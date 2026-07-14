import { useEffect, useMemo, useState } from 'react'
import {
  deleteRestaurant,
  getRestaurants,
  getMyRestaurant,
  updateRestaurant,
} from '../../shared/api/restaurants';
import { useAuthStore } from '../../features/auth/store/authStore'
import { showError, showSuccess } from '../../shared/utils/toast';
import { ModalRestaurante } from './components/ModalRestaurante';
import { FilterBar } from '../../shared/components/ui/FilterBar';

const getRestaurantId = (restaurant) => restaurant?._id || restaurant?.id

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors && data.errors.length > 0) {
    return data.errors[0].message
  }
  return data?.message || error?.message || fallback
}

const normalizePhoto = (photo) => {
  if (!photo) return null
  if (photo.startsWith('http')) return photo
  return photo
}

export const Restaurantes = () => {
  const user = useAuthStore((state) => state.user)
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showInactive, setShowInactive] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      const searchLower = searchTerm.toLowerCase()
      const name = restaurant.restaurantName || ''
      const address = restaurant.restaurantAddress || ''
      const email = restaurant.restaurantEmail || ''
      
      const matchesSearch = 
        !searchTerm ||
        name.toLowerCase().includes(searchLower) ||
        address.toLowerCase().includes(searchLower) ||
        email.toLowerCase().includes(searchLower)

      let matchesDate = true
      if (startDate || endDate) {
        const itemDate = new Date(restaurant.createdAt || restaurant.updatedAt)
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
  }, [restaurants, searchTerm, startDate, endDate])

  const stats = useMemo(() => {
    const activeCount = filteredRestaurants.filter((item) => item.restaurantActive !== false).length
    const inactiveCount = filteredRestaurants.filter((item) => item.restaurantActive === false).length

    return {
      total: filteredRestaurants.length,
      active: activeCount,
      inactive: inactiveCount,
    }
  }, [filteredRestaurants])

  const loadRestaurants = async (targetInactive = showInactive) => {
    setLoading(true)
    setError(null)

    try {
      let data
      if (user?.roles?.includes('ADMIN_RESTAURANT')) {
        const response = await getMyRestaurant()
        data = { data: response.data?.data ? [response.data.data] : [] }
      } else {
        const response = await getRestaurants({ restaurantActive: !targetInactive })
        data = response.data
      }
      setRestaurants(data?.data ?? [])
    } catch (err) {
      const message = getErrorMessage(err, 'No se pudieron cargar los restaurantes.')
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRestaurants()
  }, [showInactive])

  const handleEdit = (restaurant) => {
    setEditing(restaurant)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditing(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (restaurant) => {
    const restaurantId = getRestaurantId(restaurant)

    if (!restaurantId) {
      showError('No se pudo identificar el restaurante seleccionado.')
      return
    }

    const confirmed = window.confirm('¿Seguro que deseas desactivar este restaurante?')

    if (!confirmed) return

    try {
      await deleteRestaurant(restaurantId)
      showSuccess('Restaurante desactivado.')
      await loadRestaurants()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo desactivar el restaurante.'))
    }
  }

  const handleReactivate = async (restaurant) => {
    const restaurantId = getRestaurantId(restaurant)

    if (!restaurantId) {
      showError('No se pudo identificar el restaurante seleccionado.')
      return
    }

    try {
      await updateRestaurant(restaurantId, { restaurantActive: true })
      showSuccess('Restaurante reactivado.')
      await loadRestaurants()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo reactivar el restaurante.'))
    }
  }

  return (
    <section className="space-y-6 font-sans text-slate-300 antialiased max-w-[1600px] mx-auto p-4 md:p-6">
      
      {/* Header Estilo Premium para Entorno Oscuro */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Infraestructura Corporativa</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Control Operativo de Restaurantes
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Administra altas, ediciones, parámetros de localización y el estado comercial de tus sedes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-500 active:bg-blue-700 focus:outline-none"
          >
            Nuevo Restaurante
          </button>
          <button
            type="button"
            onClick={() => loadRestaurants()}
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-200 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-700 hover:text-white"
          >
            Actualizar
          </button>
        </div>
      </header>

      {/* Contenedor Principal (Panel Completo Oscuro) */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-5 shadow-xl space-y-5">
        
        {/* Controles Superiores de Filtrado de Estado */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/60 pb-4">
          <div>
            <h2 className="text-base font-bold text-white">Listado general de sedes</h2>
            <p className="text-xs text-slate-400">
              {showInactive ? 'Visualizando únicamente registros inactivos/archivados.' : 'Visualizando únicamente registros operativos vigentes.'}
            </p>
          </div>
          
          <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setShowInactive(false)}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                !showInactive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Activos
            </button>
            <button
              type="button"
              onClick={() => setShowInactive(true)}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                showInactive
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Inactivos
            </button>
          </div>
        </div>

        {/* Buscador Parametrizado */}
        <div className="pt-1">
          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            searchPlaceholder="Buscar por nombre, dirección o correo..."
          />
        </div>

        {/* Módulo de Micro Estadísticas */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { label: 'Sedes en vista', value: stats.total, bg: 'bg-slate-950/60 text-slate-300 border-slate-800/80' },
            { label: 'Activos', value: stats.active, bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
            { label: 'Inactivos', value: stats.inactive, bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
          ].map((card) => (
            <div key={card.label} className={`rounded-xl border p-3 ${card.bg}`}>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{card.label}</p>
              <p className="mt-1 text-xl font-bold tracking-tight">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Visualización de Tarjetas de Restaurante */}
        <div className="pt-2">
          {loading && (
            <div className="p-12 text-center text-sm text-slate-400 animate-pulse font-medium">
              Sincronizando la infraestructura comercial con el servidor...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-center text-sm text-rose-400 font-medium">
              {error}
            </div>
          )}

          {!loading && !error && filteredRestaurants.length === 0 && (
            <div className="p-12 text-center text-sm text-slate-500 rounded-xl border border-dashed border-slate-800">
              No se registran restaurantes vigentes bajo estos criterios de filtrado.
            </div>
          )}

          {!loading && !error && filteredRestaurants.length > 0 && (
            <div className="grid gap-4 md:grid-cols-1 xl:grid-cols-2">
              {filteredRestaurants.map((restaurant) => {
                const restaurantId = getRestaurantId(restaurant)
                const isActive = restaurant.restaurantActive !== false
                const photoUrl = normalizePhoto(restaurant.restaurantPhoto)

                return (
                  <article
                    key={restaurantId || restaurant.restaurantEmail}
                    className="rounded-xl border border-slate-800/70 bg-slate-950/30 p-5 shadow-sm transition-all hover:border-slate-700 flex flex-col sm:flex-row gap-4 items-start"
                  >
                    {/* Contenedor Fotográfico */}
                    <div className="h-20 w-20 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shrink-0 shadow-inner">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={restaurant.restaurantName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-slate-950 text-xl font-black text-slate-500">
                          {(restaurant.restaurantName || 'R').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Información Descriptiva */}
                    <div className="flex-1 min-w-0 space-y-3.5 w-full">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-white truncate">
                            {restaurant.restaurantName}
                          </h3>
                          <p className="text-[11px] font-mono text-slate-500 truncate pt-0.5">
                            {restaurant.restaurantEmail || 'Sin correo asignado'}
                          </p>
                        </div>
                        
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide shrink-0 ${
                            isActive 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      {/* Parámetros Operativos */}
                      <div className="grid gap-3 text-xs sm:grid-cols-2 pt-2 border-t border-slate-800/40">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dirección</p>
                          <p className="font-medium text-slate-300 pt-0.5 truncate" title={restaurant.restaurantAddress}>
                            {restaurant.restaurantAddress || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Teléfono</p>
                          <p className="font-medium text-slate-300 pt-0.5">{restaurant.restaurantPhone || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Horario Comercial</p>
                          <p className="font-medium text-slate-300 pt-0.5">
                            {restaurant.openingHours || '--:--'} a {restaurant.closingHours || '--:--'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fecha de Alta</p>
                          <p className="font-medium text-slate-300 pt-0.5">
                            {restaurant.createdAt ? new Date(restaurant.createdAt).toLocaleDateString('es-GT') : 'N/D'}
                          </p>
                        </div>
                      </div>

                      {/* Botones de Acción Integrados */}
                      <div className="mt-4 pt-3 flex gap-2 justify-end border-t border-slate-800/40">
                        <button
                          type="button"
                          onClick={() => handleEdit(restaurant)}
                          className="rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                          disabled={!restaurantId}
                        >
                          Editar
                        </button>
                        {isActive ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(restaurant)}
                            className="rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-500/10 transition-colors"
                            disabled={!restaurantId}
                          >
                            Desactivar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleReactivate(restaurant)}
                            className="rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            disabled={!restaurantId}
                          >
                            Reactivar
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Modal Flotante */}
      <ModalRestaurante
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        restaurantToEdit={editing}
        onSaved={() => {
          setIsModalOpen(false)
          loadRestaurants()
        }}
      />
    </section>
  )
}