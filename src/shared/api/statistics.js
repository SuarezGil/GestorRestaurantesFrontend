import { axiosApi } from './api'

export const getAdminStatistics = async () => {
  return axiosApi.get('/statistics/admin/overview')
}

export const getTopSellingMenus = async () => {
  return axiosApi.get('/statistics/top-selling')
}

export const getRestaurantStatistics = async (restaurantId) => {
  return axiosApi.get(`/statistics/${restaurantId}`)
}

