import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/store/authStore'
import { getRestaurantStatistics } from '../../shared/api/statistics'
import { showError } from '../../shared/utils/toast'

const getErrMsg = (err, fallback) =>
  err?.response?.data?.errors?.[0]?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback

export const RestaurantReports = () => {
  const user = useAuthStore((state) => state.user)
  const [reportType, setReportType] = useState('ventas')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  const loadReports = async () => {
    if (!user?.restaurantId) return
    try {
      setLoading(true)
      const { data } = await getRestaurantStatistics(user.restaurantId)
      setStats(data?.data || null)
    } catch (err) {
      showError(getErrMsg(err, 'No se pudieron cargar los reportes estadísticos.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.restaurantId) {
      loadReports()
    } else {
      setLoading(false)
    }
  }, [user?.restaurantId])

  const reportOptions = [
    { value: 'ventas', label: 'Desempeño de Ventas y Órdenes' },
    { value: 'platos', label: 'Platos Más Populares y Rentables' },
    { value: 'ocupacion', label: 'Distribución de Horas Pico' },
  ]

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 print:p-0 print:space-y-4">
      {/* Banner Superior Premium */}
      <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-r from-emerald-50 via-emerald-50/60 to-emerald-100/30 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden relative shadow-sm print:hidden">
        <div className="space-y-3 z-10">
          <span className="inline-flex rounded-full bg-emerald-100 border border-emerald-200/50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
            Reportes
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Módulo de Reportes
          </h1>
          <p className="text-sm text-slate-500 max-w-[580px] leading-relaxed">
            Analiza el rendimiento general, ventas, platos populares e ingresos del establecimiento.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="rounded-2xl bg-slate-800 px-5 py-3 text-sm font-bold text-white hover:bg-slate-900 transition shadow-sm hover:shadow active:scale-[0.98] flex items-center gap-2 self-start sm:self-center shrink-0 z-10"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          <span>Imprimir Reporte</span>
        </button>
      </div>

      {/* Printable Header */}
      <div className="hidden print:block border-b-2 border-slate-200 pb-4 mb-6">
        <h1 className="text-3xl font-black text-slate-900">{stats?.restaurant?.restaurantName || 'Reporte de Restaurante'}</h1>
        <p className="text-sm text-slate-600 mt-1">Teléfono: {stats?.restaurant?.restaurantPhone || 'N/A'} | Correo: {stats?.restaurant?.restaurantEmail || 'N/A'}</p>
        <p className="text-xs text-slate-400 mt-2">Generado de forma automática el: {new Date().toLocaleString('es-GT')}</p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="w-full sm:max-w-xs">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Selecciona el tipo de reporte</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition font-medium"
            >
              {reportOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={loadReports}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition flex items-center gap-2"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            <span>Recargar Datos</span>
          </button>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="text-center text-slate-500 py-16">Cargando datos y generando analíticas...</div>
      ) : !stats ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-800">
          No se pudieron generar reportes para tu restaurante. Por favor, realiza algunas ventas o reservaciones primero.
        </div>
      ) : (
        <div className="space-y-6">
          {/* SALES REPORT */}
          {reportType === 'ventas' && (
            <div className="space-y-6">
              {/* Performance Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ingresos Totales</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-600">Q{(stats.performance?.totalIncome || 0).toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Órdenes Totales</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{stats.performance?.totalOrders || 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ticket Promedio</p>
                  <p className="mt-2 text-3xl font-bold text-blue-600">Q{(stats.performance?.averageTicket || 0).toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-medium">Tasa de Finalización</p>
                  <p className="mt-2 text-3xl font-bold text-teal-600">{stats.performance?.completionRate || 0}%</p>
                </div>
              </div>

              {/* Advanced metrics tables */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Resumen General de Actividad</h3>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Órdenes Completadas:</span>
                      <span className="font-bold text-emerald-600">{stats.performance?.completedOrders || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Órdenes Canceladas:</span>
                      <span className="font-bold text-rose-600">{stats.performance?.canceledOrders || 0}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Reservaciones Registradas:</span>
                      <span className="font-bold text-blue-600">{stats.performance?.totalReservations || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Estabilidad de Operaciones:</span>
                      <span className="font-bold text-slate-900">Saludable</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DISHES REPORT */}
          {reportType === 'platos' && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Rendimiento por Plato</h3>
                <p className="text-sm text-slate-500 mt-1">Los platos de tu menú ordenados por volumen de ventas y rentabilidad</p>
              </div>

              {(!stats.salesByDish || stats.salesByDish.length === 0) ? (
                <div className="text-center text-slate-400 py-12">No hay registro de ventas para tus platos todavía.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                        <th className="py-3 px-4">Plato</th>
                        <th className="py-3 px-4">Categoría</th>
                        <th className="py-3 px-4 text-center">Unidades Vendidas</th>
                        <th className="py-3 px-4 text-right">Precio Unitario</th>
                        <th className="py-3 px-4 text-right">Ganancia Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.salesByDish.map((dish, i) => (
                        <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">{dish.dishName}</td>
                          <td className="py-3 px-4 text-slate-500 text-xs">{dish.menuCategory?.replace('_', ' ')}</td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-700">{dish.unitsSold} u</td>
                          <td className="py-3 px-4 text-right text-slate-500">Q{Number(dish.menuPrice).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600">Q{Number(dish.revenue).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* OCCUPANCY / PEAK HOURS */}
          {reportType === 'ocupacion' && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Demanda Horaria</h3>
                <p className="text-sm text-slate-500 mt-1">Monitorea cuáles son las horas con mayor afluencia de pedidos en tu local</p>
              </div>

              {(!stats.peakHours || stats.peakHours.length === 0) ? (
                <div className="text-center text-slate-400 py-12">No hay suficientes órdenes para tabular horas pico.</div>
              ) : (
                <div className="space-y-4">
                  {stats.peakHours.map((h, i) => {
                    const maxOrders = Math.max(...stats.peakHours.map((x) => x.orders), 1)
                    const percent = (h.orders / maxOrders) * 100

                    return (
                      <div key={i} className="flex items-center gap-4">
                        <span className="w-16 text-sm font-semibold text-slate-600">{h.hour}</span>
                        <div className="flex-1 h-6 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden">
                          <div
                            style={{ width: `${percent}%` }}
                            className="h-full bg-emerald-500/20 border-r border-emerald-500 transition-all duration-500"
                          />
                        </div>
                        <span className="w-20 text-right text-sm font-bold text-slate-900">{h.orders} pedidos</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
