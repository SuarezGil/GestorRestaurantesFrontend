import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getRestaurants } from '../../shared/api/restaurants'
import { getMenus } from '../../shared/api/menus'
import { getTables } from '../../shared/api/tables'
import { getInventories } from '../../shared/api/inventory'
import { createMyOrder, getMyOrders } from '../../shared/api/orders'
import { showError, showSuccess } from '../../shared/utils/toast'

// ─── helpers ─────────────────────────────────────────────────────────────────
const CATEGORY_LABEL = {
  ENTRADA: 'Entradas',
  PLATO_FUERTE: 'Platos fuertes',
  POSTRE: 'Postres',
  BEBIDA: 'Bebidas',
}

const CATEGORY_ICON = {
  ENTRADA: '',
  PLATO_FUERTE: '',
  POSTRE: '',
  BEBIDA: '',
}

const ORDER_TYPE_LABEL = {
  EN_RESTAURANTE: 'En restaurante',
  PARA_LLEVAR: 'Para llevar',
  A_DOMICILIO: 'A domicilio',
}

const ORDER_TYPE_ICON = {
  EN_RESTAURANTE: '',
  PARA_LLEVAR: '',
  A_DOMICILIO: '',
}

const STATUS_LABEL = {
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
}

const STATUS_COLOR = {
  EN_PREPARACION: 'bg-amber-100 text-amber-700 border-amber-200',
  LISTO: 'bg-sky-100 text-sky-700 border-sky-200',
  ENTREGADO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELADO: 'bg-rose-100 text-rose-600 border-rose-200',
}

const SHIPPING_FEE = 20

const getErrMsg = (err, fallback) =>
  err?.response?.data?.errors?.[0]?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback

const resolveStock = (menu) => {
  const candidates = [menu?.stock, menu?.stockQuantity, menu?.quantity, menu?.inventoryQuantity]
  const found = candidates.find((value) => Number.isFinite(Number(value)))
  if (found === undefined) return null
  return Math.max(0, Number(found))
}

// ─── sub-components ───────────────────────────────────────────────────────────
const MenuCard = ({ menu, qty, onAdd, onRemove }) => (
  <article className="group flex flex-col overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/70 shadow-sm transition-all duration-300 hover:border-orange-400/20 hover:bg-slate-900 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/5">
    {menu.menuPhoto ? (
      <div className="h-36 w-full overflow-hidden bg-slate-900">
        <img src={menu.menuPhoto} alt={menu.menuName} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      </div>
    ) : (
      <div className="h-36 w-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-4xl">
        {CATEGORY_ICON[menu.menuCategory] || ''}
      </div>
    )}
    <div className="flex flex-1 flex-col p-4">
      <p className="text-sm font-bold text-white leading-snug">{menu.menuName}</p>
      {menu.menuDescription && (
        <p className="mt-1 text-xs text-slate-400 leading-relaxed line-clamp-2">{menu.menuDescription}</p>
      )}
      <p className="mt-1 text-xs font-semibold text-slate-500">
        Stock: {resolveStock(menu) ?? '—'}
      </p>
      <div className="mt-auto pt-3 flex items-center justify-between gap-2">
        <span className="text-base font-bold text-orange-400">Q{Number(menu.menuPrice || 0).toFixed(2)}</span>
        {qty === 0 ? (
          <button
            type="button"
            onClick={() => onAdd(menu)}
            className="rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-orange-400 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
            disabled={resolveStock(menu) === 0}
            title={resolveStock(menu) === 0 ? 'Sin stock disponible' : 'Agregar'}
          >
            {resolveStock(menu) === 0 ? 'Sin stock' : '+ Agregar'}
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onRemove(menu._id)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-bold"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-bold text-white">{qty}</span>
            <button
              type="button"
              onClick={() => onAdd(menu)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 text-slate-950 hover:bg-orange-400 transition-colors font-bold"
              disabled={resolveStock(menu) !== null && qty >= resolveStock(menu)}
              title={resolveStock(menu) !== null && qty >= resolveStock(menu) ? 'Stock máximo alcanzado' : 'Agregar más'}
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  </article>
)

const CartItem = ({ item, onAdd, onRemove }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2.5">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-white truncate">{item.menuName}</p>
      <p className="text-xs text-slate-400">Q{Number(item.menuPrice).toFixed(2)} c/u</p>
    </div>
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        onClick={() => onRemove(item._id)}
        className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm font-bold"
      >
        −
      </button>
      <span className="w-5 text-center text-sm font-bold text-white">{item.qty}</span>
      <button
        type="button"
        onClick={() => onAdd(item)}
        className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500 text-slate-950 hover:bg-orange-400 transition-colors text-sm font-bold"
      >
        +
      </button>
    </div>
    <span className="text-sm font-bold text-white w-16 text-right">
      Q{(Number(item.menuPrice) * item.qty).toFixed(2)}
    </span>
  </div>
)

// ─── main component ───────────────────────────────────────────────────────────
export const ClientOrderView = () => {
  const location = useLocation()
  const [restaurants, setRestaurants] = useState([])
  const [menus, setMenus] = useState([])
  const [inventories, setInventories] = useState([])
  const [tables, setTables] = useState([])
  const [myOrders, setMyOrders] = useState([])
  const [loadingMenus, setLoadingMenus] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  // Siempre mostrar el formulario de nuevo pedido por defecto
  const [activeTab, setActiveTab] = useState('NEW') // 'NEW' | 'HISTORY'
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [restaurantId, setRestaurantId] = useState('')
  const [orderType, setOrderType] = useState('EN_RESTAURANTE')
  const [tableId, setTableId] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [cart, setCart] = useState({}) // { menuId: { qty, menuName, menuPrice, _id } }

  // ── consume reorder state from history ────────────────────────────────────
  useEffect(() => {
    const { reorderCart, reorderRestaurantId } = location.state || {}
    if (reorderCart && Object.keys(reorderCart).length > 0) {
      setCart(reorderCart)
      setActiveTab('NEW')
      if (reorderRestaurantId) setRestaurantId(reorderRestaurantId)
      window.history.replaceState({}, '') // clear state to avoid re-applying on refresh
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── load restaurants ──────────────────────────────────────────────────────
  useEffect(() => {
    getRestaurants({ restaurantActive: true, limit: 100 })
      .then(({ data }) => {
        const list = data?.data || []
        setRestaurants(list)
        if (list.length > 0) setRestaurantId(list[0]._id)
        setTimeout(() => setMounted(true), 60)
      })
      .catch(() => {})
  }, [])

  // ── load menus when restaurant changes ────────────────────────────────────
  useEffect(() => {
    if (!restaurantId) { setMenus([]); return }
    setLoadingMenus(true)
    setCart({})
    setActiveCategory('ALL')
    Promise.all([
      getMenus({ restaurantId, menuActive: true }).catch(() => ({ data: { menus: [] } })),
      getInventories({ restaurantId }).catch(() => ({ data: { inventories: [] } })),
    ])
      .then(([menusResp, inventoriesResp]) => {
        // Filtrar solo menús que pertenezcan al restaurante seleccionado
        const menusData = (menusResp?.data?.menus || []).filter((menu) => {
          const menuRestaurantId = menu?.restaurantId?._id || menu?.restaurantId
          return String(menuRestaurantId || '') === String(restaurantId)
        })
        const inventoriesData = inventoriesResp?.data?.inventories || []
        setInventories(inventoriesData)

        const stockByMenuId = inventoriesData.reduce((acc, item) => {
          const menuId = item?.menuId?._id || item?.menuId
          if (!menuId) return acc
          acc[String(menuId)] = Number(item?.quantity || 0)
          return acc
        }, {})

        const menusWithStock = menusData.map((menu) => ({
          ...menu,
          stock: stockByMenuId[String(menu._id)] ?? resolveStock(menu),
        }))

        setMenus(menusWithStock)
      })
      .catch(() => setMenus([]))
      .finally(() => setLoadingMenus(false))
  }, [restaurantId])

  // ── load tables when restaurant or orderType changes ──────────────────────
  useEffect(() => {
    if (!restaurantId || orderType !== 'EN_RESTAURANTE') { setTables([]); setTableId(''); return }
    getTables({ restaurantId, tableActive: true, limit: 100 })
      .then(({ data }) => setTables(data?.data || []))
      .catch(() => setTables([]))
    setTableId('')
  }, [restaurantId, orderType])

  // ── load my orders ────────────────────────────────────────────────────────
  const loadMyOrders = useCallback(async () => {
    setLoadingOrders(true)
    try {
      const { data } = await getMyOrders()
      setMyOrders(data?.orders || [])
    } catch (_err) {}
    finally { setLoadingOrders(false) }
  }, [])

  useEffect(() => {
    loadMyOrders()
    const interval = setInterval(loadMyOrders, 5000)
    return () => clearInterval(interval)
  }, [loadMyOrders])

  // ── derived ───────────────────────────────────────────────────────────────
  const categories = useMemo(() => {
    const cats = [...new Set(menus.map(m => m.menuCategory))]
    return cats
  }, [menus])

  const filteredMenus = useMemo(() =>
    activeCategory === 'ALL' ? menus : menus.filter(m => m.menuCategory === activeCategory),
    [menus, activeCategory]
  )

  const cartItems = useMemo(() =>
    Object.values(cart).filter(item => item.qty > 0),
    [cart]
  )

  const subtotal = useMemo(() =>
    cartItems.reduce((sum, item) => sum + item.menuPrice * item.qty, 0),
    [cartItems]
  )

  const totalItems = useMemo(() =>
    cartItems.reduce((sum, item) => sum + item.qty, 0),
    [cartItems]
  )

  const shippingFee = orderType === 'A_DOMICILIO' ? SHIPPING_FEE : 0
  const total = subtotal + shippingFee

  // ── cart handlers ─────────────────────────────────────────────────────────
  const addToCart = (menu) => {
    const stock = resolveStock(menu)
    const currentQty = cart[menu._id]?.qty || 0
    if (stock !== null && currentQty >= stock) return

    setCart(prev => ({
      ...prev,
      [menu._id]: {
        _id: menu._id,
        menuName: menu.menuName,
        menuPrice: menu.menuPrice,
        stock,
        qty: (prev[menu._id]?.qty || 0) + 1,
      }
    }))
  }

  const removeFromCart = (menuId) => {
    setCart(prev => {
      const current = prev[menuId]
      if (!current) return prev
      if (current.qty <= 1) {
        const next = { ...prev }
        delete next[menuId]
        return next
      }
      return { ...prev, [menuId]: { ...current, qty: current.qty - 1 } }
    })
  }

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (cartItems.length === 0) return showError('Agrega al menos un producto al pedido.')
    if (!restaurantId) return showError('Selecciona un restaurante.')
    if (orderType === 'EN_RESTAURANTE' && !tableId) return showError('Selecciona una mesa.')
    if (orderType === 'A_DOMICILIO' && !deliveryAddress.trim()) return showError('Ingresa la dirección de entrega.')

    const payload = {
      restaurantId,
      orderType,
      items: cartItems.map(item => ({ menuId: item._id, quantity: item.qty })),
      ...(orderType === 'EN_RESTAURANTE' && { tableId }),
      ...(orderType === 'A_DOMICILIO' && { deliveryAddress: deliveryAddress.trim() }),
    }

    setSaving(true)
    try {
      await createMyOrder(payload)
      showSuccess('¡Pedido realizado con éxito!')
      setCart({})
      setTableId('')
      setDeliveryAddress('')
      setActiveTab('HISTORY')
      await loadMyOrders()
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo realizar el pedido.'))
    } finally {
      setSaving(false)
    }
  }

  const selectedRestaurant = restaurants.find(r => r._id === restaurantId)

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <section className="font-serif relative overflow-hidden">
      <div className="relative mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">

        {/* HEADER */}
        <header className={`rounded-[32px] border border-slate-800/80 bg-slate-900/70 p-8 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.8)] backdrop-blur-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className={`inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.26em] text-orange-300 transition-all duration-500 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                Pedidos
              </p>
              <h1 className={`font-serif mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                Haz tu <span className="text-orange-400">pedido</span>
              </h1>
              <p className={`font-serif mt-4 max-w-2xl text-base leading-8 text-slate-300 transition-all duration-800 delay-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                Elige tu restaurante, explora el menú, arma tu pedido y confirma en segundos.
              </p>
            </div>
          </div>
          {/* Tabs */}
          <div className={`mt-6 flex border-b border-slate-800 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            {[['NEW', 'Nuevo pedido'], ['HISTORY', 'Mis pedidos']].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`px-5 py-2.5 text-sm font-semibold transition-all duration-200 border-b-2 ${
                  activeTab === key
                    ? 'border-orange-500 text-orange-400 scale-105'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:scale-105'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        {/* ── NEW ORDER TAB ── */}
        {activeTab === 'NEW' && (
          <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr_360px]">

            {/* LEFT: restaurant + menu */}
            <div className="space-y-5">

              {/* Restaurant & order type selectors */}
              <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.9)]">
                <h2 className="text-base font-bold text-white mb-4">1. Configura tu pedido</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col text-sm font-semibold text-slate-300">
                    Restaurante
                    <select
                      value={restaurantId}
                      onChange={e => setRestaurantId(e.target.value)}
                      className="mt-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                    >
                      <option value="">— Elige un restaurante —</option>
                      {restaurants.map(r => (
                        <option key={r._id} value={r._id}>{r.restaurantName}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col text-sm font-semibold text-slate-300">
                    Tipo de entrega
                    <select
                      value={orderType}
                      onChange={e => setOrderType(e.target.value)}
                      className="mt-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                    >
                      {Object.entries(ORDER_TYPE_LABEL).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </label>

                  {orderType === 'EN_RESTAURANTE' && (
                    <label className="flex flex-col text-sm font-semibold text-slate-300">
                      Mesa
                      <select
                        value={tableId}
                        onChange={e => setTableId(e.target.value)}
                        className="mt-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                      >
                        <option value="">— Selecciona una mesa —</option>
                        {tables.map(t => (
                          <option key={t._id} value={t._id}>
                            {t.tableName || `Mesa ${t.tableNumber}`} (cap. {t.tableCapacity})
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {orderType === 'A_DOMICILIO' && (
                    <label className="flex flex-col text-sm font-semibold text-slate-300 sm:col-span-2">
                      Dirección de entrega
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={e => setDeliveryAddress(e.target.value)}
                        placeholder="Zona, avenida, referencia..."
                        className="mt-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Menu */}
              <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.9)]">
                <h2 className="text-base font-bold text-white mb-4">2. Elige tus productos</h2>

                {!restaurantId && (
                  <p className="py-8 text-center text-sm text-slate-500">Selecciona un restaurante para ver el menú.</p>
                )}

                {restaurantId && loadingMenus && (
                  <p className="py-8 text-center text-sm text-slate-500">Cargando menú…</p>
                )}

                {restaurantId && !loadingMenus && menus.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500">Este restaurante no tiene menús disponibles.</p>
                )}

                {restaurantId && !loadingMenus && menus.length > 0 && (
                  <>
                    {/* Category filter */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      <button
                        type="button"
                        onClick={() => setActiveCategory('ALL')}
                        className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                          activeCategory === 'ALL'
                            ? 'border-orange-500 bg-orange-500 text-slate-950'
                            : 'border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-600 hover:bg-slate-900'
                        }`}
                      >
                        Todos
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setActiveCategory(cat)}
                          className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                            activeCategory === cat
                              ? 'border-orange-500 bg-orange-500 text-slate-950'
                              : 'border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-600 hover:bg-slate-900'
                          }`}
                        >
                          {CATEGORY_LABEL[cat] || cat}
                        </button>
                      ))}
                    </div>

                    {/* Menu grid */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredMenus.map(menu => (
                        <MenuCard
                          key={menu._id}
                          menu={menu}
                          qty={cart[menu._id]?.qty || 0}
                          onAdd={addToCart}
                          onRemove={removeFromCart}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT: Cart */}
            <aside className="space-y-5">
              <div className="sticky top-6 rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.9)] space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">3. Tu pedido</h2>
                  {totalItems > 0 && (
                    <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-bold text-slate-950">{totalItems}</span>
                  )}
                </div>

                {cartItems.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-500">Aún no has agregado productos.</p>
                )}

                {cartItems.length > 0 && (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {cartItems.map(item => (
                      <CartItem
                        key={item._id}
                        item={item}
                        onAdd={addToCart}
                        onRemove={removeFromCart}
                      />
                    ))}
                  </div>
                )}

                {/* Summary */}
                {cartItems.length > 0 && (
                  <div className="space-y-2 border-t border-slate-800 pt-4">
                    <div className="flex justify-between text-sm text-slate-400">
                      <span>Subtotal</span>
                      <span>Q{subtotal.toFixed(2)}</span>
                    </div>
                    {orderType === 'A_DOMICILIO' && (
                      <div className="flex justify-between text-sm text-slate-400">
                        <span>Envío</span>
                        <span>Q{shippingFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold text-white border-t border-slate-800 pt-2 mt-1">
                      <span>Total</span>
                      <span className="text-orange-400">Q{total.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Order type badge */}
                {restaurantId && (
                  <div className="rounded-xl bg-orange-500/15 border border-orange-500/30 px-4 py-3 text-sm text-orange-300">
                    <span className="font-semibold">{ORDER_TYPE_LABEL[orderType]}</span>
                    {selectedRestaurant && (
                      <p className="mt-0.5 text-xs text-slate-400">{selectedRestaurant.restaurantName}</p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving || cartItems.length === 0}
                  className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-orange-500/20 hover:bg-orange-400 disabled:opacity-50 transition-all"
                >
                  {saving ? 'Confirmando...' : `Confirmar pedido${totalItems > 0 ? ` (${totalItems})` : ''}`}
                </button>
              </div>
            </aside>
          </form>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'HISTORY' && (
          <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.9)]">
            <h2 className="text-base font-bold text-white mb-5">Mis pedidos</h2>

            {loadingOrders && (
              <p className="py-8 text-center text-sm text-slate-500">Cargando pedidos…</p>
            )}

            {!loadingOrders && myOrders.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-400">Aún no tienes pedidos. ¡Haz tu primero!</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('NEW')}
                  className="mt-4 rounded-xl bg-orange-500 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-orange-400 transition-colors shadow-sm"
                >
                  Hacer pedido
                </button>
              </div>
            )}

            {!loadingOrders && myOrders.length > 0 && (
              <div className="space-y-3">
                {myOrders.map(order => (
                  <article key={order._id} className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 hover:border-orange-400/30 transition-colors">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-white">
                          Pedido #{order._id?.slice(-6).toUpperCase()}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {ORDER_TYPE_LABEL[order.orderType] || order.orderType}
                          {order.restaurantId?.restaurantName && ` · ${order.restaurantId.restaurantName}`}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                        </p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${order.status === 'EN_PREPARACION' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : order.status === 'LISTO' ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' : order.status === 'ENTREGADO' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : order.status === 'CANCELADO' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                        {STATUS_LABEL[order.status] || order.status}
                      </span>
                    </div>

                    {/* Items */}
                    {order.items?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {order.items.map((item, i) => (
                          <span key={i} className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-slate-300">
                            {item.quantity}× {item.menuId?.menuName || 'Producto'}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      {order.deliveryAddress && (
                        <p className="text-xs text-slate-400">{order.deliveryAddress}</p>
                      )}
                      {order.tableId && (
                        <p className="text-xs text-slate-400">Mesa {order.tableId?.tableNumber || order.tableId?.tableName || ''}</p>
                      )}
                      <span className="ml-auto text-sm font-bold text-orange-400">
                        Q{Number(order.total || 0).toFixed(2)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  )
}
