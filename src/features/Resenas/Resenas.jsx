import { useEffect, useState, useMemo } from 'react'
import { getReviews, deleteReview } from '../../shared/api/reviews'
import { showError, showSuccess } from '../../shared/utils/toast'
import { FilterBar } from '../../shared/components/ui/FilterBar'

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors && data.errors.length > 0) {
    return data.errors[0].message
  }
  return data?.message || error?.message || fallback
}

export const Resenas = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReview, setSelectedReview] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const searchLower = searchTerm.toLowerCase()
      const userName = review.userName || 'Usuario Anónimo'
      const comment = review.comment || ''
      const restaurantName = review.restaurantId?.restaurantName || ''
      const menuName = review.menuId?.menuName || ''

      const matchesSearch =
        !searchTerm ||
        userName.toLowerCase().includes(searchLower) ||
        comment.toLowerCase().includes(searchLower) ||
        restaurantName.toLowerCase().includes(searchLower) ||
        menuName.toLowerCase().includes(searchLower)

      let matchesDate = true
      if (startDate || endDate) {
        const itemDate = new Date(review.createdAt)
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
  }, [reviews, searchTerm, startDate, endDate])

  const ratingValues = filteredReviews
    .map(review => Number(review.rating))
    .filter(rating => Number.isFinite(rating))
  const averageRating = ratingValues.length > 0
    ? ratingValues.reduce((total, rating) => total + rating, 0) / ratingValues.length
    : 0
  const averageRatingLabel = averageRating > 0 ? averageRating.toFixed(1) : '0.0'

  const acceptedReviews = ratingValues.filter(rating => rating >= 4).length
  const acceptancePercentage = ratingValues.length > 0
    ? ((acceptedReviews / ratingValues.length) * 100).toFixed(1)
    : 0

  const loadReviews = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await getReviews()
      setReviews(data?.reviews || [])
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar las reseñas.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [])

  const handleDelete = async (review) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta reseña?')) return
    
    try {
      await deleteReview(review._id)
      showSuccess('Reseña eliminada.')
      setSelectedReview(null)
      await loadReviews()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo eliminar la reseña.'))
    }
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={`text-base ${i < rating ? 'text-amber-400' : 'text-slate-700'}`}>
        ★
      </span>
    ))
  }

  return (
    <section className="space-y-6 font-sans text-slate-300 antialiased max-w-[1600px] mx-auto p-4 md:p-6">
      
      {/* Header Estilo Premium */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-violet-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-violet-400">Auditoría de Experiencia</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Feedback y Calificaciones
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitorea el nivel de satisfacción, comentarios de clientes y desempeño gastronómico de tus sedes.
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-center text-sm text-rose-400 font-medium">
          {error}
        </div>
      )}

      {/* Grid de KPIs / Tarjetas Superiores */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Promedio General</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-black text-white tracking-tight">{averageRatingLabel}</span>
            <span className="pb-0.5 text-xs text-slate-500">/ 5.0</span>
          </div>
          <div className="mt-2 flex gap-0.5">{renderStars(Math.round(averageRating))}</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Calificaciones Registradas</p>
          <p className="mt-2 text-3xl font-black text-white tracking-tight">{filteredReviews.length}</p>
          <p className="text-xs text-slate-500 mt-2">Opiniones procesadas en el módulo</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Porcentaje de Aceptación</p>
          <div className="mt-2 flex items-end gap-1">
            <span className="text-3xl font-black text-emerald-400 tracking-tight">{acceptancePercentage}%</span>
            <span className="pb-0.5 text-xs text-slate-500">con 4-5 estrellas</span>
          </div>
          <div className="mt-3.5 w-full bg-slate-950 rounded-full h-1.5 border border-slate-800/80">
            <div className="bg-emerald-500 h-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" style={{ width: `${acceptancePercentage}%` }} />
          </div>
        </div>
      </div>

      {/* Distribución de Listado y Detalle */}
      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        
        {/* Bloque Izquierdo: Lista Principal */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-5 shadow-xl space-y-4">
          <div className="border-b border-slate-800/60 pb-3">
            <h2 className="text-base font-bold text-white">Reseñas del catálogo</h2>
            <p className="text-xs text-slate-400">Utiliza los filtros temporales para auditar picos de servicio.</p>
          </div>

          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            searchPlaceholder="Buscar por usuario, comentario o establecimiento..."
          />

          <div className="space-y-3 pt-2">
            {loading && (
              <div className="p-12 text-center text-sm text-slate-400 animate-pulse font-medium">
                Cargando feed de opiniones...
              </div>
            )}
            
            {!loading && filteredReviews.length === 0 && (
              <div className="p-12 text-center text-sm text-slate-500 rounded-xl border border-dashed border-slate-800">
                No hay reseñas que coincidan con los criterios establecidos.
              </div>
            )}

            {!loading && filteredReviews.length > 0 && (
              <div className="grid gap-3">
                {filteredReviews.map(review => (
                  <article 
                    key={review._id} 
                    onClick={() => setSelectedReview(review)}
                    className={`rounded-xl border p-4 shadow-sm transition-all cursor-pointer flex flex-col gap-2 relative ${
                      selectedReview?._id === review._id 
                        ? 'border-violet-500/80 bg-violet-500/5' 
                        : 'border-slate-800/70 bg-slate-950/20 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm truncate">{review.userName || 'Usuario Anónimo'}</h3>
                        <p className="text-[11px] font-medium text-slate-400 mt-0.5 truncate">
                          {review.restaurantId ? `Sede: ${review.restaurantId.restaurantName || 'Desconocida'}` : ''}
                          {review.menuId ? ` • Platillo: ${review.menuId.menuName || 'Desconocido'}` : ''}
                        </p>
                      </div>
                      <div className="flex gap-0.5 shrink-0 bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-800">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 pt-1 font-normal">
                      {review.comment || 'El usuario no adjuntó una descripción textual.'}
                    </p>
                    
                    <div className="flex justify-between items-center text-[10px] font-medium text-slate-500 pt-2 border-t border-slate-900">
                      <span>Publicado el: {new Date(review.createdAt).toLocaleDateString()}</span>
                      {selectedReview?._id === review._id && (
                        <span className="text-violet-400 text-[9px] font-bold uppercase tracking-wider">En vista de detalle</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Bloque Derecho: Sticky Detail Panel */}
        <aside className="h-fit sticky top-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-xl text-left">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">Detalle de reseña</h2>
            
            {selectedReview ? (
              <div className="mt-4 space-y-4 text-sm text-slate-300">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Usuario emisor</p>
                  <p className="font-bold text-white text-base mt-0.5">{selectedReview.userName || 'Anónimo'}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Evaluación otorgada</p>
                  <div className="mt-1 flex gap-0.5 bg-slate-950 w-fit px-2.5 py-1 rounded-xl border border-slate-800">
                    {renderStars(selectedReview.rating)}
                  </div>
                </div>

                {selectedReview.restaurantId && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Establecimiento</p>
                    <p className="font-semibold text-slate-200 mt-0.5">{selectedReview.restaurantId.restaurantName}</p>
                  </div>
                )}

                {selectedReview.menuId && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ítem del menú</p>
                    <p className="font-semibold text-slate-200 mt-0.5">{selectedReview.menuId.menuName}</p>
                  </div>
                )}

                <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Opinión extendida</p>
                  <p className="text-xs text-slate-300 italic font-normal leading-relaxed">
                    "{selectedReview.comment || 'Sin comentarios adicionales.'}"
                  </p>
                </div>

                {/* Acciones del detalle */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedReview)}
                    className="w-full inline-flex items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-500/20 transition-all"
                  >
                    Eliminar Reseña del Sistema
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400 mb-3 text-lg">
                  📝
                </div>
                <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                  Selecciona cualquier tarjeta del listado central para auditar el detalle de la auditoría.
                </p>
              </div>
            )}
          </section>
        </aside>

      </div>
    </section>
  )
}