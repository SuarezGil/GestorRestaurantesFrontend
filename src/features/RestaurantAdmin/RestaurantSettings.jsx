import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/store/authStore'
import { getMyRestaurant, updateRestaurant } from '../../shared/api/restaurants'
import { showError, showSuccess } from '../../shared/utils/toast'

const getErrMsg = (err, fallback) =>
  err?.response?.data?.errors?.[0]?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback

export const RestaurantSettings = () => {
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restaurantId, setRestaurantId] = useState(null)
  
  const [formData, setFormData] = useState({
    restaurantName: '',
    restaurantAddress: '',
    restaurantPhone: '',
    restaurantEmail: '',
    openingHours: '08:00',
    closingHours: '22:00',
  })

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        const { data } = await getMyRestaurant()
        const restaurant = data?.data
        if (restaurant) {
          setRestaurantId(restaurant._id || restaurant.id)
          setFormData({
            restaurantName: restaurant.restaurantName || '',
            restaurantAddress: restaurant.restaurantAddress || '',
            restaurantPhone: restaurant.restaurantPhone || '',
            restaurantEmail: restaurant.restaurantEmail || '',
            openingHours: restaurant.openingHours || '08:00',
            closingHours: restaurant.closingHours || '22:00',
          })
        }
      } catch (err) {
        showError(getErrMsg(err, 'No se pudieron cargar los datos de tu restaurante.'))
      } finally {
        setLoading(false)
      }
    }
    loadRestaurant()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.restaurantName.trim() || !formData.restaurantAddress.trim() || !formData.restaurantPhone.trim() || !formData.restaurantEmail.trim()) {
      return showError('Completa todos los campos obligatorios.')
    }

    setSaving(true)
    try {
      await updateRestaurant(restaurantId, formData)
      showSuccess('Configuración del restaurante guardada exitosamente.')
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo guardar la configuración.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner Superior Premium */}
      <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-r from-emerald-50 via-emerald-50/60 to-emerald-100/30 p-6 sm:p-8 flex flex-col justify-between gap-4 overflow-hidden relative shadow-sm">
        <div className="space-y-3 z-10">
          <span className="inline-flex rounded-full bg-emerald-100 border border-emerald-200/50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
            Configuración
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Configuración del Restaurante
          </h1>
          <p className="text-sm text-slate-500 max-w-[580px] leading-relaxed">
            Administra los datos generales de tu establecimiento, información de contacto y horarios de atención.
          </p>
        </div>
      </div>

      {/* Settings Form */}
      {loading ? (
        <div className="text-center text-slate-500 py-12">Cargando configuración...</div>
      ) : !restaurantId ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-800">
          No tienes ningún restaurante asignado. Solicita al administrador del sistema que asocie tu cuenta a un restaurante.
        </div>
      ) : (
        <form onSubmit={handleSave} className="max-w-2xl rounded-2xl border border-slate-100 bg-white shadow-sm p-8 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Información Básica</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Nombre del Restaurante</label>
                <input
                  type="text"
                  value={formData.restaurantName}
                  onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Correo Electrónico</label>
                <input
                  type="email"
                  value={formData.restaurantEmail}
                  onChange={(e) => setFormData({ ...formData, restaurantEmail: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  required
                  disabled
                />
                <p className="mt-1 text-xs text-slate-400">El correo electrónico del restaurante no se puede modificar.</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Información de Contacto</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Teléfono</label>
                <input
                  type="tel"
                  value={formData.restaurantPhone}
                  onChange={(e) => setFormData({ ...formData, restaurantPhone: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Dirección</label>
                <input
                  type="text"
                  value={formData.restaurantAddress}
                  onChange={(e) => setFormData({ ...formData, restaurantAddress: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  required
                />
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Horario de Atención</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Hora de Apertura</label>
                <input
                  type="time"
                  value={formData.openingHours}
                  onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Hora de Cierre</label>
                <input
                  type="time"
                  value={formData.closingHours}
                  onChange={(e) => setFormData({ ...formData, closingHours: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  required
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

