import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { register as registerRequest } from '../../shared/api/auth'
import toast from 'react-hot-toast'
import { getAllUsersWithAuthService } from '../../shared/api/auth.js'
import { toggleUserActive } from '../../shared/api/users.js'

// ─── Helpers ───────────────────────────────────────────────────────────────────
const resolveUser = (user) => {
  const profile = user?.UserProfile || {}
  const emailRecord = user?.UserEmail || {}
  const roleRecord = user?.UserRoles?.[0]?.Role || {}

  return {
    id: user?.id || user?.Id || 'N/D',
    name: user?.name || user?.Name || 'N/D',
    email: user?.email || user?.Email || 'N/D',
    phone: user?.phone || profile.phone || profile.Phone || 'N/D',
    avatar: profile.profilePicture || profile.ProfilePicture || profile.Imagen || '',
    role: user?.role || roleRecord.Name || 'USER_ROLE',
    isActive: user?.isActive ?? user?.IsActive ?? false,
    emailVerified: user?.isEmailVerified ?? emailRecord.EmailVerified ?? false,
    createdAt: user?.createdAt || user?.CreatedAt,
  }
}

const formatDate = (value) => {
  if (!value) return 'N/D'
  return new Date(value).toLocaleDateString('es-GT', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const initials = (name) =>
  name !== 'N/D'
    ? name.split(' ').map((p) => p[0]?.toUpperCase()).filter(Boolean).slice(0, 2).join('')
    : '?'

const ROLE_CONFIG = {
  ADMIN_ROLE: {
    label: 'Administrador',
    avatarBg: 'bg-violet-100 text-violet-700',
    icon: () => (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    classes: 'bg-violet-100 text-violet-700 border-violet-200',
    badgeBg: 'bg-violet-50 border-violet-200 text-violet-700',
  },
  ADMIN_RESTAURANT: {
    label: 'Admin Restaurante',
    avatarBg: 'bg-rose-100 text-rose-700',
    icon: () => (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    classes: 'bg-rose-100 text-rose-700 border-rose-200',
    badgeBg: 'bg-rose-50 border-rose-200 text-rose-700',
  },
  USER_ROLE: {
    label: 'Cliente',
    avatarBg: 'bg-sky-100 text-sky-700',
    icon: () => (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    classes: 'bg-sky-100 text-sky-700 border-sky-200',
    badgeBg: 'bg-sky-50 border-sky-200 text-sky-700',
  },
}

const getRoleConfig = (role) =>
  ROLE_CONFIG[role] ?? {
    label: role,
    avatarBg: 'bg-slate-100 text-slate-600',
    icon: () => (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
    badgeBg: 'bg-slate-50 border-slate-200 text-slate-600',
  }

const PAGE_SIZE = 10

const SortIcon = ({ field, sortField, sortDir }) => {
  if (sortField !== field) return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
      <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
    </svg>
  )
  return sortDir === 'asc'
    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
}

// ─── Component ─────────────────────────────────────────────────────────────────
export const AdminUsuarios = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('Todos')
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [togglingId, setTogglingId] = useState(null)
  const [profileIdQuery, setProfileIdQuery] = useState('')
  const [profileResult, setProfileResult] = useState(null)
  const [profileNotFound, setProfileNotFound] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm()
  
  const onCreateSubmit = async (values) => {
    // Prepare payload expected by backend
    const payload = {
      name: values.name,
      email: values.email,
      password: values.password,
      phone: values.phone,
      role: values.role || 'USER_ROLE',
    }

    try {
      // sanitize phone to digits only
      const phoneSanitized = String(values.phone || '').replace(/\D/g, '').slice(0, 8)
      if (phoneSanitized.length !== 8) {
        setError('phone', { type: 'manual', message: 'El teléfono debe tener exactamente 8 dígitos' })
        return
      }

      const toastId = toast.loading('Creando usuario...')
      const { data } = await registerRequest({ ...payload, phone: phoneSanitized })
      toast.dismiss(toastId)
      toast.success(data?.message || 'Usuario creado correctamente.')
      setShowCreateModal(false)
      reset()
      await loadUsers()
    } catch (err) {
      toast.dismiss()
      const serverMessage = err?.response?.data?.message
      const validationErrors = err?.response?.data?.errors
      if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        // Map backend validation errors to form fields
        validationErrors.forEach((e) => {
          // express-validator uses path like 'phone' or 'email'
          if (e.path) setError(e.path, { type: 'server', message: e.msg || e.message })
          else toast.error(e.message || e.msg)
        })
      } else {
        const msg = serverMessage || err?.message || 'Error al crear usuario.'
        toast.error(msg)
      }
    }
  }
  const navigate = useNavigate()

  const loadUsers = async () => {
    setLoading(true)
  setFetchError('')
    try {
      const data = await getAllUsersWithAuthService()
      setUsers(Array.isArray(data?.users) ? data.users : [])
    } catch (err) {
      setFetchError(err?.response?.data?.message || err?.message || 'No se pudo cargar la lista de usuarios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  const handleToggleActive = async (userId, currentActive) => {
    setTogglingId(userId)
    try {
      await toggleUserActive(userId)
      setUsers((prev) =>
        prev.map((u) => {
          const id = u?.id || u?.Id
          if (id === userId) return { ...u, isActive: !currentActive, IsActive: !currentActive }
          return u
        })
      )
      await loadUsers()
    } catch (err) {
      // If toggling failed, refresh list to show correct state
      await loadUsers()
    } finally {
      setTogglingId(null)
    }
  }

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
    setPage(1)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      const r = resolveUser(u)
      const matchesSearch =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        String(r.phone).toLowerCase().includes(q)
      const matchesRole = roleFilter === 'Todos' || r.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const ra = resolveUser(a)
      const rb = resolveUser(b)
      let va = ra[sortField] ?? ''
      let vb = rb[sortField] ?? ''
      if (sortField === 'createdAt') { va = new Date(va).getTime() || 0; vb = new Date(vb).getTime() || 0 }
      else { va = String(va).toLowerCase(); vb = String(vb).toLowerCase() }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts = useMemo(() => {
    const map = { ADMIN_ROLE: 0, ADMIN_RESTAURANT: 0, USER_ROLE: 0 }
    users.forEach((u) => {
      const role = resolveUser(u).role
      if (map[role] !== undefined) map[role]++
    })
    return map
  }, [users])

  const handleSearchById = () => {
    const q = profileIdQuery.trim().toLowerCase()
    if (!q) return
    const found = users.find((u) => resolveUser(u).id.toLowerCase().includes(q))
    if (found) { setProfileResult(resolveUser(found)); setProfileNotFound(false) }
    else { setProfileResult(null); setProfileNotFound(true) }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="rounded-2xl border border-slate-100 bg-white px-7 py-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h1 className="text-lg font-bold text-slate-900">Auth administrativo</h1>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="23" y2="8" /><line x1="21" y1="6" x2="21" y2="10" />
            </svg>
            <h2 className="text-base font-semibold text-slate-800">Registrar usuario</h2>
          </div>
          <p className="text-sm text-slate-500 mb-5">Registro de usuarios desde el panel administrativo.</p>
          <button type="button" onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Crear usuario
          </button>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
            </svg>
            <h2 className="text-base font-semibold text-slate-800">Ver perfil por ID</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">Consulta el perfil completo usando el ID del usuario.</p>
          <div className="flex gap-2">
            <input value={profileIdQuery}
              onChange={(e) => { setProfileIdQuery(e.target.value); setProfileResult(null); setProfileNotFound(false) }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchById()}
              placeholder="ID de usuario"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:bg-white transition"
            />
            <button type="button" onClick={handleSearchById}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
              Buscar perfil
            </button>
          </div>
          {profileResult && (
            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-4 flex items-center gap-3">
              {profileResult.avatar ? (
                <img src={profileResult.avatar} alt={profileResult.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getRoleConfig(profileResult.role).avatarBg}`}>
                  {initials(profileResult.name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-mono text-slate-400 truncate">{profileResult.id}</p>
                <p className="text-sm font-semibold text-slate-800">{profileResult.name}</p>
                <p className="text-xs text-slate-500">{profileResult.email}</p>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${getRoleConfig(profileResult.role).classes}`}>
                    {getRoleConfig(profileResult.role).label}
                  </span>
                  <span className={`text-xs font-medium ${profileResult.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {profileResult.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
          )}
          {profileNotFound && <p className="mt-2 text-xs text-rose-500">No se encontró ningún usuario con ese ID.</p>}
        </section>
      </div>

      {/* Role badges */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
          const Icon = cfg.icon
          const active = roleFilter === role
          return (
            <button key={role} type="button"
              onClick={() => { setRoleFilter(active ? 'Todos' : role); setPage(1) }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                active ? cfg.classes + ' ring-2 ring-offset-1 ring-current' : cfg.badgeBg + ' hover:opacity-80'
              }`}>
              <Icon />
              {cfg.label}
              <span className="ml-0.5 rounded-full bg-white/60 px-1.5 py-0.5 text-[10px] font-bold">{counts[role]}</span>
            </button>
          )
        })}
        {roleFilter !== 'Todos' && (
          <button type="button" onClick={() => { setRoleFilter('Todos'); setPage(1) }}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 transition">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Todos
          </button>
        )}
      </div>

      {/* Table */}
      <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-800">Listado de usuarios</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{filtered.length} / {users.length}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Buscar por ID, nombre, correo..."
                className="w-52 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
              />
            </div>
            <button type="button" onClick={loadUsers} disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50">
              <svg className={loading ? 'animate-spin' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Actualizar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
            <p className="mt-3 text-sm text-slate-500">Cargando usuarios...</p>
          </div>
        ) : fetchError ? (
          <div className="m-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{fetchError}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center m-5 py-14 text-center rounded-xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-500">No hay usuarios que coincidan.</p>
            {(search || roleFilter !== 'Todos') && (
              <button type="button" onClick={() => { setSearch(''); setRoleFilter('Todos') }}
                className="mt-2 text-xs text-blue-500 hover:underline">Limpiar filtros</button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3 cursor-pointer select-none hover:text-slate-700 transition-colors" onClick={() => handleSort('id')}>
                      <div className="flex items-center gap-1">ID <SortIcon field="id" sortField={sortField} sortDir={sortDir} /></div>
                    </th>
                    <th className="px-4 py-3 cursor-pointer select-none hover:text-slate-700 transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1">Nombre <SortIcon field="name" sortField={sortField} sortDir={sortDir} /></div>
                    </th>
                    <th className="px-4 py-3 cursor-pointer select-none hover:text-slate-700 transition-colors" onClick={() => handleSort('email')}>
                      <div className="flex items-center gap-1">Correo <SortIcon field="email" sortField={sortField} sortDir={sortDir} /></div>
                    </th>
                    <th className="px-4 py-3">Teléfono</th>
                    <th className="px-4 py-3 cursor-pointer select-none hover:text-slate-700 transition-colors" onClick={() => handleSort('role')}>
                      <div className="flex items-center gap-1">Rol <SortIcon field="role" sortField={sortField} sortDir={sortDir} /></div>
                    </th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Verificado</th>
                    <th className="px-4 py-3 cursor-pointer select-none hover:text-slate-700 transition-colors" onClick={() => handleSort('createdAt')}>
                      <div className="flex items-center gap-1">Registro <SortIcon field="createdAt" sortField={sortField} sortDir={sortDir} /></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map((u) => {
                    const r = resolveUser(u)
                    const roleCfg = getRoleConfig(r.role)
                    const RoleIcon = roleCfg.icon
                    const shortId = r.id !== 'N/D' ? r.id.slice(0, 16) + (r.id.length > 16 ? '…' : '') : 'N/D'
                    const isToggling = togglingId === r.id
                    return (
                      <tr key={r.id} className="transition hover:bg-slate-50/80">
                        <td className="px-4 py-3.5">
                          <span title={r.id}
                            className="font-mono text-xs text-blue-600 cursor-pointer hover:underline"
                            onClick={() => { setProfileIdQuery(r.id); setProfileResult(r); setProfileNotFound(false) }}>
                            {shortId}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            {r.avatar ? (
                              <img src={r.avatar} alt={r.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
                                onError={(e) => { e.target.style.display = 'none' }}
                              />
                            ) : (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${roleCfg.avatarBg}`}>
                                {initials(r.name)}
                              </div>
                            )}
                            <span className="font-medium text-slate-800 truncate max-w-[140px]">{r.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 text-xs">{r.email}</td>
                        <td className="px-4 py-3.5 text-slate-500 text-xs">{r.phone}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${roleCfg.classes}`}>
                            <RoleIcon />{roleCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <button type="button"
                            disabled={isToggling}
                            onClick={() => handleToggleActive(r.id, r.isActive)}
                            title={r.isActive ? 'Click para desactivar' : 'Click para activar'}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition-all ${
                              r.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            } ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                            {isToggling ? (
                              <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12a9 9 0 1 1-6.22-8.56" strokeLinecap="round" />
                              </svg>
                            ) : (
                              <span className={`h-1.5 w-1.5 rounded-full ${r.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            )}
                            {r.isActive ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-medium">
                          <span className={r.emailVerified ? 'text-emerald-600' : 'text-amber-500'}>
                            {r.emailVerified ? 'SI' : 'NO'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-400">{formatDate(r.createdAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <p className="text-xs text-slate-400">
                Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} de {sorted.length}
              </p>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setPage(1)} disabled={page === 1}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition">«</button>
                <button type="button" onClick={() => setPage((p) => p - 1)} disabled={page === 1}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition">‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, idx) =>
                    p === '…' ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-xs text-slate-400">…</span>
                    ) : (
                      <button key={p} type="button" onClick={() => setPage(p)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                          page === p
                            ? 'border-slate-700 bg-slate-800 text-white'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}>
                        {p}
                      </button>
                    )
                  )}
                <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition">›</button>
                <button type="button" onClick={() => setPage(totalPages)} disabled={page === totalPages}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition">»</button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Modal crear usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <form onSubmit={handleSubmit(onCreateSubmit)} className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Registrar nuevo usuario</h3>
              <button type="button" onClick={() => { setShowCreateModal(false); reset() }}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="grid gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Nombre completo</label>
                <input {...register('name', { required: 'Nombre es requerido' })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none" />
                {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Correo electrónico</label>
                <input {...register('email', { required: 'Email es requerido', pattern: { value: /\S+@\S+\.\S+/, message: 'Email inválido' } })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none" />
                {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Contraseña</label>
                <input type="password" {...register('password', { required: 'La contraseña es obligatoria', minLength: { value: 8, message: 'La contraseña debe tener al menos 8 caracteres' } })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none" />
                {errors.password && <p className="text-xs text-rose-500">{errors.password.message}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Teléfono (8 dígitos)</label>
                <input type="tel" inputMode="numeric" maxLength={8} placeholder="00000000" {...register('phone', { required: 'El teléfono es obligatorio', pattern: { value: /^\d{8}$/, message: 'El teléfono debe tener exactamente 8 dígitos' } })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none" />
                {errors.phone && <p className="text-xs text-rose-500">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Rol</label>
                <select {...register('role')} defaultValue="USER_ROLE" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none">
                  <option value="USER_ROLE">Cliente</option>
                  <option value="ADMIN_RESTAURANT">Admin Restaurante</option>
                  <option value="ADMIN_ROLE">Administrador</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button type="button" onClick={() => { setShowCreateModal(false); reset() }} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition">{isSubmitting ? 'Creando...' : 'Crear usuario'}</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
