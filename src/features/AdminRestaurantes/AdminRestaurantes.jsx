import { useCallback, useEffect, useMemo, useState } from 'react'
import { getRestaurants, assignAdmin } from '../../shared/api/restaurants'
import { getUsersByRole, createAdminRestaurant, sendAssignmentNotification } from '../../shared/api/users'
import { showError, showSuccess } from '../../shared/utils/toast'
import { useAuthStore } from '../auth/store/authStore'
import AdminFormModal from './components/AdminFormModal'
import AdminInfoModal from './components/AdminInfoModal'

// ─── helpers ─────────────────────────────────────────────────────────────────
const getErrMsg = (err, fallback) =>
  err?.response?.data?.errors?.[0]?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback

const emptyForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  restaurantId: '',
}

const inputCls =
  'mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50'
const labelCls = 'flex flex-col text-sm font-semibold text-slate-700'

// ─── sub-components ───────────────────────────────────────────────────────────

const AdminCard = ({ admin, restaurants, onReassign, onView }) => {
  const assignedRestaurant = restaurants.find((r) => r.adminId === admin.id)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(assignedRestaurant?._id || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (modalOpen) {
      console.log('DEBUG AdminCard Modal Opened:', {
        adminId: admin.id,
        restaurantsCount: restaurants.length,
        firstRestaurant: restaurants[0],
        filtered: restaurants.filter((r) => !r.adminId || r.adminId === admin.id),
      })
    }
  }, [modalOpen, admin.id, restaurants])

  const handleSaveReassignment = async () => {
    setSaving(true)
    try {
      await onReassign(admin.id, selectedRestaurantId || null, assignedRestaurant?._id || null)
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Encabezado con avatar y estado */}
      <div className="flex items-start gap-3">
        {/* Avatar más pequeño */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-lg font-bold text-indigo-700">
          {admin.name?.[0]?.toUpperCase() ?? 'A'}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 truncate">{admin.name}</h3>
          <p className="text-xs text-slate-500 truncate">{admin.email}</p>
          
          {/* Estado badge */}
          <div className="mt-1.5">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${admin.isActive !== false ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-600'}`}>
              {admin.isActive !== false ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      {/* Sección Asignado */}
      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Asignado</p>
        <p className="mt-1 text-xs font-medium text-slate-800 line-clamp-2">{assignedRestaurant ? assignedRestaurant.restaurantName : '— Sin asignar —'}</p>
      </div>

      {/* Botones de acción */}
      <div className="mt-3 flex items-center gap-2">
        {/* Botón ojito — abre el modal de info */}
        <button
          type="button"
          title="Ver información"
          onClick={() => onView && onView()}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setSelectedRestaurantId(assignedRestaurant?._id || ''); setModalOpen(true) }}
          className="flex-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
        >
          {assignedRestaurant ? 'Reasignar' : 'Asignar'}
        </button>
      </div>

      {/* Modal de reasignación */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">{assignedRestaurant ? 'Reasignar restaurante' : 'Asignar restaurante'}</h3>
            <p className="text-xs text-slate-500 mt-1">Selecciona el restaurante para asignar a este administrador.</p>
            <select
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
              className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
            >
              <option value="">— Sin asignar —</option>
              {restaurants.filter((r) => !r.adminId || r.adminId === admin.id).map((r) => (
                <option key={r._id} value={r._id}>{r.restaurantName}</option>
              ))}
            </select>
            <div className="mt-4 flex gap-2">
              <button onClick={handleSaveReassignment} disabled={saving} className="flex-1 rounded-xl bg-indigo-600 py-2 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
              <button onClick={() => setModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

// ─── main component ───────────────────────────────────────────────────────────
export const AdminRestaurantes = () => {
  const { user } = useAuthStore()
  const [restaurants, setRestaurants] = useState([])
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [viewAdmin, setViewAdmin] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [search, setSearch] = useState('')

  // Validación de rol
  const isAdmin = user?.role === 'ADMIN_ROLE'

  // Si no es admin, mostrar mensaje de acceso restringido
  if (!isAdmin) {
    return (
      <section className="space-y-6 font-body">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-200 text-rose-700 mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-rose-900">Acceso restringido</h2>
          <p className="mt-2 text-sm text-rose-800">Solo los administradores del sistema pueden acceder a esta sección. Si crees que es un error, contacta al administrador.</p>
          <p className="mt-3 text-xs text-rose-700">Tu rol actual: <strong>{user?.role || 'Desconocido'}</strong></p>
        </div>
      </section>
    )
  }

  // ── load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [restaurantsRes, adminsRes] = await Promise.all([
        getRestaurants({ limit: 200 }),
        getUsersByRole('ADMIN_RESTAURANT'),
      ])
      setRestaurants(restaurantsRes.data?.data || [])
      setAdmins(adminsRes.data || [])
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo cargar la información.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const adminsWithRole = admins.filter(a => a.role === 'ADMIN_RESTAURANT')
    const assigned = adminsWithRole.filter(a => restaurants.some(r => r.adminId === a.id)).length
    return {
      total: adminsWithRole.length,
      assigned,
      unassigned: adminsWithRole.length - assigned,
      restaurants: restaurants.length,
    }
  }, [admins, restaurants])

  // ── filtered admins ───────────────────────────────────────────────────────
  const filteredAdmins = useMemo(() => {
    // Filtrar primero por rol ADMIN_RESTAURANT
    const adminsWithRole = admins.filter(a => a.role === 'ADMIN_RESTAURANT')
    
    if (!search.trim()) return adminsWithRole
    const q = search.toLowerCase()
    return adminsWithRole.filter(
      a => a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q)
    )
  }, [admins, search])

  // ── free restaurants (not assigned) ───────────────────────────────────────
  const freeRestaurants = useMemo(
    () => restaurants.filter(r => !r.adminId),
    [restaurants]
  )

  // ── handlers ─────────────────────────────────────────────────────────────
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.phone.trim()) {
      return showError('Completa todos los campos obligatorios.')
    }
    if (!/^\d{8}$/.test(form.phone)) {
      return showError('El teléfono debe tener exactamente 8 dígitos.')
    }
    if (form.password.length < 8) {
      return showError('La contraseña debe tener al menos 8 caracteres.')
    }

    setSaving(true)
    try {
      // 1. Create user in auth service with ADMIN_RESTAURANT role
      const res = await createAdminRestaurant({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
      })
      const newUser = res.data?.user
      showSuccess('Administrador de restaurante creado.')

      // 2. Assign to restaurant if selected
      if (form.restaurantId && newUser?.id) {
        const assignedRestaurant = restaurants.find(r => r._id === form.restaurantId)
        await assignAdmin(form.restaurantId, newUser.id)
        showSuccess('Administrador asignado al restaurante.')

        // 3. Send notification email
        try {
          await sendAssignmentNotification(newUser.id, assignedRestaurant?.restaurantName || 'Tu restaurante')
        } catch (emailErr) {
          console.error('Error enviando email de notificación:', emailErr)
          // No mostrar error al usuario, solo en consola
        }
      }

      setForm(emptyForm)
      setIsFormOpen(false)
      await loadData()
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo crear el administrador.'))
    } finally {
      setSaving(false)
    }
  }

  const handleReassign = async (adminId, newRestaurantId, prevRestaurantId) => {
    try {
      // Remove from previous restaurant
      if (prevRestaurantId) {
        await assignAdmin(prevRestaurantId, null)
      }
      // Assign to new restaurant
      if (newRestaurantId) {
        await assignAdmin(newRestaurantId, adminId)
      }
      showSuccess('Asignación actualizada.')
      await loadData()
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo actualizar la asignación.'))
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <section className="space-y-6 font-body">

      {/* HEADER */}
      <header className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(67,56,202,0.3),_transparent_50%),linear-gradient(120deg,_#0f172a_0%,_#1e1b4b_40%,_#312e81_100%)] p-8 text-white shadow-xl">
        <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full bg-white/12 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-indigo-200">
              Gestión de accesos
            </p>
            <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Administradores de restaurante
            </h1>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">
              Crea cuentas de administrador de restaurante y asígnalas a cada local de forma centralizada y segura.
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20 self-start lg:self-auto"
          >
            Actualizar
          </button>
        </div>
      </header>

      {/* STATS */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Admins registrados', value: stats.total, color: 'text-indigo-700' },
          { label: 'Asignados', value: stats.assigned, color: 'text-emerald-700' },
          { label: 'Sin asignar', value: stats.unassigned, color: 'text-amber-600' },
          { label: 'Restaurantes', value: stats.restaurants, color: 'text-slate-700' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{s.label}</p>
            <p className={`mt-1.5 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* CREAR ADMIN: abrirlo en modal para limpiar la vista */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Nuevo administrador</h2>
            <p className="text-xs text-slate-500 mt-2">Crea un nuevo administrador de restaurante. Se asignará automáticamente el rol <span className="font-semibold text-indigo-700">ADMIN_RESTAURANT</span>.</p>
          </div>
          <button onClick={() => setIsFormOpen(true)} className="whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">Crear</button>
        </div>
      </div>

      {/* ── LIST ── */}
      <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Administradores registrados
              {!loading && <span className="ml-2 text-sm font-normal text-slate-400">({filteredAdmins.length})</span>}
            </h2>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="w-full sm:w-64 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition"
            />
          </div>

          {loading && (
            <div className="py-12 text-center text-sm text-slate-400">Cargando administradores...</div>
          )}

          {!loading && filteredAdmins.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400 mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">
                {search ? 'No se encontraron administradores con ese criterio.' : 'Aún no hay administradores de restaurante registrados.'}
              </p>
            </div>
          )}

          {!loading && filteredAdmins.length > 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(showAll ? filteredAdmins : filteredAdmins.slice(0, 6)).map(admin => (
                    <AdminCard
                      key={admin.id}
                      admin={admin}
                      restaurants={restaurants}
                      onReassign={handleReassign}
                      onView={() => setViewAdmin(admin)}
                    />
                  ))}
              </div>
              {filteredAdmins.length > 6 && (
                <div className="flex justify-center mt-3">
                  <button onClick={() => setShowAll(s => !s)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    {showAll ? 'Mostrar menos' : `Mostrar más (${filteredAdmins.length - 6})`}
                  </button>
                </div>
              )}
            </>
          )}
          {/* Modales */}
          <AdminFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} form={form} setForm={setForm} onSubmit={handleCreate} saving={saving} showPassword={showPassword} setShowPassword={setShowPassword} freeRestaurants={freeRestaurants} />
          <AdminInfoModal isOpen={!!viewAdmin} onClose={() => setViewAdmin(null)} admin={viewAdmin} assignedRestaurant={restaurants.find(r => r.adminId === viewAdmin?.id)} />
        </div>
    </section>
  )
}

export default AdminRestaurantes
