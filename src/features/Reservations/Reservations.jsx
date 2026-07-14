import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getRestaurants } from '../../shared/api/restaurants'
import { getTables } from '../../shared/api/tables'
import { getAllUsers } from '../../shared/api/users'
import {
  cancelReservation,
  createReservation,
  getReservations,
  updateReservation,
  updateReservationStatus,
} from '../../shared/api/reservations'
import { showError, showSuccess } from '../../shared/utils/toast'
import {
  STATUS_OPTIONS,
  getErrorMessage,
  statusLabel,
  toInputDateTime,
  isClientRole,
  getUserId,
  getUserLabel
} from './utils/reservationHelpers'
import { ReservationStats } from './components/Admin/ReservationStats'
import { AdminReservationList } from './components/Admin/AdminReservationList'
import { AdminReservationModal } from './components/Admin/AdminReservationModal'
import { AdminReservationDetail } from './components/Admin/AdminReservationDetail'
import { FilterBar } from '../../shared/components/ui/FilterBar'

const emptyForm = {
  userId: '',
  restaurantId: '',
  tableId: [],
  numberPeople: 1,
  typeReservation: 'PERSONAL',
  description: '',
  coupon: '',
  startDate: '',
  endDate: '',
  photo: null,
}

export const Reservations = () => {
  const [reservations, setReservations] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [users, setUsers] = useState([])
  const [tables, setTables] = useState([])
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [editingReservation, setEditingReservation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  const [searchParams, setSearchParams] = useSearchParams()

  const usersById = useMemo(() => {
    return new Map(users.map((user) => [getUserId(user), user]))
  }, [users])

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const searchLower = searchTerm.toLowerCase()
      const resId = reservation._id || ''
      const user = usersById.get(String(reservation.userId || ''))
      const userLabel = user ? getUserLabel(user) : ''
      const type = reservation.typeReservation || ''

      const matchesSearch =
        !searchTerm ||
        resId.toLowerCase().includes(searchLower) ||
        userLabel.toLowerCase().includes(searchLower) ||
        type.toLowerCase().includes(searchLower)

      let matchesDate = true
      if (startDate || endDate) {
        const itemDate = new Date(reservation.startDate || reservation.createdAt)
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
  }, [reservations, searchTerm, startDate, endDate, usersById])

  const stats = useMemo(() => ({
    total: filteredReservations.length,
    pending: filteredReservations.filter((r) => r.status === 'PENDIENTE').length,
    canceled: filteredReservations.filter((r) => r.status === 'CANCELADO').length,
  }), [filteredReservations])


  const loadInitialData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [reservationsRes, restaurantsRes, usersRes] = await Promise.all([
        getReservations(),
        getRestaurants({ limit: 100 }),
        getAllUsers().catch(() => ({ data: { users: [] } })),
      ])

      setReservations(reservationsRes.data?.reservations || [])
      setRestaurants(restaurantsRes.data?.data || [])
      setUsers((usersRes.data?.users || []).filter((user) => isClientRole(user)))
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar la información de reservaciones.'))
    } finally {
      setLoading(false)
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
    loadTables(form.restaurantId)
  }, [form.restaurantId])

  useEffect(() => {
    const couponParam = searchParams.get('coupon')
    if (!couponParam) return

    setForm({ ...emptyForm, coupon: couponParam })
    setEditingReservation(null)
    setIsModalOpen(true)

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('coupon')
    setSearchParams(nextParams, { replace: true })
  }, [searchParams, setSearchParams])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingReservation(null)
    setIsModalOpen(false)
  }

  const toggleTableSelection = (tableId) => {
    setForm((prev) => {
      const selected = prev.tableId.includes(tableId)
        ? prev.tableId.filter((id) => id !== tableId)
        : [...prev.tableId, tableId]
      return { ...prev, tableId: selected }
    })
  }

  const startEditing = (reservation) => {
    setEditingReservation(reservation)
    setSelectedReservation(reservation)
    setForm({
      userId: reservation.userId || '',
      restaurantId: reservation.restaurantId?._id || reservation.restaurantId || '',
      tableId: (reservation.tableId || []).map((table) => table._id || table),
      numberPeople: reservation.numberPeople || 1,
      typeReservation: reservation.typeReservation || 'PERSONAL',
      description: reservation.description || '',
      coupon: reservation.coupon || '',
      startDate: toInputDateTime(reservation.startDate),
      endDate: toInputDateTime(reservation.endDate),
      photo: null,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.userId) {
      showError('Selecciona un usuario para la reservación.')
      return
    }

    if (!form.restaurantId || form.tableId.length === 0) {
      showError('Selecciona restaurante y al menos una mesa.')
      return
    }

    if (form.typeReservation === 'EVENTO' && !form.description.trim()) {
      showError('Las reservas de evento requieren descripción.')
      return
    }

    const payload = {
      userId: form.userId,
      restaurantId: form.restaurantId,
      tableId: form.tableId,
      numberPeople: Number(form.numberPeople) || 1,
      typeReservation: form.typeReservation,
      description: form.description,
      coupon: form.coupon?.trim() || undefined,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      photo: form.photo,
    }

    setSaving(true)
    try {
      if (editingReservation) {
        await updateReservation(editingReservation._id, payload)
        showSuccess('Reserva actualizada correctamente.')
      } else {
        await createReservation(payload)
        showSuccess('Reserva creada correctamente.')
      }

      resetForm()
      await loadInitialData()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo guardar la reservación.'))
    } finally {
      setSaving(false)
    }
  }

  const handleStatusUpdate = async (reservation, status) => {
    try {
      await updateReservationStatus(reservation._id, status)
      showSuccess('Estado de reservación actualizado.')
      await loadInitialData()
      if (selectedReservation?._id === reservation._id) {
        setSelectedReservation((prev) => ({ ...prev, status }))
      }
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo actualizar el estado.'))
    }
  }

  const handleCancel = async (reservation) => {
    if (!window.confirm('¿Deseas cancelar esta reservación?')) return

    try {
      await cancelReservation(reservation._id)
      showSuccess('Reservación cancelada.')
      await loadInitialData()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo cancelar la reservación.'))
    }
  }

  return (
    <section className="space-y-6 font-sans text-slate-300 antialiased max-w-[1600px] mx-auto p-4 md:p-6">
      
      {/* Header en Sintonía con Entornos Oscuros */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Libro de Reservas</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Gestión de Reservas
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Organiza y audita las reservas del salón, asignación de mesas y eventos corporativos o personales.
          </p>
        </div>
        
        <div>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-sky-500 active:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Reserva
          </button>
        </div>
      </header>

      {/* Grid General */}
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        
        {/* Lado Izquierdo: Monitor de Reservas */}
        <div className="space-y-6">
          
          {/* Card de Filtros Básicos y Controles Operativos */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Listado de reservas</h2>
              <p className="text-xs text-slate-400">Verifica la ocupación futura y estados de confirmación.</p>
            </div>

            {/* Inyección de Estadísticas */}
            <div className="pt-1">
              <ReservationStats total={stats.total} pending={stats.pending} canceled={stats.canceled} />
            </div>

            {/* Filtros Globales Reutilizables */}
            <div className="pt-2 border-t border-slate-800/60">
              <FilterBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                searchPlaceholder="Buscar por ID, cliente o tipo..."
              />
            </div>
          </div>

          {/* Componente del Listado Central */}
          <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
            <AdminReservationList
              loading={loading}
              error={error}
              reservations={filteredReservations}
              selectedReservation={selectedReservation}
              setSelectedReservation={setSelectedReservation}
              usersById={usersById}
              startEditing={startEditing}
              handleCancel={handleCancel}
              handleStatusUpdate={handleStatusUpdate}
            />
          </div>
        </div>

        {/* Lado Derecho: Panel de Detalle Fijo/Sticky */}
        <aside className="h-fit sticky top-6">
          <AdminReservationDetail 
            selectedReservation={selectedReservation}
            usersById={usersById}
          />
        </aside>
      </div>

      {/* Modal CRUD Flotante */}
      <AdminReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        form={form}
        setForm={setForm}
        handleSubmit={handleSubmit}
        saving={saving}
        editingReservation={editingReservation}
        users={users}
        restaurants={restaurants}
        tables={tables}
        toggleTableSelection={toggleTableSelection}
      />
    </section>
  )
}