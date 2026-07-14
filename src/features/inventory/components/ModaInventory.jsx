export const ModaInventory = ({ item, onClose }) => {
  if (!item) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4"
      onClick={onClose}
    >
      <section
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Detalle de inventario</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">{item.menuName}</h3>
            <p className="mt-1 text-sm text-slate-500">{item.restaurantName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[180px_1fr]">
          <div className="h-44 w-full overflow-hidden rounded-2xl bg-slate-100">
            {item.menuPhoto ? (
              <img
                src={item.menuPhoto}
                alt={item.menuName || 'Imagen de menú'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-slate-500">
                {(item.menuName || 'P').charAt(0)}
              </div>
            )}
          </div>

          <div className="space-y-4 text-sm text-slate-700">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Stock actual</p>
                <p className="mt-1 font-semibold text-slate-900">{item.quantity}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Categoría</p>
                <p className="mt-1 font-semibold text-slate-900">{item.menuCategory || 'Sin categoría'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Precio</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {item.menuPrice === null || item.menuPrice === undefined
                    ? 'Sin precio'
                    : `Q${Number(item.menuPrice).toFixed(2)}`}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Actualizado</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'Sin fecha'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Descripción</p>
              <p className="mt-1 rounded-xl bg-slate-50 p-3 text-slate-700">
                {item.menuDescription || 'Este menú no tiene descripción registrada.'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">ID inventario</p>
                <p className="mt-1 break-all font-mono text-xs text-slate-700">{item._id}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">ID menú</p>
                <p className="mt-1 break-all font-mono text-xs text-slate-700">
                  {item.menuId?._id || item.menuId || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
