import { axiosApi } from './api'

export const getEventsByReservation = async (reservationId) => {
  return axiosApi.get(`/events/reservation/${reservationId}`)
}

export const createEvent = async (payload) => {
  return axiosApi.post('/events', payload)
}

export const deactivateEvent = async (id) => {
  return axiosApi.put(`/events/deactivate/${id}`)
}
