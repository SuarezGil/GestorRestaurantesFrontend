import { axiosApi } from './api'

export const getMenus = async (params = {}) => {
  return axiosApi.get('/menus', { params })
}

export const getMenuById = async (id) => {
  return axiosApi.get(`/menus/${id}`)
}

export const createMenu = async (payload) => {
  const formData = new FormData()

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return

    // stockQuantity is part of inventory and should not be sent to the menus endpoint
    if (key === 'stockQuantity') return

    if (key === 'menuPhoto' && value instanceof File) {
      formData.append('menuPhoto', value)
      return
    }

    formData.append(key, value)
  })

  return axiosApi.post('/menus', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const updateMenu = async (id, payload) => {
  const formData = new FormData()

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    // stockQuantity is part of inventory and should not be sent to the menus endpoint
    if (key === 'stockQuantity') return

    if (key === 'menuPhoto' && value instanceof File) {
      formData.append('menuPhoto', value)
      return
    }

    formData.append(key, value)
  })

  return axiosApi.put(`/menus/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const deleteMenu = async (id) => {
  return axiosApi.delete(`/menus/${id}`)
}
