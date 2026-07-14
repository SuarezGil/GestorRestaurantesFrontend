import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getRestaurants } from '../../shared/api/restaurants'
import { getTables } from '../../shared/api/tables'
import { getReviewsByRestaurant } from '../../shared/api/reviews'
import { createReservation, getMyReservations } from '../../shared/api/reservations'
import { showError, showSuccess } from '../../shared/utils/toast'
import heroImg from '../../assets/img/restaurant-hero.png'
import ambianceImg from '../../assets/img/restaurant-ambiance.png'

// ─── helpers ────────────────────────────────────────────────────────────────
const getErrorMessage = (err, fallback) => {
  const data = err?.response?.data
  if (data?.errors?.length) return data.errors[0].message
  return data?.message || err?.message || fallback
}

const toInputDateTime = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })
}

const emptyForm = {
  restaurantId: '',
  tableId: [],
  numberPeople: 2,
  typeReservation: 'PERSONAL',
  description: '',
  coupon: '',
  startDate: '',
  endDate: '',
  photo: null,
}

const inputCls = 'mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
const labelCls = 'flex flex-col text-sm font-semibold text-slate-300'

// ─── AvailabilityBadge ───────────────────────────────────────────────────────
const AvailabilityBadge = ({ checking, conflict }) => {
  if (checking)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
        <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
        Verificando disponibilidad…
      </span>
    )
  if (conflict === null) return null
  if (conflict)
    return (
      <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">
        Horario con conflicto
      </span>
    )
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
      Horario disponible
    </span>
  )
}

// ─── main component ───────────────────────────────────────────────────────────
export const ClientRestaurants = () => {
  const [restaurants, setRestaurants] = useState([])
  const [restaurantReviews, setRestaurantReviews] = useState({})
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [showReservationModal, setShowReservationModal] = useState(false)

  // Wizard states
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [tables, setTables] = useState([])
  const [loadingTables, setLoadingTables] = useState(false)
  const [myReservations, setMyReservations] = useState([])
  const [checking, setChecking] = useState(false)
  const [conflict, setConflict] = useState(null)
  const debounceRef = useRef(null)

  // ── load restaurants and reviews ──────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const { data } = await getRestaurants({ restaurantActive: true, limit: 100 })
        const restaurantsList = data?.data || []
        setRestaurants(restaurantsList)

        // Load reviews for each restaurant
        const reviewsPromises = restaurantsList.map(async (restaurant) => {
          try {
            const reviewsData = await getReviewsByRestaurant(restaurant._id)
            return { id: restaurant._id, reviews: reviewsData.data?.reviews || [] }
          } catch {
            return { id: restaurant._id, reviews: [] }
          }
        })

        const reviewsResults = await Promise.all(reviewsPromises)
        const reviewsMap = reviewsResults.reduce((acc, { id, reviews }) => {
          acc[id] = reviews
          return acc
        }, {})
        setRestaurantReviews(reviewsMap)

        // Load my reservations
        const reservationsData = await getMyReservations()
        setMyReservations(reservationsData.data?.reservations || [])
      } catch (err) {
        showError('No se pudieron cargar los restaurantes.')
      } finally {
        setLoading(false)
        setTimeout(() => setMounted(true), 60)
      }
    }
    loadData()
  }, [])

  // ── calculate average rating ──────────────────────────────────────────────
  const getRestaurantRating = (restaurantId) => {
    const reviews = restaurantReviews[restaurantId] || []
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + Number(review.rating || 0), 0)
    return (sum / reviews.length).toFixed(1)
  }

  // ── load tables when restaurant changes ───────────────────────────────────
  useEffect(() => {
    if (!form.restaurantId) { setTables([]); return }
    let cancelled = false
    setLoadingTables(true)
    setForm((p) => ({ ...p, tableId: [] }))
    setConflict(null)
    getTables({ restaurantId: form.restaurantId, tableActive: true, limit: 100 })
      .then(({ data }) => { if (!cancelled) setTables(data?.data || []) })
      .catch(() => { if (!cancelled) setTables([]) })
      .finally(() => { if (!cancelled) setLoadingTables(false) })
    return () => { cancelled = true }
  }, [form.restaurantId])

  // ── real-time availability ────────────────────────────────────────────────
  useEffect(() => {
    const { tableId, startDate, endDate, restaurantId } = form
    if (!tableId.length || !startDate || !endDate || !restaurantId) { setConflict(null); return }
    clearTimeout(debounceRef.current)
    setChecking(true)
    debounceRef.current = setTimeout(() => {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (end <= start) { setConflict(null); setChecking(false); return }
      const hasConflict = myReservations.some((r) => {
        if (r.status === 'CANCELADO') return false
        const rStart = new Date(r.startDate)
        const rEnd = new Date(r.endDate)
        const tableOverlap = (r.tableId || []).some((t) => tableId.includes(t._id || t))
        return tableOverlap && start < rEnd && end > rStart
      })
      setConflict(hasConflict)
      setChecking(false)
    }, 500)
  }, [form.tableId, form.startDate, form.endDate, form.restaurantId, myReservations])

  // ── auto-select restaurant when detail modal opens ────────────────────────
  useEffect(() => {
    if (selectedRestaurant && selectedRestaurant._id !== form.restaurantId) {
      setForm((prev) => ({ ...prev, restaurantId: selectedRestaurant._id }))
      setStep(1)
    }
  }, [selectedRestaurant])

  // ── derived ───────────────────────────────────────────────────────────────
  const selectedCapacity = useMemo(
    () => form.tableId.reduce((sum, id) => {
      const t = tables.find((x) => x._id === id)
      return sum + Number(t?.tableCapacity || 0)
    }, 0),
    [form.tableId, tables]
  )

  const selectedRestaurantData = useMemo(
    () => restaurants.find((r) => r._id === form.restaurantId),
    [restaurants, form.restaurantId]
  )

  // ── helpers ───────────────────────────────────────────────────────────────
  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }))

  const toggleTable = (id) => {
    setForm((p) => ({
      ...p,
      tableId: p.tableId.includes(id) ? p.tableId.filter((x) => x !== id) : [...p.tableId, id],
    }))
  }

  const resetWizard = () => {
    setForm(emptyForm)
    setStep(1)
    setConflict(null)
  }

  const openReservationModal = (restaurant) => {
    // Instead of opening a separate modal, we use the detail modal with wizard
    setForm({ ...emptyForm, restaurantId: restaurant._id })
    setStep(1)
  }

  const closeReservationModal = () => {
    setShowReservationModal(false)
    resetWizard()
  }

  // ── validation ────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!form.restaurantId) { showError('Selecciona un restaurante.'); return false }
    if (!form.startDate || !form.endDate) { showError('Indica fecha y hora de inicio y fin.'); return false }
    if (new Date(form.endDate) <= new Date(form.startDate)) { showError('La fecha de fin debe ser posterior al inicio.'); return false }
    if (form.typeReservation === 'EVENTO' && !form.description.trim()) { showError('Las reservas de tipo Evento requieren descripción.'); return false }
    return true
  }

  const validateStep2 = () => {
    if (!form.tableId.length) { showError('Selecciona al menos una mesa.'); return false }
    const needed = Number(form.numberPeople || 1)
    if (selectedCapacity < needed) {
      showError(`Capacidad insuficiente: ${selectedCapacity} de ${needed} personas cubiertas. Selecciona más mesas.`)
      return false
    }
    if (conflict) { showError('Hay un conflicto de horario. Cambia el horario o la mesa.'); return false }
    return true
  }

  const goNext = () => {
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
  }

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return
    setSaving(true)
    const payload = {
      restaurantId: form.restaurantId,
      tableId: form.tableId,
      numberPeople: Number(form.numberPeople) || 1,
      typeReservation: form.typeReservation,
      description: form.description,
      coupon: form.coupon?.trim() || undefined,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      photo: form.photo,
    }
    try {
      await createReservation(payload)
      showSuccess('¡Reserva creada! Te esperamos.')
      closeReservationModal()
      // Reload reservations
      const reservationsData = await getMyReservations()
      setMyReservations(reservationsData.data?.reservations || [])
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo guardar la reservación.'))
    } finally {
      setSaving(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <section className="font-serif relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">

        {/* HEADER */}
        <header className={`rounded-[32px] border border-slate-800/80 bg-slate-900/70 p-8 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.8)] backdrop-blur-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className={`flex flex-col md:flex-row items-center gap-6`}>
            <div className="md:w-2/3">
              <p className={`inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.26em] text-orange-300 transition-all duration-500 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                Descubre
              </p>
              <h1 className={`font-serif mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                Nuestros <span className="text-orange-400">restaurantes</span> de calidad
              </h1>
              <p className={`font-serif mt-4 max-w-2xl text-base leading-8 text-slate-300 transition-all duration-800 delay-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                Explora nuestra selección de restaurantes, revisa sus calificaciones y reserva tu mesa en minutos.
              </p>
            </div>
            <div className="md:w-1/3 hidden md:flex justify-end">
              <img src={heroImg} alt="Hero" className={`w-56 rounded-[28px] border border-white/10 shadow-xl transform transition-all duration-800 ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`} />
            </div>
          </div>
        </header>

        {/* RESTAURANTS GRID */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant, idx) => {
              const avgRating = getRestaurantRating(restaurant._id)
              const reviewCount = restaurantReviews[restaurant._id]?.length || 0
              return (
                <article
                  key={restaurant._id}
                  className={`group overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/80 shadow-sm transition-all duration-300 hover:border-orange-400/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10 cursor-pointer ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                  style={{ transitionDelay: `${300 + idx * 100}ms` }}
                  onClick={() => setSelectedRestaurant(restaurant)}
                >
                  {restaurant.restaurantPhoto ? (
                    <div className="h-48 w-full overflow-hidden bg-slate-900">
                      <img
                        src={restaurant.restaurantPhoto}
                        alt={restaurant.restaurantName}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="h-48 w-full bg-gradient-to-br from-slate-800 to-slate-950" />
                  )}

                  <div className="p-6 space-y-3">
                    <h3 className="font-serif text-xl font-bold text-white">{restaurant.restaurantName}</h3>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className={`text-lg ${Number(avgRating) >= star ? 'text-amber-400' : 'text-slate-700'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-slate-400">
                        {avgRating > 0 ? `${avgRating} (${reviewCount} ${reviewCount === 1 ? 'reseña' : 'reseñas'})` : 'Sin reseñas'}
                      </span>
                    </div>

                    {/* Schedule */}
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span className="font-semibold text-orange-400">Horario:</span>
                      <span>{restaurant.restaurantSchedule || 'No especificado'}</span>
                    </div>

                    {/* Address */}
                    {restaurant.restaurantAddress && (
                      <p className="text-xs text-slate-500 line-clamp-2">{restaurant.restaurantAddress}</p>
                    )}

                    <button
                      type="button"
                      className="w-full rounded-xl bg-orange-500/10 border border-orange-500/30 px-4 py-2 text-sm font-semibold text-orange-400 transition-all hover:bg-orange-500 hover:text-slate-950"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedRestaurant(restaurant)
                      }}
                    >
                      Ver detalles
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* BOTTOM SECTIONS */}
        <div className="grid gap-5 lg:grid-cols-2 mt-8">
          {/* Experiences */}
          <article className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.9)]">
            <p className="text-xs uppercase tracking-[0.28em] text-orange-300">Experiencias</p>
            <h2 className="font-serif mt-3 text-2xl font-semibold text-white">Calidad garantizada</h2>
            <p className="font-serif mt-3 text-sm leading-6 text-slate-300">
              Todos nuestros restaurantes han sido cuidadosamente seleccionados para ofrecerte la mejor experiencia gastronómica. 
              Ambiente acogedor, servicio de primera y platos que deleitan el paladar.
            </p>
            <div className="mt-6 space-y-3">
              <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-4">
                <p className="font-serif text-sm font-semibold text-white">Variedad de opciones</p>
                <p className="font-serif mt-2 text-xs leading-5 text-slate-400">
                  Desde cocina tradicional hasta propuestas innovadoras, encuentra el lugar perfecto para cada ocasión.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-4">
                <p className="font-serif text-sm font-semibold text-white">Calificaciones reales</p>
                <p className="font-serif mt-2 text-xs leading-5 text-slate-400">
                  Las estrellas que ves reflejan las opiniones auténticas de nuestros clientes. Tu opinión también cuenta.
                </p>
              </div>
            </div>
          </article>

          {/* Inspiration */}
          <article className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.9)]">
            <div className="flex h-full flex-col justify-between gap-5">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Inspírate</p>
                <h3 className="font-serif mt-3 text-2xl font-bold text-white">Tu próxima visita te espera</h3>
                <p className="font-serif mt-2 text-sm leading-6 text-slate-300">
                  Explora, compara y elige. Hacer una reserva nunca fue tan fácil. Tu mesa ideal está a un clic de distancia.
                </p>
              </div>

              <div className="overflow-hidden rounded-[32px] border border-white/10">
                <img src={ambianceImg} alt="Ambiente de restaurante" className="h-56 w-full object-cover" />
              </div>

              <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-4">
                <p className="font-serif text-sm font-semibold text-white">Consejos para elegir</p>
                <ul className="font-serif mt-3 space-y-2 text-xs leading-5 text-slate-400">
                  <li>• Revisa las calificaciones y reseñas de otros clientes.</li>
                  <li>• Verifica los horarios antes de hacer tu reserva.</li>
                  <li>• Considera la ubicación y el tipo de cocina que ofrece.</li>
                </ul>
              </div>
            </div>
          </article>
        </div>
      </div>

      {/* RESTAURANT DETAIL MODAL WITH WIZARD */}
      {selectedRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedRestaurant(null)}>
          <div className="relative w-full max-w-7xl max-h-[90vh] overflow-y-auto rounded-[32px] border border-white/10 bg-slate-900 p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => { setSelectedRestaurant(null); resetWizard(); }}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition hover:bg-slate-700 hover:text-white z-10"
            >
              ✕
            </button>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* LEFT COLUMN: Restaurant Info */}
              <div className="space-y-6">
                {selectedRestaurant.restaurantPhoto && (
                  <div className="overflow-hidden rounded-[24px]">
                    <img src={selectedRestaurant.restaurantPhoto} alt={selectedRestaurant.restaurantName} className="w-full h-64 object-cover" />
                  </div>
                )}

                <div>
                  <h2 className="font-serif text-3xl font-bold text-white">{selectedRestaurant.restaurantName}</h2>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`text-xl ${Number(getRestaurantRating(selectedRestaurant._id)) >= star ? 'text-amber-400' : 'text-slate-700'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-slate-400">
                      {getRestaurantRating(selectedRestaurant._id)} ({restaurantReviews[selectedRestaurant._id]?.length || 0} reseñas)
                    </span>
                  </div>
                </div>

                <div className="space-y-4 rounded-[24px] border border-white/10 bg-slate-950/70 p-6">
                  {[
                    ['Dirección', selectedRestaurant.restaurantAddress || 'No especificada'],
                    ['Teléfono', selectedRestaurant.restaurantPhone || 'No especificado'],
                    ['Horario', selectedRestaurant.restaurantSchedule || 'No especificado'],
                    ['Capacidad', `${selectedRestaurant.restaurantCapacity || 0} personas`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 text-sm">
                      <span className="font-semibold text-slate-400">{label}:</span>
                      <span className="text-right text-white">{value}</span>
                    </div>
                  ))}
                </div>

                {selectedRestaurant.restaurantDescription && (
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-white">Descripción</h3>
                    <p className="font-serif mt-2 text-sm leading-6 text-slate-300">{selectedRestaurant.restaurantDescription}</p>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Reservation Wizard */}
              <div className="space-y-6 rounded-[24px] border border-orange-500/20 bg-slate-950/50 p-6">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-white">Hacer Reservación</h3>
                  <p className="text-sm text-slate-400 mt-1">Completa los datos para reservar tu mesa</p>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex flex-1 items-center gap-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${step >= s ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                        {s}
                      </div>
                      {s < 3 && <div className={`h-1 flex-1 rounded-full transition ${step > s ? 'bg-orange-500' : 'bg-slate-800'}`} />}
                    </div>
                  ))}
                </div>

                {/* STEP 1 */}
                {step === 1 && (
                  <div className="space-y-4">
                    <h4 className="font-serif text-lg font-bold text-white">Detalles de la Reserva</h4>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className={labelCls}>
                        Fecha y hora de inicio
                        <input type="datetime-local" className={inputCls} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
                      </label>
                      <label className={labelCls}>
                        Fecha y hora de fin
                        <input type="datetime-local" className={inputCls} value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
                      </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className={labelCls}>
                        Número de personas
                        <input type="number" min="1" max="50" className={inputCls} value={form.numberPeople} onChange={(e) => set('numberPeople', e.target.value)} />
                      </label>
                      <label className={labelCls}>
                        Tipo de reserva
                        <select className={inputCls} value={form.typeReservation} onChange={(e) => set('typeReservation', e.target.value)}>
                          <option value="PERSONAL">Personal</option>
                          <option value="EVENTO">Evento</option>
                        </select>
                      </label>
                    </div>

                    <label className={labelCls}>
                      Descripción {form.typeReservation === 'EVENTO' && <span className="ml-1 text-xs font-normal text-orange-400">*requerida para eventos</span>}
                      <textarea
                        className={`${inputCls} resize-none`}
                        rows={3}
                        placeholder="Ej: Cumpleaños, reunión de negocios..."
                        value={form.description}
                        onChange={(e) => set('description', e.target.value)}
                      />
                    </label>

                    <div className="flex justify-end gap-3 pt-2">
                      <button type="button" onClick={goNext} className="rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:bg-orange-400 active:scale-95">
                        Siguiente → Seleccionar mesa
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="font-serif text-lg font-bold text-white">Elige tu mesa</h4>
                        <p className="font-serif mt-1 text-sm text-slate-400">
                          Selecciona mesas para cubrir <strong className="text-white">{form.numberPeople} personas</strong>
                        </p>
                      </div>
                      <AvailabilityBadge checking={checking} conflict={conflict} />
                    </div>

                    {loadingTables && (
                      <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
                        <p className="text-sm font-semibold">Buscando mesas disponibles…</p>
                      </div>
                    )}

                    {!loadingTables && tables.length === 0 && (
                      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-amber-200 bg-amber-50 py-12">
                        <p className="text-sm font-semibold text-amber-700">Sin mesas registradas</p>
                        <p className="text-xs text-amber-600 text-center px-6">Este restaurante aún no tiene mesas disponibles.</p>
                      </div>
                    )}

                    {!loadingTables && tables.length > 0 && form.tableId.length > 0 && (
                      <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="font-semibold text-white">Capacidad cubierta</span>
                          <span className={`font-bold ${selectedCapacity >= Number(form.numberPeople || 1) ? 'text-emerald-400' : 'text-orange-400'}`}>
                            {selectedCapacity} / {form.numberPeople} personas
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${selectedCapacity >= Number(form.numberPeople || 1) ? 'bg-emerald-500' : 'bg-orange-500'}`}
                            style={{ width: `${Math.min(100, (selectedCapacity / Number(form.numberPeople || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {!loadingTables && tables.length > 0 && (
                      <div className="grid gap-3 sm:grid-cols-2 max-h-80 overflow-y-auto pr-2">
                        {tables.map((t) => {
                          const selected = form.tableId.includes(t._id)
                          const cap = Number(t.tableCapacity || 0)
                          return (
                            <button
                              key={t._id}
                              type="button"
                              onClick={() => toggleTable(t._id)}
                              className={`flex flex-col gap-2 rounded-[24px] border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-95
                              ${selected ? 'border-orange-500/50 bg-orange-500/10' : 'border-white/10 bg-slate-950/60 hover:border-orange-400/30'}`}
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-white">{t.tableName || `Mesa ${t._id.slice(-4)}`}</p>
                                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${selected ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                  {selected ? '✓' : ''}
                                </span>
                              </div>
                              <p className="text-sm text-slate-400">Capacidad: {cap} {cap === 1 ? 'persona' : 'personas'}</p>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-full border border-slate-700 bg-slate-950/80 px-6 py-2.5 text-sm font-semibold text-white transition hover:border-slate-500 active:scale-95">
                        ← Atrás
                      </button>
                      <button type="button" onClick={goNext} className="flex-1 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:bg-orange-400 active:scale-95">
                        Confirmar →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <div className="space-y-4">
                    <h4 className="font-serif text-lg font-bold text-white">Resumen de la Reserva</h4>

                    <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Restaurante:</span>
                        <span className="font-semibold text-white">{selectedRestaurantData?.restaurantName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Inicio:</span>
                        <span className="font-semibold text-white">{formatDate(form.startDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fin:</span>
                        <span className="font-semibold text-white">{formatDate(form.endDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Personas:</span>
                        <span className="font-semibold text-white">{form.numberPeople}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tipo:</span>
                        <span className="font-semibold text-white">{form.typeReservation}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mesas:</span>
                        <span className="font-semibold text-white">{form.tableId.length}</span>
                      </div>
                      {form.description && (
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-400">Descripción:</span>
                          <span className="font-semibold text-white">{form.description}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-full border border-slate-700 bg-slate-950/80 px-6 py-2.5 text-sm font-semibold text-white transition hover:border-slate-500 active:scale-95">
                        ← Atrás
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-1 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:bg-orange-400 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-700"
                      >
                        {saving ? 'Guardando…' : 'Confirmar Reserva'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
