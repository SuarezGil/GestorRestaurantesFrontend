import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRestaurants } from '../../shared/api/restaurants'

export const PublicRestaurantsPage = () => {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const { data } = await getRestaurants({ restaurantActive: true, limit: 100 })
        setRestaurants(data?.data ?? [])
      } catch (err) {
        console.error('Error fetching restaurants', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRestaurants()
  }, [])

  const filteredRestaurants = useMemo(() => {
    if (!search.trim()) return restaurants
    const q = search.toLowerCase()
    return restaurants.filter(
      (r) =>
        (r.restaurantName || '').toLowerCase().includes(q) ||
        (r.restaurantAddress || '').toLowerCase().includes(q)
    )
  }, [restaurants, search])

  const isRestaurantOpen = (openingHours, closingHours) => {
    if (!openingHours || !closingHours) return false
    
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const parseTime = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number)
      return h * 60 + m
    }

    const startMinutes = parseTime(openingHours)
    const endMinutes = parseTime(closingHours)

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes
    } else {
      // Overnight (e.g. 18:00 to 02:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 font-body text-zinc-200">
      <header className="relative border-b border-zinc-800 bg-black pb-24 pt-20 shadow-2xl">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-10 -top-10 h-72 w-72 rounded-full bg-red-900/30 blur-3xl" />
          <div className="absolute right-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-orange-900/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-widest text-zinc-400 transition hover:text-white uppercase">
            <span>←</span> Volver al inicio
          </Link>
          <div className="mt-12">
            <h1 className="font-display text-5xl font-black tracking-widest text-white sm:text-7xl drop-shadow-md">
              NUESTROS
              <br />
              <span className="text-red-600">RESTAURANTES</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-light text-zinc-400">
              Descubre el ambiente, horarios de atención y encuentra la experiencia Fuego y Sabor más cercana a ti.
            </p>
          </div>
          
          <div className="mt-12 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre o ubicación..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-zinc-700 bg-zinc-900/80 px-8 py-5 pl-14 text-sm text-white placeholder-zinc-500 shadow-inner backdrop-blur-md transition focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl text-zinc-500">
                🔍
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-zinc-500 text-lg uppercase tracking-widest">Cargando restaurantes...</p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-16 text-center shadow-lg">
            <p className="text-xl font-light text-zinc-300">No encontramos restaurantes con esa búsqueda.</p>
            <button
              onClick={() => setSearch('')}
              className="mt-6 uppercase tracking-widest text-sm font-bold text-red-500 transition hover:text-red-400 hover:scale-105"
            >
              Borrar filtros
            </button>
          </div>
        ) : (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRestaurants.map((restaurant) => {
              const photo = restaurant.restaurantPhoto?.startsWith('http') 
                ? restaurant.restaurantPhoto 
                : null
              const isOpen = isRestaurantOpen(restaurant.openingHours, restaurant.closingHours)

              return (
                <article
                  key={restaurant._id || restaurant.id}
                  onClick={() => setSelectedRestaurant(restaurant)}
                  className="group cursor-pointer overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-900 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-900/20"
                >
                  <div className="relative h-80 overflow-hidden bg-black">
                    {photo ? (
                      <img
                        src={photo}
                        alt={restaurant.restaurantName}
                        className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-100"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-6xl font-black text-zinc-800 transition-transform duration-700 group-hover:scale-110">
                        {(restaurant.restaurantName || 'R')[0]}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                    <div className="absolute left-6 right-6 top-6 flex justify-end">
                      <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-md ${isOpen ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        <span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                        {isOpen ? 'Abierto ahora' : 'Cerrado'}
                      </span>
                    </div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="font-display text-3xl font-black tracking-wide text-white drop-shadow-md transition-colors group-hover:text-red-500">
                        {restaurant.restaurantName}
                      </h3>
                    </div>
                  </div>
                  <div className="p-8">
                    <p className="flex items-start gap-3 text-sm text-zinc-400">
                      <span className="mt-0.5 text-zinc-600">📍</span>
                      <span className="leading-relaxed">{restaurant.restaurantAddress || 'Sin dirección registrada'}</span>
                    </p>
                    <p className="mt-4 flex items-center gap-3 text-sm text-zinc-400">
                      <span className="text-zinc-600">🕒</span>
                      <span className="font-medium tracking-wide text-zinc-300">
                        {restaurant.openingHours || '--:--'} - {restaurant.closingHours || '--:--'}
                      </span>
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      {selectedRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedRestaurant(null)}
          />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-2xl">
            {selectedRestaurant.restaurantPhoto?.startsWith('http') && (
              <div className="relative h-72 w-full bg-black">
                <img 
                  src={selectedRestaurant.restaurantPhoto} 
                  alt={selectedRestaurant.restaurantName}
                  className="h-full w-full object-cover opacity-90" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
              </div>
            )}
            <div className={`p-8 ${!selectedRestaurant.restaurantPhoto?.startsWith('http') ? 'pt-12' : 'pt-4 relative z-10 -mt-16'}`}>
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-display text-4xl font-black tracking-widest text-white drop-shadow-lg">
                  {selectedRestaurant.restaurantName}
                </h2>
                <button
                  onClick={() => setSelectedRestaurant(null)}
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-300 backdrop-blur-md transition hover:bg-zinc-700 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="mt-8 space-y-6">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Dirección</p>
                  <p className="mt-2 text-base font-medium leading-relaxed text-zinc-200">{selectedRestaurant.restaurantAddress || 'No especificada'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Horario</p>
                    <p className="mt-2 text-base font-medium text-zinc-200">
                      {selectedRestaurant.openingHours || '--:--'} a {selectedRestaurant.closingHours || '--:--'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Teléfono</p>
                    <p className="mt-2 text-base font-medium text-zinc-200">{selectedRestaurant.restaurantPhone || 'No especificado'}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Contacto</p>
                  <p className="mt-2 text-base font-medium text-zinc-200">{selectedRestaurant.restaurantEmail || 'No especificado'}</p>
                </div>
              </div>

              <div className="mt-10">
                <Link
                  to="/auth"
                  className="block w-full rounded-full bg-red-600 px-6 py-5 text-center text-sm font-bold uppercase tracking-widest text-white shadow-lg transition hover:bg-red-500 hover:scale-[1.02]"
                >
                  Inicia sesión para reservar
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
