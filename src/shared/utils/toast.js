import toast from 'react-hot-toast'

const baseStyle = {
  borderRadius: '10px',
  fontWeight: 600,
  fontFamily: 'inherit',
  fontSize: '0.95rem',
  padding: '14px 20px',
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
}

export const showSuccess = (message) =>
  toast.success(message, {
    style: {
      ...baseStyle,
      background: '#16a34a',
      color: '#fff',
    },
  })

export const showError = (message) =>
  toast.error(message, {
    style: {
      ...baseStyle,
      background: '#dc2626',
      color: '#fff',
    },
  })

export const showInfo = (message) =>
  toast(message, {
    style: {
      ...baseStyle,
      background: '#0f172a',
      color: '#fff',
    },
  })
