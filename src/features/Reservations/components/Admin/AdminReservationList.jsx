import { STATUS_OPTIONS, statusLabel, getUserLabel } from '../../utils/reservationHelpers'

export const AdminReservationList = ({
  loading,
  error,
  reservations,
  selectedReservation,
  setSelectedReservation,
  usersById,
  startEditing,
  handleCancel,
  handleStatusUpdate
}) => {
  return (
    <div className="mt-6 space-y-3">
      {loading && <p className="py-6 text-center text-sm text-slate-500">Cargando...</p>}
      {!loading && error && <p className="py-6 text-center text-sm text-rose-500">{error}</p>}
      {!loading && !error && reservations.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No hay reservas registradas.</p>}

      {!loading && reservations.map((reservation) => (
        <article
          key={reservation._id}
          className={`rounded-2xl border p-4 transition ${selectedReservation?._id === reservation._id ? 'border-sky-400 bg-sky-50/60' : 'border-slate-100 hover:border-sky-200'}`}
          onClick={() => setSelectedReservation(reservation)}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{reservation.restaurantId?.restaurantName || 'Restaurante'}</p>
              <p className="text-xs text-slate-500">
                Cliente: {usersById.get(String(reservation.userId)) ? getUserLabel(usersById.get(String(reservation.userId))) : reservation.userId || 'N/A'}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{statusLabel(reservation.status)}</span>
          </div>

          <p className="mt-2 text-sm text-slate-600">
            {new Date(reservation.startDate).toLocaleString()} - {new Date(reservation.endDate).toLocaleString()}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={(e) => { e.stopPropagation(); startEditing(reservation) }} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">Editar</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); handleCancel(reservation) }} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-600">Cancelar</button>
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                type="button"
                disabled={status === reservation.status}
                onClick={(e) => {
                  e.stopPropagation()
                  handleStatusUpdate(reservation, status)
                }}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 disabled:opacity-40"
              >
                {statusLabel(status)}
              </button>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}
