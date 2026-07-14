import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/store/authStore'
import { getReservations, updateReservationStatus, createReservation } from '../../shared/api/reservations'
import { getTables } from '../../shared/api/tables'
import { getAllUsers } from '../../shared/api/users'
import { showError, showSuccess } from '../../shared/utils/toast'

const getErrMsg = (err, fallback) =>
  err?.response?.data?.errors?.[0]?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback

export const RestaurantReservations = () => {
  const user = useAuthStore((state) => state.user)
  const [reservations, setReservations] = useState([])
  const [usersList, setUsersList] = useState([])
  const [tablesList, setTablesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('TODOS')
  const [updatingId, setUpdatingId] = useState(null)

  // Add Reservation States
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    userId: '',
    tableId: [],
    numberPeople: '',
    typeReservation: 'PERSONAL',
    description: '',
    startDate: '',
    endDate: ''
  })

  // Search and Pagination States
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const loadReservations = async () => {
    if (!user?.restaurantId) return
    try {
      setLoading(true)
      const { data } = await getReservations({ restaurantId: user.restaurantId })
      setReservations(data?.reservations || [])
    } catch (err) {
      showError(getErrMsg(err, 'No se pudieron cargar las reservaciones.'))
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const { data } = await getAllUsers()
      setUsersList(data?.users || [])
    } catch (err) {
      console.error('Error al cargar la lista de usuarios:', err)
    }
  }

  const loadTables = async () => {
    if (!user?.restaurantId) return
    try {
      const { data } = await getTables({ restaurantId: user.restaurantId })
      setTablesList(data?.tables || [])
    } catch (err) {
      console.error('Error al cargar la lista de mesas:', err)
    }
  }

  useEffect(() => {
    if (user?.restaurantId) {
      loadReservations()
      loadUsers()
      loadTables()
    } else {
      setLoading(false)
    }
  }, [user?.restaurantId])

  const handleUpdateStatus = async (id, status) => {
    setUpdatingId(id)
    try {
      await updateReservationStatus(id, status)
      showSuccess(`Reservación actualizada a ${status.toLowerCase()} exitosamente.`)
      loadReservations()
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo actualizar el estado de la reservación.'))
    } finally {
      setUpdatingId(null)
    }
  }

  const handleCreateReservationSubmit = async (e) => {
    e.preventDefault()
    if (!formData.userId) return showError('Por favor, selecciona un cliente.')
    if (!formData.tableId || formData.tableId.length === 0) return showError('Por favor, selecciona al menos una mesa.')
    if (!formData.numberPeople || Number(formData.numberPeople) <= 0) return showError('Por favor, ingresa un número de personas válido.')
    if (!formData.startDate) return showError('Por favor, selecciona una fecha de inicio.')
    if (!formData.endDate) return showError('Por favor, selecciona una fecha de finalización.')

    setSaving(true)
    try {
      await createReservation({
        ...formData,
        restaurantId: user.restaurantId,
        tableId: formData.tableId
      })
      showSuccess('Reservación creada exitosamente.')
      setShowModal(false)
      loadReservations()
    } catch (err) {
      showError(getErrMsg(err, 'No se pudo crear la reservación.'))
    } finally {
      setSaving(false)
    }
  }

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filterStatus, searchQuery])

  // Filtering Logic
  const filteredReservations = reservations.filter((r) => {
    const matchesStatus = filterStatus === 'TODOS' || r.status === filterStatus
    const matchedUser = usersList.find((u) => String(u.id || u.Id) === String(r.userId)) || {}
    const customerName = String(matchedUser.name || matchedUser.Name || r.userId || '').toLowerCase()
    const matchesSearch = customerName.includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Pagination Logic
  const startIndex = filteredReservations.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, filteredReservations.length)
  const paginatedReservations = filteredReservations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage)

  const statusColors = {
    PENDIENTE: 'bg-amber-100 text-amber-700 border-amber-200',
    COMPLETADO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CANCELADO: 'bg-rose-100 text-rose-700 border-rose-200',
  }

  const cardBorderAccents = {
    PENDIENTE: 'border-l-[5px] border-l-amber-500',
    COMPLETADO: 'border-l-[5px] border-l-emerald-500',
    CANCELADO: 'border-l-[5px] border-l-rose-500',
  }

  const formatReservationDate = (dateString) => {
    try {
      const date = new Date(dateString)
      const options = { weekday: 'long', day: 'numeric', month: 'short' }
      let formatted = date.toLocaleDateString('es-GT', options)
      return formatted.charAt(0).toUpperCase() + formatted.slice(1).replace('.', '')
    } catch {
      return 'Fecha inválida'
    }
  }

  const formatReservationTime = (dateString) => {
    try {
      const date = new Date(dateString)
      let timeStr = date.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: true })
      return timeStr
    } catch {
      return 'Hora inválida'
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner Superior Premium */}
      <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-r from-emerald-50 via-emerald-50/60 to-emerald-100/30 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative shadow-sm">
        <div className="space-y-3 z-10">
          <span className="inline-flex rounded-full bg-emerald-100 border border-emerald-200/50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
            Reservaciones
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Control de Reservaciones
          </h1>
          <p className="text-sm text-slate-500 max-w-[580px] leading-relaxed">
            Supervisa las mesas asignadas, horarios de llegada y solicitudes de tus clientes.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              userId: '',
              tableId: [],
              numberPeople: '',
              typeReservation: 'PERSONAL',
              description: '',
              startDate: '',
              endDate: ''
            })
            setShowModal(true)
          }}
          className="shrink-0 z-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 transition active:scale-[0.98] flex items-center gap-2"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Nueva Reservación</span>
        </button>
      </div>

      {/* Dynamic Tab Filter & Search Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/40 pb-2">
        <div className="flex flex-wrap gap-2">
          {/* TODOS Filter Button */}
          <button
            onClick={() => setFilterStatus('TODOS')}
            className={`rounded-2xl px-5 py-3 text-sm font-bold flex items-center gap-2 transition-all duration-200 border ${filterStatus === 'TODOS'
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/10'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={filterStatus === 'TODOS' ? 'text-white' : 'text-emerald-600'}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Todos</span>
          </button>

          {/* PENDIENTE Filter Button */}
          <button
            onClick={() => setFilterStatus('PENDIENTE')}
            className={`rounded-2xl px-5 py-3 text-sm font-bold flex items-center gap-2 transition-all duration-200 border ${filterStatus === 'PENDIENTE'
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/10'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={filterStatus === 'PENDIENTE' ? 'text-white' : 'text-amber-500'}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Pendiente</span>
          </button>

          {/* COMPLETADO Filter Button */}
          <button
            onClick={() => setFilterStatus('COMPLETADO')}
            className={`rounded-2xl px-5 py-3 text-sm font-bold flex items-center gap-2 transition-all duration-200 border ${filterStatus === 'COMPLETADO'
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/10'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={filterStatus === 'COMPLETADO' ? 'text-white' : 'text-emerald-500'}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>Completado</span>
          </button>

          {/* CANCELADO Filter Button */}
          <button
            onClick={() => setFilterStatus('CANCELADO')}
            className={`rounded-2xl px-5 py-3 text-sm font-bold flex items-center gap-2 transition-all duration-200 border ${filterStatus === 'CANCELADO'
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/10'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={filterStatus === 'CANCELADO' ? 'text-white' : 'text-rose-500'}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>Cancelado</span>
          </button>
        </div>

        {/* Search Input on the right */}
        <div className="relative w-full lg:w-[280px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar reservación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:outline-none shadow-sm transition"
          />
        </div>
      </div>

      {/* Reservations Grid List (Two columns on desktop xl+) */}
      {loading ? (
        <div className="text-center text-slate-500 py-16 font-medium">Cargando reservaciones...</div>
      ) : paginatedReservations.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/50 p-16 text-center shadow-inner">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 mx-auto mb-4">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <p className="text-slate-500 font-medium">No hay reservaciones registradas en este estado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {paginatedReservations.map((reservation) => (
            <div
              key={reservation._id}
              className={`rounded-[20px] border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between ${cardBorderAccents[reservation.status] || cardBorderAccents.PENDIENTE}`}
            >
              <div>
                {/* Top Row: User Avatar, Name, Email, Status & Created At */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3">
                  {(() => {
                    const matchedUser = usersList.find((u) => String(u.id || u.Id) === String(reservation.userId)) || {}
                    const customerName = matchedUser.name || matchedUser.Name || 'N/A'
                    const customerEmail = matchedUser.email || matchedUser.Email || 'Email no disponible'
                    const avatarLetter = String(customerName)[0]?.toUpperCase() || 'C'

                    return (
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-700 uppercase shadow-sm border border-purple-200/50">
                          {avatarLetter}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-900 text-base leading-tight">
                              {customerName}
                            </h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[reservation.status] || statusColors.PENDIENTE}`}>
                              {reservation.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium mt-0.5 leading-none">
                            {customerEmail}
                          </p>
                        </div>
                      </div>
                    )
                  })()}

                  <div className="flex items-center gap-3.5 self-end sm:self-center">
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-slate-400">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Creada: {new Date(reservation.createdAt).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>


                  </div>
                </div>

                {/* 2x2 Grid block with vertical & horizontal divider lines */}
                <div className="border border-slate-100 bg-slate-50/30 rounded-xl mt-3 grid grid-cols-2 overflow-hidden">
                  {/* Date column */}
                  <div className="p-3 flex items-center gap-3 border-r border-b border-slate-100">
                    <div className="p-2 rounded-xl bg-white border border-slate-100 text-emerald-600 shrink-0 shadow-sm">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fecha</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">{formatReservationDate(reservation.startDate)}</p>
                    </div>
                  </div>

                  {/* Hour column */}
                  <div className="p-3 flex items-center gap-3 border-b border-slate-100">
                    <div className="p-2 rounded-xl bg-white border border-slate-100 text-emerald-600 shrink-0 shadow-sm">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hora</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">{formatReservationTime(reservation.startDate)}</p>
                    </div>
                  </div>

                  {/* People column */}
                  <div className="p-3 flex items-center gap-3 border-r border-slate-100">
                    <div className="p-2 rounded-xl bg-white border border-slate-100 text-slate-500 shrink-0 shadow-sm">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Personas</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">{reservation.numberPeople}</p>
                    </div>
                  </div>

                  {/* Type column */}
                  <div className="p-3 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white border border-slate-100 text-slate-500 shrink-0 shadow-sm">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tipo</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">{reservation.typeReservation || 'Personal'}</p>
                    </div>
                  </div>
                </div>

                {/* Note Bubble Row */}
                <div className="border border-slate-100 bg-white rounded-xl p-3 mt-3 flex items-start gap-3 shadow-sm">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">Nota especial</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1">{reservation.description ? `"${reservation.description}"` : '—'}</p>
                  </div>
                </div>
              </div>

              {/* Footer Table Assignment and Actions */}
              <div className="mt-4 pt-3.5 border-t border-slate-100/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="text-slate-500 font-semibold text-xs">Mesa asignada:</span>
                  {reservation.tableId && reservation.tableId.length > 0 ? (
                    reservation.tableId.map((table) => (
                      <span key={table._id} className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-0.5 rounded-lg font-bold shadow-sm">
                        {table.tableName || 'Mesa'} (Cap: {table.tableCapacity || table.capacity})
                      </span>
                    ))
                  ) : (
                    <span className="text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-0.5 rounded-lg font-medium shadow-sm">
                      Mesa sin asignar
                    </span>
                  )}
                </div>

                {/* Accept/Reject operations */}
                {reservation.status === 'PENDIENTE' && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      disabled={updatingId === reservation._id}
                      onClick={() => handleUpdateStatus(reservation._id, 'COMPLETADO')}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-50"
                    >
                      {updatingId === reservation._id ? 'Actualizando...' : 'Completar'}
                    </button>
                    <button
                      disabled={updatingId === reservation._id}
                      onClick={() => handleUpdateStatus(reservation._id, 'CANCELADO')}
                      className="rounded-xl bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 text-xs font-bold hover:bg-rose-100 transition active:scale-[0.98] disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination & Counter Footer */}
      {!loading && filteredReservations.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100 mt-6">
          <p className="text-xs sm:text-sm font-semibold text-slate-500">
            Mostrando {startIndex} a {endIndex} de {filteredReservations.length} reservaciones
          </p>

          {/* Page Switcher */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition ${currentPage === pageNum
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {pageNum}
                </button>
              )
            })}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Selector Dropdown */}
          <div className="relative">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-4 pr-10 text-xs font-bold text-slate-600 hover:border-slate-300 focus:outline-none shadow-sm transition"
            >
              <option value={5}>5 por página</option>
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
            </select>
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>
        </div>
      )}

      {/* Modal de Nueva Reservación */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="rounded-[24px] border border-slate-100 bg-white shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                Nueva Reservación
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateReservationSubmit} className="space-y-4">
              {/* Cliente */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  Seleccionar Cliente
                </label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  required
                >
                  <option value="" disabled>Selecciona un cliente...</option>
                  {usersList.map(u => (
                    <option key={u.id || u.Id || u._id} value={u.id || u.Id || u._id}>
                      {u.name || u.Name || 'Usuario'} ({u.email || u.Email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mesas */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  Seleccionar Mesas (Multiselección)
                </label>
                <select
                  multiple
                  value={formData.tableId}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value)
                    setFormData(prev => ({ ...prev, tableId: selected }))
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition min-h-[90px]"
                  required
                >
                  {tablesList.map(t => (
                    <option key={t._id} value={t._id}>
                      Mesa #{t.numberTable || t.number} - Capacidad: {t.capacity} personas ({t.location || 'Salón'})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1 font-bold">Mantén presionado Ctrl (o Cmd) para seleccionar más de una mesa.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Personas */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    Número de Personas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.numberPeople}
                    onChange={(e) => setFormData(prev => ({ ...prev, numberPeople: e.target.value }))}
                    placeholder="Ej. 4"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                    required
                  />
                </div>

                {/* Tipo de Reservación */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    Tipo de Reservación
                  </label>
                  <select
                    value={formData.typeReservation}
                    onChange={(e) => setFormData(prev => ({ ...prev, typeReservation: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  >
                    <option value="PERSONAL">Personal</option>
                    <option value="EVENTO">Evento</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Fecha Inicio */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    Fecha/Hora Inicio
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                    required
                  />
                </div>

                {/* Fecha Fin */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    Fecha/Hora Fin
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                    required
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  Descripción / Notas Especiales
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ej. Mesa cerca de la ventana, celebración de cumpleaños..."
                  rows="3"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                ></textarea>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition disabled:opacity-50"
                >
                  {saving ? 'Creando...' : 'Crear Reservación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
