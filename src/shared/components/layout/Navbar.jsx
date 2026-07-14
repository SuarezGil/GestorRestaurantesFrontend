import { useAuthStore } from '../../../features/auth/store/authStore'
import imgLogo from '../../../assets/img/logoRestaurante.png'
import { AvatarUser } from '../ui/AvatarUser'

export const Navbar = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <nav className="bg-slate-900/45 border-b border-white/20 sticky top-0 z-50 shadow-lg backdrop-blur-md">
      <div className="px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img
            src={imgLogo}
            alt="Logo"
            className="w-10 h-10 rounded-full object-cover border border-white/35 shadow-sm flex-shrink-0"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = ''
            }}
          />
          <div>
            <p className="m-0 text-[0.95rem] font-bold text-slate-100 leading-tight font-display">
              Gestor Restaurantes
            </p>
            <p className="m-0 text-[0.7rem] text-slate-300 font-medium">
              Panel de administración
            </p>
          </div>
        </div>
        {isAuthenticated && <AvatarUser />}
      </div>
    </nav>
  )
}
