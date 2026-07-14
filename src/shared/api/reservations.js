import { axiosApi } from './api'

export const getReservations = async (params = {}) => {
  return axiosApi.get('/reservations', { params })
}

const buildReservationFormData = (payload) => {
  const formData = new FormData()

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    if (key === 'photo' && value instanceof File) {
      formData.append('photo', value)
      return
    }

    if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value))
      return
    }

    formData.append(key, value)
  })

  return formData
}

export const getMyReservations = async () => {
  return axiosApi.get('/reservations/my-reservations')
}

export const createReservation = async (payload) => {
  const formData = buildReservationFormData(payload)
  return axiosApi.post('/reservations/create', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const updateReservation = async (id, payload) => {
  const formData = buildReservationFormData(payload)
  return axiosApi.put(`/reservations/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const updateReservationStatus = async (id, status) => {
  return axiosApi.put(`/reservations/status/${id}`, { status })
}

export const cancelReservation = async (id) => {
  return updateReservationStatus(id, 'CANCELADO')
}
