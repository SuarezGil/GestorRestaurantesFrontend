import { useEffect, useState } from 'react'
import { verifyEmail } from '../../../shared/api/auth'
import { showError, showSuccess } from '../../../shared/utils/toast'

export const useVerifyEmail = (token, onDone) => {
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('Verificando correo...')

  useEffect(() => {
    let alive = true

    const run = async () => {
      if (!token) {
        const errorMessage = 'Token inválido o ausente.'
        if (alive) {
          setStatus('error')
          setMessage(errorMessage)
        }
        showError(errorMessage)
        onDone?.()
        return
      }

      try {
        const response = await verifyEmail(token)
        const successMessage =
          response.data?.message ?? 'Correo verificado correctamente. Ya puedes iniciar sesión.'

        if (alive) {
          setStatus('success')
          setMessage(successMessage)
        }
        showSuccess(successMessage)
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ?? 'No se pudo verificar el correo.'

        if (alive) {
          setStatus('error')
          setMessage(errorMessage)
        }
        showError(errorMessage)
      } finally {
        onDone?.()
      }
    }

    run()

    return () => {
      alive = false
    }
  }, [token, onDone])

  return { status, message }
}
