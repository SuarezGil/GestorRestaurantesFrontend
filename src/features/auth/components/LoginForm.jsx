import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

export const LoginForm = ({ onGoToForgot }) => {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const loading = useAuthStore((state) => state.loading)
  const error = useAuthStore((state) => state.error)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (formData) => {
    const result = await login(formData)

    if (result.success) {
      toast.success('¡Bienvenido de nuevo!')
      navigate(result.redirectTo ?? '/dashboard', { replace: true })
      return
    }

    if (result?.error?.toLowerCase().includes('permisos')) {
      navigate('/unauthorized', { replace: true })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid w-full gap-4 sm:gap-5">
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
            required: 'Este campo es obligatorio',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Por favor ingresa un email válido',
            },
          })}
        />
        {errors.email && <p className="text-xs sm:text-sm text-rose-400">{errors.email.message}</p>}
      </div>

      <div className="grid gap-2">
        <label htmlFor="password" className="text-xs sm:text-sm font-semibold text-slate-100">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="w-full rounded-xl sm:rounded-2xl border border-slate-700 bg-slate-950 px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base text-slate-100 outline-none transition focus:border-white/50 focus:ring-2 focus:ring-white/10"
            {...register('password', {
              required: 'La contraseña es obligatoria',
              minLength: {
                value: 6,
                message: 'La contraseña debe tener al menos 6 caracteres',
              },
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1"
            title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? (
              <svg className="h-4 sm:h-5 w-4 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ) : (
              <svg className="h-4 sm:h-5 w-4 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
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
        {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </button>

      <button
        type="button"
        onClick={onGoToForgot}
        className="text-xs sm:text-sm font-semibold text-slate-300 transition hover:text-white py-1"
      >
        Olvidé contraseña
      </button>
    </form>
  )
}
