import { axiosAuth } from './api'

export const getAllUsers = async () => {
  return axiosAuth.get('/users/all')
}

export const getUsersByRole = async (roleName) => {
  return axiosAuth.get(`/users/by-role/${roleName}`)
}

export const createAdminRestaurant = async (payload) => {
  return axiosAuth.post('/users/admin-restaurant', payload)
}

export const sendAssignmentNotification = async (userId, restaurantName) => {
  return axiosAuth.post('/users/send-assignment-notification', { userId, restaurantName })
}

export const updateUserRole = async (userId, roleName) => {
  return axiosAuth.put(`/users/${userId}/role`, { roleName })
}

export const updateUserProfile = async (userData) => {
  return axiosAuth.put('/users/profile', userData)
}

export const changePassword = async (passwordData) => {
  return axiosAuth.post('/users/change-password', passwordData)
}

export const deleteAccount = async () => {
  return axiosAuth.delete('/users/account')
}

export const toggleUserActive = async (userId) => {
  return axiosAuth.patch(`/users/${userId}/toggle-active`)
}
