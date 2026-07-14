import { getUserId, getUserLabel } from '../../utils/reservationHelpers'

export const AdminReservationModal = ({
  isOpen,
  onClose,
  form,
  setForm,
  handleSubmit,
  saving,
  editingReservation,
  users,
  restaurants,
  tables,
  toggleTableSelection,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-all">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold text-slate-900">
            {editingReservation ? 'Editar reserva' : 'Crear reserva'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Usuario
              <select
                value={form.userId}
                onChange={(e) => setForm((prev) => ({ ...prev, userId: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
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
                value={form.restaurantId}
                onChange={(e) => setForm((prev) => ({ ...prev, restaurantId: e.target.value, tableId: [] }))}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
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
              Número de personas
              <input
                type="number"
                min="1"
                value={form.numberPeople}
                onChange={(e) => setForm((prev) => ({ ...prev, numberPeople: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Tipo de reserva
              <select
                value={form.typeReservation}
                onChange={(e) => setForm((prev) => ({ ...prev, typeReservation: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
              >
                <option value="PERSONAL">Personal</option>
                <option value="EVENTO">Evento</option>
              </select>
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700">Mesas disponibles</p>
              {form.tableId.length > 0 && (() => {
                const selectedCap = form.tableId.reduce((sum, id) => {
                  const t = tables.find(x => x._id === id)
                  return sum + Number(t?.tableCapacity || 0)
                }, 0)
                const needed = Number(form.numberPeople || 1)
                const covered = selectedCap >= needed
                return (
                  <span className={`text-xs font-bold ${covered ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {selectedCap}/{needed} personas {covered ? '' : `— faltan ${needed - selectedCap}`}
                  </span>
                )
              })()}
            </div>
            {form.tableId.length > 0 && (() => {
              const selectedCap = form.tableId.reduce((sum, id) => {
                const t = tables.find(x => x._id === id)
                return sum + Number(t?.tableCapacity || 0)
              }, 0)
              const needed = Number(form.numberPeople || 1)
              return (
                <div className="mb-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${selectedCap >= needed ? 'bg-emerald-500' : 'bg-sky-400'}`}
                    style={{ width: `${Math.min(100, (selectedCap / needed) * 100)}%` }}
                  />
                </div>
              )
            })()}
            <div className="grid gap-2 sm:grid-cols-3">
              {tables.length === 0 && (
                <p className="col-span-3 text-xs text-slate-500 italic">Selecciona un restaurante para ver las mesas.</p>
              )}
              {tables.map((table) => {
                const tableId = table._id
                const checked = form.tableId.includes(tableId)
                const cap = Number(table.tableCapacity || 0)
                const needsCombining = cap < Number(form.numberPeople || 1)

                return (
                  <label
                    key={tableId}
                    className={`rounded-xl border px-3 py-2 text-sm transition-colors cursor-pointer ${checked ? 'border-sky-400 bg-sky-50' : 'border-slate-200 hover:border-sky-200'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTableSelection(tableId)}
                      className="mr-2"
                    />
                    <span className="inline-flex items-center gap-1.5">
                      <span className="font-medium">{table.tableNumber || table.tableName || `Mesa ${tableId.slice(-4)}`}</span>
                      <span className="text-xs text-slate-500">(Cap. {cap})</span>
                      {needsCombining && <span className="text-xs text-amber-500">(combinar)</span>}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Inicio
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Fin
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
              />
            </label>
          </div>

          <label className="text-sm font-semibold text-slate-700">
            Descripción
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none resize-none"
              rows={2}
              placeholder="Ejemplo: cumpleaños, aniversario, reunión..."
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Cupón de descuento (opcional)
            <input
              value={form.coupon}
              onChange={(e) => setForm((prev) => ({ ...prev, coupon: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
              placeholder="Ej: FIESTA20"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Foto (opcional)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm((prev) => ({ ...prev, photo: e.target.files?.[0] || null }))}
              className="mt-1.5 w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </label>

          <div className="mt-4 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-sky-500 disabled:opacity-50">
              {saving ? 'Guardando...' : editingReservation ? 'Actualizar reserva' : 'Crear reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
