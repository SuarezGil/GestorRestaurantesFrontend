import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { approvePromotion, createPromotion, getActivePromotions, getAllPromotions } from '../../shared/api/promotions'
import { getReservations } from '../../shared/api/reservations'
import { getEventsByReservation } from '../../shared/api/events'
import { getRestaurants } from '../../shared/api/restaurants'
import { showError, showInfo, showSuccess } from '../../shared/utils/toast'
import { FilterBar } from '../../shared/components/ui/FilterBar'

const formatDate = (value) => {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'Sin fecha'
  return date.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatDateTime = (value) => {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'Sin fecha'
  return date.toLocaleString('es-GT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const buildCouponUrl = (path, code) => {
  if (!code) return path
  return `${path}?coupon=${encodeURIComponent(code)}`
}

export const Promotions = () => {
  const [promotions, setPromotions] = useState([])
  const [events, setEvents] = useState([])
  const [eventReservations, setEventReservations] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    restaurantId: '',
    title: '',
    description: '',
    couponCode: '',
    discountPercentage: 0,
    startDate: '',
    endDate: '',
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const resetForm = () => {
    setForm({
      restaurantId: '',
      title: '',
      description: '',
      couponCode: '',
      discountPercentage: 0,
      startDate: '',
      endDate: '',
    })
  }

  const loadData = async (options = {}) => {
    const { silent = false } = options
    if (!silent) {
      setLoading(true)
    }
    setError(null)

    try {
      const [promotionsRes, reservationsRes, restaurantsRes] = await Promise.all([
        getAllPromotions().catch(() => getActivePromotions()),
        getReservations().catch(() => ({ data: { reservations: [] } })),
        getRestaurants({ limit: 200 }).catch(() => ({ data: { data: [] } })),
      ])

      const promotionsData = promotionsRes.data?.promotions || []
      const reservations = reservationsRes.data?.reservations || []
      const restaurantList = restaurantsRes.data?.data || []

      const eventReservationsList = reservations.filter(
        (reservation) => reservation.typeReservation === 'EVENTO'
      )

      const eventsResults = await Promise.allSettled(
        eventReservationsList.map((reservation) => getEventsByReservation(reservation._id))
      )

      const eventsData = eventsResults.flatMap((result, index) => {
        if (result.status !== 'fulfilled') {
          return []
        }
        const reservation = eventReservationsList[index]
        const entries = result.value?.data?.events || []
        return entries.map((eventItem) => ({
          ...eventItem,
          reservation,
        }))
      })

      setPromotions(promotionsData)
      setEventReservations(eventReservationsList)
      setEvents(eventsData)
      setRestaurants(restaurantList)
    } catch (_err) {
      setError('No se pudo cargar la informacion de promociones y eventos.')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const restaurantsById = useMemo(() => {
    return new Map(restaurants.map((restaurant) => [restaurant._id, restaurant]))
  }, [restaurants])

  const isPromotionActive = (promo) => {
    if (!promo?.isActive || !promo?.isApproved) return false
    const now = new Date()
    const start = promo.startDate ? new Date(promo.startDate) : null
    const end = promo.endDate ? new Date(promo.endDate) : null
    if (start && now < start) return false
    if (end && now > end) return false
    return true
  }

  const filteredPromotions = useMemo(() => {
    return promotions.filter((promo) => {
      const searchLower = searchTerm.toLowerCase()
      const title = promo.title || ''
      const description = promo.description || ''
      const couponCode = promo.couponCode || ''

      const matchesSearch =
        !searchTerm ||
        title.toLowerCase().includes(searchLower) ||
        description.toLowerCase().includes(searchLower) ||
        couponCode.toLowerCase().includes(searchLower)

      let matchesDate = true
      if (startDate || endDate) {
        const itemDate = new Date(promo.createdAt || promo.startDate)
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
  }, [promotions, searchTerm, startDate, endDate])

  const activePromotions = filteredPromotions.filter((promo) => promo.isApproved === true && promo.isActive !== false)
  const pendingPromotions = filteredPromotions.filter((promo) => promo.isApproved === false)
  const couponPromotions = activePromotions.filter((promo) => promo.couponCode && isPromotionActive(promo))

  const handleCopyCoupon = async (code) => {
    if (!code) return
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(code)
    }
  }

  const handleApprovePromotion = async (promotionId) => {
    if (!promotionId) return
    setSaving(true)
    try {
      await approvePromotion(promotionId)
      showSuccess('Promocion aprobada.')
      await loadData({ silent: true })
    } catch (_err) {
      showError('No se pudo aprobar la promocion.')
    } finally {
      setSaving(false)
    }
  }

  const handleCreatePromotion = async (event) => {
    event.preventDefault()

    if (!form.restaurantId) {
      showError('Selecciona un restaurante.')
      return
    }
    if (!form.title.trim()) {
      showError('El titulo es obligatorio.')
      return
    }

    const discount = Number(form.discountPercentage)
    if (Number.isNaN(discount) || discount < 0 || discount > 100) {
      showError('El descuento debe estar entre 0 y 100.')
      return
    }

    const payload = {
      restaurantId: form.restaurantId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      couponCode: form.couponCode.trim() || null,
      discountPercentage: discount,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
    }

    setSaving(true)
    try {
      await createPromotion(payload)
      showSuccess('Promocion creada correctamente.')
      showInfo('Queda pendiente de aprobacion para mostrarse como activa.')
      resetForm()
      await loadData({ silent: true })
    } catch (_err) {
      showError('No se pudo crear la promocion.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-6 font-sans text-slate-300 antialiased max-w-[1600px] mx-auto p-4 md:p-6">
      
      {/* Header Adaptado a Entornos Oscuros */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Marketing & Eventos</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Promociones y Eventos
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Consulta promociones activas, cupones disponibles y la agenda operativa de reservas destacadas.
          </p>
        </div>
        
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-right shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Resumen del Servidor</p>
          <p className="text-xs text-slate-300 mt-0.5 font-medium">{activePromotions.length} Promos activas • {eventReservations.length} Eventos</p>
        </div>
      </header>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-center text-sm text-rose-400 font-medium">
          {error}
        </div>
      )}

      {/* Grid de Distribución */}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        
        {/* Columna Izquierda: Formulario y Listado */}
        <div className="space-y-6">
          
          {/* Bloque 1: Formulario de Creación (Glassmorphism) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-xl">
            <div className="border-b border-slate-800/60 pb-3">
              <h2 className="text-base font-bold text-white">Nueva oferta comercial</h2>
              <p className="text-xs text-slate-400">Las campañas ingresadas requieren aprobación interna previa.</p>
            </div>

            <form onSubmit={handleCreatePromotion} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Restaurante Sede
                  </label>
                  <select
                    value={form.restaurantId}
                    onChange={(e) => setForm((prev) => ({ ...prev, restaurantId: e.target.value }))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="" className="bg-slate-950">Selecciona una sede...</option>
                    {restaurants.map((restaurant) => (
                      <option key={restaurant._id} value={restaurant._id} className="bg-slate-950">
                        {restaurant.restaurantName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Porcentaje de Descuento
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.discountPercentage}
                    onChange={(e) => setForm((prev) => ({ ...prev, discountPercentage: e.target.value }))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Título de la promoción
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none placeholder-slate-600"
                  placeholder="Ej: 2x1 en pastas selectas o Noche de Cócteles"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Términos y Condiciones (Opcional)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none placeholder-slate-600 resize-none"
                  rows={2}
                  placeholder="Especifica días aplicables, restricciones de consumo o alérgenos..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Código de Cupón (Opcional)
                  </label>
                  <input
                    type="text"
                    value={form.couponCode}
                    onChange={(e) => setForm((prev) => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none placeholder-slate-600"
                    placeholder="Ej: DESCUENTOPAX"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Período de Vigencia
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none [color-scheme:dark]"
                    />
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  Limpiar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 transition-all disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Crear promoción'}
                </button>
              </div>
            </form>
          </div>

          {/* Bloque 2: Listado Central de Ofertas Aprobadas */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Ofertas vigentes en catálogo</h2>
                <p className="text-xs text-slate-400">Campañas comerciales distribuidas y visibles al público.</p>
              </div>
              <span className="rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-300">
                {loading ? 'Sincronizando...' : `${activePromotions.length} Habilitadas`}
              </span>
            </div>

            <FilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              startDate={startDate}
              onStartDateChange={setStartDate}
              endDate={endDate}
              onEndDateChange={setEndDate}
              searchPlaceholder="Buscar por título, descripción o cupón..."
            />

            <div className="grid gap-4 pt-2">
              {activePromotions.length === 0 && !loading && (
                <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
                  No se registran promociones activas bajo este parámetro.
                </div>
              )}
              
              {activePromotions.map((promo) => {
                const restaurant = restaurantsById.get(promo.restaurantId?._id || promo.restaurantId)
                const sDate = formatDate(promo.startDate)
                const eDate = formatDate(promo.endDate)
                const now = new Date()
                const start = promo.startDate ? new Date(promo.startDate) : null
                const end = promo.endDate ? new Date(promo.endDate) : null
                
                const promoStatus = (!start || now >= start) && (!end || now <= end)
                  ? { label: 'Vigente', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
                  : start && now < start
                  ? { label: 'Programada', cls: 'bg-sky-500/10 text-sky-400 border-sky-500/20' }
                  : { label: 'Vencida', cls: 'bg-slate-800 text-slate-400 border-slate-700' }

                return (
                  <article key={promo._id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                            {restaurant?.restaurantName || 'Sede General'}
                          </p>
                          <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${promoStatus.cls}`}>
                            {promoStatus.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white pt-1">{promo.title}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                          {promo.description || 'Campaña de beneficio exclusivo activa para comandas presenciales o digitales.'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-center min-w-[100px] shrink-0 self-stretch sm:self-auto flex sm:flex-col items-center justify-between sm:justify-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Beneficio</p>
                        <p className="text-xl font-black text-indigo-400 mt-0.5">-{promo.discountPercentage || 0}%</p>
                      </div>
                    </div>

                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 pt-2 border-t border-slate-800/40">
                      <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/50">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cupón de Canje</p>
                        <p className="mt-0.5 text-xs font-mono font-bold text-slate-200">{promo.couponCode || 'Uso automático'}</p>
                      </div>
                      <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/50">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vigencia Oficial</p>
                        <p className="mt-0.5 text-xs font-medium text-slate-300">{sDate} al {eDate}</p>
                      </div>
                      <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/50">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Condiciones</p>
                        <p className="mt-0.5 text-xs font-medium text-slate-300">Aplica en checkout</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Link
                        to={buildCouponUrl('/dashboard/orders', promo.couponCode)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all border ${promo.couponCode ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500' : 'bg-slate-800 border-slate-800 text-slate-500 cursor-not-allowed'}`}
                      >
                        Aplicar en orden
                      </Link>
                      <Link
                        to={buildCouponUrl('/dashboard/reservations', promo.couponCode)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all border ${promo.couponCode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white' : 'bg-slate-800 border-slate-800 text-slate-500 cursor-not-allowed'}`}
                      >
                        Aplicar en reserva
                      </Link>
                      {promo.couponCode && (
                        <button
                          type="button"
                          onClick={() => handleCopyCoupon(promo.couponCode)}
                          className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-400 hover:bg-indigo-500/10 transition-colors ml-auto"
                        >
                          Copiar código
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Sidebar Operativo */}
        <aside className="space-y-4">
          
          {/* Tarjeta 1: Aprobaciones Pendientes */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-xl space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">Mesa de Aprobación</h3>
              <h2 className="text-base font-bold text-white mt-0.5">Campañas en cola</h2>
            </div>
            
            <div className="space-y-3">
              {pendingPromotions.length === 0 && !loading && (
                <p className="text-xs text-slate-500 bg-slate-950/40 p-4 rounded-xl border border-slate-800 border-dashed text-center">
                  No hay promociones pendientes de auditar.
                </p>
              )}
              {pendingPromotions.map((promo) => {
                const restaurant = restaurantsById.get(promo.restaurantId?._id || promo.restaurantId)
                return (
                  <div key={promo._id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                        {restaurant?.restaurantName || 'Sede Solicitante'}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-200">{promo.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{formatDate(promo.startDate)} - {formatDate(promo.endDate)}</p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-1">
                      <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400">
                        Auditoría
                      </span>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleApprovePromotion(promo._id)}
                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-amber-500 disabled:opacity-50 transition-colors"
                      >
                        Aprobar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tarjeta 2: Resumen Cupones Rápidos */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-xl space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Cupones Activos</h3>
              <h2 className="text-base font-bold text-white mt-0.5">Acceso exprés</h2>
            </div>

            <div className="space-y-2">
              {couponPromotions.length === 0 && !loading && (
                <p className="text-xs text-slate-500 text-center py-2">No se computan llaves promocionales.</p>
              )}
              {couponPromotions.map((promo) => (
                <div key={promo._id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex justify-between items-center gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-bold text-slate-200 truncate">{promo.couponCode}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">Corte: {formatDate(promo.endDate)}</p>
                  </div>
                  <span className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-xs font-bold text-indigo-400 shrink-0">
                    -{promo.discountPercentage || 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tarjeta 3: Agenda de Eventos */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-xl space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">Cronograma</h3>
              <h2 className="text-base font-bold text-white mt-0.5">Agenda destacada</h2>
            </div>

            <div className="space-y-3">
              {events.length === 0 && !loading && (
                <p className="text-xs text-slate-500 text-center py-2">Sin eventos especiales agendados.</p>
              )}
              {events.map((eventItem) => {
                const reservation = eventItem.reservation
                const restaurant = restaurantsById.get(reservation?.restaurantId?._id || reservation?.restaurantId)
                return (
                  <div key={eventItem._id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                        {restaurant?.restaurantName || 'Sede Central'}
                      </p>
                      <span className="text-[10px] font-bold text-slate-500 shrink-0 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {reservation?.numberPeople || 0} pax
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 leading-relaxed">{eventItem.description || 'Evento institucional'}</p>
                    <p className="text-[10px] text-indigo-400 font-medium">
                      {formatDateTime(reservation?.startDate)} h
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>

      </div>
    </section>
  )
}