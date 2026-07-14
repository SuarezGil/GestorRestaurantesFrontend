export const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors?.length) return data.errors[0].message
  return data?.message || error?.message || fallback
}

export const toInputDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })
}

export const STATUS_LABEL = { PENDIENTE: 'Pendiente', COMPLETADO: 'Completada' }
export const STATUS_COLORS = {
  PENDIENTE: 'bg-amber-100 text-amber-700 border border-amber-200',
  COMPLETADO: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
}
export const STATUS_OPTIONS = ['PENDIENTE', 'COMPLETADO']

export const statusLabel = (status) => STATUS_LABEL[status] || status

export const isClientRole = (user) => {
  const roles = user?.UserRoles || []
  return roles.some((entry) => entry?.Role?.Name === 'USER_ROLE')
}

export const getUserId = (user) => String(user?.Id || user?.id || user?._id || '')

export const getUserLabel = (user) => {
  const name = user?.Name || user?.name || 'Usuario sin nombre'
  const email = user?.Email || user?.email || ''
  return email ? `${name} (${email})` : name
}
