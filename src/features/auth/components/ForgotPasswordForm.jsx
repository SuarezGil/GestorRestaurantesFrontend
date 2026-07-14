import { useForm } from 'react-hook-form'
import { forgotPassword } from '../../../shared/api/auth'
import { showError, showSuccess } from '../../../shared/utils/toast'

export const ForgotPasswordForm = ({ onBackToLogin }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async ({ email }) => {
    try {
      const { data } = await forgotPassword(email)
      showSuccess(
        data?.message ??
          'Si el correo existe, enviamos instrucciones para restablecer la contraseña.',
      )
      reset()
    } catch (error) {
      const message = error.response?.data?.message ?? 'No se pudo iniciar la recuperación.'
      showError(message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid w-full gap-5">
      <div className="grid gap-2">
        <label htmlFor="forgot-email" className="text-sm font-semibold text-slate-100">
          Email
        </label>
        <input
          id="forgot-email"
          type="email"
          placeholder="correo@ejemplo.com"
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-white/50 focus:ring-2 focus:ring-white/10"
          {...register('email', {
            required: 'El email es obligatorio',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Por favor ingresa un email válido',
            },
          })}
        />
        {errors.email && <p className="text-sm text-rose-400">{errors.email.message}</p>}
      </div>

      <p className="text-sm leading-6 text-slate-400">
        Te enviaremos un enlace para cambiar tu contraseña. Ese enlace abrirá la pantalla de restablecimiento.
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Enviando...' : 'Recuperar contraseña'}
      </button>

      <button
        type="button"
        className="text-sm font-semibold text-slate-300 transition hover:text-white"
        onClick={onBackToLogin}
      >
        Volver al inicio de sesión
      </button>
    </form>
  )
}
