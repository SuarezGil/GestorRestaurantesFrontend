import React from 'react'

export const AdminFormModal = ({ isOpen, onClose, form, setForm, onSubmit, saving, showPassword, setShowPassword, freeRestaurants = [] }) => {
  if (!isOpen) return null

  const inputCls = 'mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50'
  const labelCls = 'flex flex-col text-sm font-semibold text-slate-700'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 pt-4 pb-3 rounded-t-2xl">
          <h2 className="font-display text-lg font-semibold text-slate-900">Crear administrador de restaurante</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4 px-6 py-5">
          <label className={labelCls}>
            Nombre completo *
            <input name="name" value={form.name || ''} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} className={inputCls} required />
          </label>

          <label className={labelCls}>
            Correo electrónico *
            <input name="email" type="email" value={form.email || ''} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} className={inputCls} required />
          </label>

          <label className={labelCls}>
            Contraseña *
            <div className="relative">
              <input name="password" type={showPassword ? 'text' : 'password'} value={form.password || ''} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))} className={inputCls + ' pr-10'} required />
              <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          <label className={labelCls}>
            Teléfono *
            <input name="phone" value={form.phone || ''} onChange={e => setForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0,8) }))} className={inputCls} required />
          </label>

          <label className={labelCls}>
            Restaurante a asignar (opcional)
            <select name="restaurantId" value={form.restaurantId || ''} onChange={e => setForm(prev => ({ ...prev, restaurantId: e.target.value }))} className={inputCls}>
              <option value="">— Sin asignar —</option>
              {freeRestaurants.map(r => (
                <option key={r._id} value={r._id}>{r.restaurantName}</option>
              ))}
            </select>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">{saving ? 'Creando...' : 'Crear administrador'}</button>
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminFormModal
