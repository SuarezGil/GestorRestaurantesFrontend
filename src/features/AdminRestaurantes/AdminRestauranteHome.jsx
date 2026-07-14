import { useAuthStore } from '../auth/store/authStore'

export const AdminRestauranteHome = () => {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-100 text-4xl">
        🍽️
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-slate-900">
        Bienvenido{user?.name ? `, ${user.name}` : ''}
      </h1>
      <p className="mt-3 text-slate-500 max-w-sm">
        Selecciona una opción del menú lateral para comenzar a gestionar tu restaurante.
      </p>
      <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700">
        Administrador de restaurante
      </span>
    </div>
  )
}
