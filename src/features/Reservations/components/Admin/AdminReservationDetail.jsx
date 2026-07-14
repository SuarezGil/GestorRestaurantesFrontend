import { getUserLabel, statusLabel } from '../../utils/reservationHelpers'

export const AdminReservationDetail = ({ selectedReservation, usersById }) => {
  return (
    <aside className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-6 shadow-xl sticky top-6 text-left">
        <h2 className="text-base font-bold text-white">Detalle de reserva</h2>
        
        {/* Estado Vacío */}
        {!selectedReservation && (
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Selecciona una reserva de la lista para ver su información completa.
          </p>
        )}
        
        {/* Con Reserva Seleccionada */}
        {selectedReservation && (
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span className="font-semibold text-slate-400">Estado:</span> 
              <span className={`font-bold ${
                selectedReservation.status === 'COMPLETADA' || selectedReservation.status === 'CONFIRMADA' ? 'text-emerald-400' :
                selectedReservation.status === 'PENDIENTE' ? 'text-amber-400' : 'text-rose-400'
              }`}>{statusLabel(selectedReservation.status)}</span>
            </div>
            
            <div className="flex justify-between border-b border-slate-800/60 pb-2 items-start gap-2">
              <span className="font-semibold text-slate-400">Cliente:</span>{' '}
              <span className="font-medium text-white text-right max-w-[200px] truncate">
                {selectedReservation.userId
                  ? (usersById.get(String(selectedReservation.userId))
                    ? getUserLabel(usersById.get(String(selectedReservation.userId)))
                    : selectedReservation.userId)
                  : 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span className="font-semibold text-slate-400">Restaurante:</span> 
              <span className="font-medium text-white">{selectedReservation.restaurantId?.restaurantName || 'N/A'}</span>
            </div>
            
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span className="font-semibold text-slate-400">Mesas:</span> 
              <span className="font-medium text-white">{(selectedReservation.tableId || []).map((t) => t.tableNumber || t._id || t).join(', ') || 'N/A'}</span>
            </div>
            
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span className="font-semibold text-slate-400">Personas:</span> 
              <span className="font-medium text-white">{selectedReservation.numberPeople} pax</span>
            </div>
            
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span className="font-semibold text-slate-400">Tipo:</span> 
              <span className="font-medium text-white uppercase tracking-wider text-xs bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{selectedReservation.typeReservation}</span>
            </div>
            
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span className="font-semibold text-slate-400">Inicio:</span> 
              <span className="font-medium text-slate-200">{new Date(selectedReservation.startDate).toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span className="font-semibold text-slate-400">Fin:</span> 
              <span className="font-medium text-slate-200">{new Date(selectedReservation.endDate).toLocaleString()}</span>
            </div>
            
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="font-semibold text-slate-400">Descripción:</span> 
              <p className="font-medium text-left text-slate-300 text-xs bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                {selectedReservation.description || 'Sin especificaciones o comentarios adicionales.'}
              </p>
            </div>
          </div>
        )}
      </section>
    </aside>
  )
}