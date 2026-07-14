import { formatDate, STATUS_COLORS, STATUS_LABEL } from '../../utils/reservationHelpers'

export const MyReservationsList = ({
  myReservations,
  loadingMy,
  loadMyReservations,
  detailId,
  setDetailId,
  detailReservation,
  startEdit,
  handleCancel
}) => {
  return (
    <aside>
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">Mis reservaciones</h2>
            <p className="text-xs text-slate-400 mt-0.5">{myReservations.length} en total</p>
          </div>
          <button type="button" onClick={loadMyReservations} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:bg-slate-50">↻ Actualizar</button>
        </div>

        {loadingMy && (
          <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
            <p className="text-sm">Cargando tus reservaciones…</p>
          </div>
        )}
        {!loadingMy && myReservations.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-sky-200 bg-sky-50 py-10">
            <p className="text-sm font-semibold text-sky-700">Sin reservaciones aún</p>
            <p className="text-xs text-sky-500 text-center px-4">Usa el formulario de la izquierda para crear tu primera reserva.</p>
          </div>
        )}

        <div className="space-y-3">
          {!loadingMy && myReservations.map((res) => {
            const borderColor = res.status === 'PENDIENTE' ? 'border-l-amber-400' : res.status === 'COMPLETADO' ? 'border-l-emerald-400' : 'border-l-rose-400'
            return (
              <article key={res._id} className={`rounded-2xl border border-slate-100 border-l-4 ${borderColor} bg-white p-4 shadow-sm transition hover:shadow-md`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{res.restaurantId?.restaurantName || 'Restaurante'}</p>
                    <p className="mt-1 text-xs text-slate-500">Inicio: {formatDate(res.startDate)}</p>
                    <p className="text-xs text-slate-500">Hasta: {formatDate(res.endDate)}</p>
                    <p className="mt-1 text-xs text-slate-400">{res.numberPeople} {res.numberPeople === 1 ? 'persona' : 'personas'} · {res.typeReservation}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_COLORS[res.status] || 'bg-slate-100 text-slate-600'}`}>
                    {STATUS_LABEL[res.status] || res.status}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setDetailId(detailId === res._id ? null : res._id)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">
                    {detailId === res._id ? '▲ Ocultar' : '▼ Ver detalle'}
                  </button>
                  {res.status === 'PENDIENTE' && (
                    <>
                      <button type="button" onClick={() => startEdit(res)} className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100">Editar</button>
                      <button type="button" onClick={() => handleCancel(res)} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100">Cancelar</button>
                    </>
                  )}
                </div>

                {detailId === res._id && detailReservation && (
                  <div className="mt-3 space-y-1.5 rounded-xl bg-slate-50 border border-slate-100 p-3">
                    {[
                      ['Mesas', (res.tableId || []).map((t) => t.tableName || t._id || t).join(', ') || '—'],
                      ['Descripción', res.description || 'Sin descripción'],
                      ['Estado', STATUS_LABEL[res.status] || res.status],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-2 text-xs">
                        <span className="text-slate-500">{label}</span>
                        <span className="text-right font-medium text-slate-700">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>
    </aside>
  )
}
