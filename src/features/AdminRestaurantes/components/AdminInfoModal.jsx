import React from 'react'

export const AdminInfoModal = ({ isOpen, onClose, admin, assignedRestaurant }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-2xl font-bold text-slate-700">{admin?.name?.[0]?.toUpperCase() || 'A'}</div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-900">{admin?.name}</h3>
            <p className="text-sm text-slate-500">{admin?.role || 'ADMIN_RESTAURANT'}</p>
            <div className="mt-2 flex items-center gap-3">
              <p className="text-sm text-slate-600">{admin?.email}</p>
              {admin?.phone && <p className="text-sm text-slate-600"> Tel: {admin.phone}</p>}
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-50">×</button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-100 p-4">
            <p className="text-xs text-slate-400">Estado</p>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 mt-1 text-xs font-semibold ${admin?.isActive !== false ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
              {admin?.isActive !== false ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="rounded-lg border border-slate-100 p-4">
            <p className="text-xs text-slate-400">Restaurante asignado</p>
            <p className="mt-1 font-medium text-slate-800">{assignedRestaurant ? assignedRestaurant.restaurantName : '— Sin asignar —'}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          {assignedRestaurant && (
            <button onClick={() => { /* navegar a restaurante si hay ruta */ }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Ir al restaurante</button>
          )}
          <button onClick={onClose} className="rounded-2xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Cerrar</button>
        </div>
      </div>
    </div>
  )
}

export default AdminInfoModal
