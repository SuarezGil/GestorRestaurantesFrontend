import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/store/authStore'
import { getTables, createTable, updateTable } from '../../shared/api/tables'
import { showError, showSuccess } from '../../shared/utils/toast'

const getErrMsg = (err, fallback) =>
  err?.response?.data?.errors?.[0]?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback

export const RestaurantTables = () => {
  const user = useAuthStore((state) => state.user)
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [formData, setFormData] = useState({
    tableName: '',
    tableCapacity: 2,
    tableActive: true,
  })
  const [editingTable, setEditingTable] = useState(null)
  const [capacityFilter, setCapacityFilter] = useState('TODOS')
  const [searchQuery, setSearchQuery] = useState('')

  const loadTables = async () => {
    if (!user?.restaurantId) return
    try {
      setLoading(true)
      const { data } = await getTables({ restaurantId: user.restaurantId })
      setTables(data?.data || [])
    } catch (err) {
      showError(getErrMsg(err, 'No se pudieron cargar las mesas.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.restaurantId) {
      loadTables()
    } else {
      setLoading(false)
    }
  }, [user?.restaurantId])

  const handleSubmitTable = async (e) => {
    e.preventDefault()
    if (!formData.tableName.trim()) {
      return showError('El nombre de la mesa es obligatorio.')
    }
    if (!user?.restaurantId) {
      return showError('No tienes un restaurante asignado.')
    }

    setAdding(true)
    try {
      if (editingTable) {
        await updateTable(editingTable._id, {
          tableName: formData.tableName,
          tableCapacity: formData.tableCapacity,
          tableActive: formData.tableActive,
          restaurantId: user.restaurantId,
        })
        showSuccess('Mesa actualizada exitosamente.')
      } else {
        await createTable({
          tableName: formData.tableName,
          tableCapacity: formData.tableCapacity,
          restaurantId: user.restaurantId,
        })
        showSuccess('Mesa creada exitosamente.')
      }
      setShowModal(false)
      setEditingTable(null)
      setFormData({ tableName: '', tableCapacity: 2, tableActive: true })
      loadTables()
    } catch (err) {
      showError(getErrMsg(err, editingTable ? 'No se pudo actualizar la mesa.' : 'No se pudo crear la mesa.'))
    } finally {
      setAdding(false)
    }
  }

  const filteredTables = tables.filter((table) => {
    const nameStr = table.tableName?.toLowerCase() || ''
    const matchesSearch = searchQuery === '' || nameStr.includes(searchQuery.toLowerCase())

    let matchesCapacity = true
    if (capacityFilter === 'SMALL') matchesCapacity = table.tableCapacity <= 2
    else if (capacityFilter === 'MEDIUM') matchesCapacity = table.tableCapacity > 2 && table.tableCapacity <= 4
    else if (capacityFilter === 'LARGE') matchesCapacity = table.tableCapacity > 4

    return matchesSearch && matchesCapacity
  })

  const smallTablesCount = tables.filter(t => t.tableCapacity <= 2).length
  const mediumTablesCount = tables.filter(t => t.tableCapacity > 2 && t.tableCapacity <= 4).length
  const largeTablesCount = tables.filter(t => t.tableCapacity > 4).length
  const totalTablesCount = tables.length

  return (
    <div className="space-y-6">
      {/* Banner Superior Premium */}
      <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-r from-emerald-50 via-emerald-50/60 to-emerald-100/30 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden relative shadow-sm">
        <div className="space-y-3 z-10">
          <span className="inline-flex rounded-full bg-emerald-100 border border-emerald-200/50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
            Mesas
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Gestión de Mesas
          </h1>
          <p className="text-sm text-slate-500 max-w-[580px] leading-relaxed">
            Administra y distribuye la disposición de las mesas de tu restaurante para el control de reservaciones.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTable(null)
            setFormData({ tableName: '', tableCapacity: 2, tableActive: true })
            setShowModal(true)
          }}
          className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition shadow-sm hover:shadow active:scale-[0.98] shrink-0 self-start sm:self-center z-10 flex items-center justify-center gap-1.5"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Nueva Mesa</span>
        </button>
      </div>

      {/* Metrics Row (4 columns) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mesas Pequeñas */}
        <div className="bg-white border border-slate-100/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:shadow transition">
          <div className="rounded-2xl bg-emerald-50 border border-emerald-100/40 p-3 text-emerald-600 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 2v5M12 17v5M2 12h5M17 12h5" />
            </svg>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-800 block leading-none">{smallTablesCount}</span>
            <span className="text-xs font-bold text-slate-700 block mt-1">Pequeñas</span>
            <span className="text-[10px] font-semibold text-slate-400 block leading-none mt-0.5">1-2 pers.</span>
          </div>
        </div>

        {/* Mesas Medianas */}
        <div className="bg-white border border-slate-100/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:shadow transition">
          <div className="rounded-2xl bg-purple-50 border border-purple-100/40 p-3 text-purple-600 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 2v5M12 17v5M2 12h5M17 12h5" />
              <circle cx="12" cy="12" r="9" strokeDasharray="2 2" />
            </svg>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-800 block leading-none">{mediumTablesCount}</span>
            <span className="text-xs font-bold text-slate-700 block mt-1">Medianas</span>
            <span className="text-[10px] font-semibold text-slate-400 block leading-none mt-0.5">3-4 pers.</span>
          </div>
        </div>

        {/* Mesas Grandes */}
        <div className="bg-white border border-slate-100/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:shadow transition">
          <div className="rounded-2xl bg-amber-50 border border-amber-100/40 p-3 text-amber-500 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 2v5M12 17v5M2 12h5M17 12h5" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-800 block leading-none">{largeTablesCount}</span>
            <span className="text-xs font-bold text-slate-700 block mt-1">Grandes</span>
            <span className="text-[10px] font-semibold text-slate-400 block leading-none mt-0.5">5+ pers.</span>
          </div>
        </div>

        {/* Total Mesas */}
        <div className="bg-white border border-slate-100/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:shadow transition">
          <div className="rounded-2xl bg-blue-50 border border-blue-100/40 p-3 text-blue-600 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-800 block leading-none">{totalTablesCount}</span>
            <span className="text-xs font-bold text-slate-700 block mt-1">Total</span>
            <span className="text-[10px] font-semibold text-slate-400 block leading-none mt-0.5">mesas</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/40 pb-2">
        {/* Capacity Selector */}
        <div className="relative w-full sm:w-[220px]">
          <select
            value={capacityFilter}
            onChange={(e) => setCapacityFilter(e.target.value)}
            className="appearance-none w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-xs font-bold text-slate-600 hover:border-slate-300 focus:outline-none shadow-sm transition"
          >
            <option value="TODOS">Todas las capacidades</option>
            <option value="SMALL">Pequeña (1-2 pers.)</option>
            <option value="MEDIUM">Mediana (3-4 pers.)</option>
            <option value="LARGE">Grande (5+ pers.)</option>
          </select>
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-[280px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar mesa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none transition shadow-sm"
          />
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="text-center text-slate-500 py-16 font-medium">Cargando distribución de mesas...</div>
      ) : filteredTables.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/50 p-16 text-center shadow-inner">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 mx-auto mb-4">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 2v20M2 12h20" />
          </svg>
          <p className="text-slate-500 font-medium">No se encontraron mesas que coincidan con la búsqueda</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {filteredTables.map((table) => (
            <div key={table._id} className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 p-5">
              <div className="flex gap-5">
                {/* Isometric Table SVG representation */}
                <div className="shrink-0 aspect-square h-[120px] w-[120px] sm:h-[130px] sm:w-[130px] rounded-2xl bg-gradient-to-br from-slate-50 via-slate-50/40 to-emerald-50/20 border border-slate-100 flex flex-col items-center justify-center text-slate-400 gap-1.5 shadow-inner">
                  <div className="rounded-full bg-emerald-50/80 p-2.5 text-emerald-600 border border-emerald-100/30">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="5.5" strokeDasharray="3 2" className="text-emerald-700/60" />
                      <rect x="9.5" y="9.5" width="5" height="5" rx="1" fill="currentColor" className="text-emerald-500/20" />
                      <circle cx="12" cy="3.5" r="1.8" fill="currentColor" className="text-slate-400" />
                      <circle cx="12" cy="20.5" r="1.8" fill="currentColor" className="text-slate-400" />
                      <circle cx="3.5" cy="12" r="1.8" fill="currentColor" className="text-slate-400" />
                      <circle cx="20.5" cy="12" r="1.8" fill="currentColor" className="text-slate-400" />
                    </svg>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Mesa</span>
                </div>

                {/* Details Column */}
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    {/* Category tag */}
                    <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      table.tableCapacity <= 2 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      table.tableCapacity <= 4 ? 'bg-purple-50 text-purple-700 border-purple-100' :
                      'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {table.tableCapacity <= 2 ? 'MESA PEQUEÑA' :
                       table.tableCapacity <= 4 ? 'MESA MEDIANA' : 'MESA GRANDE'}
                    </span>

                    {/* Table Name */}
                    <h3 className="font-extrabold text-slate-800 text-lg tracking-tight mt-2 leading-tight">
                      {table.tableName}
                    </h3>
                    
                    {/* Code under title */}
                    <p className="text-[10px] text-slate-400 font-extrabold mt-0.5 uppercase tracking-wider">
                      Código: T{table._id?.slice(-4).toUpperCase() || 'N/A'}
                    </p>
                  </div>

                  {/* Capacity badge */}
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-xl self-start w-fit mt-1.5 shadow-sm flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Capacidad: {table.tableCapacity} personas</span>
                  </span>
                </div>
              </div>

              {/* Footer divider and metadata row */}
              <div className="mt-4 pt-3.5 border-t border-slate-100/60 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Status */}
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${table.tableActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <span>Estado</span>
                    <span className={`font-extrabold ${table.tableActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {table.tableActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>

                {/* Edit & Actions buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setEditingTable(table)
                      setFormData({
                        tableName: table.tableName,
                        tableCapacity: table.tableCapacity,
                        tableActive: table.tableActive ?? true
                      })
                      setShowModal(true)
                    }}
                    className="rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 transition active:scale-[0.98] flex items-center gap-1"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-900">
              {editingTable ? 'Editar Mesa' : 'Nueva Mesa'}
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Nombre de la Mesa</label>
                <input
                  type="text"
                  value={formData.tableName}
                  onChange={(e) => setFormData({ ...formData, tableName: e.target.value })}
                  placeholder="Ej: Mesa 1, VIP 1"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition animate-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Capacidad (personas)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.tableCapacity}
                  onChange={(e) => setFormData({ ...formData, tableCapacity: parseInt(e.target.value) })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition animate-none"
                />
              </div>

              {/* Status Switch (Only displayed when editing) */}
              {editingTable && (
                <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                  <div>
                    <span className="block text-xs font-bold text-slate-800">Mesa Activa</span>
                    <span className="block text-[10px] text-slate-400 font-semibold leading-tight mt-0.5">Determina si la mesa está disponible en el salón</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tableActive}
                      onChange={(e) => setFormData({ ...formData, tableActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingTable(null)
                }}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitTable}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
              >
                {editingTable ? 'Guardar Cambios' : 'Crear Mesa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
