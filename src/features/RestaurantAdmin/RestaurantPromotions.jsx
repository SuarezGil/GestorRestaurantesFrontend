import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/store/authStore'
import { getAllPromotions, createPromotion, updatePromotion, deletePromotion } from '../../shared/api/promotions'
import { showError, showSuccess } from '../../shared/utils/toast'

const getErrMsg = (err, fallback) =>
  err?.response?.data?.errors?.[0]?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback

export const RestaurantPromotions = () => {
  const user = useAuthStore((state) => state.user)
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    couponCode: '',
    discountPercentage: 10,
    startDate: '',
    endDate: '',
  })

  const loadPromotions = async () => {
    if (!user?.restaurantId) return
    try {
      setLoading(true)
      const { data } = await getAllPromotions()
      const filtered = (data?.promotions || []).filter((promo) => {
        const promoRestaurantId = promo.restaurantId?._id || promo.restaurantId
        return String(promoRestaurantId) === String(user.restaurantId)
      })
      setPromotions(filtered)
    } catch (err) {
      showError(getErrMsg(err, 'No se pudieron cargar las promociones.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.restaurantId) {
      loadPromotions()
    } else {
      setLoading(false)
    }
  }, [user?.restaurantId])

  const handleEditClick = (promo) => {
    setEditingId(promo._id)
    setFormData({
      title: promo.title || '',
      description: promo.description || '',
      couponCode: promo.couponCode || '',
      discountPercentage: promo.discountPercentage || 0,
      startDate: promo.startDate ? new Date(promo.startDate).toISOString().slice(0, 10) : '',
      endDate: promo.endDate ? new Date(promo.endDate).toISOString().slice(0, 10) : '',
    })
    setShowModal(true)
  }

  const handleDeletePromotion = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta promoción?')) return
    try {
      await deletePromotion(id)
      showSuccess('Promoción eliminada correctamente.')
      loadPromotions()
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo eliminar la promoción.'))
    }
  }

  const handleAddPromotion = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      return showError('El título de la promoción es obligatorio.')
    }
    if (!formData.couponCode.trim()) {
      return showError('El código de cupón es obligatorio.')
    }
    if (!user?.restaurantId) {
      return showError('No tienes un restaurante asignado para crear promociones.')
    }

    setAdding(true)
    try {
      const payload = {
        restaurantId: user.restaurantId,
        title: formData.title,
        description: formData.description || null,
        couponCode: formData.couponCode.toUpperCase().trim(),
        discountPercentage: Number(formData.discountPercentage),
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      }

      if (editingId) {
        await updatePromotion(editingId, payload)
        showSuccess('Promoción actualizada con éxito.')
      } else {
        await createPromotion(payload)
        showSuccess('Promoción creada con éxito. Pendiente de aprobación por súper administrador.')
      }

      setShowModal(false)
      setEditingId(null)
      setFormData({
        title: '',
        description: '',
        couponCode: '',
        discountPercentage: 10,
        startDate: '',
        endDate: '',
      })
      loadPromotions()
    } catch (err) {
      showError(getErrMsg(err, `No se pudo ${editingId ? 'actualizar' : 'crear'} la promoción.`))
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner Superior Premium */}
      <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-r from-emerald-50 via-emerald-50/60 to-emerald-100/30 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden relative shadow-sm">
        <div className="space-y-3 z-10">
          <span className="inline-flex rounded-full bg-emerald-100 border border-emerald-200/50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
            Promociones
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Gestión de Promociones
          </h1>
          <p className="text-sm text-slate-500 max-w-[580px] leading-relaxed">
            Crea y administra ofertas especiales y cupones de descuento para atraer y fidelizar clientes.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null)
            setFormData({
              title: '',
              description: '',
              couponCode: '',
              discountPercentage: 10,
              startDate: '',
              endDate: '',
            })
            setShowModal(true)
          }}
          className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition shadow-sm hover:shadow active:scale-[0.98] shrink-0 self-start sm:self-center z-10"
        >
          + Nueva Promoción
        </button>
      </div>


      {/* Promotions List */}
      {loading ? (
        <div className="text-center text-slate-500 py-12">Cargando promociones...</div>
      ) : promotions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-slate-500 font-medium">No tienes promociones creadas aún</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-100 transition"
          >
            Crear primera promoción
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {promotions.map((promo, idx) => {
            const isApproved = promo.isApproved
            const isEven = idx % 2 === 0
            const iconBg = isEven ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
            const ticketBg = isEven ? 'bg-emerald-50/40 border-l-[3px] border-l-emerald-400 border-dashed' : 'bg-indigo-50/30 border-l-[3px] border-l-indigo-400 border-dashed'
            const offColor = isEven ? 'text-emerald-600' : 'text-indigo-600'

            // Format dates
            const formatShortDate = (dateStr) => {
              if (!dateStr) return 'Indefinida'
              try {
                const d = new Date(dateStr)
                return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
              } catch {
                return '—'
              }
            }

            const startDateFormatted = formatShortDate(promo.startDate)
            const endDateFormatted = formatShortDate(promo.endDate)

            // Determine if active
            const now = new Date()
            const isExpired = promo.endDate && new Date(promo.endDate) < now
            const isActive = isApproved && !isExpired

            return (
              <div key={promo._id} className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between">
                <div>
                  {/* Top row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconBg} font-bold`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                          <line x1="7" y1="7" x2="7.01" y2="7" />
                        </svg>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-slate-800 text-base leading-tight">{promo.title}</h3>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${isApproved
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                          : 'bg-amber-50 text-amber-700 border-amber-200/50'
                          }`}>
                          {isApproved ? 'APROBADA' : 'PENDIENTE'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Coupon details box */}
                  <div className={`mt-4 ${ticketBg} rounded-r-xl p-4 flex items-center justify-between border-y border-r border-slate-100/50 relative overflow-hidden`}>
                    <div className="flex items-center gap-4">
                      {/* Big Percentage */}
                      <div className="flex flex-col">
                        <span className={`text-2xl font-extrabold tracking-tight ${offColor}`}>
                          {promo.discountPercentage}%
                        </span>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider leading-none mt-0.5">
                          OFF
                        </span>
                      </div>

                      {/* Vertical line divider inside ticket */}
                      <div className="h-10 w-px bg-slate-200/60 mx-1" />

                      {/* Coupon Info */}
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">CUPÓN</span>
                        <span className="text-sm font-mono font-black text-slate-700 tracking-wider mt-0.5 uppercase">
                          {promo.couponCode}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Copy Button */}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(promo.couponCode);
                          showSuccess("Código de cupón copiado.");
                        }}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100/50 transition"
                        title="Copiar cupón"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditClick(promo)}
                        className="text-slate-400 hover:text-emerald-600 p-1.5 rounded-lg hover:bg-emerald-50 transition"
                        title="Editar promoción"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeletePromotion(promo._id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                        title="Eliminar promoción"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom row */}
                <div className="mt-4 pt-3.5 border-t border-slate-100/60 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>Vigencia:</span>
                    <span className="font-bold text-slate-600">{startDateFormatted} – {endDateFormatted}</span>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/30'
                    : 'bg-rose-50 text-rose-700 border-rose-200/30'
                    }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {isActive ? 'Activa' : isExpired ? 'Vencida' : 'Inactiva'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bottom call to action banner */}


      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
          <div className="rounded-[24px] border border-slate-100 bg-white shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900">{editingId ? 'Editar Promoción' : 'Nueva Promoción'}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {editingId ? 'Actualiza los datos de tu promoción.' : 'Los cupones quedan inactivos hasta que sean aprobados.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingId(null)
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPromotion} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Título de la Oferta</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej: Descuento de Fin de Semana"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Código Cupón</label>
                  <input
                    type="text"
                    value={formData.couponCode}
                    onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                    placeholder="Ej: DESCUENTO20"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono font-bold outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Descripción / Detalles</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe qué platos o condiciones aplica..."
                  rows={2}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition resize-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Descuento (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: Number(e.target.value) })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Fecha Inicio</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Fecha Fin</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingId(null)
                  }}
                  className="w-full sm:w-auto rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={adding}
                  className="w-full sm:w-auto rounded-xl bg-emerald-600 px-8 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition active:scale-95 disabled:opacity-50"
                >
                  {adding
                    ? (editingId ? 'Guardando...' : 'Creando...')
                    : (editingId ? 'Guardar Cambios' : 'Crear Promoción')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
