import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useVerifyEmail } from '../hooks/useVerifyEmail'

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const handleDone = useCallback(() => {
    window.setTimeout(() => {
      navigate('/', { replace: true })
    }, 2000)
  }, [navigate])

  const { status, message } = useVerifyEmail(token, handleDone)

  const isSuccess = status === 'success'
  const isLoading = status === 'loading'
  const isError = status === 'error'

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <section className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-950 p-10 shadow-2xl text-center">
        <div className="mb-8">
          <p
            className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border ${
              isSuccess
                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30'
                : isError
                  ? 'bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30'
                  : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border-blue-500/30'
            }`}
          >
            {isLoading ? 'Verificando...' : isSuccess ? 'Verificado' : 'Error'}
          </p>
          <h1 className="text-3xl font-bold text-slate-100 mb-3">Verificación de correo</h1>
          <p className={`text-sm ${isSuccess ? 'text-green-400' : isError ? 'text-rose-400' : 'text-slate-400'}`}>
            {message}
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center">
            <div className="w-8 h-8 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}

        {isSuccess && (
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 mb-3">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-slate-300 text-sm">Redirigiendo en 2 segundos...</p>
          </div>
        )}

        {isError && (
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 mb-3">
              <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-semibold text-white transition hover:from-blue-700 hover:to-blue-800 mt-4"
            >
              Volver al inicio
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
