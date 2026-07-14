export const ORDER_TYPES = ['EN_RESTAURANTE', 'A_DOMICILIO', 'PARA_LLEVAR']
export const ORDER_STATUSES = ['EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO']

export const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors?.length) {
    return data.errors[0].message
  }
  return data?.message || error?.message || fallback
}

export const statusLabel = (status) => {
  if (status === 'EN_PREPARACION') return 'Pendiente'
  if (status === 'LISTO') return 'Listo'
  if (status === 'ENTREGADO') return 'Completado'
  if (status === 'CANCELADO') return 'Cancelado'
  return status
}

export const orderTypeLabel = (type) => {
  if (type === 'EN_RESTAURANTE') return 'En restaurante'
  if (type === 'A_DOMICILIO') return 'A domicilio'
  if (type === 'PARA_LLEVAR') return 'Para llevar'
  return type
}

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
