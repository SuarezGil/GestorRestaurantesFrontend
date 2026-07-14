import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../store/authStore'

export const RegisterForm = ({ onSwitchToLogin, onGoToResend }) => {
  const [preview, setPreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const registerUser = useAuthStore((state) => state.register)
  const loading = useAuthStore((state) => state.loading)
  const error = useAuthStore((state) => state.error)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
    },
  })

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreview(event.target?.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearFile = () => {
    setPreview(null)
    setSelectedFile(null)
  }

  const onSubmit = async (formData) => {
    // Crear FormData para incluir el archivo si existe
    const submitData = new FormData()
    submitData.append('name', formData.name)
    submitData.append('email', formData.email)
    submitData.append('phone', formData.phone)
    submitData.append('password', formData.password)
    if (selectedFile) {
      submitData.append('profilePicture', selectedFile)
    }

    const result = await registerUser(submitData)

    if (result.success) {
      onSwitchToLogin({
        message: result.message,
        email: formData.email,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid w-full gap-4 sm:gap-5">
      {/* Profile Picture Upload */}
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        <div className="relative">
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="h-20 sm:h-24 w-20 sm:w-24 rounded-full border-2 border-slate-700 object-cover bg-slate-800"
            />
          ) : (
            <div className="h-20 sm:h-24 w-20 sm:w-24 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center">
              <svg className="h-10 sm:h-12 w-10 sm:w-12 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          )}
          <label
            htmlFor="profilePicture"
            className="absolute bottom-0 right-0 flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-full bg-blue-600 cursor-pointer hover:bg-blue-700 transition shadow-lg"
            title="Cambiar foto de perfil"
          >
            <svg className="h-3 sm:h-4 w-3 sm:w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </label>
          <input
            id="profilePicture"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-slate-400">Foto de perfil</p>
          {selectedFile && (
            <button
              type="button"
              onClick={clearFile}
              className="mt-1 text-xs text-rose-400 hover:text-rose-300 transition"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="name" className="text-xs sm:text-sm font-semibold text-slate-100">
          Nombre
        </label>
        <input
          id="name"
          type="text"
          placeholder="Tu nombre completo"
          className="w-full rounded-xl sm:rounded-2xl border border-slate-700 bg-slate-950 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-100 outline-none transition focus:border-white/50 focus:ring-2 focus:ring-white/10"
          {...register('name', {
            required: 'El nombre es obligatorio',
            minLength: {
              value: 3,
              message: 'El nombre debe tener al menos 3 caracteres',
            },
          })}
        />
        {errors.name && <p className="text-xs sm:text-sm text-rose-400">{errors.name.message}</p>}
      </div>

      <div className="grid gap-2">
        <label htmlFor="email" className="text-xs sm:text-sm font-semibold text-slate-100">
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="correo@ejemplo.com"
          className="w-full rounded-xl sm:rounded-2xl border border-slate-700 bg-slate-950 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-100 outline-none transition focus:border-white/50 focus:ring-2 focus:ring-white/10"
          {...register('email', {
            required: 'El email es obligatorio',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Por favor ingresa un email válido',
            },
          })}
        />
        {errors.email && <p className="text-xs sm:text-sm text-rose-400">{errors.email.message}</p>}
      </div>

      <div className="grid gap-2">
        <label htmlFor="phone" className="text-xs sm:text-sm font-semibold text-slate-100">
          Teléfono
        </label>
        <input
          id="phone"
          type="tel"
          placeholder="12345678"
          className="w-full rounded-xl sm:rounded-2xl border border-slate-700 bg-slate-950 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-100 outline-none transition focus:border-white/50 focus:ring-2 focus:ring-white/10"
          {...register('phone', {
            required: 'El teléfono es obligatorio',
            pattern: {
              value: /^\d{8}$/,
              message: 'El teléfono debe tener exactamente 8 dígitos',
            },
          })}
        />
        {errors.phone && <p className="text-xs sm:text-sm text-rose-400">{errors.phone.message}</p>}
      </div>

      <div className="grid gap-2">
        <label htmlFor="password" className="text-xs sm:text-sm font-semibold text-slate-100">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          className="w-full rounded-xl sm:rounded-2xl border border-slate-700 bg-slate-950 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-100 outline-none transition focus:border-white/50 focus:ring-2 focus:ring-white/10"
          {...register('password', {
            required: 'La contraseña es obligatoria',
            minLength: {
              value: 8,
              message: 'La contraseña debe tener al menos 8 caracteres',
            },
          })}
        />
        {errors.password && <p className="text-xs sm:text-sm text-rose-400">{errors.password.message}</p>}
      </div>

      {error && (
        <div className="rounded-xl sm:rounded-2xl border border-rose-700 bg-rose-950 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-rose-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-xl sm:rounded-2xl bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 mt-1"
      >
        {loading ? 'Creando usuario...' : 'Crear cuenta'}
      </button>

      <button
        type="button"
        className="text-xs sm:text-sm font-semibold text-slate-300 transition hover:text-white py-1"
        onClick={onGoToResend}
      >
        Reenviar verificación
      </button>
    </form>
  )
}
