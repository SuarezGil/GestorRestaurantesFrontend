import { useForm } from 'react-hook-form'
import { resendVerification } from '../../../shared/api/auth'
import { showError, showSuccess } from '../../../shared/utils/toast'

export const ResendVerificationForm = ({ onBackToRegister }) => {
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
      const { data } = await resendVerification(email)
      showSuccess(data?.message ?? 'Hemos reenviado el correo de verificación.')
      reset()
    } catch (error) {
      const message = error.response?.data?.message ?? 'No se pudo reenviar la verificación.'
      showError(message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid w-full gap-5">
      <div className="grid gap-2">
        <label htmlFor="resend-email" className="text-sm font-semibold text-slate-100">
          Email
        </label>
        <input
          id="resend-email"
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
        El enlace de verificación solo se puede usar una vez. Si ya lo usaste o expiró, solicita uno nuevo aquí.
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Enviando...' : 'Reenviar verificación'}
      </button>

      <button
        type="button"
        className="text-sm font-semibold text-slate-300 transition hover:text-white"
        onClick={onBackToRegister}
      >
        Volver a crear usuario
      </button>
    </form>
  )
}
