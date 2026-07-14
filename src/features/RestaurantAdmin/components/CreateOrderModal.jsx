export const CreateOrderModal = ({
  isOpen,
  onClose,
  createForm,
  setCreateForm,
  availableMenus,
  availableClients,
  availableTables = [],
  onAddItem,
  onRemoveItem,
  onQuantityChange,
  onSubmit,
  isSubmitting
}) => {
  if (!isOpen) return null

  const handleClose = () => {
    onClose()
    setCreateForm({
      clienteId: '',
      tableId: '',
      orderType: 'EN_RESTAURANTE',
      deliveryAddress: '',
      items: []
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-all">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
          <h2 className="font-display text-2xl font-semibold text-slate-900">Crear Nueva Orden</h2>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>
        
        <div className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Selección de Cliente */}
            <div>
              <label className="text-sm font-semibold text-slate-700">Cliente</label>
              <select
                value={createForm.clienteId}
                onChange={(e) => setCreateForm(prev => ({ ...prev, clienteId: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
              >
                <option value="">Selecciona un cliente...</option>
                {availableClients.map(client => (
                  <option key={client._id} value={client._id}>
                    {client.name} ({client.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de orden */}
            <div>
              <label className="text-sm font-semibold text-slate-700">Tipo de orden</label>
              <select
                value={createForm.orderType}
                onChange={(e) => setCreateForm(prev => ({ ...prev, orderType: e.target.value, tableId: '', deliveryAddress: '' }))}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
              >
                <option value="EN_RESTAURANTE">En Restaurante</option>
                <option value="PARA_LLEVAR">Para Llevar</option>
                <option value="A_DOMICILIO">A Domicilio</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-1">
            {createForm.orderType === 'EN_RESTAURANTE' && (
              <div>
                <label className="text-sm font-semibold text-slate-700">Mesa</label>
                <select
                  value={createForm.tableId}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, tableId: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
                >
                  <option value="">Selecciona una mesa...</option>
                  {availableTables.map(table => (
                    <option key={table._id} value={table._id}>
                      {table.tableName} (Capacidad: {table.tableCapacity})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {createForm.orderType === 'A_DOMICILIO' && (
              <div>
                <label className="text-sm font-semibold text-slate-700">Dirección de Entrega</label>
                <input
                  type="text"
                  value={createForm.deliveryAddress}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
                  placeholder="Zona, calle, número de casa..."
                />
              </div>
            )}
          </div>

          {/* Artículos de la Orden */}
          <div className="space-y-3 mt-2 border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold text-slate-700">Artículos de la Orden</p>
            
            {createForm.items.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-sm font-medium text-slate-400">
                No hay artículos. Agrega uno abajo.
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {createForm.items.map((item) => (
                  <div key={item.menuId} className="grid grid-cols-[1fr_auto] items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="min-w-0">
                      <span className="block text-sm font-bold text-slate-800 truncate">{item.menuName}</span>
                      <span className="block text-xs text-slate-500 font-medium">Q{Number(item.price).toFixed(2)} c/u</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => onQuantityChange(item.menuId, -1)}
                          className="h-7 w-7 rounded-md hover:bg-slate-50 text-slate-600 font-bold flex items-center justify-center text-sm transition"
                        >
                          -
                        </button>
                        <span className="text-sm font-bold text-slate-700 w-8 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onQuantityChange(item.menuId, 1)}
                          className="h-7 w-7 rounded-md hover:bg-slate-50 text-slate-600 font-bold flex items-center justify-center text-sm transition"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.menuId)}
                        className="h-9 w-9 rounded-xl border border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Agregar nuevo artículo */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Agregar nuevo plato</label>
            <div className="flex gap-2">
              <select
                id="create-add-item-select"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
                defaultValue=""
              >
                <option value="" disabled>Selecciona un plato...</option>
                {availableMenus
                  .filter(menu => !createForm.items.some(item => item.menuId === menu._id))
                  .map(menu => (
                    <option key={menu._id} value={menu._id}>
                      {menu.menuName} (Q{Number(menu.menuPrice).toFixed(2)})
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const select = document.getElementById('create-add-item-select')
                  if (select && select.value) {
                    onAddItem(select.value)
                    select.value = ""
                  }
                }}
                className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition active:scale-95"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Footer del Modal */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total estimado</span>
              <span className="text-2xl font-black text-emerald-600">
                Q{createForm.items.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}
              </span>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={handleClose}
                className="flex-1 sm:flex-none rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                disabled={isSubmitting || createForm.items.length === 0 || !createForm.clienteId || (createForm.orderType === 'A_DOMICILIO' && !createForm.deliveryAddress) || (createForm.orderType === 'EN_RESTAURANTE' && !createForm.tableId)}
                onClick={onSubmit}
                className="flex-1 sm:flex-none rounded-xl bg-emerald-600 px-8 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-emerald-300 transition active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Creando...' : 'Crear Orden'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
