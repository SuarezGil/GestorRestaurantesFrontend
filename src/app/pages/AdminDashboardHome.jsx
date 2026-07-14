import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useAuthStore } from "../../features/auth/store/authStore"
import { getOrders } from "../../shared/api/orders"
import { getReservations } from "../../shared/api/reservations"
import { getTables } from "../../shared/api/tables"
import { getInventories } from "../../shared/api/inventory"
import { getMenus } from "../../shared/api/menus"
import { getInvoices, getIssuedInvoices } from "../../shared/api/invoices"
import { getRestaurants } from "../../shared/api/restaurants"
import { getReviews } from "../../shared/api/reviews"
import { getAllUsers } from "../../shared/api/users"
import { getAdminStatistics } from "../../shared/api/statistics"

const LOW_STOCK_THRESHOLD = 10

const quickActions = [
  {
    title: "Reservaciones",
    description: "Coordina el flujo del dia y confirma cupos.",
    to: "/dashboard/reservations",
    accent: "from-sky-50 to-sky-100 text-sky-900",
  },
  {
    title: "Pedidos",
    description: "Monitorea estados y tiempos de entrega.",
    to: "/dashboard/orders",
    accent: "from-amber-50 to-amber-100 text-amber-900",
  },
  {
    title: "Menu",
    description: "Actualiza platos, combos y precios clave.",
    to: "/dashboard/menus",
    accent: "from-emerald-50 to-emerald-100 text-emerald-900",
  },
  {
    title: "Mesas",
    description: "Gestiona la disponibilidad por turnos.",
    to: "/dashboard/mesas",
    accent: "from-indigo-50 to-indigo-100 text-indigo-900",
  },
  {
    title: "Facturacion",
    description: "Revisa cobros y comprobantes del dia.",
    to: "/dashboard/facturas",
    accent: "from-rose-50 to-rose-100 text-rose-900",
  },
  {
    title: "Inventario",
    description: "Controla insumos y rotacion semanal.",
    to: "/dashboard/inventory",
    accent: "from-teal-50 to-teal-100 text-teal-900",
  },
  {
    title: "Estadisticas",
    description: "Consulta ventas, visitas y tendencias.",
    to: "/dashboard/estadisticas",
    accent: "from-slate-50 to-slate-100 text-slate-900",
  },
]

const formatNumber = (value) =>
  new Intl.NumberFormat("es-GT").format(Number(value || 0))

const toArray = (value) => (Array.isArray(value) ? value : [])

const isSameDay = (first, second) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate()

const formatTime = (dateValue) => {
  const hours = String(dateValue.getHours()).padStart(2, "0")
  const minutes = String(dateValue.getMinutes()).padStart(2, "0")
  return `${hours}:${minutes}`
}

export const AdminDashboardHome = () => {
  const user = useAuthStore((state) => state.user)
  const userName = user?.name ?? "Administrador"
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dashboardData, setDashboardData] = useState({
    orders: [],
    reservations: [],
    tables: [],
    inventories: [],
    menus: [],
    invoices: [],
    issuedInvoices: [],
    restaurants: [],
    reviews: [],
    users: [],
    stats: null,
    totalIssued: 0,
  })

  useEffect(() => {
    let isMounted = true

    const loadDashboard = async () => {
      setIsLoading(true)
      setError(null)

      const results = await Promise.allSettled([
        getOrders(),
        getReservations(),
        getTables({ limit: 200, tableActive: true }),
        getInventories(),
        getMenus(),
        getInvoices(),
        getIssuedInvoices(),
        getRestaurants({ limit: 200, restaurantActive: true }),
        getReviews(),
        getAllUsers(),
        getAdminStatistics(),
      ])

      if (!isMounted) return

      const errors = []

      const pick = (result, extractor, fallback) => {
        if (result.status === "fulfilled") {
          return extractor(result.value)
        }
        errors.push(result.reason?.message ?? "Error de red")
        return fallback
      }

      const orders = pick(results[0], (res) => toArray(res.data?.orders), [])
      const reservations = pick(
        results[1],
        (res) => toArray(res.data?.reservations),
        []
      )
      const tables = pick(results[2], (res) => toArray(res.data?.data), [])
      const inventories = pick(
        results[3],
        (res) => toArray(res.data?.inventories),
        []
      )
      const menus = pick(results[4], (res) => toArray(res.data?.menus), [])
      const invoices = pick(results[5], (res) => toArray(res.data?.invoices), [])
      const issuedInvoices = pick(
        results[6],
        (res) => toArray(res.data?.invoices),
        []
      )
      const totalIssued = pick(
        results[6],
        (res) => Number(res.data?.totalIssued || 0),
        0
      )
      const restaurants = pick(results[7], (res) => toArray(res.data?.data), [])
      const reviews = pick(results[8], (res) => toArray(res.data?.reviews), [])
      const users = pick(results[9], (res) => toArray(res.data?.users), [])
      const stats = pick(results[10], (res) => res.data?.data ?? null, null)

      setDashboardData({
        orders,
        reservations,
        tables,
        inventories,
        menus,
        invoices,
        issuedInvoices,
        restaurants,
        reviews,
        users,
        stats,
        totalIssued,
      })

      if (errors.length) {
        setError(`No se pudo cargar ${errors.length} endpoint(s).`)
      }

      setIsLoading(false)
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const {
    orders,
    reservations,
    tables,
    inventories,
    menus,
    invoices,
    restaurants,
    reviews,
    users,
    stats,
    totalIssued,
  } = dashboardData

  const now = new Date()
  const activeOrders = orders.filter(
    (order) => order.status !== "ENTREGADO" && order.status !== "CANCELADO"
  )
  const pendingReservations = reservations.filter(
    (reservation) => reservation.status === "PENDIENTE"
  )
  const todayReservations = reservations.filter((reservation) => {
    const start = new Date(reservation.startDate)
    return Number.isFinite(start.getTime()) && isSameDay(start, now)
  })

  const occupiedTableIds = new Set()
  reservations.forEach((reservation) => {
    const start = new Date(reservation.startDate)
    const end = new Date(reservation.endDate)
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return
    if (reservation.status === "CANCELADO") return
    if (start <= now && end >= now) {
      toArray(reservation.tableId).forEach((table) => {
        occupiedTableIds.add(String(table?._id ?? table))
      })
    }
  })

  const menuMap = useMemo(() => {
    return new Map(
      menus.map((menu) => [String(menu?._id ?? menu?.id), menu])
    )
  }, [menus])

  const lowStockItems = inventories.filter(
    (item) => Number(item?.quantity ?? 0) <= LOW_STOCK_THRESHOLD
  )

  const inventoryAlerts = lowStockItems.slice(0, 4).map((item) => {
    const menu = menuMap.get(String(item?.menuId))
    const name = menu?.menuName ?? "Producto sin nombre"
    const remaining = `${Number(item?.quantity ?? 0)} unidades`
    const level = Number(item?.quantity ?? 0) <= 5 ? "Critico" : "Bajo"
    return { name, remaining, level }
  })

  const weeklyPerformance = useMemo(() => {
    const weekdayLabels = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
    const days = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - index))
      return date
    })

    const counts = days.map((day) => {
      return orders.filter((order) => {
        const createdAt = new Date(order.createdAt)
        return Number.isFinite(createdAt.getTime()) && isSameDay(createdAt, day)
      }).length
    })

    const maxCount = Math.max(1, ...counts)

    return days.map((day, index) => ({
      label: weekdayLabels[day.getDay()],
      value: Math.round((counts[index] / maxCount) * 100),
      total: counts[index],
    }))
  }, [orders])

  const totalRevenue = stats?.demandByRestaurants?.reduce(
    (acc, item) => acc + Number(item?.totalRevenue ?? 0),
    0
  )

  const quickStats = [
    {
      label: "Pedidos pendientes",
      value: formatNumber(activeOrders.length),
      note: `${formatNumber(activeOrders.length)} activos`,
      tone: "bg-amber-100 text-amber-800 border-amber-200",
    },
    {
      label: "Mesas ocupadas",
      value: `${formatNumber(occupiedTableIds.size)}/${formatNumber(
        tables.length
      )}`,
      note: `${formatNumber(tables.length)} mesas activas`,
      tone: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    {
      label: "Reservas de hoy",
      value: formatNumber(todayReservations.length),
      note: `${formatNumber(pendingReservations.length)} pendientes`,
      tone: "bg-sky-100 text-sky-800 border-sky-200",
    },
    {
      label: "Stock bajo",
      value: formatNumber(lowStockItems.length),
      note: `umbral ${LOW_STOCK_THRESHOLD}u`,
      tone: "bg-rose-100 text-rose-800 border-rose-200",
    },
  ]

  const activityHighlights = [
    {
      title: "Ticket promedio",
      value: `Q${formatNumber(stats?.demandByRestaurants?.length ? (totalRevenue / Math.max(orders.length, 1)).toFixed(2) : 0)}`,
      detail: "Ventas globales",
    },
    {
      title: "Pedidos activos",
      value: formatNumber(activeOrders.length),
      detail: "En cocina o listos",
    },
    {
      title: "Clientes registrados",
      value: formatNumber(users.length),
      detail: "Desde Auth",
    },
  ]

  const scheduleItems = todayReservations
    .slice(0, 4)
    .map((reservation) => {
      const start = new Date(reservation.startDate)
      const time = Number.isFinite(start.getTime()) ? formatTime(start) : "--:--"
      const restaurantName = reservation.restaurantId?.restaurantName ?? "Restaurante"
      const tableNames = toArray(reservation.tableId)
        .map((table) => table?.tableName)
        .filter(Boolean)
        .join(", ")
      const label = `Reserva ${restaurantName}`
      const status = reservation.status ?? "PENDIENTE"
      const detail = tableNames ? `Mesas ${tableNames}` : "Mesa por asignar"
      return { time, label, status, detail }
    })

  const statsHighlights = [
    { label: "Restaurantes", value: restaurants.length },
    { label: "Mesas activas", value: tables.length },
    { label: "Menus", value: menus.length },
    { label: "Pedidos", value: orders.length },
    { label: "Reservas", value: reservations.length },
    { label: "Facturas", value: invoices.length },
    { label: "Emitidas", value: totalIssued },
    { label: "Inventario", value: inventories.length },
    { label: "Resenas", value: reviews.length },
    { label: "Usuarios", value: users.length },
  ]

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-8 text-white shadow-lg animate-fadeIn">
        <div className="absolute -right-16 top-10 h-52 w-52 rounded-full bg-emerald-400/30 blur-3xl" />
        <div className="absolute bottom-0 left-12 h-40 w-40 rounded-full bg-sky-400/30 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
              Resumen ejecutivo
            </p>
            <h1 className="mt-4 text-4xl font-bold font-display">Hola, {userName}</h1>
            <p className="mt-3 max-w-xl text-sm text-slate-200">
              Visualiza la operacion del restaurante en un solo lugar. Revisa el pulso del dia,
              coordina equipos y prioriza acciones clave.
            </p>
            {error && (
              <p className="mt-4 text-xs font-semibold text-amber-200">
                {error}
              </p>
            )}
          </div>
          <div className="grid gap-3">
            {activityHighlights.map((item, index) => (
              <div
                key={`highlight-${item.title ?? ''}-${index}`}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur animate-fadeIn"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <p className="text-[0.7rem] uppercase tracking-[0.2em] text-emerald-100">
                  {item.title}
                </p>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-2xl font-semibold">{item.value}</p>
                  <span className="text-xs text-slate-200">{item.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((stat, index) => (
          <div
            key={stat.label}
            className={`rounded-2xl border px-5 py-4 shadow-sm animate-fadeIn ${stat.tone}`}
            style={{ animationDelay: `${0.1 + index * 0.06}s` }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">
              {stat.label}
            </p>
            <div className="mt-3 flex items-end justify-between">
              <span className="text-3xl font-bold font-display">{stat.value}</span>
              <span className="text-xs font-semibold">{stat.note}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Accesos rapidos
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 font-display">
                  Operacion diaria
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                7 modulos activos
              </span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {quickActions.map((action, index) => (
                <Link
                  key={action.title}
                  to={action.to}
                  className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${action.accent} p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md animate-fadeIn`}
                  style={{ animationDelay: `${0.18 + index * 0.05}s` }}
                >
                  <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/60 opacity-0 blur-2xl transition-all duration-300 group-hover:opacity-100" />
                  <div className="relative">
                    <h3 className="text-lg font-bold font-display">{action.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 group-hover:text-slate-700">
                      {action.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
                      Ir ahora
                      <span className="text-base">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Agenda del dia
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 font-display">
                  Actividad prioritaria
                </h2>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                {formatNumber(pendingReservations.length)} alertas activas
              </span>
            </div>
            <div className="mt-5 grid gap-3">
              {scheduleItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No hay reservas registradas para hoy.
                </div>
              ) : (
                scheduleItems.map((item) => (
                  <div
                    key={`${item.time}-${item.label}`}
                    className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div className="text-sm font-semibold text-slate-500">{item.time}</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.detail}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {item.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Inventario critico
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 font-display">
              Productos con riesgo
            </h2>
            <div className="mt-4 grid gap-3">
              {inventoryAlerts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No hay alertas de stock por debajo de {LOW_STOCK_THRESHOLD} unidades.
                </div>
              ) : (
                inventoryAlerts.map((item, i) => (
                  <div
                    key={`alert-${item.name ?? ''}-${i}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.remaining}</p>
                    </div>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                      {item.level}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Cobertura de modulos
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 font-display">
              Resumen operativo
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {statsHighlights.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {formatNumber(item.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Estadisticas basicas
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 font-display">
                  Ventas semanales
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                {formatNumber(orders.length)} ordenes
              </span>
            </div>
            <div className="mt-5 grid grid-cols-7 items-end gap-2">
              {weeklyPerformance.map((day) => (
                <div key={day.label} className="flex h-32 flex-col items-center justify-end gap-2">
                  <div
                    className="w-6 rounded-full bg-gradient-to-t from-emerald-500 to-emerald-200"
                    style={{ height: `${day.value}%` }}
                    title={`${day.total} ordenes`}
                  />
                  <span className="text-[0.65rem] font-semibold text-slate-500">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Objetivo del mes
              </p>
              <p className="mt-2 text-sm text-emerald-900">
                Ventas globales Q{formatNumber(totalRevenue?.toFixed(2) || 0)} con {formatNumber(stats?.demandByRestaurants?.length || 0)} restaurantes activos.
              </p>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Top platos
                </p>
                <div className="mt-2 space-y-2 text-sm text-slate-700">
                  {(stats?.bestSellingDishes ?? []).slice(0, 3).map((dish, i) => (
                    <div key={`dish-${dish.menuId ?? ''}-${i}`} className="flex items-center justify-between">
                      <span>{dish.dishName}</span>
                      <span className="text-xs font-semibold text-slate-500">
                        {formatNumber(dish.unitsSold)} uds
                      </span>
                    </div>
                  ))}
                  {(!stats?.bestSellingDishes || stats.bestSellingDishes.length === 0) && (
                    <p className="text-xs text-slate-500">Sin datos suficientes.</p>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Horas pico
                </p>
                <div className="mt-2 space-y-2 text-sm text-slate-700">
                  {(stats?.peakOrderHours ?? []).slice(0, 3).map((hour) => (
                    <div key={hour.hour} className="flex items-center justify-between">
                      <span>{hour.hour}</span>
                      <span className="text-xs font-semibold text-slate-500">
                        {formatNumber(hour.orders)} pedidos
                      </span>
                    </div>
                  ))}
                  {(!stats?.peakOrderHours || stats.peakOrderHours.length === 0) && (
                    <p className="text-xs text-slate-500">Sin datos suficientes.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
