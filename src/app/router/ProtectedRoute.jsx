import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/store/authStore'
import { Spinner } from '../../shared/components/layout/Spinner.jsx'

export const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoadingAuth = useAuthStore((state) => state.isLoadingAuth)

  if (isLoadingAuth) {
    return <Spinner label="Validando sesión..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}
