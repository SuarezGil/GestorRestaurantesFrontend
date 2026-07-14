import { axiosApi } from './api'

export const getTables = async ({ page = 1, limit = 50, tableActive, restaurantId } = {}) => {
  const params = { page, limit }

  if (tableActive !== undefined) {
    params.tableActive = tableActive
  }

  if (restaurantId) {
    params.restaurantId = restaurantId
  }

  return axiosApi.get('/tables', { params })
}

export const getTableById = async (id) => {
  return axiosApi.get(`/tables/${id}`)
}

export const createTable = async (payload) => {
  return axiosApi.post('/tables', payload)
}

export const updateTable = async (id, payload) => {
  return axiosApi.put(`/tables/${id}`, payload)
}

export const deleteTable = async (id) => {
  return axiosApi.delete(`/tables/${id}`)
}
