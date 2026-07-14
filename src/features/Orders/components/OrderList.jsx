import { ORDER_STATUSES, orderTypeLabel, statusLabel } from '../utils/orderHelpers'

export const OrderList = ({
  orders,
  loading,
  error,
  selectedOrder,
  setSelectedOrder,
  handleStatusUpdate
}) => {
  return (
    <div className="space-y-3 p-4">
      {loading && <p className="py-6 text-center text-sm text-slate-400">Cargando...</p>}
      {!loading && error && <p className="py-6 text-center text-sm text-rose-400">{error}</p>}
      {!loading && !error && orders.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No hay órdenes registradas.</p>}

      {!loading && orders.map((order) => (
        <article
          key={order._id}
          onClick={() => setSelectedOrder(order)}
          className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
            selectedOrder?._id === order._id 
              ? 'border-emerald-500/50 bg-emerald-950/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
              : 'border-white/5 bg-slate-900/50 hover:border-white/10 hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-white">Orden #{order._id?.slice(-6)}</p>
              <p className="text-xs text-slate-400 mt-0.5">{orderTypeLabel(order.orderType)}</p>
            </div>
            <span className="rounded-lg bg-slate-800 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300 border border-white/5">
              {statusLabel(order.status)}
            </span>
          </div>
          
          <p className="mt-3 text-sm font-semibold text-emerald-400">Total: Q{Number(order.total || 0).toFixed(2)}</p>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {ORDER_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                disabled={status === order.status}
                onClick={(e) => {
                  e.stopPropagation()
                  handleStatusUpdate(order, status)
                }}
                className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase transition-colors ${
                  status === order.status 
                    ? 'bg-emerald-600 text-white cursor-default' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/5'
                }`}
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