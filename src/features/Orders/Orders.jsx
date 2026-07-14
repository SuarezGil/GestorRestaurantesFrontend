import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getRestaurants } from '../../shared/api/restaurants'
import { getTables } from '../../shared/api/tables'
import { getMenus } from '../../shared/api/menus'
import { getAllUsers } from '../../shared/api/users'
import { createOrder, getOrders, getOrdersByRestaurant, updateOrderStatus } from '../../shared/api/orders'
import { showError, showSuccess } from '../../shared/utils/toast'
import { getErrorMessage, isClientRole, orderTypeLabel, statusLabel } from './utils/orderHelpers'
import { OrderStats } from './components/OrderStats'
import { OrderList } from './components/OrderList'
import { OrderDetail } from './components/OrderDetail'
import { CreateOrderModal } from './components/CreateOrderModal'
import { FilterBar } from '../../shared/components/ui/FilterBar'

const emptyItem = { menuId: '', quantity: 1 }

export const Orders = () => {
  const [restaurants, setRestaurants] = useState([])
  const [users, setUsers] = useState([])
  const [menus, setMenus] = useState([])
  const [tables, setTables] = useState([])
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [restaurantFilter, setRestaurantFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  const [searchParams, setSearchParams] = useSearchParams()

  const [form, setForm] = useState({
    userId: '',
    restaurantId: '',
    tableId: '',
    orderType: 'EN_RESTAURANTE',
    deliveryAddress: '',
    coupon: '',
    items: [emptyItem],
  })

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const searchLower = searchTerm.toLowerCase()
      const orderIdFull = (order._id || '').toLowerCase()
      const orderIdRendered = `orden #${(order._id || '').slice(-6)}`.toLowerCase()
      const customerName = (order.userId?.Name || order.userId?.name || '').toLowerCase()
      const typeRendered = (orderTypeLabel(order.orderType) || order.orderType || '').toLowerCase()
      const statusRendered = (statusLabel(order.status) || order.status || '').toLowerCase()

      const matchesSearch =
        !searchTerm ||
        orderIdFull.includes(searchLower.replace('#', '')) ||
        orderIdRendered.includes(searchLower) ||
        customerName.includes(searchLower) ||
        typeRendered.includes(searchLower) ||
        statusRendered.includes(searchLower)

      let matchesDate = true
      if (startDate || endDate) {
        const itemDate = new Date(order.createdAt || order.updatedAt)
        if (!Number.isNaN(itemDate.getTime())) {
          if (startDate) {
            matchesDate = matchesDate && itemDate >= new Date(startDate + 'T00:00:00')
          }
          if (endDate) {
            matchesDate = matchesDate && itemDate <= new Date(endDate + 'T23:59:59')
          }
        }
      }

      return matchesSearch && matchesDate
    })
  }, [orders, searchTerm, startDate, endDate])

  const stats = useMemo(() => ({
    total: filteredOrders.length,
    pending: filteredOrders.filter((o) => o.status === 'EN_PREPARACION').length,
    completed: filteredOrders.filter((o) => o.status === 'ENTREGADO').length,
  }), [filteredOrders])

  const loadInitialData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [restaurantsRes, menusRes, usersRes] = await Promise.all([
        getRestaurants({ limit: 100 }),
        getMenus().catch(() => ({ data: { menus: [] } })),
        getAllUsers().catch(() => ({ data: { users: [] } })),
      ])

      const restaurantList = restaurantsRes.data?.data || []
      setRestaurants(restaurantList)
      setMenus(menusRes.data?.menus || [])
      setUsers((usersRes.data?.users || []).filter((user) => isClientRole(user)))

      if (restaurantList.length > 0) {
        const firstRestaurantId = restaurantList[0]._id
        setForm((prev) => ({ ...prev, restaurantId: firstRestaurantId }))
      }
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar la información inicial.'))
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async (restaurantId) => {
    try {
      const { data } = restaurantId
        ? await getOrdersByRestaurant(restaurantId)
        : await getOrders()
      setOrders(data?.orders || [])
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudieron cargar las órdenes.'))
    }
  }

  const loadTables = async (restaurantId) => {
    if (!restaurantId) {
      setTables([])
      return
    }

    try {
      const { data } = await getTables({ restaurantId, limit: 100 })
      setTables(data?.data || [])
    } catch (_err) {
      setTables([])
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadOrders(restaurantFilter)
  }, [restaurantFilter])

  useEffect(() => {
    loadTables(form.restaurantId)
  }, [form.restaurantId])

  useEffect(() => {
    const couponParam = searchParams.get('coupon')
    if (!couponParam) return

    setForm((prev) => ({ ...prev, coupon: couponParam }))
    setIsModalOpen(true)

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('coupon')
    setSearchParams(nextParams, { replace: true })
  }, [searchParams, setSearchParams])

  const handleItemChange = (index, key, value) => {
    setForm((prev) => {
      const items = [...prev.items]
      items[index] = { ...items[index], [key]: value }
      return { ...prev, items }
    })
  }

  const addItem = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem] }))
  }

  const removeItem = (index) => {
    setForm((prev) => {
      const items = prev.items.filter((_, i) => i !== index)
      return { ...prev, items: items.length ? items : [emptyItem] }
    })
  }

  const resetForm = () => {
    setForm((prev) => ({
      userId: '',
      restaurantId: prev.restaurantId,
      tableId: '',
      orderType: 'EN_RESTAURANTE',
      deliveryAddress: '',
      coupon: '',
      items: [emptyItem],
    }))
  }

  const handleCreate = async (event) => {
    event.preventDefault()

    const cleanItems = form.items
      .filter((item) => item.menuId)
      .map((item) => ({
        menuId: item.menuId,
        quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
      }))

    if (!form.restaurantId || cleanItems.length === 0) {
      showError('Selecciona restaurante y agrega al menos un menú.')
      return
    }

    if (!form.userId) {
      showError('Selecciona un usuario para la orden.')
      return
    }

    if (form.orderType === 'EN_RESTAURANTE' && !form.tableId) {
      showError('Para órdenes en restaurante debes seleccionar una mesa.')
      return
    }

    if (form.orderType === 'A_DOMICILIO' && !form.deliveryAddress.trim()) {
      showError('Para órdenes a domicilio debes ingresar dirección de entrega.')
      return
    }

    const payload = {
      userId: form.userId,
      restaurantId: form.restaurantId,
      orderType: form.orderType,
      items: cleanItems,
    }

    const trimmedCoupon = form.coupon?.trim()
    if (trimmedCoupon) {
      payload.coupon = trimmedCoupon
    }

    if (form.orderType === 'EN_RESTAURANTE') {
      payload.tableId = form.tableId
    }

    if (form.orderType === 'A_DOMICILIO') {
      payload.deliveryAddress = form.deliveryAddress.trim()
    }

    setSaving(true)
    try {
      const response = await createOrder(payload)
      showSuccess('Orden creada correctamente.')
      resetForm()
      await loadOrders(form.restaurantId)
      setSelectedOrder(response.data?.order || null)
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo crear la orden.'))
    } finally {
      setSaving(false)
    }
  }

  const handleStatusUpdate = async (order, status) => {
    try {
      await updateOrderStatus(order._id, status)
      showSuccess('Estado de orden actualizado.')
      await loadOrders(restaurantFilter)
      if (selectedOrder?._id === order._id) {
        setSelectedOrder((prev) => ({ ...prev, status }))
      }
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo actualizar el estado.'))
    }
  }

  return (
    <section className="space-y-6 font-sans text-slate-300 antialiased max-w-[1600px] mx-auto p-4 md:p-6">
      
      {/* Header Estilo Premium Oscuro */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Panel de Control</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Gestión de Órdenes
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitorea comandas en tiempo real, despacha flujos y gestiona peticiones del salón.
          </p>
        </div>

        <div>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-500 active:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Orden
          </button>
        </div>
      </header>

      {/* Grid de Contenido Principal */}
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        
        {/* Bloque Izquierdo: Monitor de Órdenes y Filtro Global */}
        <div className="space-y-6">
          
          {/* Card de Filtros Operativos */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-xl space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Listado de órdenes</h2>
                <p className="text-xs text-slate-400">Filtra la carga transaccional por sucursal activa.</p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 inline-flex items-center gap-3">
                  Restaurante
                  <select
                    className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={restaurantFilter}
                    onChange={(e) => setRestaurantFilter(e.target.value)}
                  >
                    <option value="" className="bg-slate-950">Todos los restaurantes</option>
                    {restaurants.map((restaurant) => (
                      <option key={restaurant._id} value={restaurant._id} className="bg-slate-950">
                        {restaurant.restaurantName}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {/* Inyección de Estadísticas con Estética Corregida Internamente */}
            <div className="pt-1">
              <OrderStats total={stats.total} pending={stats.pending} completed={stats.completed} />
            </div>

            {/* Filtros de Fecha e IDs */}
            <div className="pt-2 border-t border-slate-800/60">
              <FilterBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                searchPlaceholder="Buscar por ID, cliente, tipo o estado..."
              />
            </div>
          </div>

          {/* Componente Lista de Comandas */}
          <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
            <OrderList 
              orders={filteredOrders}
              loading={loading}
              error={error}
              selectedOrder={selectedOrder}
              setSelectedOrder={setSelectedOrder}
              handleStatusUpdate={handleStatusUpdate}
            />
          </div>
        </div>

        {/* Bloque Derecho: Panel de Detalle de Comanda Seleccionada */}
        <aside className="h-fit sticky top-6">
          <OrderDetail selectedOrder={selectedOrder} handleStatusUpdate={handleStatusUpdate} />
        </aside>

      </div>

      {/* Modal Transaccional para Apertura de Órdenes */}
      <CreateOrderModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        form={form}
        setForm={setForm}
        handleCreate={handleCreate}
        saving={saving}
        users={users}
        restaurants={restaurants}
        tables={tables}
        menus={form.restaurantId
          ? menus.filter(m => (m.restaurantId?._id || m.restaurantId)?.toString() === form.restaurantId)
          : []
        }
        handleItemChange={handleItemChange}
        addItem={addItem}
        removeItem={removeItem}
      />
    </section>
  )
}