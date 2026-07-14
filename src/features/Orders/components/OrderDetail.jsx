import { orderTypeLabel, statusLabel } from '../utils/orderHelpers'

export const OrderDetail = ({ selectedOrder, handleStatusUpdate }) => {
  return (
    <aside className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-6 shadow-xl sticky top-6">
        <h2 className="text-base font-bold text-white">Detalle de orden</h2>
        
        {/* Estado Vacío */}
        {!selectedOrder && (
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Selecciona una orden de la lista para ver su detalle completo.
          </p>
        )}
        
        {/* Con Orden Seleccionada */}
        {selectedOrder && (
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span className="font-semibold text-slate-400">Estado:</span> 
              <span className={`font-bold ${
                selectedOrder.status === 'ENTREGADO' ? 'text-emerald-400' :
                selectedOrder.status === 'LISTO' ? 'text-sky-400' :
                selectedOrder.status === 'CANCELADO' ? 'text-rose-400' : 'text-amber-400'
              }`}>{statusLabel(selectedOrder.status)}</span>
            </div>
            
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span className="font-semibold text-slate-400">Tipo:</span> 
              <span className="font-medium text-white">{orderTypeLabel(selectedOrder.orderType)}</span>
            </div>
            
            {selectedOrder.orderType === 'EN_RESTAURANTE' && (
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="font-semibold text-slate-400">Mesa:</span> 
                <span className="font-medium text-white">{selectedOrder.tableId?.tableNumber || 'N/A'}</span>
              </div>
            )}
            
            {selectedOrder.orderType === 'A_DOMICILIO' && (
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="font-semibold text-slate-400">Dirección:</span> 
                <span className="font-medium text-white text-right max-w-[200px] truncate" title={selectedOrder.deliveryAddress}>
                  {selectedOrder.deliveryAddress || 'N/A'}
                </span>
              </div>
            )}
            
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span className="font-semibold text-slate-400">Total:</span> 
              <span className="font-bold text-emerald-400 text-base">Q{Number(selectedOrder.total || 0).toFixed(2)}</span>
            </div>
            
            {/* Lista de Productos Comprados */}
            <div className="pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Productos ({selectedOrder.items?.length || 0})
              </p>
              <ul className="space-y-2">
                {(selectedOrder.items || []).map((item) => (
                  <li 
                    key={item._id || item.menuId?._id || item.menuId} 
                    className="flex justify-between items-center rounded-xl bg-slate-950/60 px-3 py-2 border border-slate-800/80"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-800 text-[11px] font-bold text-slate-200 border border-slate-700">
                        {item.quantity}
                      </span>
                      <span className="font-medium text-slate-200">{item.menuId?.menuName || 'Menú'}</span>
                    </div>
                    <span className="font-bold text-white">Q{Number(item.price || 0).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Botones de Acción Operativa */}
            {selectedOrder.status !== 'ENTREGADO' && selectedOrder.status !== 'CANCELADO' && (
              <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col gap-2">
                {selectedOrder.status === 'EN_PREPARACION' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedOrder, 'LISTO')}
                    className="w-full inline-flex items-center justify-center rounded-xl bg-sky-600/90 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 transition-all active:scale-[0.98]"
                  >
                    Marcar como Listo
                  </button>
                )}
                <button
                  onClick={() => handleStatusUpdate(selectedOrder, 'ENTREGADO')}
                  className="w-full inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 transition-all active:scale-[0.98]"
                >
                  Marcar como Completado
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </aside>
  )
}