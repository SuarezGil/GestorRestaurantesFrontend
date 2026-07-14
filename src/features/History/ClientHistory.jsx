import { useEffect, useState, useMemo } from 'react'
import { getMyReservations } from '../../shared/api/reservations'
import { getMyOrders } from '../../shared/api/orders'
import { formatDate, statusLabel, STATUS_COLORS, STATUS_LABEL } from '../Reservations/utils/reservationHelpers'
import { showError } from '../../shared/utils/toast'
import { FilterBar } from '../../shared/components/ui/FilterBar'

export const ClientHistory = () => {
  const [reservations, setReservations] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ALL') // ALL, RESERVATIONS, ORDERS
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [resResp, ordResp] = await Promise.all([
          getMyReservations().catch(() => ({ data: { reservations: [] } })),
          getMyOrders().catch(() => ({ data: { orders: [] } }))
        ])
        setReservations(resResp.data?.reservations || [])
        setOrders(ordResp.data?.orders || [])
      } catch (error) {
        showError('No se pudo cargar el historial.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleRebook = (restaurantId) => {
    navigate('/client/reservations', { state: { prefillRestaurantId: restaurantId } })
  }

  const handleReorder = (order) => {
    const reorderItems = (order.items || []).reduce((acc, item) => {
      const id = item.menuId?._id || item.menuId
      if (!id) return acc
      acc[id] = {
        _id: id,
        menuName: item.menuId?.menuName || item.menuName || 'Plato',
        menuPrice: item.price || item.menuId?.menuPrice || 0,
        qty: item.quantity || 1,
      }
      return acc
    }, {})
    navigate('/client/orders', { state: { reorderCart: reorderItems, reorderRestaurantId: order.restaurantId?._id || order.restaurantId } })
  }

  const filteredReservations = activeTab === 'ORDERS' ? [] : reservations
  const filteredOrders = activeTab === 'RESERVATIONS' ? [] : orders

  const combinedHistory = useMemo(() => [
    ...filteredReservations.map(r => ({ ...r, _type: 'RESERVATION', _date: new Date(r.startDate) })),
    ...filteredOrders.map(o => ({ ...o, _type: 'ORDER', _date: new Date(o.date || o.createdAt || new Date()) }))
  ].sort((a, b) => b._date - a._date), [filteredReservations, filteredOrders])

  const finalHistory = useMemo(() => {
    return combinedHistory.filter(item => {
      const searchLower = searchTerm.toLowerCase()
      const restaurantName = item.restaurantId?.restaurantName || 'Restaurante'
      const statusLabelText = item._type === 'RESERVATION' ? STATUS_LABEL[item.status] || item.status : item.status || 'Completado'
      const typeLabel = item._type === 'RESERVATION' ? 'reserva' : 'pedido'

      const matchesSearch = !searchTerm ||
        restaurantName.toLowerCase().includes(searchLower) ||
        statusLabelText.toLowerCase().includes(searchLower) ||
        typeLabel.toLowerCase().includes(searchLower)
        
      let matchesDate = true
      if (startDate || endDate) {
        if (!Number.isNaN(item._date.getTime())) {
          if (startDate) {
            matchesDate = matchesDate && item._date >= new Date(startDate + 'T00:00:00')
          }
          if (endDate) {
            matchesDate = matchesDate && item._date <= new Date(endDate + 'T23:59:59')
          }
        }
      }
      return matchesSearch && matchesDate
    })
  }, [combinedHistory, searchTerm, startDate, endDate])

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === 'ALL' ? 'text-sky-600 border-b-2 border-sky-600 bg-sky-50/50' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Todo
        </button>
        <button
          onClick={() => setActiveTab('RESERVATIONS')}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === 'RESERVATIONS' ? 'text-sky-600 border-b-2 border-sky-600 bg-sky-50/50' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Reservaciones
        </button>
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === 'ORDERS' ? 'text-sky-600 border-b-2 border-sky-600 bg-sky-50/50' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Pedidos
        </button>
      </div>

        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          searchPlaceholder="Buscar por restaurante, tipo o estado..."
        />

      <div className="space-y-4">

        {loading && (
          <div className="py-12 text-center text-slate-500">
            <span className="text-3xl animate-pulse inline-block mb-3">⏳</span>
            <p>Cargando historial...</p>
          </div>
        )}

        {!loading && finalHistory.length === 0 && (
          <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <span className="text-4xl inline-block mb-3">📭</span>
            <p>No tienes reservaciones ni pedidos que coincidan en tu historial.</p>
          </div>
        )}

        {!loading && finalHistory.map((item) => {
          if (item._type === 'RESERVATION') {
            return (
              <article key={`res-${item._id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-xl">
                      🗓️
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Reserva</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[item.status] || 'bg-slate-100 text-slate-600'}`}>
                          {STATUS_LABEL[item.status] || item.status}
                        </span>
                      </div>
                      <h3 className="mt-1 font-semibold text-slate-900">{item.restaurantId?.restaurantName || 'Restaurante'}</h3>
                      <p className="text-sm text-slate-500">{formatDate(item.startDate)}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.numberPeople} {item.numberPeople === 1 ? 'persona' : 'personas'} · Mesa(s): {(item.tableId || []).map(t => t.tableNumber || t.tableName || t._id?.slice(-4) || t).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center sm:justify-end">
                    <button
                      onClick={() => handleRebook(item.restaurantId?._id || item.restaurantId)}
                      className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      Volver a reservar
                    </button>
                  </div>
                </div>
              </article>
            )
          }

          if (item._type === 'ORDER') {
            // Mock format depending on backend. We assume it has total, items, status, date
            const statusLabelOrder = item.status || 'Completado'
            return (
              <article key={`ord-${item._id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-xl">
                      🍔
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Pedido</span>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600">
                          {statusLabelOrder}
                        </span>
                      </div>
                      <h3 className="mt-1 font-semibold text-slate-900">{item.restaurantId?.restaurantName || 'Restaurante'}</h3>
                      <p className="text-sm text-slate-500">{formatDate(item.date || item.createdAt)}</p>
                      <p className="mt-1 text-xs text-slate-600 font-medium">
                        Total: Q{Number(item.total || 0).toFixed(2)}
                      </p>
                      {item.orderType && (
                        <p className="text-xs text-slate-400 mt-0.5">Tipo: {item.orderType}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center sm:justify-end">
                    <button
                      onClick={() => handleReorder(item)}
                      className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      Repetir pedido
                    </button>
                  </div>
                </div>
              </article>
            )
          }
          return null
        })}
      </div>
    </div>
  )
}
