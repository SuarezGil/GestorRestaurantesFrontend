import { axiosApi } from './api'

export const getInvoices = async (params = {}) => {
  return axiosApi.get('/invoices', { params })
}

export const getIssuedInvoices = async (params = {}) => {
  return axiosApi.get('/invoices/issued', { params })
}

export const getMyInvoices = async (params = {}) => {
  return axiosApi.get('/invoices/my-invoices', { params })
}

export const exportInvoicePdf = async (invoiceId) => {
  return axiosApi.get(`/invoices/my-invoices/${invoiceId}/pdf`, {
    responseType: 'blob',
  })
}

export const exportMyInvoicePdf = async (invoiceId) => {
  return axiosApi.get(`/invoices/my/${invoiceId}/pdf`, {
    responseType: 'blob',
  })
}
