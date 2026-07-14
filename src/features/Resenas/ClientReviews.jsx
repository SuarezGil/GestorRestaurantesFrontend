import { useEffect, useState, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { getRestaurants } from '../../shared/api/restaurants'
import { getMenus } from '../../shared/api/menus'
import { getMyOrders } from '../../shared/api/orders'
import {
  createReview,
  deleteReview,
  getReviewsByRestaurant,
  getReviewsByMenu,
} from '../../shared/api/reviews'
import { showError, showSuccess } from '../../shared/utils/toast'

// â”€â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getErrMsg = (err, fallback) =>
  err?.response?.data?.errors?.[0]?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback

const EMPTY_FORM = { rating: 0, comment: '' }
const RATING_LABELS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente']

// â”€â”€â”€ StarRating â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const StarRating = ({ value, onChange, readonly = false, size = 'md' }) => {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value
  const sizeClass = size === 'sm' ? 'text-sm' : 'text-2xl'

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) =>
        readonly ? (
          <span key={star} className={`${sizeClass} leading-none`}>
            <span className={display >= star ? 'text-amber-400' : 'text-slate-200'}>★</span>
          </span>
        ) : (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className={`${sizeClass} leading-none transition-transform cursor-pointer hover:scale-125`}
          >
            <span className={display >= star ? 'text-amber-400' : 'text-slate-200'}>★</span>
          </button>
        )
      )}
    </div>
  )
}

// â”€â”€â”€ ReviewCard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ReviewCard = ({ review, currentUserId, onDelete }) => {
  const isOwner = currentUserId && review.userId && String(review.userId) === String(currentUserId)
  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('es-GT', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    : ''
  const initials = review.userName
    ? review.userName.split(' ').map((p) => p[0]?.toUpperCase()).slice(0, 2).join('')
    : 'AN'

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-300">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white truncate">
              {review.userName ?? 'Anónimo'}
            </p>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs text-slate-500">{date}</span>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => onDelete(review._id)}
                  className="shrink-0 text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors"
                  title="Eliminar mi reseña"
                >
                  ×
                </button>
              )}
            </div>
          </div>
          <div className="mt-0.5">
            <StarRating value={review.rating} readonly size="sm" />
          </div>
        </div>
      </div>
      {review.comment && (
        <p className="mt-3 text-sm text-slate-400 leading-relaxed pl-12">{review.comment}</p>
      )}
    </div>
  )
}

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const ClientReviews = () => {
  const { user } = useOutletContext()

  const [tab, setTab] = useState('restaurant')
  const [restaurants, setRestaurants] = useState([])
  const [menus, setMenus] = useState([])
  const [hasActivity, setHasActivity] = useState(null)
  const [selectedId, setSelectedId] = useState('')
  const [reviewsMap, setReviewsMap] = useState({})
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const [starFilter, setStarFilter] = useState(0)
  const [mounted, setMounted] = useState(false)

  // â”€â”€ Init â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const init = async () => {
      try {
        const [restRes, menuRes, ordersRes] = await Promise.allSettled([
          getRestaurants({ limit: 100 }),
          getMenus({ limit: 200 }),
          getMyOrders(),
        ])
        if (restRes.status === 'fulfilled') {
          // backend: { success, data: [...], pagination }
          setRestaurants(restRes.value.data?.data || [])
        }
        if (menuRes.status === 'fulfilled') {
          // backend: { success, menus: [...] }
          setMenus(menuRes.value.data?.menus || [])
        }
        if (ordersRes.status === 'fulfilled') {
          const orders = ordersRes.value.data?.orders ?? ordersRes.value.data ?? []
          setHasActivity(Array.isArray(orders) ? orders.length > 0 : false)
        } else {
          setHasActivity(false)
        }
      } finally {
        setInitLoading(false)
        setTimeout(() => setMounted(true), 60)
      }
    }
    init()
  }, [])

  // â”€â”€ Load reviews â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const loadReviews = useCallback(async (id, type) => {
    if (!id) return
    setReviewsLoading(true)
    try {
      const { data } =
        type === 'restaurant'
          ? await getReviewsByRestaurant(id)
          : await getReviewsByMenu(id)
      setReviewsMap((prev) => ({ ...prev, [id]: data?.reviews || [] }))
    } catch {
      setReviewsMap((prev) => ({ ...prev, [id]: [] }))
    } finally {
      setReviewsLoading(false)
    }
  }, [])

  const handleSelect = (id) => {
    if (selectedId === id) { setSelectedId(''); return }
    setSelectedId(id)
    setForm(EMPTY_FORM)
    setStarFilter(0)
    if (!(id in reviewsMap)) loadReviews(id, tab)
  }

  const handleTabChange = (newTab) => {
    setTab(newTab)
    setSelectedId('')
    setForm(EMPTY_FORM)
    setStarFilter(0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.rating) { showError('Elige una puntuación.'); return }
    setSubmitting(true)
    try {
      await createReview({
        ...(tab === 'restaurant' ? { restaurantId: selectedId } : { menuId: selectedId }),
        rating: form.rating,
        comment: form.comment.trim() || null,
        userName: user?.name || 'Anónimo',
      })
      showSuccess('¡Reseña enviada exitosamente!')
      setForm(EMPTY_FORM)
      setReviewsMap((prev) => { const next = { ...prev }; delete next[selectedId]; return next })
      await loadReviews(selectedId, tab)
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo enviar la reseña.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview(reviewId)
      showSuccess('Reseña eliminada.')
      setReviewsMap((prev) => {
        const next = { ...prev }
        if (next[selectedId]) {
          next[selectedId] = next[selectedId].filter((r) => r._id !== reviewId)
        }
        return next
      })
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo eliminar la reseña.'))
    }
  }

  // â”€â”€ Derived â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const items = tab === 'restaurant' ? restaurants : menus
  const nameKey = tab === 'restaurant' ? 'restaurantName' : 'menuName'
  const photoKey = tab === 'restaurant' ? 'restaurantPhoto' : 'menuPhoto'
  const selectedItem = items.find((i) => i._id === selectedId)
  const selectedReviews = reviewsMap[selectedId] ?? []
  const avgRating = selectedReviews.length
    ? (selectedReviews.reduce((s, r) => s + Number(r.rating), 0) / selectedReviews.length)
    : 0
  const filteredReviews = starFilter === 0
    ? selectedReviews
    : selectedReviews.filter((r) => Number(r.rating) === starFilter)
  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    s,
    count: selectedReviews.filter((r) => Number(r.rating) === s).length,
  }))

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <section className="font-serif -mt-9 -mx-6 px-6 pt-9 pb-16 min-h-screen">
      <div className="w-full space-y-5">

        {/* â”€â”€ HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <header className={`rounded-[32px] border border-slate-800/80 bg-slate-900/70 p-8 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.8)] backdrop-blur-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col md:flex-row items-start gap-6 justify-between">
            <div className="flex-1">
              <p className={`inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.26em] text-orange-300 transition-all duration-500 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                Mi experiencia
              </p>
              <h1 className={`font-serif mt-6 text-4xl font-bold text-white sm:text-5xl transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                Reseñas y <span className="text-orange-400">calificaciones</span>
              </h1>
              <p className={`mt-4 text-base text-slate-300 leading-8 transition-all duration-800 delay-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                Comparte tu opinión sobre los{' '}
                <span className="font-medium text-orange-400">restaurantes y platillos</span>{' '}
                que hayas visitado. Tu experiencia ayuda a otros clientes a elegir mejor.
              </p>
              {/* Tabs */}
              <div className={`mt-6 flex gap-2 flex-wrap transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                {[
                  { key: 'restaurant', label: 'Restaurantes' },
                  { key: 'menu',       label: 'Platillos' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTabChange(key)}
                    className={`inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      tab === key
                        ? 'border-orange-500 bg-orange-500 text-slate-950 shadow-sm scale-105'
                        : 'border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-600 hover:bg-slate-900 hover:scale-105'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* â”€â”€ Activity warning â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {!initLoading && !hasActivity && (
          <div className="flex items-start gap-3 rounded-[32px] border border-orange-500/30 bg-orange-500/10 px-5 py-4 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-orange-300">Sin actividad registrada</p>
              <p className="text-xs text-orange-400/80 mt-0.5">
                Necesitas al menos un pedido para dejar una reseña. Puedes leer opiniones de otros clientes.
              </p>
            </div>
          </div>
        )}

        {/* â”€â”€ MAIN GRID â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {initLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : (
          <section className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">

            {/* â”€â”€ Left: restaurant/menu cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <article className="rounded-[32px] border border-slate-800/80 bg-slate-900/70 p-6 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.8)] backdrop-blur-sm">
              <p className="inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.26em] text-orange-300">Descubre</p>
              <h2 className="mt-4 text-xl font-semibold text-white">
                {tab === 'restaurant' ? 'Restaurantes disponibles' : 'Platillos del menú'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Selecciona un {tab === 'restaurant' ? 'restaurante' : 'platillo'} para leer sus reseñas
                {hasActivity ? ' y dejar la tuya.' : '.'}
              </p>

              {items.length === 0 ? (
                <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 py-14 text-center">
                  <p className="mt-3 text-sm text-slate-500">
                    No hay {tab === 'restaurant' ? 'restaurantes' : 'platillos'} disponibles.
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {items.map((item) => {
                    const itemReviews = reviewsMap[item._id] ?? null
                    const avg = itemReviews?.length
                      ? (itemReviews.reduce((s, r) => s + Number(r.rating), 0) / itemReviews.length).toFixed(1)
                      : null
                    const isSelected = selectedId === item._id

                    return (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => handleSelect(item._id)}
                        className={`group overflow-hidden rounded-[24px] border-2 text-left transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 active:scale-95 ${
                          isSelected
                            ? 'border-orange-500 ring-2 ring-orange-500/20 bg-slate-950'
                            : 'border-white/10 bg-slate-950/70 hover:border-orange-400/30'
                        }`}
                      >
                        <div className="h-36 w-full overflow-hidden bg-slate-900">
                          {item[photoKey] ? (
                            <img
                              src={item[photoKey]}
                              alt={item[nameKey]}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
                            </div>
                          )}
                        </div>
                        <div className={`p-3 ${isSelected ? 'bg-slate-900' : 'bg-slate-950/70'}`}>
                          <h3 className="text-sm font-semibold text-white truncate">{item[nameKey]}</h3>
                          {avg ? (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <StarRating value={Math.round(Number(avg))} readonly size="sm" />
                              <span className="text-xs text-slate-400 shrink-0">{avg} · {itemReviews.length} {itemReviews.length === 1 ? 'reseña' : 'reseñas'}</span>
                            </div>
                          ) : (
                            <p className="mt-1 text-xs italic text-slate-500">Sin reseñas aún</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </article>

            {/* â”€â”€ Right: detail panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <article className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/80 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.9)]">

              {!selectedId ? (
                /* â”€â”€ Inspiration placeholder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
                <div className="relative flex h-full flex-col gap-5 p-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-orange-400">Tu opinión</p>
                    <h3 className="mt-2 text-xl font-bold text-white">Tu reseña vale mucho</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Ayuda a otros comensales a descubrir los mejores lugares. Elige un restaurante de la lista para empezar.
                    </p>
                  </div>

                  <div className="grid gap-3 mt-auto">
                    <div className="rounded-3xl bg-orange-500/15 border border-orange-500/30 p-4">
                      <p className="text-sm font-semibold text-orange-300">Reseñas honestas</p>
                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        Tu opinión ayuda a los restaurantes a mejorar y a otros clientes a elegir con confianza.
                      </p>
                    </div>
                    <div className="rounded-3xl bg-slate-950/70 border border-white/10 p-4">
                      <p className="text-sm font-semibold text-white">Consejos al calificar</p>
                      <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-400">
                        <li>• Sé específico sobre lo que más te gustó.</li>
                        <li>• Menciona el servicio, la comida y el ambiente.</li>
                        <li>• Una calificación justa ayuda a todos.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                /* â”€â”€ Selected restaurant detail â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
                <div className="relative flex flex-col h-full">
                  {/* Detail header */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-800 p-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-orange-400">
                        {tab === 'restaurant' ? 'Restaurante' : 'Platillo'}
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-white">{selectedItem?.[nameKey]}</h3>
                      {avgRating > 0 && (
                        <div className="mt-1 flex items-center gap-2">
                          <StarRating value={Math.round(avgRating)} readonly size="sm" />
                          <span className="text-xs text-slate-400">
                            {avgRating.toFixed(1)} · {selectedReviews.length} {selectedReviews.length === 1 ? 'reseña' : 'reseñas'}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedId('')}
                      className="rounded-xl border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 transition"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex flex-col gap-5 overflow-y-auto p-5 flex-1">
                    {/* Reviews list */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
                        Opiniones ({selectedReviews.length})
                      </p>

                      {/* Filtro por estrellas */}
                      {!reviewsLoading && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <button
                            type="button"
                            onClick={() => setStarFilter(0)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                              starFilter === 0
                                ? 'border-orange-500 bg-orange-500 text-slate-950'
                                : 'border-slate-700 bg-slate-950/70 text-slate-400 hover:border-slate-600'
                            }`}
                          >
                            Todas ({selectedReviews.length})
                          </button>
                          {starCounts.map(({ s, count }) =>
                            count > 0 ? (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setStarFilter(starFilter === s ? 0 : s)}
                                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                                  starFilter === s
                                    ? 'border-amber-400 bg-amber-400 text-slate-950'
                                    : 'border-slate-700 bg-slate-950/70 text-slate-400 hover:border-amber-400/50'
                                }`}
                              >
                                {s}★ ({count})
                              </button>
                            ) : null
                          )}
                        </div>
                      )}

                      {reviewsLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="h-6 w-6 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
                        </div>
                      ) : selectedReviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-8 text-center">
                          <p className="mt-2 text-xs text-slate-500">Aún no hay reseñas.</p>
                          {hasActivity && <p className="text-xs text-orange-400 mt-0.5">¡Sé el primero en opinar!</p>}
                        </div>
                      ) : filteredReviews.length > 0 ? (
                        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                          {filteredReviews.map((r) => <ReviewCard key={r._id} review={r} currentUserId={user?.uid} onDelete={handleDeleteReview} />)}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-500/30 py-6 text-center">
                          <p className="mt-2 text-xs text-slate-500">No hay reseñas de {starFilter}★ para este elemento.</p>
                          <button type="button" onClick={() => setStarFilter(0)} className="mt-1.5 text-xs text-orange-400 hover:underline">Ver todas</button>
                        </div>
                      )}
                    </div>

                    {/* Write review form */}
                    {hasActivity ? (
                      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">
                          Deja tu reseña
                        </p>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-slate-400">Puntuación *</label>
                          <StarRating
                            value={form.rating}
                            onChange={(v) => setForm((p) => ({ ...p, rating: v }))}
                          />
                          {form.rating > 0 && (
                            <p className="text-xs font-medium text-orange-400">{RATING_LABELS[form.rating]}</p>
                          )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-slate-400">
                            Comentario <span className="font-normal text-slate-500">(opcional)</span>
                          </label>
                          <textarea
                            value={form.comment}
                            onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                            rows={3}
                            maxLength={500}
                            placeholder="Describe tu experiencia..."
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none transition"
                          />
                          <p className="text-right text-xs text-slate-500">{form.comment.length}/500</p>
                        </div>

                        <button
                          type="submit"
                          disabled={submitting || !form.rating}
                          className="rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/20 hover:bg-orange-400 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Enviando…
                            </span>
                          ) : 'Enviar reseña'}
                        </button>
                      </form>
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-8 text-center px-4">
                        <p className="mt-2 text-xs font-semibold text-slate-400">Realiza un pedido primero</p>
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                          Necesitas tener al menos un pedido para dejar una reseña.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </article>

          </section>
        )}
      </div>
    </section>
  )
}

