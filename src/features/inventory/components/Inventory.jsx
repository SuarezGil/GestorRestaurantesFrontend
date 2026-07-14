import { useEffect, useMemo, useState } from 'react'
import { getInventories } from '../../../shared/api/inventory'
import { getMenus } from '../../../shared/api/menus'
import { getRestaurants } from '../../../shared/api/restaurants'
import { ModaInventory } from './ModaInventory'
import { FilterBar } from '../../../shared/components/ui/FilterBar'

// Función de color de stock optimizada para entornos oscuros
const getStockColor = (qty) => {
  if (qty <= 10) return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
  if (qty <= 25) return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
}

export const Inventory = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  
  const [searchTerm, setSearchTerm] = useState('')

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const searchLower = searchTerm.toLowerCase()
      const name = item.menuName || ''
      const restaurant = item.restaurantName || ''

      return !searchTerm ||
        name.toLowerCase().includes(searchLower) ||
        restaurant.toLowerCase().includes(searchLower)
    })
  }, [items, searchTerm])

  const stats = useMemo(() => {
    const total = filteredItems.length
    const lowStock = filteredItems.filter((i) => i.quantity <= 10).length
    const adequate = filteredItems.filter((i) => i.quantity > 10 && i.quantity <= 25).length
    const high = filteredItems.filter((i) => i.quantity > 25).length
    return { total, lowStock, adequate, high }
  }, [filteredItems])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [invRes, menusRes, restRes] = await Promise.all([getInventories(), getMenus(), getRestaurants()])
      const invList = invRes.data?.inventories ?? invRes.inventories ?? []
      const menusList = menusRes.data?.menus ?? menusRes.menus ?? []
      const restaurantsList = restRes.data?.data ?? restRes.data ?? []

      // build lookup maps
      const menusMap = new Map(
        menusList.map((m) => [
          m._id ?? m.id,
          {
            name: m.menuName ?? m.name,
            photo: m.menuPhoto ?? null,
            description: m.menuDescription ?? '',
            category: m.menuCategory ?? '',
            price: m.menuPrice ?? null,
          },
        ])
      )
      const restMap = new Map(restaurantsList.map((r) => [(r._id ?? r.id), r.restaurantName ?? r.name ?? r.restaurantName]))

      // attach readable names to inventory items
      const mapped = invList.map((inv) => {
        const mid = inv.menuId?._id ?? inv.menuId
        const rid = inv.restaurantId?._id ?? inv.restaurantId
        const menuInfo = menusMap.get(mid)
        return {
          ...inv,
          menuName: menuInfo?.name ?? inv.menuId?.menuName ?? '—',
          menuPhoto: menuInfo?.photo ?? inv.menuId?.menuPhoto ?? null,
          menuDescription: menuInfo?.description ?? inv.menuId?.menuDescription ?? '',
          menuCategory: menuInfo?.category ?? inv.menuId?.menuCategory ?? '',
          menuPrice: menuInfo?.price ?? inv.menuId?.menuPrice ?? null,
          restaurantName: restMap.get(rid) ?? inv.restaurantId?.restaurantName ?? '—',
        }
      })

      setItems(mapped)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Error al cargar inventario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-6 font-sans text-slate-300 antialiased max-w-[1600px] mx-auto p-4 md:p-6">
      
      {/* Header Estilo Premium */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Control de Existencias</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Gestión de Inventario
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Supervisa los niveles de insumos y disponibilidad de porciones por sucursal en tiempo real.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-200 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-700 hover:text-white"
          >
            Recargar datos
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-center text-sm text-rose-400 font-medium">
          {error}
        </div>
      )}

      {/* Contenedor Principal */}
      <div className="grid gap-6">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-5 shadow-xl space-y-5">
          
          {/* Fila de Título y Filtros Rápidos / Badges */}
          <div className="flex flex-col gap-4 border-b border-slate-800/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Listado general de insumos</h2>
              <p className="text-xs text-slate-400">Explora el stock consolidado según el flujo operativo.</p>
            </div>
            
            <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
              <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-300">
                Total: {stats.total}
              </div>
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-rose-400">
                Crítico / Bajo: {stats.lowStock}
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-400">
                Suficiente: {stats.high}
              </div>
            </div>
          </div>

          {/* Buscador Integrado */}
          <div className="pt-1">
            <FilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Buscar por menú o restaurante..."
              hideDateFilters={true}
            />
          </div>

          {/* Listado de Artículos */}
          <div className="space-y-4 pt-2">
            {loading && (
              <div className="p-12 text-center text-sm text-slate-400 animate-pulse font-medium">
                Sincronizando el almacén general con cocina...
              </div>
            )}

            {!loading && filteredItems.length === 0 && (
              <div className="p-12 text-center text-sm text-slate-500 rounded-xl border border-dashed border-slate-800">
                No se registran productos en inventario bajo esta búsqueda.
              </div>
            )}

            {!loading && filteredItems.length > 0 && (
              <div className="grid gap-4 md:grid-cols-1 xl:grid-cols-2">
                {filteredItems.map((item) => (
                  <article
                    key={item._id}
                    onClick={() => setSelectedItem(item)}
                    className="cursor-pointer rounded-xl border border-slate-800/70 bg-slate-950/30 p-4 shadow-sm transition-all hover:border-slate-700 hover:bg-slate-800/20 flex flex-col sm:flex-row gap-4 items-start group"
                  >
                    {/* Thumbnail / Imagen del menú */}
                    <div className="h-16 w-16 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center text-sm font-black text-slate-500 shrink-0 shadow-inner">
                      {item.menuPhoto ? (
                        <img
                          src={item.menuPhoto}
                          alt={item.menuName || 'Imagen'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (item.menuName || 'P').charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Información Descriptiva */}
                    <div className="flex-1 min-w-0 space-y-3 w-full">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                            {item.menuName}
                          </h3>
                          <p className="text-xs font-semibold text-indigo-400 tracking-wide mt-0.5 truncate">
                            {item.restaurantName}
                          </p>
                        </div>

                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold shrink-0 ${getStockColor(item.quantity)}`}>
                          Stock: {item.quantity}
                        </span>
                      </div>

                      {/* Parámetros Operativos Secundarios */}
                      <div className="grid gap-3 grid-cols-2 pt-2.5 border-t border-slate-800/40 text-xs">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Último Balance</p>
                          <p className="font-medium text-slate-300 pt-0.5">{new Date().toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Código SKA / ID</p>
                          <p className="font-medium text-slate-500 font-mono pt-0.5 truncate" title={item._id}>
                            {item._id}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Modal CRUD Flotante del Subcomponente */}
      <ModaInventory item={selectedItem} onClose={() => setSelectedItem(null)} />
    </section>
  )
}