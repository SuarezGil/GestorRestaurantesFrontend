import { useEffect, useMemo, useState } from 'react'
import { getAllUsers } from '../../shared/api/users'
import { getReservations } from '../../shared/api/reservations'
import { getOrders } from '../../shared/api/orders'
import { FilterBar } from '../../shared/components/ui/FilterBar'

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors?.length) {
    return data.errors[0].message
  }

  return data?.message || error?.message || fallback
}

const formatNumber = (value) => {
  return new Intl.NumberFormat('es-GT').format(Number(value || 0))
}

const formatDate = (value) => {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const isClientRole = (user) => {
  const roles = user?.UserRoles || []
  return roles.some((entry) => entry?.Role?.Name === 'USER_ROLE')
}

const getUserId = (user) => String(user?.Id || user?.id || user?._id || '')

const getUserLabel = (user) => {
  const name = user?.Name || user?.name || 'Usuario sin nombre'
  const email = user?.Email || user?.email || ''
  return email ? `${name} (${email})` : name
}

const getOrderItemName = (item) => {
  return (
    item?.menuId?.menuName ||
    item?.menuName ||
    item?.name ||
    'Item sin nombre'
  )
}

const summarizeOrderItems = (orders = []) => {
  const tally = new Map()

  orders.forEach((order) => {
    ;(order.items || []).forEach((item) => {
      const name = getOrderItemName(item)
      const quantity = Number(item?.quantity || 1)
      tally.set(name, (tally.get(name) || 0) + quantity)
    })
  })

  if (tally.size === 0) {
    return 'Sin pedidos vinculados'
  }

  const entries = [...tally.entries()].sort((a, b) => b[1] - a[1])
  const [topName, topQuantity] = entries[0]
  const secondary = entries.slice(1, 3).map(([name, quantity]) => `${name} x${quantity}`).join(' · ')

  return secondary ? `${topName} x${topQuantity} | ${secondary}` : `${topName} x${topQuantity}`
}

const summarizeRestaurants = (reservations = [], orders = []) => {
  const tally = new Map()

  reservations.forEach((reservation) => {
    const restaurantName = reservation?.restaurantId?.restaurantName || 'Restaurante sin nombre'
    tally.set(restaurantName, (tally.get(restaurantName) || 0) + 1)
  })

  orders.forEach((order) => {
    const restaurantName = order?.restaurantId?.restaurantName || 'Restaurante sin nombre'
    tally.set(restaurantName, (tally.get(restaurantName) || 0) + 1)
  })

  if (tally.size === 0) {
    return 'Sin historial'
  }

  const [topName, count] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0]
  return `${topName} (${formatNumber(count)})`
}

export const ClientesFrecuentes = () => {
  const [users, setUsers] = useState([])
  const [reservations, setReservations] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [usersRes, reservationsRes, ordersRes] = await Promise.all([
        getAllUsers(),
        getReservations(),
        getOrders(),
      ])

      setUsers((usersRes.data?.users || []).filter((user) => isClientRole(user)))
      setReservations(reservationsRes.data?.reservations || [])
      setOrders(ordersRes.data?.orders || [])
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar la vista de clientes frecuentes.'))
      setUsers([])
      setReservations([])
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const clientRows = useMemo(() => {
    const reservationsByUser = new Map()
    const ordersByUser = new Map()

    reservations.forEach((reservation) => {
      const userId = reservation?.userId ? String(reservation.userId) : ''
      if (!userId) return
      const bucket = reservationsByUser.get(userId) || []
      bucket.push(reservation)
      reservationsByUser.set(userId, bucket)
    })

    orders.forEach((order) => {
      const userId = order?.userId ? String(order.userId) : ''
      if (!userId) return
      const bucket = ordersByUser.get(userId) || []
      bucket.push(order)
      ordersByUser.set(userId, bucket)
    })

    return users
      .map((user) => {
        const userId = getUserId(user)
        const userReservations = reservationsByUser.get(userId) || []
        const userOrders = ordersByUser.get(userId) || []
        const activeReservations = userReservations.filter((reservation) => reservation.status !== 'CANCELADO')
        const canceledReservations = userReservations.filter((reservation) => reservation.status === 'CANCELADO')
        const totalOrders = userOrders.filter((order) => order.status !== 'CANCELADO').length
        const totalVisits = activeReservations.length + totalOrders
        const lastReservation = [...userReservations].sort((a, b) => new Date(b.startDate || b.createdAt) - new Date(a.startDate || a.createdAt))[0]
        const lastOrder = [...userOrders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0]
        const favoriteRestaurant = summarizeRestaurants(userReservations, userOrders)
        const favoriteItems = summarizeOrderItems(userOrders)

        return {
          userId,
          name: getUserLabel(user),
          reservations: userReservations,
          orders: userOrders,
          activeReservations: activeReservations.length,
          canceledReservations: canceledReservations.length,
          totalOrders,
          totalVisits,
          favoriteRestaurant,
          favoriteItems,
          summary: `${activeReservations.length} reservas activas · ${totalOrders} pedidos · Última reserva ${formatDate(lastReservation?.startDate || lastReservation?.createdAt)} · Último pedido ${formatDate(lastOrder?.createdAt)}`,
        }
      })
      .filter((row) => row.totalVisits > 0)
      .sort((a, b) => {
        if (b.totalVisits !== a.totalVisits) return b.totalVisits - a.totalVisits
        return b.totalOrders - a.totalOrders
      })
  }, [orders, reservations, users])

  const filteredClientRows = useMemo(() => {
    if (!searchTerm) return clientRows
    const lower = searchTerm.toLowerCase()
    return clientRows.filter(
      (row) =>
        row.name.toLowerCase().includes(lower) ||
        row.userId.toLowerCase().includes(lower) ||
        (row.favoriteRestaurant && row.favoriteRestaurant.toLowerCase().includes(lower))
    )
  }, [clientRows, searchTerm])

  const kpis = useMemo(() => {
    const totalClients = filteredClientRows.length
    const totalReservations = filteredClientRows.reduce((acc, row) => acc + row.activeReservations, 0)
    const totalOrders = filteredClientRows.reduce((acc, row) => acc + row.totalOrders, 0)
    const avgVisits = totalClients > 0 ? (totalReservations + totalOrders) / totalClients : 0

    return {
      totalClients,
      totalReservations,
      totalOrders,
      avgVisits,
    }
  }, [filteredClientRows])

  return (
    <section className="space-y-6 font-sans text-slate-300 antialiased max-w-[1600px] mx-auto p-4 md:p-6">
      
      {/* Header Adaptado a la Interfaz Oscura */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Estrategia de Fidelización</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Clientes Frecuentes
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Identifica usuarios con mayor volumen transaccional, hábitos de consumo e historial recurrente.
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-center text-sm text-rose-400 font-medium">
          {error}
        </div>
      )}

      {/* Grid de KPIs / Métricas Iniciales */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Clientes activos', value: formatNumber(kpis.totalClients) },
          { label: 'Reservas activas', value: formatNumber(kpis.totalReservations) },
          { label: 'Pedidos vinculados', value: formatNumber(kpis.totalOrders) },
          { label: 'Promedio actividad', value: kpis.avgVisits.toFixed(1) },
        ].map((kpi, idx) => (
          <article key={idx} className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-4 shadow-xl">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{kpi.label}</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-white">{kpi.value}</p>
          </article>
        ))}
      </section>

      {/* Contenedor Principal (Tabla y Filtros) */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-5 shadow-xl space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Ranking de clientes</h2>
            <p className="text-xs text-slate-400">Ordenado jerárquicamente por cantidad de interacciones totales.</p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-200 shadow-sm transition-all hover:bg-slate-700 hover:text-white"
          >
            Actualizar métricas
          </button>
        </div>

        {loading && (
          <div className="p-12 text-center text-sm text-slate-400 animate-pulse font-medium">
            Sincronizando perfiles recurrentes del servidor...
          </div>
        )}
        
        {!loading && !error && clientRows.length > 0 && (
          <div className="pt-1 border-t border-slate-800/60">
            <FilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              hideDateFilters={true}
              searchPlaceholder="Buscar por nombre, ID o restaurante..."
            />
          </div>
        )}

        {!loading && !error && filteredClientRows.length === 0 && (
          <div className="p-12 text-center text-sm text-slate-500 rounded-xl border border-dashed border-slate-800">
            No se registran clientes que coincidan con los criterios de búsqueda.
          </div>
        )}

        {/* Tabla Estilizada */}
        {!loading && !error && filteredClientRows.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-slate-950/20">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3.5">Cliente / Cuenta</th>
                  <th className="px-4 py-3.5">Reservas</th>
                  <th className="px-4 py-3.5">Pedidos</th>
                  <th className="px-4 py-3.5">Restaurante Frecuente</th>
                  <th className="px-4 py-3.5">Platillos más comunes</th>
                  <th className="px-4 py-3.5">Resumen de Auditoría</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {filteredClientRows.map((row) => (
                  <tr key={row.userId} className="hover:bg-slate-800/30 transition-colors align-top">
                    <td className="px-4 py-4">
                      <p className="font-bold text-white leading-tight">{row.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-1">ID: {row.userId}</p>
                    </td>
                    
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-md bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/20">
                        {formatNumber(row.activeReservations)} Activas
                      </span>
                      <p className="mt-1.5 text-xs text-slate-500 font-normal">
                        {formatNumber(row.canceledReservations)} Canceladas
                      </p>
                    </td>
                    
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                        {formatNumber(row.totalOrders)} Pedidos
                      </span>
                    </td>
                    
                    <td className="px-4 py-4 text-slate-200 font-medium">
                      {row.favoriteRestaurant}
                    </td>
                    
                    <td className="px-4 py-4 text-xs text-slate-400 leading-relaxed font-normal max-w-[240px]">
                      {row.favoriteItems}
                    </td>
                    
                    <td className="px-4 py-4 text-xs text-slate-500 font-normal leading-relaxed max-w-[300px]">
                      {row.summary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  )
}