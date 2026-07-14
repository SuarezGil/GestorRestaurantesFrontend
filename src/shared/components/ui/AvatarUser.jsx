import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../../../features/auth/store/authStore";
import defaultAvatarImg from "../../../assets/img/AvatarUserDefault.webp";

export const AvatarUser = () => {
    const { user, logout } = useAuthStore();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const toggleMenu = () => setOpen((prev) => !prev);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/", { replace: true });
    };

    const profilePicture =
        user?.profilePicture ||
        user?.ProfilePicture ||
        user?.UserProfile?.Imagen ||
        user?.UserProfile?.ProfilePicture ||
        "";

    const avatarSrc =
        profilePicture && profilePicture.trim() !== ""
            ? profilePicture
            : defaultAvatarImg;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Avatar trigger button */}
            <button
                onClick={toggleMenu}
                className={`flex items-center gap-2 p-1 rounded-full border-2 transition-colors duration-200 bg-transparent cursor-pointer ${open ? "border-emerald-300" : "border-white/35 hover:border-emerald-300"
                    }`}
                aria-label="Menú de usuario"
            >
                <img
                    src={avatarSrc}
                    alt={user?.username || "Avatar"}
                    className="w-8 h-8 rounded-full object-cover block"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = defaultAvatarImg;
                    }}
                />

            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900/88 border border-white/20 rounded-[18px] shadow-xl z-50 overflow-hidden animate-fadeIn backdrop-blur-md">
                    {/* User info header */}
                    <div className="flex items-center gap-3 px-4 py-4 border-b border-white/15 bg-gradient-to-br from-emerald-500/18 to-slate-700/35">
                        <img
                            src={avatarSrc}
                            alt={user?.username}
                            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-300 flex-shrink-0"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = defaultAvatarImg;
                            }}
                        />
                        <div className="min-w-0">
                            <p className="m-0 text-sm font-bold text-slate-100 truncate font-display">
                                {user?.username || "Usuario"}
                            </p>
                            <p className="m-0 mt-0.5 text-xs text-slate-300 truncate">
                                {user?.email || ""}
                            </p>
                        </div>
                    </div>

                    {/* Menu items */}
                    <ul className="list-none m-0 p-2 space-y-0.5">
                        {user?.role === 'ADMIN_ROLE' && (
                            <li>
                                <Link
                                    to="/dashboard/usuarios"
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-100 hover:bg-white/10 transition-colors"
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                    Usuarios
                                </Link>
                            </li>
                        )}

                        <li className="border-t border-white/15 my-1.5 pt-1.5">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-300 hover:bg-rose-400/15 transition-colors text-left"
                            >
                                Cerrar sesión
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};