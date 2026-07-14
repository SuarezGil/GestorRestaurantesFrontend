import { useEffect, useState } from 'react'
import {
  createRestaurant,
  updateRestaurant,
} from '../../../shared/api/restaurants'
import { showError, showSuccess } from '../../../shared/utils/toast'

const emptyForm = {
  restaurantName: '',
  restaurantAddress: '',
  restaurantPhone: '',
  restaurantEmail: '',
  openingHours: '',
  closingHours: '',
  restaurantActive: true,
  restaurantPhoto: null,
}

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



export const ModalRestaurante = ({ isOpen, onClose, onSaved, restaurantToEdit }) => {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)

  useEffect(() => {
    if (isOpen) {
      if (restaurantToEdit) {
        setForm({
          restaurantName: restaurantToEdit.restaurantName ?? '',
          restaurantAddress: restaurantToEdit.restaurantAddress ?? '',
          restaurantPhone: restaurantToEdit.restaurantPhone ?? '',
          restaurantEmail: restaurantToEdit.restaurantEmail ?? '',
          openingHours: restaurantToEdit.openingHours ?? '',
          closingHours: restaurantToEdit.closingHours ?? '',
          restaurantActive: restaurantToEdit.restaurantActive !== false,
          restaurantPhoto: null,
        })
        setPhotoPreview(normalizePhoto(restaurantToEdit.restaurantPhoto))
      } else {
        setForm(emptyForm)
        setPhotoPreview(null)
      }
    }
  }, [isOpen, restaurantToEdit])

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

  if (!isOpen) return null

  const handleInputChange = (event) => {
    const { name, value, type, files } = event.target

    if (type === 'file') {
      const file = files?.[0] ?? null
      setForm((prev) => ({ ...prev, restaurantPhoto: file }))

      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }

      setPhotoPreview(file ? URL.createObjectURL(file) : null)
      return
    }

    if (name === 'restaurantActive') {
      setForm((prev) => ({ ...prev, restaurantActive: value === 'true' }))
      return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const requiredFields = [
      'restaurantName',
      'restaurantAddress',
      'restaurantPhone',
      'restaurantEmail',
      'openingHours',
      'closingHours',
    ]

    const missing = requiredFields.filter((field) => !String(form[field] || '').trim())

    if (missing.length > 0) {
      showError('Completa todos los campos obligatorios antes de continuar.')
      return
    }

    setSaving(true)

    try {
      if (restaurantToEdit) {
        const restaurantId = getRestaurantId(restaurantToEdit)
        if (!restaurantId) {
          showError('No se pudo identificar el restaurante seleccionado.')
          return
        }

        await updateRestaurant(restaurantId, {
          restaurantName: form.restaurantName,
          restaurantAddress: form.restaurantAddress,
          restaurantPhone: form.restaurantPhone,
          restaurantEmail: form.restaurantEmail,
          openingHours: form.openingHours,
          closingHours: form.closingHours,
          restaurantActive: form.restaurantActive,
        })

        showSuccess('Restaurante actualizado.')
      } else {
        await createRestaurant(form)
        showSuccess('Restaurante creado.')
      }

      onSaved()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo guardar el restaurante.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[26px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Formulario</p>
            <h2 className="font-display mt-1 text-xl font-semibold text-slate-900">
              {restaurantToEdit ? 'Editar restaurante' : 'Crear restaurante'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-6 py-6">
          <form id="restaurant-form" className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Nombre
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  name="restaurantName"
                  value={form.restaurantName}
                  onChange={handleInputChange}
                  placeholder="Sazón del puerto"
                  required
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Teléfono
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  name="restaurantPhone"
                  value={form.restaurantPhone}
                  onChange={handleInputChange}
                  placeholder="12345678"
                  required
                />
              </label>
            </div>

            <label className="text-sm font-semibold text-slate-700">
              Dirección
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                name="restaurantAddress"
                value={form.restaurantAddress}
                onChange={handleInputChange}
                placeholder="Avenida 5, zona 10"
                required
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Correo electrónico
              <input
                type="email"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                name="restaurantEmail"
                value={form.restaurantEmail}
                onChange={handleInputChange}
                placeholder="contacto@restaurante.com"
                required
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Apertura
                <input
                  type="time"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  name="openingHours"
                  value={form.openingHours}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Cierre
                <input
                  type="time"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  name="closingHours"
                  value={form.closingHours}
                  onChange={handleInputChange}
                  required
                />
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Estado
                <select
                  name="restaurantActive"
                  value={form.restaurantActive ? 'true' : 'false'}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Foto {restaurantToEdit ? '(no editable)' : '(solo al crear)'}
                <input
                  type="file"
                  accept="image/*"
                  name="restaurantPhoto"
                  disabled={Boolean(restaurantToEdit)}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500 focus:outline-none"
                />
              </label>
            </div>

            {photoPreview && (
              <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200">
                <img src={photoPreview} alt="Vista previa" className="h-48 w-full object-cover" />
              </div>
            )}
          </form>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="restaurant-form"
            disabled={saving}
            className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Guardando...' : restaurantToEdit ? 'Guardar cambios' : 'Crear restaurante'}
          </button>
        </div>
      </div>
    </div>
  )
}
