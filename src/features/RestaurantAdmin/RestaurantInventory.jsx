import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/store/authStore'
import { getMenus } from '../../shared/api/menus'
import { getInventories, createInventory, updateInventory } from '../../shared/api/inventory'
import { showError, showSuccess } from '../../shared/utils/toast'

const getErrMsg = (err, fallback) =>
  err?.response?.data?.errors?.[0]?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback

export const RestaurantInventory = () => {
  const user = useAuthStore((state) => state.user)
  const [menus, setMenus] = useState([])
  const [inventories, setInventories] = useState([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [updatingItem, setUpdatingItem] = useState(null) // { menuId, inventoryId, currentQty, menuName }
  const [newQty, setNewQty] = useState('')
  const [saving, setSaving] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  const loadInventoryAndMenus = async () => {
    if (!user?.restaurantId) return
    try {
      setLoading(true)
      const [menusRes, invRes] = await Promise.all([
        getMenus({ restaurantId: user.restaurantId }),
        getInventories({ restaurantId: user.restaurantId }),
      ])
      setMenus(menusRes?.data?.menus || [])
      setInventories(invRes?.data?.inventories || [])
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo cargar el inventario del restaurante.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.restaurantId) {
      loadInventoryAndMenus()
    } else {
      setLoading(false)
    }
  }, [user?.restaurantId])

  const openUpdateModal = (menu) => {
    const invEntry = inventories.find((i) => (i.menuId?._id || i.menuId) === menu._id)
    setUpdatingItem({
      menuId: menu._id,
      menuName: menu.menuName,
      inventoryId: invEntry?._id || null,
      currentQty: invEntry?.quantity || 0,
    })
    setNewQty(invEntry ? String(invEntry.quantity) : '0')
    setShowModal(true)
  }

  const handleUpdateStock = async (e) => {
    e.preventDefault()
    if (newQty === '' || isNaN(newQty) || Number(newQty) < 0) {
      return showError('Ingresa una cantidad válida igual o mayor a 0.')
    }

    setSaving(true)
    try {
      if (updatingItem.inventoryId) {
        // Actualizar existente
        await updateInventory(updatingItem.inventoryId, {
          quantity: Number(newQty),
        })
      } else {
        // Crear nueva entrada
        await createInventory({
          menuId: updatingItem.menuId,
          restaurantId: user.restaurantId,
          quantity: Number(newQty),
        })
      }
      showSuccess(`Stock para "${updatingItem.menuName}" actualizado exitosamente.`)
      setShowModal(false)
      loadInventoryAndMenus()
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo actualizar el stock del ingrediente.'))
    } finally {
      setSaving(false)
    }
  }

  // Combinar menus con inventarios
  const mergedItems = menus.map((menu) => {
    const inv = inventories.find((i) => (i.menuId?._id || i.menuId) === menu._id)
    return {
      ...menu,
      stockId: inv?._id || null,
      quantity: inv?.quantity || 0,
    }
  })

  const totalPlates = mergedItems.length
  const lowStockCount = mergedItems.filter(item => item.quantity > 0 && item.quantity <= 5).length
  const outOfStockCount = mergedItems.filter(item => item.quantity === 0).length
  const activeCategories = new Set(mergedItems.map(item => item.menuCategory).filter(Boolean)).size

  // Filter items
  const filteredItems = mergedItems.filter((item) => {
    const matchesSearch = item.menuName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'ALL' || item.menuCategory === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Format date helper
  const formatLastUpdated = (dateStr) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleString('es-GT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return '—'
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner Superior Premium */}
      <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-r from-emerald-50 via-emerald-50/60 to-emerald-100/30 p-6 sm:p-8 flex flex-col xl:flex-row justify-between gap-6 overflow-hidden relative shadow-sm">
        <div className="space-y-3 z-10 max-w-[450px]">
          <span className="inline-flex rounded-full bg-emerald-100 border border-emerald-200/50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
            Inventario
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Gestión de Inventario
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Monitorea y ajusta la disponibilidad de stock para cada plato del menú.
          </p>
        </div>

        {/* Stats Cards Row inside banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 z-10 xl:self-center w-full xl:w-auto">
          {/* Card 1: Platos */}
          <div className="bg-white/85 border border-white rounded-2xl p-3.5 flex items-center gap-3 shadow-sm min-w-[120px]">
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-black text-slate-800 block leading-none">{totalPlates}</span>
              <span className="text-[10px] font-extrabold text-slate-700 block mt-0.5">Platos</span>
              <span className="text-[8px] font-extrabold text-slate-400 block uppercase leading-none">en inventario</span>
            </div>
          </div>

          {/* Card 2: Stock bajo */}
          <div className="bg-white/85 border border-white rounded-2xl p-3.5 flex items-center gap-3 shadow-sm min-w-[120px]">
            <div className="rounded-xl bg-amber-50 p-2 text-amber-500 shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-black text-slate-800 block leading-none">{lowStockCount}</span>
              <span className="text-[10px] font-extrabold text-slate-700 block mt-0.5">Stock bajo</span>
              <span className="text-[8px] font-extrabold text-slate-400 block uppercase leading-none">requiere atención</span>
            </div>
          </div>

          {/* Card 3: Agotados */}
          <div className="bg-white/85 border border-white rounded-2xl p-3.5 flex items-center gap-3 shadow-sm min-w-[120px]">
            <div className="rounded-xl bg-rose-50 p-2 text-rose-500 shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-black text-slate-800 block leading-none">{outOfStockCount}</span>
              <span className="text-[10px] font-extrabold text-slate-700 block mt-0.5">Agotados</span>
              <span className="text-[8px] font-extrabold text-slate-400 block uppercase leading-none">sin stock</span>
            </div>
          </div>

          {/* Card 4: Categorías */}
          <div className="bg-white/85 border border-white rounded-2xl p-3.5 flex items-center gap-3 shadow-sm min-w-[120px]">
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-black text-slate-800 block leading-none">{activeCategories}</span>
              <span className="text-[10px] font-extrabold text-slate-700 block mt-0.5">Categorías</span>
              <span className="text-[8px] font-extrabold text-slate-400 block uppercase leading-none">activas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Platos en inventario Sub-Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/40 pb-2">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-100/50 p-2.5 text-emerald-600 border border-emerald-200/30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-800 leading-tight">Platos en inventario</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Visualiza el stock disponible y ajusta la cantidad de raciones.</p>
          </div>
        </div>

        {/* Search & Category Filter Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-[220px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar plato..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none transition shadow-sm"
            />
          </div>

          {/* Categories Selector */}
          <div className="relative w-full sm:w-[200px]">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-xs font-bold text-slate-600 hover:border-slate-300 focus:outline-none shadow-sm transition"
            >
              <option value="ALL">Todas las categorías</option>
              <option value="PLATO_FUERTE">Platos Fuertes</option>
              <option value="POSTRE">Postres</option>
              <option value="BEBIDA">Bebidas</option>
            </select>
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Inventory List */}
      {loading ? (
        <div className="text-center text-slate-500 py-12">Cargando inventario de platos...</div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-slate-500 mb-4 font-medium">No se encontraron platos en el menú con este filtro.</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
          {filteredItems.map((item) => {
            const isLow = item.quantity > 0 && item.quantity <= 5
            const isHigh = item.quantity > 5

            // Status Badge
            let statusBadge = null
            if (isHigh) {
              statusBadge = (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Alto stock
                </span>
              )
            } else if (isLow) {
              statusBadge = (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Stock bajo
                </span>
              )
            } else {
              statusBadge = (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  Agotado
                </span>
              )
            }

            // Category text
            const categoryLabels = {
              PLATO_FUERTE: 'PLATO FUERTE',
              POSTRE: 'POSTRE',
              BEBIDA: 'BEBIDA'
            }
            const catLabel = categoryLabels[item.menuCategory] || item.menuCategory?.replace('_', ' ') || 'MENÚ'
            const catColors = {
              PLATO_FUERTE: 'bg-emerald-50 text-emerald-700 border border-emerald-200/30',
              POSTRE: 'bg-pink-50 text-pink-700 border border-pink-200/30',
              BEBIDA: 'bg-indigo-50 text-indigo-700 border border-indigo-200/30'
            }
            const catStyle = catColors[item.menuCategory] || 'bg-slate-50 text-slate-700 border border-slate-200/30'

            return (
              <div key={item._id} className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-5">
                  {/* Left Side: Dish Image */}
                  <div className="shrink-0 flex items-center justify-center">
                    {item.menuPhoto ? (
                      <img
                        src={item.menuPhoto}
                        alt={item.menuName}
                        className="aspect-square h-[140px] w-[140px] sm:h-[150px] sm:w-[150px] object-cover rounded-2xl shadow-sm border border-slate-100"
                      />
                    ) : (
                      <div className="aspect-square h-[140px] w-[140px] sm:h-[150px] sm:w-[150px] rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 flex flex-col items-center justify-center text-slate-400 gap-1.5 shadow-inner">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Sin foto</span>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Details & Stock */}
                  <div className="flex-1 flex flex-col sm:flex-row justify-between gap-4">
                    {/* Info */}
                    <div className="flex flex-col justify-start gap-2">
                      <div>
                        {/* Top Badges / Row */}
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${catStyle}`}>
                            {catLabel}
                          </span>

                          {/* Small Logo / Stamp Placeholder */}
                          <div className="h-6 w-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400">
                              <circle cx="12" cy="12" r="10" />
                            </svg>
                          </div>
                        </div>

                        {/* Title & Code */}
                        <h3 className="font-extrabold text-slate-800 text-lg tracking-tight mt-2 leading-tight">
                          {item.menuName}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-extrabold mt-0.5">
                          CÓDIGO: Q{item._id?.slice(-4).toUpperCase() || 'N/A'}
                        </p>
                      </div>

                      {/* Status Badge Row */}
                      <div className="mt-3">
                        {statusBadge}
                      </div>
                    </div>

                    {/* Stock available on the right */}
                    <div className="flex flex-col justify-start items-end sm:text-right shrink-0 mt-2 sm:mt-0">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                        Stock disponible
                      </span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-black text-slate-800 leading-none">
                          {item.quantity}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          raciones
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Divider & Buttons */}
                <div className="mt-2 pt-3.5 border-t border-slate-100/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>Última actualización:</span>
                    <span className="font-bold text-slate-600">
                      {formatLastUpdated(item.updatedAt)}
                    </span>
                  </div>

                  <button
                    onClick={() => openUpdateModal(item)}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold transition shadow-sm hover:shadow active:scale-[0.98] flex items-center justify-center gap-1.5 shrink-0 self-end sm:self-center border border-emerald-600 hover:border-emerald-500"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Ajustar stock</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bottom call to action bann
er */}


      {/* Modal */}
      {showModal && updatingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-900">Ajustar Inventario</h3>
            <p className="mt-1 text-sm text-slate-500">{updatingItem.menuName}</p>

            <form onSubmit={handleUpdateStock} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Cantidad en Raciones</label>
                <input
                  type="number"
                  min="0"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  placeholder="Ej: 15"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  required
                />
                <p className="mt-1.5 text-xs text-slate-400">Indica el número total de porciones o platos listos para servir.</p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
