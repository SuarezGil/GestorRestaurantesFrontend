import axios from 'axios'
import { useAuthStore } from '../../features/auth/store/authStore'

export const axiosAuth = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL,
  timeout: 8000,
})

export const axiosApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? import.meta.env.VITE_AUTH_URL,
  timeout: 8000,
})

const attachToken = (clientName) => (config) => {
  const token = useAuthStore.getState().token

  config._axiosClient = clientName

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
}

axiosAuth.interceptors.request.use(attachToken('auth'))
axiosApi.interceptors.request.use(attachToken('api'))

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
      return
    }

    resolve(token)
  })

  failedQueue = []
}

const handleRefreshToken = async (error) => {
  const originalRequest = error.config

  if (!originalRequest || originalRequest._retry) {
    return Promise.reject(error)
  }

  const status = error.response?.status
  const errorCode = error.response?.data?.error
  const requestUrl = originalRequest.url ?? ''
  const isRefreshEndpoint = requestUrl.includes('/auth/refresh')
  const isLoginEndpoint = requestUrl.includes('/auth/login')
  const shouldRefresh =
    !isRefreshEndpoint &&
    !isLoginEndpoint &&
    (status === 401 || (status === 403 && errorCode === 'TOKEN_EXPIRED'))

  if (!shouldRefresh) {
    return Promise.reject(error)
  }

  const retryClient = originalRequest._axiosClient === 'api' ? axiosApi : axiosAuth

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject })
    })
      .then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return retryClient(originalRequest)
      })
      .catch((queueError) => Promise.reject(queueError))
  }

  originalRequest._retry = true
  isRefreshing = true

  const refreshToken = useAuthStore.getState().refreshToken

  if (!refreshToken) {
    isRefreshing = false
    processQueue(error, null)
    useAuthStore.getState().logout()
    return Promise.reject(error)
  }

  try {
    const response = await axiosAuth.post('/auth/refresh', { refreshToken })
    const {
      accessToken,
      refreshToken: newRefreshToken,
      expiresAt,
      expiresIn,
      userDetails,
    } = response.data

    const currentUser = useAuthStore.getState().user
    const updatedUser = userDetails
      ? { ...userDetails, restaurantId: currentUser?.restaurantId }
      : currentUser

    useAuthStore.setState({
      token: accessToken,
      refreshToken: newRefreshToken ?? refreshToken,
      expiresAt: expiresAt ?? expiresIn ?? null,
      user: updatedUser,
      isAuthenticated: true,
      isLoadingAuth: false,
    })

    processQueue(null, accessToken)
    originalRequest.headers.Authorization = `Bearer ${accessToken}`

    return retryClient(originalRequest)
  } catch (refreshError) {
    processQueue(refreshError, null)
    useAuthStore.getState().logout()
    return Promise.reject(refreshError)
  } finally {
    isRefreshing = false
  }
}

axiosAuth.interceptors.response.use((response) => response, handleRefreshToken)
axiosApi.interceptors.response.use((response) => response, handleRefreshToken)

const axiosInventory = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 8000,
})

axiosInventory.interceptors.request.use((config) => {
    //config._axiosClient = "auth"
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
})