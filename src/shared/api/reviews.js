import { axiosApi } from './api'

export const getReviews = async () => {
  return axiosApi.get('/reviews')
}

export const getReviewsByRestaurant = async (restaurantId) => {
  return axiosApi.get(`/reviews/restaurant/${restaurantId}`)
}

export const getReviewsByMenu = async (menuId) => {
  return axiosApi.get(`/reviews/menu/${menuId}`)
}

export const createReview = async (payload) => {
  return axiosApi.post('/reviews', payload)
}

export const deleteReview = async (id) => {
  return axiosApi.delete(`/reviews/${id}`)
}
