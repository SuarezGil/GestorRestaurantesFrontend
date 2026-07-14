import { axiosApi } from './api'

export const getActivePromotions = async (params = {}) => {
  return axiosApi.get('/promotions/active', { params })
}

export const getAllPromotions = async () => {
  return axiosApi.get('/promotions')
}

export const createPromotion = async (payload) => {
  return axiosApi.post('/promotions', payload)
}

export const approvePromotion = async (id) => {
  return axiosApi.put(`/promotions/approve/${id}`)
}

export const updatePromotion = async (id, payload) => {
  return axiosApi.put(`/promotions/${id}`, payload)
}

export const deletePromotion = async (id) => {
  return axiosApi.delete(`/promotions/${id}`)
}
