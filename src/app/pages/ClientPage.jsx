import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../../features/auth/store/authStore'
import { ReservationView } from '../../features/Reservations/ReservationView'
import { ClientOrderView } from '../../features/Orders/ClientOrderView'
import { getMyOrders } from '../../shared/api/orders'
import { getMenus } from '../../shared/api/menus'
import { getRestaurants } from '../../shared/api/restaurants'
import { getTopSellingMenus } from '../../shared/api/statistics'
import { getMyReservations } from '../../shared/api/reservations'
import { getMyInvoices, exportInvoicePdf } from '../../shared/api/invoices'
import { Outlet, NavLink, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import FondoImg from '../../assets/img/Fondo.jpg'
import LogoImg from '../../assets/img/Logo.png'
import PostresImg from '../../assets/img/Postres.jpg'
import PlatoImg from '../../assets/img/Plato fuerte.jpg'
import BebidasImg from '../../assets/img/Bebidas.jpg'
import { showError } from '../../shared/utils/toast'

export const ClientHome = () => {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [recentOrders, setRecentOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState(null)
  const [featuredMenus, setFeaturedMenus] = useState([])
  const [nextReservation, setNextReservation] = useState(null)
  const [reservationLoading, setReservationLoading] = useState(true)
  const [reservationError, setReservationError] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const loadOrders = async () => {
      setOrdersLoading(true)
      setOrdersError(null)
      try {
        const response = await getMyOrders()
        setRecentOrders(response.data?.orders || [])
      } catch (err) {
        setOrdersError('No se pudieron cargar tus pedidos.')
      } finally {
        setOrdersLoading(false)
      }
    }

    const loadFeaturedMenus = async () => {
      try {
        const menusResponse = await getTopSellingMenus()
        const menus = menusResponse.data?.data?.topSellingMenus || []
        setFeaturedMenus(menus)
      } catch (err) {
        setFeaturedMenus([])
      }
    }

    const loadNextReservation = async () => {
      setReservationLoading(true)
      setReservationError(null)
      try {
        const response = await getMyReservations()
        const reservations = response.data?.reservations || []
        const now = Date.now()

        const activeOrUpcoming = reservations
          .filter((reservation) => {
            if (reservation.status === 'CANCELADO') return false

            const start = new Date(reservation.startDate).getTime()
            const end = new Date(reservation.endDate).getTime()

            if (!Number.isFinite(start)) return false

            // Prefer reservations that are currently active or upcoming.
            if (Number.isFinite(end)) {
              return end >= now
            }

            return start >= now
          })
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))

        const next = activeOrUpcoming[0] || null

        setNextReservation(next)
      } catch (err) {
        setReservationError('No se pudo cargar tu próxima reserva.')
        setNextReservation(null)
      } finally {
        setReservationLoading(false)
      }
    }

    loadOrders()
    loadFeaturedMenus()
    loadNextReservation()
    setTimeout(() => setMounted(true), 60)
  }, [])

  const formatOrderDate = (value) => {
    if (!value) return ''
    return new Date(value).toLocaleDateString('es-GT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  const formatReservationDate = (value) => {
    if (!value) return ''
    return new Date(value).toLocaleDateString('es-GT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  const formatReservationTime = (value) => {
    if (!value) return ''
    return new Date(value).toLocaleTimeString('es-GT', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <section className="font-serif relative overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-center">
          <div className={`space-y-6 rounded-[32px] border border-slate-800/80 bg-slate-900/70 p-8 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.8)] backdrop-blur-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div>
              <p className={`inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.26em] text-orange-300 transition-all duration-500 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                ¡Bienvenido de vuelta!
              </p>
              <h1 className={`font-serif mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                Hola, <span className="text-orange-400">{user?.name?.split(' ')[0] || 'Cliente'}</span>
              </h1>
              <p className={`font-serif mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg transition-all duration-800 delay-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                Gestiona tus reservas, pedidos y facturas de forma rápida y sencilla.
              </p>
            </div>

            <div className={`grid gap-4 sm:grid-cols-2 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <button
                type="button"
                onClick={() => navigate('restaurants')}
                className="inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-400 hover:scale-105 active:scale-95"
              >
                Explorar restaurantes
              </button>
              <button
                type="button"
                onClick={() => navigate('menu')}
                className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/80 px-6 py-3 text-sm font-semibold text-white transition-all hover:border-slate-500 hover:bg-slate-900 hover:scale-105 active:scale-95"
              >
                Explorar menú
              </button>
            </div>
          </div>

          <div className={`rounded-[32px] border border-slate-800/80 bg-slate-950/70 p-8 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.8)] backdrop-blur-sm transition-all duration-800 delay-100 ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`}>
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-6 text-center">
              <img src={LogoImg} alt="Logo" className={`h-56 w-56 rounded-[36px] border border-white/10 object-contain bg-slate-950 p-4 shadow-xl transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-6 scale-90'}`} />
              <div>
                <p className="font-serif text-xs uppercase tracking-[0.24em] text-slate-400">Tu restaurante</p>
                <h3 className="font-serif mt-2 text-xl font-semibold text-white">Fuego y Sabor</h3>
                <p className="font-serif mt-2 text-sm text-slate-400">Explora el menú y haz tu pedido con un solo clic.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="font-serif mb-4 text-lg font-semibold text-slate-200">Te puede interesar</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { img: PostresImg, title: 'Postres', category: 'POSTRE' },
              { img: PlatoImg, title: 'Platos fuertes', category: 'PLATO_FUERTE' },
              { img: BebidasImg, title: 'Bebidas', category: 'BEBIDA' }
            ].map((c) => (
              <button
                key={c.title}
                type="button"
                onClick={() => navigate(`menu?category=${c.category}`)}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] transition hover:-translate-y-1"
              >
                <img src={c.img} alt={c.title} className="h-40 w-full object-cover opacity-95 transition duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-4 px-4">
                  <p className="text-sm font-semibold uppercase tracking-wider text-slate-200">{c.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <article className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.9)]">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-orange-300">Promoción del día</p>
              <h2 className="mt-4 text-3xl font-semibold text-white">Recomendaciones para ti</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                Descubre algunos de los platillos más populares directamente de nuestro menú.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {featuredMenus.length > 0 ? (
                featuredMenus.map((menu) => (
                  <button
                    key={menu.menuId || menu._id}
                    type="button"
                    onClick={() => navigate(`menu?category=${menu.menuCategory}`)}
                    className="group overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 text-left transition hover:border-orange-400/20 hover:bg-slate-800"
                  >
                    {menu.menuPhoto ? (
                      <img
                        src={menu.menuPhoto}
                        alt={menu.dishName}
                        className="h-40 w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-slate-900 text-6xl font-semibold text-slate-400">
                        {menu.dishName?.charAt(0) || 'M'}
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-sm uppercase tracking-[0.22em] text-orange-300">{menu.menuCategory?.replace('_', ' ') || 'Menú'}</p>
                      <h3 className="mt-3 text-xl font-semibold text-white">{menu.dishName}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{menu.menuDescription || 'Plato popular según ventas.'}</p>
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <span className="text-lg font-semibold text-white">Q{menu.menuPrice}</span>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">Ver menú</span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 text-slate-300">No hay menús disponibles para promoción.</div>
              )}
            </div>
          </article>

          <article className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Próxima reserva</p>
                <h3 className="mt-3 text-xl font-semibold text-white">
                  {reservationLoading
                    ? 'Cargando...'
                    : nextReservation
                      ? formatReservationDate(nextReservation.startDate)
                      : 'Sin reservas próximas'}
                </h3>
              </div>
              {nextReservation && (
                <span className="rounded-2xl bg-slate-800 px-4 py-2 text-sm text-slate-300">
                  {(nextReservation.tableId || [])
                    .map((table) => table.tableNumber || table.tableName || table._id?.slice(-4) || table)
                    .join(', ')}
                </span>
              )}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              {reservationError
                ? reservationError
                : nextReservation
                  ? `${nextReservation.numberPeople || 1} ${(nextReservation.numberPeople || 1) === 1 ? 'persona' : 'personas'} · ${formatReservationTime(nextReservation.startDate)} · ${nextReservation.restaurantId?.restaurantName || 'Restaurante'}`
                  : 'Aún no tienes reservaciones activas. Reserva tu mesa y aparecerá aquí.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('restaurants')}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white"
            >
              Ver restaurantes
            </button>
          </article>
        </div>

        <section className="mt-10 rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Pedidos recientes</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Mantente al día con tus pedidos</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('orders')}
              className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
            >
              Ver todos
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {ordersLoading ? (
              <div className="col-span-full rounded-[28px] border border-slate-800/80 bg-slate-950/80 p-6 text-center text-slate-400">Cargando pedidos…</div>
            ) : ordersError ? (
              <div className="col-span-full rounded-[28px] border border-rose-500/20 bg-rose-500/10 p-6 text-center text-rose-200">{ordersError}</div>
            ) : recentOrders.length === 0 ? (
              <div className="col-span-full rounded-[28px] border border-slate-800/80 bg-slate-950/80 p-6 text-center text-slate-300">
                No tienes pedidos recientes. Explora el menú y haz tu primer pedido.
              </div>
            ) : (
              recentOrders.slice(0, 3).map((order) => (
                <article key={order._id} className="rounded-[28px] border border-white/10 bg-slate-950/90 p-5 shadow-sm transition hover:border-orange-400/30">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{order.orderType === 'A_DOMICILIO' ? 'A domicilio' : 'En restaurante'}</p>
                      <h3 className="mt-3 text-lg font-semibold text-white">Pedido #{order._id?.slice(-6)}</h3>
                    </div>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">{formatOrderDate(order.date || order.createdAt)}</span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-400">Total Q{Number(order.total || 0).toFixed(2)} · Estado: {order.status || 'Pendiente'}</p>
                  <button
                    type="button"
                    onClick={() => navigate('orders')}
                    className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-white"
                  >
                    Ver detalles
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  )
}

export const ClientOrders = () => <ClientOrderView />

const MENU_CATEGORIES = [
  { key: 'ENTRADA',      label: 'Entradas',       accent: 'text-amber-300',  badge: 'bg-amber-500/15 text-amber-300',  border: 'border-amber-500/30' },
  { key: 'PLATO_FUERTE', label: 'Platos Fuertes', accent: 'text-orange-300', badge: 'bg-orange-500/15 text-orange-300', border: 'border-orange-500/30' },
  { key: 'BEBIDA',       label: 'Bebidas',         accent: 'text-sky-300',    badge: 'bg-sky-500/15 text-sky-300',       border: 'border-sky-500/30' },
  { key: 'POSTRE',       label: 'Postres',         accent: 'text-pink-300',   badge: 'bg-pink-500/15 text-pink-300',     border: 'border-pink-500/30' },
]

function MenuCard({ menu, compact = false }) {
  const restaurantName = menu.restaurantId?.restaurantName || null
  return (
    <article className={`group overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/70 transition hover:border-orange-400/20 hover:bg-slate-900 ${
      compact ? 'w-44 shrink-0' : ''
    }`}>
      {menu.menuPhoto ? (
        <img
          src={menu.menuPhoto}
          alt={menu.menuName}
          className={`w-full object-cover transition duration-300 group-hover:scale-105 ${compact ? 'h-32' : 'h-44'}`}
        />
      ) : (
        <div className={`flex items-center justify-center bg-slate-900 text-4xl font-bold text-slate-600 ${compact ? 'h-32' : 'h-44'}`}>
          {menu.menuName?.charAt(0) || 'M'}
        </div>
      )}
      <div className="p-3">
        <p className="truncate text-sm font-semibold text-white">{menu.menuName}</p>
        {!compact && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{menu.menuDescription}</p>}
        <p className="mt-1 text-sm font-bold text-orange-400">Q{menu.menuPrice}</p>
        {restaurantName && (
          <p className="mt-1 truncate text-xs text-slate-500">{restaurantName}</p>
        )}
      </div>
    </article>
  )
}

function RestaurantPicker({ restaurants, selectedId, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = React.useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const all = [{ _id: '', restaurantName: 'Restaurantes generales', restaurantPhoto: null }, ...restaurants]
  const active = all.find((r) => r._id === selectedId) || all[0]

  return (
    <div ref={ref} className="relative flex flex-col gap-2 sm:items-end">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Restaurante</p>

      {/* Tarjeta activa */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group relative h-24 w-72 overflow-hidden rounded-[24px] border border-white/10 shadow-lg transition hover:border-orange-400/30"
      >
        {active.restaurantPhoto ? (
          <img src={active.restaurantPhoto} alt={active.restaurantName} className="absolute inset-0 h-full w-full object-cover brightness-50 transition duration-300 group-hover:brightness-60" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="relative flex h-full items-end justify-between px-4 pb-3">
          <p className="text-sm font-bold text-white drop-shadow">{active.restaurantName}</p>
          <svg
            className={`h-4 w-4 shrink-0 text-slate-300 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown de tarjetas */}
      {open && (
        <div className="fixed right-4 top-[180px] z-[9999] mt-2 flex w-72 flex-col gap-2 rounded-[28px] border border-white/10 bg-slate-900/95 p-3 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md sm:right-auto sm:top-auto sm:absolute sm:right-0 sm:top-full">
          {all.map((r) => (
            <button
              key={r._id}
              type="button"
              onClick={() => { onChange(r._id); setOpen(false) }}
              className={`group relative h-20 w-full overflow-hidden rounded-[20px] border transition ${
                r._id === selectedId
                  ? 'border-orange-500/60 ring-2 ring-orange-500/20'
                  : 'border-white/10 hover:border-orange-400/30'
              }`}
            >
              {r.restaurantPhoto ? (
                <img src={r.restaurantPhoto} alt={r.restaurantName} className="absolute inset-0 h-full w-full object-cover brightness-50 transition duration-300 group-hover:brightness-60" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="relative flex h-full items-end px-4 pb-3">
                <p className="text-sm font-bold text-white drop-shadow">{r.restaurantName}</p>
                {r._id === selectedId && (
                  <span className="ml-auto shrink-0 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-slate-950">Activo</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


function MenuModal({ category, menus, onClose }) {
  const cat = MENU_CATEGORIES.find((c) => c.key === category)
  const items = menus.filter((m) => m.menuCategory === category)
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[88vh] overflow-y-auto rounded-[32px] border border-white/10 bg-slate-900 p-6 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${cat?.badge}`}>{cat?.label}</span>
            <h2 className="mt-3 text-2xl font-semibold text-white">{cat?.label}</h2>
            <p className="mt-1 text-sm text-slate-400">{items.length} platillo{items.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-700 bg-slate-950/80 p-2 text-slate-400 transition hover:border-slate-500 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {items.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-slate-950/40 py-16 text-center text-sm text-slate-500">
            No hay platillos disponibles en esta categoría.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((menu) => <MenuCard key={menu._id} menu={menu} />)}
          </div>
        )}
      </div>
    </div>
  )
}

export const ClientMenu = () => {
  const [menus, setMenus] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('')
  const [modalCategory, setModalCategory] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [menusRes, restaurantsRes] = await Promise.all([
          getMenus(),
          getRestaurants({ limit: 100, restaurantActive: true }),
        ])
        setMenus(menusRes.data?.menus || [])
        setRestaurants(restaurantsRes.data?.data || [])
      } catch (_err) {
        setError('No se pudo cargar el menú.')
      } finally {
        setLoading(false)
        setTimeout(() => setMounted(true), 60)
      }
    }
    loadData()
  }, [])

  const visibleMenus = selectedRestaurantId
    ? menus.filter((m) => String(m.restaurantId?._id || m.restaurantId) === selectedRestaurantId)
    : menus

  const selectedRestaurant = restaurants.find((r) => r._id === selectedRestaurantId)

  return (
    <section className="font-serif relative">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">

        {/* HEADER */}
        <header className={`relative rounded-[32px] border border-slate-800/80 bg-slate-900/70 p-8 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.8)] backdrop-blur-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <p className={`inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.26em] text-orange-300 transition-all duration-500 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                Carta del restaurante
              </p>
              <h1 className={`font-serif mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                Descubre nuestra <span className="text-orange-400">carta</span>
              </h1>
              <p className={`font-serif mt-4 max-w-xl text-base leading-8 text-slate-300 transition-all duration-800 delay-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                {selectedRestaurant
                  ? `Mostrando el menú de ${selectedRestaurant.restaurantName}.`
                  : 'Explora entradas, platos fuertes, bebidas y postres de todos nuestros restaurantes.'}
              </p>
            </div>

            {/* Selector de restaurante */}
            <RestaurantPicker
              restaurants={restaurants}
              selectedId={selectedRestaurantId}
              onChange={setSelectedRestaurantId}
            />
          </div>
        </header>

        {/* ESTADOS */}
        {loading && (
          <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-10 text-center text-slate-400">
            Cargando menú...
          </div>
        )}
        {!loading && error && (
          <div className="rounded-[32px] border border-rose-500/20 bg-rose-500/10 p-10 text-center text-rose-300">{error}</div>
        )}

        {/* LISTAS POR CATEGORÍA */}
        {!loading && !error && MENU_CATEGORIES.map(({ key, label, accent, badge, border }) => {
          const items = visibleMenus.filter((m) => m.menuCategory === key)
          return (
            <section key={key} className={`rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.9)] transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`} style={{ transitionDelay: `${300 + MENU_CATEGORIES.findIndex(c => c.key === key) * 100}ms` }}>
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${badge}`}>{label}</span>
                  <p className="mt-1.5 text-xs text-slate-500">{items.length} platillo{items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-slate-950/40 py-8 text-center text-sm text-slate-500">
                  Sin platillos en esta categoría
                  {selectedRestaurantId ? ' para este restaurante' : ''}.
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {items.map((menu) => (
                    <MenuCard key={menu._id} menu={menu} compact />
                  ))}
                  {/* Card ver más al final */}
                  <button
                    type="button"
                    onClick={() => setModalCategory(key)}
                    className={`flex w-36 shrink-0 flex-col items-center justify-center gap-2 rounded-[24px] border ${border} bg-slate-950/40 px-4 py-6 transition-all duration-300 hover:bg-slate-950/70 hover:scale-105 active:scale-95`}
                  >
                    <span className={`text-3xl font-bold ${accent}`}>+{items.length}</span>
                    <span className="text-xs font-semibold text-slate-300">Ver todos</span>
                  </button>
                </div>
              )}
            </section>
          )
        })}

        {/* MODAL */}
        {modalCategory && (
          <MenuModal
            category={modalCategory}
            menus={visibleMenus}
            onClose={() => setModalCategory(null)}
          />
        )}
      </div>
    </section>
  )
}

export const ClientInvoices = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const loadInvoices = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getMyInvoices()
        setInvoices(response.data?.invoices || [])
      } catch (_err) {
        setError('No se pudieron cargar tus facturas.')
        setInvoices([])
      } finally {
        setLoading(false)
        setTimeout(() => setMounted(true), 60)
      }
    }

    loadInvoices()
  }, [])

  const handleDownloadPdf = async (invoice) => {
    try {
      const response = await exportInvoicePdf(invoice._id)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${invoice.invoiceNumber || `factura-${invoice._id}`}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (_err) {
      showError('No se pudo descargar la factura.')
    }
  }

  return (
    <section className="font-serif relative overflow-hidden">
      <div className="relative mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className={`rounded-[32px] border border-slate-800/80 bg-slate-900/70 p-8 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.8)] backdrop-blur-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div>
            <p className={`inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.26em] text-orange-300 transition-all duration-500 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              Facturas
            </p>
            <h1 className={`font-serif mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
              Mis <span className="text-orange-400">facturas</span>
            </h1>
            <p className={`font-serif mt-4 max-w-2xl text-base leading-8 text-slate-300 transition-all duration-800 delay-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
              Revisa tus comprobantes reales y descarga tus documentos en PDF cuando lo necesites.
            </p>
          </div>
        </header>

        <div className="space-y-4">
        {loading && (
          <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-8 text-center text-slate-400">
            Cargando facturas...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-[28px] border border-rose-500/20 bg-rose-500/10 p-8 text-center text-rose-300">
            {error}
          </div>
        )}

        {!loading && !error && invoices.length === 0 && (
          <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-8 text-center text-slate-400">
            Aún no tienes facturas disponibles.
          </div>
        )}

        {!loading && !error && invoices.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            {invoices.map((invoice) => (
              <article key={invoice._id} className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.9)] hover:border-orange-400/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Factura</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{invoice.invoiceNumber || 'Sin número'}</h3>
                  </div>
                  <span className="rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300">
                    {new Date(invoice.issuedAt).toLocaleDateString('es-GT')}
                  </span>
                </div>

                <div className="mt-4 space-y-1 text-sm text-slate-400">
                  <p>Restaurante: {invoice.restaurantId?.restaurantName || 'N/A'}</p>
                  <p>Total: <span className="font-semibold text-orange-400">Q{Number(invoice.total || 0).toFixed(2)}</span></p>
                  <p>Estado pedido: {invoice.orderId?.status || 'N/A'}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadPdf(invoice)}
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:bg-orange-400"
                >
                  Descargar PDF
                </button>
              </article>
            ))}
          </div>
        )}
        </div>
      </div>
    </section>
  )
}

export const ClientPage = () => {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const userInitials = user?.name
    ? user.name
      .split(' ')
      .map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join('')
    : 'US'

  return (
    <div className="min-h-screen text-white bg-cover bg-center relative" style={{ backgroundImage: `url(${FondoImg})` }}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/70 pointer-events-none" />
      <header className="sticky top-0 z-20 border-b border-slate-900/70 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <button
            type="button"
            className="flex items-center gap-4 rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-left shadow-sm transition hover:border-slate-700"
            onClick={() => navigate('profile')}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-900 text-sm font-semibold text-white">
              {userInitials}
            </span>
            <div>
              <p className="text-sm font-semibold text-white">{user?.name ?? 'Cliente'}</p>
              <p className="text-xs text-slate-400">Perfil de usuario</p>
            </div>
          </button>

          <nav className="flex flex-wrap items-center gap-2">
            <NavLink
              to="/client"
              end
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${isActive
                  ? 'bg-orange-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-900'
                }`
              }
            >
              Inicio
            </NavLink>
            <NavLink
              to="/client/restaurants"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${isActive
                  ? 'bg-orange-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-900'
                }`
              }
            >
              Restaurantes
            </NavLink>
            <NavLink
              to="/client/menu"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${isActive
                  ? 'bg-orange-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-900'
                }`
              }
            >
              Menú
            </NavLink>
            <NavLink
              to="/client/orders"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${isActive
                  ? 'bg-orange-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-900'
                }`
              }
            >
              Pedidos
            </NavLink>
            <NavLink
              to="/client/invoices"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${isActive
                  ? 'bg-orange-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-900'
                }`
              }
            >
              Facturas
            </NavLink>
            <NavLink
              to="/client/reviews"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${isActive
                  ? 'bg-orange-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-900'
                }`
              }
            >
              Reseñas
            </NavLink>
          </nav>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
            onClick={logout}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet context={{ user }} />
      </main>
    </div>
  )
}