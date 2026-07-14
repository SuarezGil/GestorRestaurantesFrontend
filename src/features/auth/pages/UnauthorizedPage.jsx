import { Link } from 'react-router-dom'

export const UnauthorizedPage = () => {
  return (
    <main className="auth-shell">
      <section className="auth-card auth-card--compact">
        <p className="auth-badge auth-badge--danger">Acceso denegado</p>
        <h1>No autorizado</h1>
        <p className="auth-description">
          Tu usuario no tiene permisos para ver esta sección.
        </p>
        <Link className="auth-link" to="/">
          Volver al login
        </Link>
      </section>
    </main>
  )
}
