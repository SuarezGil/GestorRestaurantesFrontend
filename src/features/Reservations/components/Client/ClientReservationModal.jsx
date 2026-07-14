import { AvailabilityBadge } from './AvailabilityBadge'

export const ClientReservationModal = ({
  isOpen,
  onClose,
  step,
  setStep,
  form,
  setForm,
  goNext,
  handleSubmit,
  saving,
  checking,
  conflict,
  filteredTables,
  selectedRestaurant,
  loadingTables,
  restaurants,
  tables,
  editingId,
  toggleTable
}) => {
  if (!isOpen) return null

  const inputCls = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100'
  const labelCls = 'flex flex-col text-sm font-semibold text-slate-700'
  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-all">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
          <h2 className="font-display text-2xl font-semibold text-slate-900">
            {editingId ? 'Editar reserva' : 'Nueva reserva'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Steps indicator */}
        <div className="mb-6 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center">
            {[['1', 'Detalles'], ['2', 'Mesa'], ['3', 'Confirmar']].map(([icon, label], i) => (
              <div key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-lg transition-all
                    ${step > i + 1 ? 'border-sky-600 bg-sky-600 text-white' : step === i + 1 ? 'border-sky-500 bg-white text-xl shadow-md shadow-sky-100' : 'border-slate-200 bg-white text-slate-300'}`}>
                    {step > i + 1 ? '✓' : icon}
                  </div>
                  <span className={`text-xs font-semibold ${step === i + 1 ? 'text-sky-600' : step > i + 1 ? 'text-sky-400' : 'text-slate-400'}`}>{label}</span>
                </div>
                {i < 2 && <div className={`mx-2 h-0.5 flex-1 rounded-full transition-all duration-500 ${step > i + 1 ? 'bg-sky-500' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">Paso {step} de 3</p>
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-slate-900">Selecciona restaurante y horario</h2>

            <label className={labelCls}>
              Restaurante
              <select id="rv-restaurant" className={inputCls} value={form.restaurantId} onChange={(e) => set('restaurantId', e.target.value)}>
                <option value="">— Elige un restaurante —</option>
                {restaurants.map((r) => <option key={r._id} value={r._id}>{r.restaurantName}</option>)}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelCls}>
                Fecha y hora de inicio
                <input id="rv-start" type="datetime-local" className={inputCls} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
              </label>
              <label className={labelCls}>
                Fecha y hora de fin
                <input id="rv-end" type="datetime-local" className={inputCls} value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelCls}>
                Número de personas
                <input id="rv-people" type="number" min="1" max="50" className={inputCls} value={form.numberPeople} onChange={(e) => set('numberPeople', e.target.value)} />
              </label>
              <label className={labelCls}>
                Tipo de reserva
                <select id="rv-type" className={inputCls} value={form.typeReservation} onChange={(e) => set('typeReservation', e.target.value)}>
                  <option value="PERSONAL">Personal</option>
                  <option value="EVENTO">Evento</option>
                </select>
              </label>
            </div>

            <label className={labelCls}>
              Descripción{' '}
              {form.typeReservation === 'EVENTO' && (
                <span className="ml-1 text-xs font-normal text-rose-500">*requerida para eventos</span>
              )}
              <textarea
                id="rv-desc"
                className={`${inputCls} resize-none`}
                rows={3}
                placeholder="Ej: Cumpleaños, reunión de negocios, aniversario…"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </label>

            <label className={labelCls}>
              Cupón de descuento (opcional)
              <input
                id="rv-coupon"
                className={inputCls}
                placeholder="Ej: FIESTA20"
                value={form.coupon}
                onChange={(e) => set('coupon', e.target.value)}
              />
            </label>

            <label className={labelCls}>
              Foto (opcional)
              <input id="rv-photo" type="file" accept="image/*" className="mt-1.5 w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500" onChange={(e) => set('photo', e.target.files?.[0] || null)} />
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
              <button type="button" onClick={goNext} className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-500">
                Siguiente → Seleccionar mesa
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold text-slate-900">Elige tu mesa</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Selecciona mesas para cubrir <strong>{form.numberPeople} personas</strong> en{' '}
                  <strong>{selectedRestaurant?.restaurantName || 'el restaurante'}</strong>
                </p>
              </div>
              <AvailabilityBadge checking={checking} conflict={conflict} />
            </div>

            {loadingTables && (
              <div className="flex flex-col items-center gap-3 py-10 text-slate-400">
                <p className="text-sm">Cargando mesas disponibles…</p>
              </div>
            )}
            {!loadingTables && !form.restaurantId && (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-slate-400">
                <p className="text-sm font-medium">Vuelve al paso anterior</p>
                <p className="text-xs">Debes seleccionar un restaurante primero</p>
              </div>
            )}
            {!loadingTables && form.restaurantId && filteredTables.length === 0 && (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-amber-200 bg-amber-50 py-10">
                <p className="text-sm font-semibold text-amber-700">Sin mesas registradas</p>
                <p className="text-xs text-amber-600">Este restaurante aún no tiene mesas. Elige otro restaurante.</p>
              </div>
            )}

            {!loadingTables && filteredTables.length > 0 && form.tableId.length > 0 && (() => {
              const selectedCap = form.tableId.reduce((sum, id) => {
                const t = tables.find(x => x._id === id)
                return sum + Number(t?.tableCapacity || 0)
              }, 0)
              const needed = Number(form.numberPeople || 1)
              const covered = selectedCap >= needed
              return (
                <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-semibold text-sky-800">Capacidad cubierta</span>
                    <span className={`font-bold ${covered ? 'text-emerald-700' : 'text-sky-700'}`}>
                      {selectedCap} / {needed} personas
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-sky-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${covered ? 'bg-emerald-500' : 'bg-sky-500'}`}
                      style={{ width: `${Math.min(100, (selectedCap / needed) * 100)}%` }}
                    />
                  </div>
                  {!covered && (
                    <p className="mt-1.5 text-xs text-sky-600">Faltan {needed - selectedCap} personas por cubrir. Agrega más mesas.</p>
                  )}
                </div>
              )
            })()}

            {!loadingTables && filteredTables.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTables.map((t) => {
                  const selected = form.tableId.includes(t._id)
                  const cap = Number(t.tableCapacity || 0)
                  const peopleIcons = '👤'.repeat(Math.min(cap, 6)) + (cap > 6 ? `+${cap - 6}` : '')
                  const needsCombining = cap < Number(form.numberPeople || 1)
                  return (
                    <button
                      key={t._id}
                      type="button"
                      id={`rv-table-${t._id}`}
                      onClick={() => toggleTable(t._id)}
                      className={`flex flex-col gap-2 rounded-2xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md
                        ${selected ? 'border-sky-500 bg-sky-50 shadow-sm shadow-sky-100' : 'border-slate-200 bg-white hover:border-sky-300'}`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-900">{t.tableName || `Mesa ${t._id.slice(-4)}`}</p>
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                          ${selected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {selected ? 'OK' : ''}
                        </span>
                      </div>
                      <p className="text-base leading-tight">{peopleIcons}</p>
                      <p className="text-xs font-medium text-slate-500">Capacidad: {cap} {cap === 1 ? 'persona' : 'personas'}</p>
                      {needsCombining && !selected && (
                        <p className="text-xs text-amber-600 font-medium">Combinar con otras mesas</p>
                      )}
                      {selected && <p className="text-xs font-semibold text-sky-600">Seleccionada</p>}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="flex justify-between gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                ← Atrás
              </button>
              <button type="button" onClick={goNext} className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-500">
                Siguiente → Confirmar
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold text-slate-900">¡Casi listo!</h2>
                <p className="text-sm text-slate-500">Revisa los detalles y confirma tu reservación</p>
              </div>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm">
              {[
                ['Restaurante', selectedRestaurant?.restaurantName || '—'],
                ['Entrada', new Date(form.startDate).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })],
                ['Salida', new Date(form.endDate).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })],
                ['Personas', `${form.numberPeople} ${Number(form.numberPeople) === 1 ? 'persona' : 'personas'}`],
                ['Tipo', form.typeReservation === 'PERSONAL' ? 'Personal' : 'Evento especial'],
                ['Mesas', form.tableId.map((id) => { const t = tables.find((x) => x._id === id); return t ? t.tableName || `Mesa ${id.slice(-4)}` : id }).join(', ')],
                ...(form.description ? [['Nota', form.description]] : []),
                ...(form.coupon ? [['Cupón', form.coupon]] : []),
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0 text-sm">
                  <span className="text-slate-500 shrink-0">{label}</span>
                  <span className="text-right font-semibold text-slate-900">{value}</span>
                </div>
              ))}
            </div>

            <AvailabilityBadge checking={checking} conflict={conflict} />

            {!conflict && !checking && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                Todo listo. Al confirmar, recibirás tu reservación con estado <strong>Pendiente</strong>.
              </div>
            )}

            <div className="flex justify-between gap-3 pt-1">
              <button type="button" onClick={() => setStep(2)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                ← Modificar
              </button>
              <button
                type="button"
                disabled={saving || !!conflict || checking}
                onClick={handleSubmit}
                className="rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-200 hover:bg-sky-500 disabled:opacity-50 transition-all"
              >
                {saving ? 'Guardando…' : editingId ? 'Actualizar reserva' : '¡Confirmar reserva!'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
