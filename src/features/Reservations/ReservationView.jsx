import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import heroImg from '../../assets/img/restaurant-hero.png'
import ambianceImg from '../../assets/img/restaurant-ambiance.png'
import cenaRomantica from '../../assets/img/Cena romántica.jpg'
import celebracionImg from '../../assets/img/Celebración.jpg'
import reunionCasual from '../../assets/img/Reunión casual.jpg'
import cenaAmigos from '../../assets/img/Cena con amigos.jpg'
import brunchEspecial from '../../assets/img/Brunch especial.jpg'
import nocheTapas from '../../assets/img/Noche de tapas.jpeg'
import { getRestaurants } from '../../shared/api/restaurants'
import { getTables } from '../../shared/api/tables'
import {
  cancelReservation,
  createReservation,
  getMyReservations,
  updateReservation,
} from '../../shared/api/reservations'
import { showError, showSuccess } from '../../shared/utils/toast'
import { useLocation, useSearchParams } from 'react-router-dom'
import { MyReservationsList } from './components/Client/MyReservationsList'
import { ClientHistory } from '../History/ClientHistory'
import { ClientReservationModal } from './components/Client/ClientReservationModal'

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

const STATUS_LABEL = { PENDIENTE: 'Pendiente', COMPLETADO: 'Completada' }
const STATUS_COLORS = {
  PENDIENTE: 'bg-amber-500/15 text-amber-300 border border-amber-500/20',
  COMPLETADO: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20',
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

// ─── sub-components ──────────────────────────────────────────────────────────

const StepDot = ({ n, active, done }) => (
  <div
    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all
      ${done ? 'border-rose-600 bg-rose-700 text-white' : active ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-400'}`}
  >
    {done ? '✓' : n}
  </div>
)

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

const inputCls = 'mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
const labelCls = 'flex flex-col text-sm font-semibold text-slate-300'

// ─── main component ───────────────────────────────────────────────────────────

export const ReservationView = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const prefillRestaurantId = location.state?.prefillRestaurantId || '';

  const [activeViewTab, setActiveViewTab] = useState('RESERVATIONS'); // 'RESERVATIONS' or 'HISTORY'
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const [restaurants, setRestaurants] = useState([])
  const [tables, setTables] = useState([])
  const [loadingTables, setLoadingTables] = useState(false)

  const [myReservations, setMyReservations] = useState([])
  const [loadingMy, setLoadingMy] = useState(true)

  const [editingId, setEditingId] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [mounted, setMounted] = useState(false)

  const [checking, setChecking] = useState(false)
  const [conflict, setConflict] = useState(null)
  const debounceRef = useRef(null)

  // ── load data ─────────────────────────────────────────────────────────────
  const loadMyReservations = useCallback(async () => {
    setLoadingMy(true)
    try {
      const { data } = await getMyReservations()
      setMyReservations(data?.reservations || [])
    } catch (_err) {
      /* silent – user may not have reservations yet */
    } finally {
      setLoadingMy(false)
    }
  }, [])

  useEffect(() => {
    getRestaurants({ restaurantActive: true, limit: 100 })
      .then(({ data }) => setRestaurants(data?.data || []))
      .catch(() => { })
    loadMyReservations()
    // small mount animation
    setTimeout(() => setMounted(true), 60)
  }, [loadMyReservations])

  useEffect(() => {
    const couponParam = searchParams.get('coupon')
    if (!couponParam) return

    setForm((prev) => ({ ...prev, coupon: couponParam }))
    setStep(1)

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('coupon')
    setSearchParams(nextParams, { replace: true })
  }, [searchParams, setSearchParams])

  // ── load tables on restaurant change ─────────────────────────────────────
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
        if (editingId && r._id === editingId) return false
        const rStart = new Date(r.startDate)
        const rEnd = new Date(r.endDate)
        const tableOverlap = (r.tableId || []).some((t) => tableId.includes(t._id || t))
        return tableOverlap && start < rEnd && end > rStart
      })
      setConflict(hasConflict)
      setChecking(false)
    }, 500)
  }, [form.tableId, form.startDate, form.endDate, form.restaurantId, myReservations, editingId])

  // ── derived ───────────────────────────────────────────────────────────────
  const filteredTables = useMemo(() => tables, [tables])

  const selectedCapacity = useMemo(
    () => form.tableId.reduce((sum, id) => {
      const t = tables.find((x) => x._id === id)
      return sum + Number(t?.tableCapacity || 0)
    }, 0),
    [form.tableId, tables]
  )

  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r._id === form.restaurantId),
    [restaurants, form.restaurantId]
  )

  const detailReservation = useMemo(
    () => myReservations.find((r) => r._id === detailId),
    [myReservations, detailId]
  )

  // ── helpers ───────────────────────────────────────────────────────────────
  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }))

  const toggleTable = (id) => {
    setForm((p) => ({
      ...p,
      tableId: p.tableId.includes(id) ? p.tableId.filter((x) => x !== id) : [...p.tableId, id],
    }))
  }

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setStep(1); setConflict(null) }

  const startEdit = (res) => {
    setEditingId(res._id)
    setDetailId(null)
    setForm({
      restaurantId: res.restaurantId?._id || res.restaurantId || '',
      tableId: (res.tableId || []).map((t) => t._id || t),
      numberPeople: res.numberPeople || 2,
      typeReservation: res.typeReservation || 'PERSONAL',
      description: res.description || '',
      coupon: res.coupon || '',
      startDate: toInputDateTime(res.startDate),
      endDate: toInputDateTime(res.endDate),
      photo: null,
    })
    setStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      if (editingId) {
        await updateReservation(editingId, payload)
        showSuccess('Reserva actualizada correctamente.')
      } else {
        await createReservation(payload)
        showSuccess('¡Reserva creada! Te esperamos.')
      }
      resetForm()
      await loadMyReservations()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo guardar la reservación.'))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (res) => {
    if (!window.confirm('¿Deseas cancelar esta reservación?')) return
    try {
      await cancelReservation(res._id)
      showSuccess('Reservación cancelada.')
      setDetailId(null)
      await loadMyReservations()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo cancelar la reservación.'))
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <section className="font-serif relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">

        {/* HEADER */}
        <header className="rounded-[32px] border border-slate-800/80 bg-slate-900/70 p-8 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.8)] backdrop-blur-sm">
          <div className={`flex flex-col md:flex-row items-center gap-6`}>
            <div className="md:w-2/3">
              <p className="inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.26em] text-orange-300">Reservaciones</p>
              <h1 className={`font-serif mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                {editingId ? 'Editar reserva' : <><span className="text-orange-400">Reserva</span> tu mesa con facilidad</>}
              </h1>
              <p className={`font-serif mt-4 max-w-2xl text-base leading-8 text-slate-300 transition-all duration-800 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                Tres pasos sencillos: elige restaurante y horario, selecciona la mesa y confirma.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {['Fecha y restaurante', 'Selecciona mesa', 'Confirmación'].map((txt, idx) => (
                  <span key={txt} className={`inline-flex items-center rounded-full border border-white/10 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 transition-transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`} style={{ transitionDelay: `${120 + idx * 60}ms` }}>{txt}</span>
                ))}
              </div>
            </div>
            <div className="md:w-1/3 hidden md:flex justify-end">
              <img src={heroImg} alt="Hero" className={`w-56 rounded-[28px] border border-white/10 shadow-xl transform transition-all duration-800 ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`} />
            </div>
          </div>
        </header>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.9)]">
            <p className="text-xs uppercase tracking-[0.28em] text-orange-300">Experiencias</p>
            <h2 className="font-serif mt-3 text-2xl font-semibold text-white">Encuentra el plan perfecto</h2>
            <p className="font-serif mt-3 text-sm leading-6 text-slate-300">Elige el restaurante, el horario y la mesa que mejor se ajuste a tu ocasión. Aquí tienes ideas para cenas románticas, reuniones con amigos o celebraciones familiares.</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { title: 'Cena romántica', desc: 'Mesas con ambiente íntimo y buena selección de vinos.', image: cenaRomantica },
                { title: 'Celebración', desc: 'Espacios amplios para celebrar con familia y amigos.', image: celebracionImg },
                { title: 'Reunión casual', desc: 'El lugar ideal para conversar y disfrutar del menú.', image: reunionCasual },
                { title: 'Cena con amigos', desc: 'Ambientes relajados para compartir entre amigos.', image: cenaAmigos },
                { title: 'Brunch especial', desc: 'Mesas iluminadas para un fin de semana diferente.', image: brunchEspecial },
                { title: 'Noche de tapas', desc: 'Disfruta de bocados y bebidas en buena compañía.', image: nocheTapas },
              ].map((item) => (
                <div key={item.title} className="group overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 transition hover:border-orange-400/20 hover:bg-slate-800">
                  <div className="h-36 w-full overflow-hidden">
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif text-sm font-semibold text-white">{item.title}</h3>
                    <p className="font-serif mt-2 text-xs leading-5 text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.9)]">
            <div className="flex h-full flex-col justify-between gap-5">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Inspírate</p>
                <h3 className="font-serif mt-3 text-2xl font-bold text-white">Tu mesa ideal está a un paso</h3>
                <p className="font-serif mt-2 text-sm leading-6 text-slate-300">Te ayudamos a reservar rápido, con opciones pensadas para cada momento y recomendaciones basadas en tu número de personas.</p>
              </div>

              <div className="overflow-hidden rounded-[32px] border border-white/10">
                <img src={ambianceImg} alt="Ambiente de restaurante" className="h-56 w-full object-cover" />
              </div>

              <div className="grid gap-3">
                <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4">
                  <p className="font-serif text-sm font-semibold text-white">Reserva con confianza</p>
                  <p className="font-serif mt-2 text-xs leading-5 text-slate-400">Tus planos se guardan aquí mismo y puedes cambiar la mesa o la hora antes de confirmar.</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4">
                  <p className="font-serif text-sm font-semibold text-white">Consejos rápidos</p>
                  <ul className="font-serif mt-3 space-y-2 text-xs leading-5 text-slate-400">
                    <li>• Elige un horario temprano si buscas un ambiente tranquilo.</li>
                    <li>• Añade una nota si celebras una ocasión especial.</li>
                    <li>• Selecciona mesas con capacidad suficiente para tu grupo.</li>
                  </ul>
                </div>
              </div>
            </div>
          </article>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">

          {/* WIZARD */}
          <section className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.9)]">

            {/* Steps indicator + progress bar */}
            <div className="mb-6 overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/50 p-4">
              <div className="flex items-center">
                {[['1', 'Detalles'], ['2', 'Mesa'], ['3', 'Confirmar']].map(([icon, label], i) => (
                  <div key={label} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-lg font-bold transition-all duration-300
                      ${step > i + 1 ? 'border-orange-500 bg-orange-500 text-white shadow-md' : step === i + 1 ? 'border-orange-400 bg-orange-500/10 text-orange-400 shadow-sm ring-2 ring-orange-500/20' : 'border-slate-700 bg-slate-800 text-slate-500'}`}>
                        {step > i + 1 ? '✓' : icon}
                      </div>
                      <span className={`text-xs font-semibold transition-colors ${step === i + 1 ? 'text-orange-400' : step > i + 1 ? 'text-orange-400' : 'text-slate-500'}`}>{label}</span>
                    </div>
                    {i < 2 && <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                      <div className={`absolute inset-y-0 left-0 rounded-full bg-orange-500 transition-all duration-500 ${step > i + 1 ? 'w-full' : 'w-0'}`} />
                    </div>}
                  </div>
                ))}
              </div>
              {/* global progress bar */}
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                  style={{ width: `${((step - 1) / 2) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-center text-xs text-slate-400">Paso {step} de 3 — {['Completa los datos básicos', 'Elige dónde sentarte', 'Revisa y confirma'][step - 1]}</p>
            </div>

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div className="animate-fadeIn space-y-4">
                <h2 className="font-serif text-xl font-bold text-white">Selecciona restaurante y horario</h2>

                <label className={labelCls}>
                  Restaurante
                  <select id="rv-restaurant" className={inputCls} value={form.restaurantId} onChange={(e) => set('restaurantId', e.target.value)}>
                    <option value="">— Elige un restaurante —</option>
                    {restaurants.map((r) => <option key={r._id} value={r._id}>{r.restaurantName}</option>)}
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelCls}>
                    Fecha y hora de inicio
                    <input id="rv-start" type="datetime-local" className={inputCls} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
                  </label>
                  <label className={labelCls}>
                    Fecha y hora de fin
                    <input id="rv-end" type="datetime-local" className={inputCls} value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelCls}>
                    Número de personas
                    <input id="rv-people" type="number" min="1" max="50" className={inputCls} value={form.numberPeople} onChange={(e) => set('numberPeople', e.target.value)} />
                  </label>
                  <label className={labelCls}>
                    Tipo de reserva
                    <select id="rv-type" className={inputCls} value={form.typeReservation} onChange={(e) => set('typeReservation', e.target.value)}>
                      <option value="PERSONAL">Personal</option>
                      <option value="EVENTO">Evento</option>
                    </select>
                  </label>
                </div>

                <label className={labelCls}>
                  Descripción{' '}
                  {form.typeReservation === 'EVENTO' && (
                    <span className="ml-1 text-xs font-normal text-orange-400">*requerida para eventos</span>
                  )}
                  <textarea
                    id="rv-desc"
                    className={`${inputCls} resize-none`}
                    rows={3}
                    placeholder="Ej: Cumpleaños, reunión de negocios, aniversario…"
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                  />
                </label>

                <label className={labelCls}>
                  Foto (opcional)
                  <input id="rv-photo" type="file" accept="image/*" className="mt-1.5 w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-600" onChange={(e) => set('photo', e.target.files?.[0] || null)} />
                </label>

                <div className="flex justify-end gap-3 pt-2">
                  {editingId && (
                    <button type="button" onClick={resetForm} className="rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm font-semibold text-white transition hover:border-slate-500">
                      Cancelar edición
                    </button>
                  )}
                  <button type="button" onClick={goNext} className="inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:bg-orange-400">
                    Siguiente → Seleccionar mesa
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div className="animate-fadeIn space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-white">Elige tu mesa</h2>
                    <p className="font-serif mt-1 text-sm text-slate-400">
                      Selecciona mesas para cubrir <strong className="text-white">{form.numberPeople} personas</strong> en{' '}
                      <strong className="text-white">{selectedRestaurant?.restaurantName || 'el restaurante'}</strong>
                    </p>
                  </div>
                  <AvailabilityBadge checking={checking} conflict={conflict} />
                </div>

                {loadingTables && (
                  <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
                    <span className="text-4xl animate-pulse"></span>
                    <p className="text-sm font-semibold">Buscando mesas disponibles…</p>
                  </div>
                )}
                {!loadingTables && !form.restaurantId && (
                  <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-slate-400">
                    <span className="text-4xl"></span>
                    <p className="text-sm font-medium">Vuelve al paso anterior</p>
                    <p className="text-xs">Debes seleccionar un restaurante primero</p>
                  </div>
                )}
                {!loadingTables && form.restaurantId && filteredTables.length === 0 && (
                  <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-amber-200 bg-amber-50 py-12">
                    <p className="text-sm font-semibold text-amber-700">Sin mesas registradas</p>
                    <p className="text-xs text-amber-600 text-center px-6">Este restaurante aún no tiene mesas. Elige otro restaurante.</p>
                  </div>
                )}

                {!loadingTables && filteredTables.length > 0 && form.tableId.length > 0 && (
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
                    {selectedCapacity < Number(form.numberPeople || 1) && (
                      <p className="mt-1.5 text-xs text-orange-400">Faltan {Number(form.numberPeople || 1) - selectedCapacity} personas por cubrir. Agrega más mesas.</p>
                    )}
                  </div>
                )}

                {!loadingTables && filteredTables.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {filteredTables.map((t) => {
                      const selected = form.tableId.includes(t._id)
                      const cap = Number(t.tableCapacity || 0)
                      const capacityLabel = cap === 1 ? '1 persona' : `${cap} personas`
                      const needsCombining = cap < Number(form.numberPeople || 1)
                      return (
                        <button
                          key={t._id}
                          type="button"
                          id={`rv-table-${t._id}`}
                          onClick={() => toggleTable(t._id)}
                          className={`flex flex-col gap-2 rounded-[24px] border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-95
                          ${selected ? 'border-orange-500/50 bg-orange-500/10' : 'border-white/10 bg-slate-950/60 hover:border-orange-400/30 hover:bg-slate-950/80'}`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-white">{t.tableName || `Mesa ${t._id.slice(-4)}`}</p>
                            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                            ${selected ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                              {selected ? 'OK' : ''}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400">Capacidad: {capacityLabel}</p>
                          {needsCombining && !selected && (
                            <p className="text-xs text-amber-400 font-medium">Combinar con otras mesas</p>
                          )}
                          {selected && <p className="text-xs font-bold text-orange-400 transition-all">Seleccionada</p>}
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="flex justify-between gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)} className="rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm font-semibold text-white transition hover:border-slate-500">
                    ← Atrás
                  </button>
                  <button type="button" onClick={goNext} className="inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:bg-orange-400">
                    Siguiente → Confirmar
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <div className="animate-fadeIn space-y-4">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-white">Casi listo</h2>
                    <p className="font-serif text-sm text-slate-400">Revisa los detalles y confirma tu reservación</p>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-4">
                  {[
                    ['Restaurante', selectedRestaurant?.restaurantName || '—'],
                    ['Entrada', formatDate(form.startDate)],
                    ['Salida', formatDate(form.endDate)],
                    ['Personas', `${form.numberPeople} ${Number(form.numberPeople) === 1 ? 'persona' : 'personas'}`],
                    ['Tipo', form.typeReservation === 'PERSONAL' ? 'Personal' : 'Evento especial'],
                    ['Mesas', form.tableId.map((id) => { const t = tables.find((x) => x._id === id); return t ? t.tableName || `Mesa ${id.slice(-4)}` : id }).join(', ')],
                    ...(form.description ? [['Nota', form.description]] : []),
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-start justify-between gap-4 border-b border-white/10 py-2.5 last:border-0 text-sm">
                      <span className="text-slate-400">{label}</span>
                      <span className="text-right font-semibold text-white">{value}</span>
                    </div>
                  ))}
                </div>

                <AvailabilityBadge checking={checking} conflict={conflict} />

                {!conflict && !checking && (
                  <div className="animate-fadeIn rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
                    Todo listo. Al confirmar, recibirás tu reservación con estado <strong className="text-emerald-300">Pendiente</strong>.
                  </div>
                )}

                <div className="flex justify-between gap-3 pt-1">
                  <button type="button" onClick={() => setStep(2)} className="rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm font-semibold text-white transition hover:border-slate-500">
                    ← Modificar
                  </button>
                  <button
                    type="button"
                    disabled={saving || !!conflict || checking}
                    onClick={handleSubmit}
                    className="inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:bg-orange-400 disabled:opacity-50 active:scale-95"
                  >
                    {saving ? 'Guardando…' : editingId ? 'Actualizar reserva' : '¡Confirmar reserva!'}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* MIS RESERVAS */}
          <aside>
            <section className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.9)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-serif text-xl font-bold text-white">Tus planes</h2>
                  <p className="font-serif text-xs text-slate-400 mt-0.5">{myReservations.length} reservación{myReservations.length === 1 ? '' : 'es'}</p>
                </div>
                <button type="button" onClick={loadMyReservations} className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-slate-500">Actualizar</button>
              </div>

              {loadingMy && (
                <div className="flex flex-col items-center gap-3 py-10">
                  <p className="text-sm font-semibold text-slate-400">Cargando tus reservaciones…</p>
                </div>
              )}
              {!loadingMy && myReservations.length === 0 && (
                <div className="flex flex-col items-center gap-3 rounded-[24px] border border-dashed border-white/10 bg-slate-950/50 py-12">

                  <p className="text-sm font-semibold text-slate-300">Aún no tienes planes</p>
                  <p className="text-xs text-slate-500 text-center px-4">Crea tu primera reserva y disfruta la experiencia.</p>

                </div>
              )}

              <div className="space-y-3">
                {!loadingMy && myReservations.map((res) => {
                  const borderColor = res.status === 'PENDIENTE' ? 'border-l-amber-300' : res.status === 'COMPLETADO' ? 'border-l-emerald-300' : 'border-l-rose-300'
                  return (
                    <article key={res._id} className={`animate-fadeIn rounded-[24px] border-l-4 ${borderColor} border border-white/10 bg-slate-950/60 p-4 transition-all duration-200 hover:bg-slate-950/80`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-white">{res.restaurantId?.restaurantName || 'Restaurante'}</p>
                          <p className="mt-1 text-xs text-slate-400">Inicio: {formatDate(res.startDate)}</p>
                          <p className="text-xs text-slate-400">Fin: {formatDate(res.endDate)}</p>
                          <p className="mt-1 text-xs text-slate-500">{res.numberPeople} {res.numberPeople === 1 ? 'persona' : 'personas'} · {res.typeReservation}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_COLORS[res.status] || 'bg-slate-800 text-slate-300'}`}>
                          {STATUS_LABEL[res.status] || res.status}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => setDetailId(detailId === res._id ? null : res._id)}
                          className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs font-semibold text-white transition hover:border-slate-500">
                          {detailId === res._id ? 'Ocultar' : 'Ver detalle'}
                        </button>
                        {res.status === 'PENDIENTE' && (
                          <>
                            <button type="button" onClick={() => startEdit(res)} className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400 transition hover:bg-orange-500/20">Editar</button>
                            <button type="button" onClick={() => handleCancel(res)} className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20">Cancelar</button>
                          </>
                        )}
                      </div>

                      {detailId === res._id && detailReservation && (
                        <div className="mt-3 space-y-1.5 rounded-[20px] border border-white/10 bg-slate-900/60 p-3">
                          {[
                            ['Mesas', (res.tableId || []).map((t) => t.tableName || t._id || t).join(', ') || '—'],
                            ['Descripción', res.description || 'Sin descripción'],
                            ['Estado', STATUS_LABEL[res.status] || res.status],
                          ].map(([label, value]) => (
                            <div key={label} className="flex justify-between gap-2 text-xs">
                              <span className="text-slate-400">{label}</span>
                              <span className="text-right font-medium text-slate-200">{value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  )
}
