import { axiosAuth } from './api'

export const login = async (data) => {
  return axiosAuth.post('/auth/login', data)
}

export const register = async (data) => {
  return axiosAuth.post('/auth/register', data)
}

export const refresh = async (refreshToken) => {
  return axiosAuth.post('/auth/refresh', { refreshToken })
}

export const verifyEmail = async (token) => {
  return axiosAuth.post('/auth/verify-email', { token })
}

export const resendVerification = async (email) => {
  return axiosAuth.post('/auth/resend-verification', { email })
}

export const forgotPassword = async (email) => {
  return axiosAuth.post('/auth/forgot-password', { email })
}

export const resetPassword = async (token, newPassword) => {
  return axiosAuth.post('/auth/reset-password', { token, newPassword })
}

export const getAllUsersWithAuthService = async () => {
  const { data } = await axiosAuth.get('/users/all')
  return data
}
