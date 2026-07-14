import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRestaurants } from '../../shared/api/restaurants'
import { getUsersByRole } from '../../shared/api/users'

export const DashboardHome = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [restaurants, setRestaurants] = useState([])
  const [admins, setAdmins] = useState([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const [restRes, adminRes] = await Promise.all([
          getRestaurants({ limit: 100 }),
          getUsersByRole('ADMIN_RESTAURANT').catch(() => ({ data: [] })),
        ])
        if (!mounted) return
        setRestaurants(restRes.data?.data || [])
        setAdmins(adminRes.data || [])
      } catch (err) {
        // silent for now
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const stats = useMemo(() => ({
    restaurants: restaurants.length,
    admins: admins.length,
    pendingReservations: Math.max(0, Math.floor(Math.random() * 20)), // placeholder
  }), [restaurants, admins])

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-main-blue">Panel</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">Resumen ejecutivo</h1>
            <p className="mt-2 text-sm text-slate-600 max-w-xl">Vista rápida con indicadores clave para la operación: restaurantes activos, administradores asignados, y reservas pendientes.</p>
          </div>
        
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-9 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs text-slate-400 uppercase">Restaurantes</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? '—' : stats.restaurants}</p>
              <p className="text-sm text-slate-500 mt-1">Activos en la plataforma</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs text-slate-400 uppercase">Administradores</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? '—' : stats.admins}</p>
              <p className="text-sm text-slate-500 mt-1">Asignados a restaurantes</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs text-slate-400 uppercase">Reservas pendientes</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats.pendingReservations}</p>
              <p className="text-sm text-slate-500 mt-1">Solicitudes por revisar</p>
            </div>
          </div>

          {/* Activity / recent admins */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Administradores recientes</h3>
              <button onClick={() => navigate('/dashboard/admin-restaurantes')} className="text-sm text-amber-500">Ver todos</button>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="mt-3 grid gap-3">
                {loading && <p className="text-sm text-slate-400">Cargando...</p>}
                {!loading && admins.length === 0 && <p className="text-sm text-slate-500">Sin administradores.</p>}
                {!loading && admins.slice(0, 5).map(a => (
                  <div key={a.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-700 text-sm">{a.name?.[0] || 'A'}</div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{a.name}</p>
                        <p className="text-xs text-slate-500">{a.email}</p>
                      </div>
                    </div>
                    <div className="text-sm text-slate-400">{a.isActive !== false ? 'Activo' : 'Inactivo'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        

      </section>
    </div>
  )
}
