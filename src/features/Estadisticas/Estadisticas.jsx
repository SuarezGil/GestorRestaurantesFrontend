import { useEffect, useMemo, useState } from 'react'
import { getAdminStatistics } from '../../shared/api/statistics'

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors?.length) {
    return data.errors[0].message
  }

  return data?.message || error?.message || fallback
}

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    maximumFractionDigits: 2,
  }).format(amount)
}

const formatNumber = (value) => {
  return new Intl.NumberFormat('es-GT').format(Number(value || 0))
}

export const Estadisticas = () => {
  const [statistics, setStatistics] = useState({
    demandByRestaurants: [],
    bestSellingDishes: [],
    peakOrderHours: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadStatistics = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data } = await getAdminStatistics()
      setStatistics({
        demandByRestaurants: data?.data?.demandByRestaurants || [],
        bestSellingDishes: data?.data?.bestSellingDishes || [],
        peakOrderHours: data?.data?.peakOrderHours || [],
      })
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar las estadisticas.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatistics()
  }, [])

  const totalOrders = useMemo(() => {
    return statistics.demandByRestaurants.reduce((acc, item) => acc + Number(item.totalOrders || 0), 0)
  }, [statistics.demandByRestaurants])

  const totalIncome = useMemo(() => {
    return statistics.demandByRestaurants.reduce((acc, item) => acc + Number(item.totalRevenue || 0), 0)
  }, [statistics.demandByRestaurants])

  const activeRestaurants = statistics.demandByRestaurants.length

  const kpiCards = useMemo(() => {
    return [
      {
        label: 'Ingresos totales',
        value: formatCurrency(totalIncome),
        detail: 'Acumulado en ordenes no canceladas',
        tone: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      },
      {
        label: 'Ordenes registradas',
        value: formatNumber(totalOrders),
        detail: 'Total consolidado del sistema',
        tone: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      },
      {
        label: 'Restaurantes activos',
        value: formatNumber(activeRestaurants),
        detail: 'Con ventas en el periodo analizado',
        tone: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      },
    ]
  }, [activeRestaurants, totalIncome, totalOrders])

  const ordersPerDay = useMemo(() => {
    const hours = statistics.peakOrderHours.slice(0, 7)
    const maxOrders = Math.max(...hours.map((item) => Number(item.orders || 0)), 1)

    return hours.map((item) => {
      const count = Number(item.orders || 0)
      const proportionalHeight = Math.max((count / maxOrders) * 100, 10)

      return {
        day: item.hour || '--:--',
        count,
        height: `${proportionalHeight}%`,
      }
    })
  }, [statistics.peakOrderHours])

  const operationalInsights = useMemo(() => {
    const busiestHour = [...statistics.peakOrderHours].sort((a, b) => Number(b.orders || 0) - Number(a.orders || 0))[0]
    const leaderRestaurant = statistics.demandByRestaurants[0]
    const topDish = statistics.bestSellingDishes[0]

    return [
      {
        label: 'Franja pico',
        value: busiestHour ? `${busiestHour.hour} (${busiestHour.orders} pedidos)` : 'Sin datos',
      },
      {
        label: 'Sucursal lider',
        value: leaderRestaurant?.restaurantName || 'Sin datos',
      },
      {
        label: 'Plato mas vendido',
        value: topDish ? `${topDish.dishName} (${topDish.unitsSold} uds.)` : 'Sin datos',
      },
    ]
  }, [statistics.bestSellingDishes, statistics.demandByRestaurants, statistics.peakOrderHours])

  return (
    <section className="space-y-6 font-sans text-slate-300 antialiased max-w-[1600px] mx-auto p-4 md:p-6">
      
      {/* Header Estilo Premium */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Business Intelligence</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Rendimiento Comercial
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Analiza la demanda consolidada, ingresos brutos, platos líderes y picos de tráfico operativo.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={loadStatistics}
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-200 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-700 hover:text-white"
          >
            Actualizar Dashboard
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-center text-sm text-rose-400 font-medium">
          {error}
        </div>
      )}

      {/* Grid de KPIs Superiores (Glassmorphism) */}
      <section className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {kpiCards.map((card) => (
          <article key={card.label} className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-xl flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
              <p className="mt-2 text-2xl font-black text-white tracking-tight">{card.value}</p>
            </div>
            <div className={`mt-4 inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold border ${card.tone}`}>
              {card.detail}
            </div>
          </article>
        ))}
      </section>

      {/* Distribución Gráfica y Panorama */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        
        {/* Gráfica de Pedidos por Hora */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-5 shadow-xl space-y-4">
          <div className="flex flex-col gap-3 border-b border-slate-800/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Pedidos por hora</h2>
              <p className="text-xs text-slate-400">Distribución de carga transaccional en las franjas retornadas.</p>
            </div>
            <span className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-400">
              Muestreo de 7 franjas
            </span>
          </div>

          {loading && (
            <div className="p-12 text-center text-sm text-slate-400 animate-pulse font-medium">
              Calculando flujos de tráfico...
            </div>
          )}

          {!loading && !error && ordersPerDay.length === 0 && (
            <div className="p-12 text-center text-sm text-slate-500 rounded-xl border border-dashed border-slate-800">
              No hay datos de horas pico disponibles en el servidor.
            </div>
          )}

          {/* Gráfica Estilizada */}
          {!loading && !error && ordersPerDay.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7 pt-4">
              {ordersPerDay.map((entry) => (
                <div key={entry.day} className="flex flex-col items-center gap-3">
                  <div className="flex h-56 w-full items-end rounded-2xl bg-slate-950 border border-slate-800/50 p-1.5 shadow-inner">
                    <div
                      className="w-full rounded-xl bg-gradient-to-t from-sky-600 via-cyan-500 to-emerald-400 shadow-[0_0_12px_rgba(34,211,238,0.2)] transition-all duration-500"
                      style={{ height: entry.height }}
                    />
                  </div>
                  <div className="text-center space-y-0.5">
                    <p className="text-xs font-bold text-white">{entry.day}</p>
                    <p className="text-[10px] font-medium text-slate-500">{entry.count} uds.</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Panel de Panorama Operativo Lateral */}
        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-xl space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">Lectura Rápida</h3>
              <h2 className="text-base font-bold text-white mt-0.5">Panorama operativo</h2>
            </div>
            
            <div className="space-y-3">
              {operationalInsights.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.label}</p>
                  <p className="mt-1 text-sm font-bold text-white leading-snug">{item.value}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {/* Grid de Platos Más Vendidos */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-5 shadow-xl space-y-4">
        <div className="flex flex-col gap-3 border-b border-slate-800/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Platos más vendidos</h2>
            <p className="text-xs text-slate-400">Los artículos con mayor rotación comercial organizados por volumen.</p>
          </div>
          <span className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-400">
            Métricas Top 4
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400 animate-pulse font-medium">
            Procesando métricas de cocina...
          </div>
        ) : statistics.bestSellingDishes.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 rounded-xl border border-dashed border-slate-800">
            No hay datos de ventas de platillos disponibles.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 pt-1">
            {statistics.bestSellingDishes.slice(0, 4).map((dish) => (
              <article key={dish.menuId} className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-4 flex flex-col justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                      {dish.menuCategory?.replace('_', ' ') || 'General'}
                    </span>
                    <span className="rounded-md bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400 shrink-0">
                      {dish.unitsSold} uds.
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white pt-1.5 line-clamp-1">{dish.dishName}</h3>
                  <p className="text-[11px] font-medium text-slate-500 truncate">{dish.restaurantName}</p>
                </div>
                
                <div className="pt-2 border-t border-slate-900/60 flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Recaudado</span>
                  <span className="text-sm font-black text-emerald-400">{formatCurrency(dish.revenue)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}