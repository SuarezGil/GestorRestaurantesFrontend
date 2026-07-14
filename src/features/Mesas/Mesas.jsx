import { useEffect, useMemo, useState } from 'react'
import { getRestaurants } from '../../shared/api/restaurants'
import { createTable, deleteTable, getTables, updateTable } from '../../shared/api/tables'
import { showError, showSuccess } from '../../shared/utils/toast'
import { FilterBar } from '../../shared/components/ui/FilterBar'

const emptyForm = {
  tableName: '',
  tableCapacity: '1',
  restaurantId: '',
  tableActive: true,
}

const getTableId = (table) => table?._id || table?.id || table?.tableId

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors && data.errors.length > 0) {
    return data.errors[0].message
  }
  return data?.message || error?.message || fallback
}

export const Mesas = () => {
  const [tables, setTables] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [filters, setFilters] = useState({ status: 'active', restaurantId: '' })

  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const searchLower = searchTerm.toLowerCase()
      const name = table.tableName || ''
      const capacity = String(table.tableCapacity || '')
      const restaurantLabel =
        table.restaurantId?.restaurantName ||
        restaurants.find((rest) => rest._id === (table.restaurantId?._id || table.restaurantId))?.restaurantName ||
        ''

      const matchesSearch =
        !searchTerm ||
        name.toLowerCase().includes(searchLower) ||
        capacity.toLowerCase().includes(searchLower) ||
        restaurantLabel.toLowerCase().includes(searchLower)

      let matchesDate = true
      if (startDate || endDate) {
        const itemDate = new Date(table.createdAt || table.updatedAt)
        if (!Number.isNaN(itemDate.getTime())) {
          if (startDate) {
            matchesDate = matchesDate && itemDate >= new Date(startDate + 'T00:00:00')
          }
          if (endDate) {
            matchesDate = matchesDate && itemDate <= new Date(endDate + 'T23:59:59')
          }
        }
      }

      return matchesSearch && matchesDate
    })
  }, [tables, searchTerm, startDate, endDate, restaurants])

  const stats = useMemo(() => {
    const activeCount = filteredTables.filter((item) => item.tableActive !== false).length
    const inactiveCount = filteredTables.filter((item) => item.tableActive === false).length

    return {
      total: filteredTables.length,
      active: activeCount,
      inactive: inactiveCount,
    }
  }, [filteredTables])

  const loadRestaurants = async () => {
    try {
      const { data } = await getRestaurants({ restaurantActive: true, limit: 100 })
      setRestaurants(data?.data ?? [])
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudieron cargar los restaurantes.'))
    }
  }

  const loadTables = async (targetFilters = filters) => {
    setLoading(true)
    setError(null)

    try {
      const tableActive = targetFilters.status === 'active' ? true : false
      const { data } = await getTables({
        tableActive,
        restaurantId: targetFilters.restaurantId || undefined,
        limit: 100,
      })

      setTables(data?.data ?? [])
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar las mesas.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRestaurants()
  }, [])

  useEffect(() => {
    loadTables()
  }, [filters])

  const handleInputChange = (event) => {
    const { name, value } = event.target

    if (name === 'tableActive') {
      setForm((prev) => ({ ...prev, tableActive: value === 'true' }))
      return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditing(null)
  }

  const handleEdit = (table) => {
    const resolvedRestaurantId =
      table.restaurantId && typeof table.restaurantId === 'object'
        ? table.restaurantId._id || table.restaurantId.id || ''
        : table.restaurantId || ''

    setEditing(table)
    setForm({
      tableName: table.tableName ?? '',
      tableCapacity: String(table.tableCapacity ?? '1'),
      restaurantId: resolvedRestaurantId,
      tableActive: table.tableActive !== false,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.tableName || !form.restaurantId) {
      showError('Completa el nombre de la mesa y el restaurante asociado.')
      return
    }

    setSaving(true)

    try {
      const payload = {
        tableName: form.tableName,
        tableCapacity: Number(form.tableCapacity) || 1,
        restaurantId: form.restaurantId,
        tableActive: form.tableActive,
      }

      if (editing) {
        const tableId = getTableId(editing)
        if (!tableId) {
          showError('No se pudo identificar la mesa seleccionada.')
          return
        }

        await updateTable(tableId, payload)
        showSuccess('Mesa actualizada.')
      } else {
        await createTable(payload)
        showSuccess('Mesa creada.')
      }

      resetForm()
      await loadTables()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo guardar la mesa.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (table) => {
    const tableId = getTableId(table)

    if (!tableId) {
      showError('No se pudo identificar la mesa seleccionada.')
      return
    }

    const confirmed = window.confirm('¿Seguro que deseas desactivar esta mesa?')

    if (!confirmed) return

    try {
      await deleteTable(tableId)
      showSuccess('Mesa desactivada.')
      await loadTables()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo desactivar la mesa.'))
    }
  }

  const handleReactivate = async (table) => {
    const tableId = getTableId(table)

    if (!tableId) {
      showError('No se pudo identificar la mesa seleccionada.')
      return
    }

    try {
      await updateTable(tableId, { tableActive: true })
      showSuccess('Mesa reactivada.')
      await loadTables()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo reactivar la mesa.'))
    }
  }

  const handleFilterChange = (event) => {
    const { name, value } = event.target

    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <section className="space-y-6 font-sans text-slate-300 antialiased max-w-[1600px] mx-auto p-4 md:p-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Gestión Operativa</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Control de Mesas
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Administra la distribución, capacidades y estados de servicio de tus restaurantes.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => loadTables()}
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-200 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-700 hover:text-white active:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Actualizar listado
          </button>
        </div>
      </header>

      {/* Grid Principal */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        
        {/* Sección Izquierda: Listado y Filtros */}
        <div className="space-y-6">
          
          {/* Card de Filtros e Indicadores (Oscuro Translúcido) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-xl space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Listado de mesas</h2>
                <p className="text-xs text-slate-400">Visualización general según criterios de búsqueda.</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="active">Activas</option>
                  <option value="inactive">Inactivas</option>
                </select>
                
                <select
                  name="restaurantId"
                  value={filters.restaurantId}
                  onChange={handleFilterChange}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 max-w-[200px]"
                >
                  <option value="">Todos los restaurantes</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant._id} value={restaurant._id}>
                      {restaurant.restaurantName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60 dark-filters">
              <FilterBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                searchPlaceholder="Buscar por nombre, capacidad o restaurante..."
              />
            </div>

            {/* Mini Stats Grid */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { label: 'Mesas en vista', value: stats.total, bg: 'bg-slate-950/60 text-slate-300 border-slate-800' },
                { label: 'Activas', value: stats.active, bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                { label: 'Inactivas', value: stats.inactive, bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
              ].map((card) => (
                <div key={card.label} className={`rounded-xl border p-3 ${card.bg}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{card.label}</p>
                  <p className="mt-1 text-xl font-bold tracking-tight">{card.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Listado / Tabla (Oscuro con efecto Glass) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-xl overflow-hidden">
            {loading && (
              <div className="p-12 text-center text-sm text-slate-400">
                <div className="inline-block animate-pulse font-medium">Cargando mesas del sistema...</div>
              </div>
            )}

            {!loading && error && (
              <div className="m-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-center text-sm text-rose-400 font-medium">
                {error}
              </div>
            )}

            {!loading && !error && filteredTables.length === 0 && (
              <div className="p-12 text-center text-sm text-slate-500">
                No se encontraron mesas que coincidan con los filtros. Crea una nueva en el panel lateral.
              </div>
            )}

            {!loading && !error && filteredTables.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3.5">Nombre de Mesa</th>
                      <th className="px-5 py-3.5">Restaurante</th>
                      <th className="px-5 py-3.5 text-center">Capacidad</th>
                      <th className="px-5 py-3.5">Estado</th>
                      <th className="px-5 py-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                    {filteredTables.map((table) => {
                      const tableId = getTableId(table)
                      const isActive = table.tableActive !== false
                      const restaurantLabel =
                        table.restaurantId?.restaurantName ||
                        restaurants.find((rest) => rest._id === table.restaurantId)?.restaurantName ||
                        'Restaurante no definido'

                      return (
                        <tr key={tableId || table.tableName} className="hover:bg-slate-800/30 transition-colors group">
                          <td className="px-5 py-4 font-semibold text-white">
                            {table.tableName || 'Mesa sin nombre'}
                          </td>
                          <td className="px-5 py-4 text-slate-400">
                            {restaurantLabel}
                          </td>
                          <td className="px-5 py-4 text-center font-medium text-slate-300">
                            {table.tableCapacity ?? '--'} <span className="text-xs text-slate-500 font-normal">pax</span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                                isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                              {isActive ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleEdit(table)}
                                className="rounded-lg px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-40"
                                disabled={!tableId}
                              >
                                Editar
                              </button>
                              {isActive ? (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(table)}
                                  className="rounded-lg px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-40"
                                  disabled={!tableId}
                                >
                                  Desactivar
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleReactivate(table)}
                                  className="rounded-lg px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
                                  disabled={!tableId}
                                >
                                  Reactivar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sección Derecha: Formulario Ocurto de Registro */}
        <aside className="space-y-6">
          {/* Formulario */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">
                  {editing ? 'Editar mesa' : 'Crear nueva mesa'}
                </h2>
                <p className="text-xs text-slate-400">Ingresa los parámetros de la infraestructura.</p>
              </div>
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Nombre de la mesa
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white shadow-sm placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  name="tableName"
                  value={form.tableName}
                  onChange={handleInputChange}
                  placeholder="Ej. Terraza 4 o Mesa 12"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Capacidad (Pax)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    name="tableCapacity"
                    value={form.tableCapacity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Estado inicial
                  </label>
                  <select
                    name="tableActive"
                    value={form.tableActive ? 'true' : 'false'}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="true" className="bg-slate-950">Activa</option>
                    <option value="false" className="bg-slate-950">Inactiva</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Restaurante asignado
                </label>
                <select
                  name="restaurantId"
                  value={form.restaurantId}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                >
                  <option value="" className="bg-slate-950">Selecciona un restaurante...</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant._id} value={restaurant._id} className="bg-slate-950">
                      {restaurant.restaurantName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 active:bg-emerald-700 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Procesando...' : editing ? 'Guardar Cambios' : 'Registrar Mesa'}
              </button>
            </form>
          </section>

          {/* Notas de Integración */}
          
        </aside>

      </div>
    </section>
  )
}