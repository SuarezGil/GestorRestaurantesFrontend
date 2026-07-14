import { ORDER_TYPES, getUserId, getUserLabel, orderTypeLabel } from '../utils/orderHelpers'

export const CreateOrderModal = ({
  isOpen,
  onClose,
  form,
  setForm,
  handleCreate,
  saving,
  users,
  restaurants,
  tables,
  menus,
  handleItemChange,
  addItem,
  removeItem
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-all">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
          <h2 className="font-display text-2xl font-semibold text-slate-900">Crear nueva orden</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleCreate} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Usuario
              <select
                value={form.userId}
                onChange={(e) => setForm((prev) => ({ ...prev, userId: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Selecciona un usuario</option>
                {users.map((user) => (
                  <option key={getUserId(user)} value={getUserId(user)}>
                    {getUserLabel(user)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Restaurante
              <select
                name="restaurantId"
                value={form.restaurantId}
                onChange={(e) => setForm((prev) => ({ ...prev, restaurantId: e.target.value, tableId: '', items: [{ menuId: '', quantity: 1 }] }))}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Selecciona uno</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant._id} value={restaurant._id}>{restaurant.restaurantName}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Tipo de orden
              <select
                value={form.orderType}
                onChange={(e) => setForm((prev) => ({ ...prev, orderType: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              >
                {ORDER_TYPES.map((type) => (
                  <option key={type} value={type}>{orderTypeLabel(type)}</option>
                ))}
              </select>
            </label>

            {form.orderType === 'EN_RESTAURANTE' && (
              <label className="text-sm font-semibold text-slate-700">
                Mesa
                <select
                  value={form.tableId}
                  onChange={(e) => setForm((prev) => ({ ...prev, tableId: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Selecciona mesa</option>
                  {tables.map((table) => (
                    <option key={table._id} value={table._id}>{table.tableNumber || `Mesa ${table._id?.slice(-4)}`}</option>
                  ))}
                </select>
              </label>
            )}

            {form.orderType === 'A_DOMICILIO' && (
              <label className="text-sm font-semibold text-slate-700">
                Dirección de entrega
                <input
                  value={form.deliveryAddress}
                  onChange={(e) => setForm((prev) => ({ ...prev, deliveryAddress: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Zona, avenida, referencia..."
                />
              </label>
            )}
          </div>

          <label className="text-sm font-semibold text-slate-700">
            Cupón de descuento (opcional)
            <input
              value={form.coupon}
              onChange={(e) => setForm((prev) => ({ ...prev, coupon: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              placeholder="Ej: FUEGO10"
            />
          </label>

          <div className="space-y-3 mt-2 border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold text-slate-700">Items de la orden</p>
            {!form.restaurantId && (
              <p className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                Selecciona un restaurante para ver los menús disponibles.
              </p>
            )}
            {form.items.map((item, index) => (
              <div key={`${index}-${item.menuId}`} className="grid grid-cols-[1fr_88px_40px] items-center gap-2">
                <select
                  value={item.menuId}
                  onChange={(e) => handleItemChange(index, 'menuId', e.target.value)}
                  disabled={!form.restaurantId}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Selecciona menú</option>
                  {menus.map((menu) => (
                    <option key={menu._id} value={menu._id}>{menu.menuName}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                />
                <button 
                  type="button" 
                  onClick={() => removeItem(index)} 
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
            <button 
              type="button" 
              onClick={addItem} 
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              + Agregar item
            </button>
          </div>

          <div className="mt-4 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-500 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Crear orden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
