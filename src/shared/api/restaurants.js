import { axiosApi } from './api'

const buildRestaurantFormData = (payload) => {
  const formData = new FormData()

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    if (key === 'restaurantPhoto' && value instanceof File) {
      formData.append('restaurantPhoto', value)
      return
    }

    formData.append(key, value)
  })

  return formData
}

export const getRestaurants = async ({ page = 1, limit = 50, restaurantActive } = {}) => {
  const params = { page, limit }

  if (restaurantActive !== undefined) {
    params.restaurantActive = restaurantActive
  }

  return axiosApi.get('/restaurants', { params })
}

export const getRestaurantById = async (id) => {
  return axiosApi.get(`/restaurants/${id}`)
}

export const getMyRestaurant = async () => {
  return axiosApi.get('/restaurants/my')
}

export const createRestaurant = async (payload) => {
  const formData = buildRestaurantFormData(payload)

  return axiosApi.post('/restaurants/create', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const updateRestaurant = async (id, payload) => {
  return axiosApi.put(`/restaurants/${id}`, payload)
}

export const deleteRestaurant = async (id) => {
  return axiosApi.delete(`/restaurants/${id}`)
}

export const assignAdmin = async (restaurantId, adminId) => {
  return axiosApi.put(`/restaurants/${restaurantId}/assign-admin`, { adminId })
}
