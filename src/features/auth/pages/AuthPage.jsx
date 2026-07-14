import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LoginForm } from '../components/LoginForm'
import { RegisterForm } from '../components/RegisterForm'
import { ResendVerificationForm } from '../components/ResendVerificationForm'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'

const FloatingIcons = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute top-[10%] left-[10%] text-5xl sm:text-7xl opacity-20 animate-float">🍔</div>
      <div className="absolute top-[20%] right-[10%] text-6xl sm:text-8xl opacity-10 animate-float-delayed">🍕</div>
      <div className="absolute bottom-[15%] left-[15%] text-5xl sm:text-7xl opacity-20 animate-float-reverse">🛵</div>
      <div className="absolute bottom-[25%] right-[15%] text-4xl sm:text-6xl opacity-30 animate-float-slow">🍜</div>
      <div className="absolute top-[45%] left-[5%] text-4xl sm:text-6xl opacity-15 animate-float-reverse">🥗</div>
      <div className="absolute top-[60%] right-[5%] text-5xl sm:text-7xl opacity-20 animate-float">🍩</div>
      <div className="absolute top-[75%] left-[30%] text-4xl sm:text-5xl opacity-10 animate-float-delayed">🌮</div>
      <div className="absolute top-[15%] left-[45%] text-4xl sm:text-5xl opacity-10 animate-float">🥤</div>
    </div>
  )
}

export const AuthPage = () => {
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') || 'login'
  const [mode, setMode] = useState(initialMode)
  useEffect(() => {
    // keep mode in sync if query param changes externally
    const m = searchParams.get('mode')
    if (m && m !== mode) setMode(m)
  }, [searchParams])
  const [notice, setNotice] = useState('')

  const handleSwitchToLogin = (payload = {}) => {
    setNotice(
      payload.message ??
        'Usuario creado. Revisa tu correo para verificar la cuenta antes de iniciar sesión.',
    )
    setMode('login')
  }

  const getTitleAndDescription = () => {
    switch (mode) {
      case 'login':
        return {
          title: 'Bienvenido',
          description: 'Inicia sesión para gestionar tus restaurantes',
        }
      case 'register':
        return {
          title: 'Crear usuario',
          description:
            'Únete y comienza a administrar tus locales hoy mismo.',
        }
      case 'resend':
        return {
          title: 'Reenviar verificación',
          description:
            'Si tu enlace expiró o ya fue usado, solicita un nuevo correo de verificación.',
        }
      case 'forgot':
        return {
          title: 'Recuperar contraseña',
          description:
            'Solicita el enlace para cambiar tu contraseña desde el correo registrado.',
        }
      default:
        return { title: '', description: '' }
    }
  }

  const { title, description } = getTitleAndDescription()

  return (
    <main className="relative min-h-screen grid place-items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12 overflow-hidden">
      <FloatingIcons />
      
      <section className="relative z-10 w-full max-w-md rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-6 sm:p-8 lg:p-10 shadow-2xl flex flex-col items-center animate-fadeIn">
        <div className="mb-4 sm:mb-6 flex h-20 sm:h-24 w-20 sm:w-24 items-center justify-center rounded-full bg-slate-800 text-slate-100">
          <svg
            viewBox="0 0 64 64"
            className="h-12 sm:h-16 w-12 sm:w-16"
            aria-hidden="true"
          >
            <circle cx="32" cy="20" r="12" fill="currentColor" />
            <path d="M16 52c0-9 7-16 16-16s16 7 16 16H16z" fill="currentColor" />
          </svg>
        </div>

        <h1 className="mb-2 sm:mb-3 w-full text-center text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">{title}</h1>
        {description ? (
          <p className="mb-5 sm:mb-7 w-full text-center text-xs sm:text-sm leading-5 sm:leading-6 text-slate-300">{description}</p>
        ) : null}

        {notice ? (
          <p className="mb-4 sm:mb-6 w-full rounded-xl sm:rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-emerald-200 backdrop-blur-sm">
            {notice}
          </p>
        ) : null}

        {mode === 'login' || mode === 'register' ? (
          <div className="mb-5 sm:mb-6 grid w-full grid-cols-2 gap-2 sm:gap-3 p-1 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-white/5">
            <button
              type="button"
              className={
                mode === 'login'
                  ? 'rounded-xl sm:rounded-2xl border-none bg-gradient-to-r from-orange-500 to-amber-500 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-lg transition-transform scale-100'
                  : 'rounded-xl sm:rounded-2xl border-none bg-transparent px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-slate-400 transition hover:text-white'
              }
              onClick={() => setMode('login')}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className={
                mode === 'register'
                  ? 'rounded-xl sm:rounded-2xl border-none bg-gradient-to-r from-orange-500 to-amber-500 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-lg transition-transform scale-100'
                  : 'rounded-xl sm:rounded-2xl border-none bg-transparent px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-slate-400 transition hover:text-white'
              }
              onClick={() => setMode('register')}
            >
              Crear usuario
            </button>
          </div>
        ) : null}

        <div className="w-full grid gap-5">
          {mode === 'login' ? (
            <LoginForm onGoToForgot={() => setMode('forgot')} />
          ) : mode === 'register' ? (
            <RegisterForm onSwitchToLogin={handleSwitchToLogin} onGoToResend={() => setMode('resend')} />
          ) : mode === 'resend' ? (
            <ResendVerificationForm onBackToRegister={() => setMode('register')} />
          ) : (
            <ForgotPasswordForm onBackToLogin={() => setMode('login')} />
          )}
        </div>
      </section>
    </main>
  )
}

