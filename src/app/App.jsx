import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '../features/auth/store/authStore'
import { AppRoutes } from "./router/AppRoutes"
 
 
const App = () => {
  useEffect(() => {
    useAuthStore.getState().initializeAuth()
  }, [])
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: "inherit",
            fontWeight: "600",
            fontSize: "1rem",
            borderRadius: "8px"
          }
        }}
      />
      <AppRoutes />
    </>
  )
}
 
export default App
