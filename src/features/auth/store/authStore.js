import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { login as loginRequest, register as registerRequest } from '../../../shared/api/auth'
import { showError } from '../../../shared/utils/toast'

const emptySession = {
  user: null,
  token: null,
  refreshToken: null,
  expiresAt: null,
  isAuthenticated: false,
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      ...emptySession,
      loading: false,
      error: null,
      isLoadingAuth: true,

      initializeAuth: () => {
        const { token } = get()

        set({
          isAuthenticated: Boolean(token),
          isLoadingAuth: false,
        })
      },

      login: async ({ email, password }) => {
        try {
          set({ loading: true, error: null })

          const { data } = await loginRequest({ email, password })
          const user = data.userDetails ?? data.user ?? null
          const role = user?.role ?? data.role
          const token = data.accessToken ?? data.token ?? null

          if (!['ADMIN_ROLE', 'USER_ROLE', 'ADMIN_RESTAURANT', 'ADMIN_RESTAURANTE'].includes(role)) {
            const message = 'No tienes permisos para acceder a esta área.'
            set({
              ...emptySession,
              error: message,
              isLoadingAuth: false,
            })
            showError(message)
            return { success: false, error: message }
          }

          if (!token) {
            const message = 'No se recibió token en la respuesta de login.'
            set({
              ...emptySession,
              error: message,
              isLoadingAuth: false,
            })
            showError(message)
            return { success: false, error: message }
          }

          set({
            user,
            token,
            refreshToken: data.refreshToken ?? null,
            expiresAt: data.expiresAt ?? data.expiresIn ?? null,
            error: null,
            isAuthenticated: true,
            isLoadingAuth: false,
          })

          // Si es administrador de restaurante, obtener y asociar su restaurantId de inmediato
          if (role === 'ADMIN_RESTAURANT' || role === 'ADMIN_RESTAURANTE') {
            try {
              const { getMyRestaurant } = await import('../../../shared/api/restaurants')
              const { data: myRestData } = await getMyRestaurant()
              const restaurant = myRestData?.data
              if (restaurant) {
                set({
                  user: {
                    ...user,
                    restaurantId: restaurant._id || restaurant.id,
                  },
                })
              }
            } catch (err) {
              console.error('Error al precargar restaurantId para el admin:', err)
            }
          }

          return {
            success: true,
            role,
            redirectTo:
              role === 'ADMIN_ROLE'
                ? '/dashboard'
                : role === 'ADMIN_RESTAURANT' || role === 'ADMIN_RESTAURANTE'
                  ? '/admin-restaurante'
                  : '/client',
          }
        } catch (error) {
          const message = error.response?.data?.message ?? 'Error de autenticación.'
          set({ error: message, isLoadingAuth: false })
          return { success: false, error: message }
        } finally {
          set({ loading: false })
        }
      },

      register: async (formData) => {
        try {
          set({ loading: true, error: null })

          const { data } = await registerRequest(formData)

          set({
            loading: false,
            error: null,
            isLoadingAuth: false,
          })

          return {
            success: true,
            emailVerificationRequired: Boolean(data?.emailVerificationRequired),
            message:
              data?.message ??
              'Usuario creado. Revisa tu correo para verificar la cuenta antes de iniciar sesión.',
          }
        } catch (error) {
          const message = error.response?.data?.message ?? 'Error al registrar usuario.'
          set({ error: message, isLoadingAuth: false })
          return { success: false, error: message }
        } finally {
          set({ loading: false })
        }
      },

      logout: () => {
        set({
          ...emptySession,
          loading: false,
          error: null,
          isLoadingAuth: false,
        })
      },

      updateUser: (updatedUser) => {
        set({
          user: updatedUser,
        })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
      }),
    },
  ),
)
