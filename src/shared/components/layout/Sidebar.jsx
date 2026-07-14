import { Link, useLocation } from "react-router-dom";

const navItems = [
  {
    label: "Inicio",
    to: "/dashboard",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11.5L12 4l9 7.5" />
        <path d="M9 21V13h6v8" />
      </svg>
    ),
  },
  {
    label: "Mesas",
    to: "/dashboard/mesas",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="4" rx="1" />
        <path d="M5 7v12M19 7v12M8 19h8" />
      </svg>
    ),
  },
  {
    label: "Menús",
    to: "/dashboard/menus",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
  },
  {
    label: "Órdenes",
    to: "/dashboard/orders",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    label: "Reservaciones",
    to: "/dashboard/reservations",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </svg>
    ),
  },
  {
    label: "Promociones",
    to: "/dashboard/promociones",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.6-4.9-2.7-4.9 2.7.9-5.6-4-3.9 5.5-.8L12 2z" />
      </svg>
    ),
  },
  {
    label: "Clientes frecuentes",
    to: "/dashboard/clientes-frecuentes",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Restaurantes",
    to: "/dashboard/restaurantes",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l19-9-9 19-2-8-8-2z" />
      </svg>
    ),
  },
  {
    label: "Inventario",
    to: "/dashboard/inventory",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    label: "Reseñas",
    to: "/dashboard/resenas",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    label: "Facturas",
    to: "/dashboard/facturas",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    label: "Estadísticas",
    to: "/dashboard/estadisticas",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: "Admins restaurante",
    to: "/dashboard/admin-restaurantes",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
      </svg>
    ),
  },
];

export const Sidebar = ({ items = navItems }) => {
  const location = useLocation();

  return (
    <aside className="w-60 flex-shrink-0 sticky top-16 h-[calc(100vh-64px)] bg-slate-900/58 border-r border-white/25 flex flex-col p-3 gap-1 overflow-y-auto backdrop-blur-md">
      {/* Section label */}
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white font-display px-2 mb-1.5">
        Módulos
      </p>

      <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
        {items.map((item) => {
          const isActive = (item.to === '/dashboard' || item.to === '/admin-restaurante') 
            ? location.pathname === item.to 
            : location.pathname.startsWith(item.to);

          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[0.85rem] border transition-all duration-150 no-underline
                  ${isActive
                    ? "bg-gradient-to-r from-emerald-500/32 to-teal-400/24 border-emerald-300/65 text-emerald-50 font-bold"
                    : "border-transparent text-white font-medium hover:bg-white/12 hover:text-white hover:border-white/25"
                  }`}
              >
                {/* Icon pill */}
                <span
                  className={`w-[30px] h-[30px] flex items-center justify-center rounded-lg flex-shrink-0 transition-all duration-150 ${
                    isActive
                      ? "bg-emerald-400 text-emerald-950"
                      : "bg-white/14 text-white"
                  }`}
                >
                  {item.icon}
                </span>

                <span className="flex-1 leading-snug drop-shadow-[0_1px_1px_rgba(0,0,0,0.55)]" style={{ color: '#fff' }}>{item.label}</span>

                {/* Active dot */}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 flex-shrink-0" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>

    </aside>
  );
};
