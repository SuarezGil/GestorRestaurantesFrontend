import { axiosApi } from './api'

export const getInventories = async (params = {}) => 
  axiosApi.get('/inventory', { params })

export const getInventoryById = async (id) => 
  axiosApi.get(`/inventory/${id}`)

export const createInventory = async (payload) => 
  axiosApi.post('/inventory', payload)

export const updateInventory = async (id, payload) => 
  axiosApi.put(`/inventory/${id}`, payload)

export const deleteInventory = async (id) => 
  axiosApi.delete(`/inventory/${id}`)

