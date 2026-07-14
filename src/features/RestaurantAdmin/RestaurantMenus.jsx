import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/store/authStore'
import { getMenus, createMenu, updateMenu } from '../../shared/api/menus'
import { showError, showSuccess } from '../../shared/utils/toast'

const getErrMsg = (err, fallback) =>
  err?.response?.data?.errors?.[0]?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback

export const RestaurantMenus = () => {
  const user = useAuthStore((state) => state.user)
  const currentUserId = String(user?.Id || user?.id || user?._id || '')
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [formData, setFormData] = useState({
    menuName: '',
    menuPrice: '',
    menuCategory: 'PLATO_FUERTE',
    menuDescription: '',
    menuActive: true,
  })
  const [editingMenu, setEditingMenu] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('TODOS')
  const [searchQuery, setSearchQuery] = useState('')

  const loadMenus = async () => {
    if (!user?.restaurantId) return
    try {
      setLoading(true)
      const { data } = await getMenus({
        restaurantId: user.restaurantId,
        ...(currentUserId && { createdBy: currentUserId })
      })
      const onlyOwnMenus = (data?.menus || []).filter((menu) => {
        const menuRestaurantId = menu?.restaurantId?._id || menu?.restaurantId
        return String(menuRestaurantId || '') === String(user.restaurantId)
      })
      setMenus(onlyOwnMenus)
    } catch (err) {
      showError(getErrMsg(err, 'No se pudieron cargar los platos del menú.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.restaurantId) {
      loadMenus()
    } else {
      setLoading(false)
    }
  }, [user?.restaurantId, currentUserId])

  const handleSubmitMenu = async (e) => {
    e.preventDefault()
    if (!formData.menuName.trim()) {
      return showError('El nombre del plato es obligatorio.')
    }
    if (!formData.menuPrice) {
      return showError('El precio es obligatorio.')
    }
    if (!user?.restaurantId) {
      return showError('No tienes un restaurante asignado.')
    }

    setAdding(true)
    try {
      if (editingMenu) {
        // Update Mode
        await updateMenu(editingMenu._id, {
          menuName: formData.menuName,
          menuPrice: Number(formData.menuPrice),
          menuCategory: formData.menuCategory,
          menuDescription: formData.menuDescription,
          menuActive: formData.menuActive,
          restaurantId: user.restaurantId,
        })
        showSuccess('Plato actualizado exitosamente.')
      } else {
        // Create Mode
        await createMenu({
          menuName: formData.menuName,
          menuPrice: Number(formData.menuPrice),
          menuCategory: formData.menuCategory,
          menuDescription: formData.menuDescription,
          restaurantId: user.restaurantId,
        })
        showSuccess('Plato agregado exitosamente al menú.')
      }
      setShowModal(false)
      setEditingMenu(null)
      setFormData({ menuName: '', menuPrice: '', menuCategory: 'PLATO_FUERTE', menuDescription: '', menuActive: true })
      loadMenus()
    } catch (err) {
      showError(getErrMsg(err, editingMenu ? 'No se pudo actualizar el plato.' : 'No se pudo agregar el plato.'))
    } finally {
      setAdding(false)
    }
  }

  const filteredMenus = menus.filter((menu) => {
    const matchesCategory = categoryFilter === 'TODOS' || menu.menuCategory === categoryFilter
    const nameStr = menu.menuName?.toLowerCase() || ''
    const matchesSearch = searchQuery === '' || nameStr.includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const platosCount = menus.filter(m => m.menuCategory === 'PLATO_FUERTE').length
  const bebidasCount = menus.filter(m => m.menuCategory === 'BEBIDA').length
  const postresCount = menus.filter(m => m.menuCategory === 'POSTRE').length
  const totalCount = menus.length

  return (
    <div className="space-y-6">
      {/* Banner Superior Premium */}
      <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-r from-emerald-50 via-emerald-50/60 to-emerald-100/30 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden relative shadow-sm">
        <div className="space-y-3 z-10">
          <span className="inline-flex rounded-full bg-emerald-100 border border-emerald-200/50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
            Menús
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Gestión de Menús
          </h1>
          <p className="text-sm text-slate-500 max-w-[580px] leading-relaxed">
            Administra los platos, postres y bebidas de tu restaurante de forma rápida y sencilla.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingMenu(null)
            setFormData({ menuName: '', menuPrice: '', menuCategory: 'PLATO_FUERTE', menuDescription: '', menuActive: true })
            setShowModal(true)
          }}
          className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition shadow-sm hover:shadow active:scale-[0.98] shrink-0 self-start sm:self-center z-10 flex items-center justify-center gap-1.5"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Nuevo Plato</span>
        </button>
      </div>

      {/* Metrics Row (4 columns) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Platos */}
        <div className="bg-white border border-slate-100/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:shadow transition">
          <div className="rounded-2xl bg-emerald-50 border border-emerald-100/40 p-3 text-emerald-600 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-800 block leading-none">{platosCount}</span>
            <span className="text-xs font-bold text-slate-700 block mt-1">Platos</span>
            <span className="text-[10px] font-semibold text-slate-400 block leading-none mt-0.5">activos</span>
          </div>
        </div>

        {/* Bebidas */}
        <div className="bg-white border border-slate-100/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:shadow transition">
          <div className="rounded-2xl bg-purple-50 border border-purple-100/40 p-3 text-purple-600 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-800 block leading-none">{bebidasCount}</span>
            <span className="text-xs font-bold text-slate-700 block mt-1">Bebidas</span>
            <span className="text-[10px] font-semibold text-slate-400 block leading-none mt-0.5">activas</span>
          </div>
        </div>

        {/* Postres */}
        <div className="bg-white border border-slate-100/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:shadow transition">
          <div className="rounded-2xl bg-amber-50 border border-amber-100/40 p-3 text-amber-500 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-800 block leading-none">{postresCount}</span>
            <span className="text-xs font-bold text-slate-700 block mt-1">Postres</span>
            <span className="text-[10px] font-semibold text-slate-400 block leading-none mt-0.5">activos</span>
          </div>
        </div>

        {/* Total Elementos */}
        <div className="bg-white border border-slate-100/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:shadow transition">
          <div className="rounded-2xl bg-blue-50 border border-blue-100/40 p-3 text-blue-600 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-800 block leading-none">{totalCount}</span>
            <span className="text-xs font-bold text-slate-700 block mt-1">Total</span>
            <span className="text-[10px] font-semibold text-slate-400 block leading-none mt-0.5">elementos</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/40 pb-2">
        {/* Categories Selector */}
        <div className="relative w-full sm:w-[220px]">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-xs font-bold text-slate-600 hover:border-slate-300 focus:outline-none shadow-sm transition"
          >
            <option value="TODOS">Todas las categorías</option>
            <option value="PLATO_FUERTE">Plato fuerte</option>
            <option value="BEBIDA">Bebida</option>
            <option value="POSTRE">Postre</option>
          </select>
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-[280px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar plato..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none transition shadow-sm"
          />
        </div>
      </div>

      {/* Menus Grid */}
      {loading ? (
        <div className="text-center text-slate-500 py-16 font-medium">Cargando catálogo del menú...</div>
      ) : filteredMenus.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/50 p-16 text-center shadow-inner">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 mx-auto mb-4">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <p className="text-slate-500 font-medium">No se encontraron platos registrados en esta categoría</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {filteredMenus.map((menu) => (
            <div key={menu._id} className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 p-5">
              <div className="flex gap-5">
                {/* Dish Photo */}
                <div className="shrink-0">
                  {menu.menuPhoto ? (
                    <img
                      src={menu.menuPhoto}
                      alt={menu.menuName}
                      className="aspect-square h-[120px] w-[120px] sm:h-[130px] sm:w-[130px] object-cover rounded-2xl shadow-sm border border-slate-100"
                    />
                  ) : (
                    <div className="aspect-square h-[120px] w-[120px] sm:h-[130px] sm:w-[130px] rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 flex flex-col items-center justify-center text-slate-400 gap-1 shadow-inner shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" className="text-slate-300">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Sin foto</span>
                    </div>
                  )}
                </div>

                {/* Details Column */}
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    {/* Category tag */}
                    <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      menu.menuCategory === 'PLATO_FUERTE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      menu.menuCategory === 'BEBIDA' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {menu.menuCategory === 'PLATO_FUERTE' ? 'PLATO FUERTE' :
                       menu.menuCategory === 'BEBIDA' ? 'BEBIDA' : 'POSTRE'}
                    </span>

                    {/* Name */}
                    <h3 className="font-extrabold text-slate-800 text-lg tracking-tight mt-2 leading-tight">
                      {menu.menuName}
                    </h3>
                    
                    {/* Code under title */}
                    <p className="text-[10px] text-slate-400 font-extrabold mt-0.5 uppercase tracking-wider">
                      Código: Q{menu.menuPrice}
                    </p>
                  </div>

                  {/* Price badge */}
                  <span className="text-sm font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-xl self-start w-fit mt-1.5 shadow-sm">
                    Q{Number(menu.menuPrice || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Footer divider and metadata row */}
              <div className="mt-4 pt-3.5 border-t border-slate-100/60 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Category */}
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    </svg>
                    <span>Categoría</span>
                    <span className="text-slate-600 font-extrabold">
                      {menu.menuCategory === 'PLATO_FUERTE' ? 'Plato fuerte' :
                       menu.menuCategory === 'BEBIDA' ? 'Bebida' : 'Postre'}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${menu.menuActive !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <span>Estado</span>
                    <span className={`font-extrabold ${menu.menuActive !== false ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {menu.menuActive !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                {/* Edit & Menu buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setEditingMenu(menu)
                      setFormData({
                        menuName: menu.menuName,
                        menuPrice: menu.menuPrice,
                        menuCategory: menu.menuCategory,
                        menuDescription: menu.menuDescription || '',
                        menuActive: menu.menuActive ?? true
                      })
                      setShowModal(true)
                    }}
                    className="rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 transition active:scale-[0.98] flex items-center gap-1"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900">
              {editingMenu ? 'Editar Plato' : 'Nuevo Plato'}
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Nombre del Plato</label>
                <input
                  type="text"
                  value={formData.menuName}
                  onChange={(e) => setFormData({ ...formData, menuName: e.target.value })}
                  placeholder="Ej: Carne Asada"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition animate-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Precio (Q)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.menuPrice}
                  onChange={(e) => setFormData({ ...formData, menuPrice: e.target.value })}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition animate-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Categoría</label>
                <select
                  value={formData.menuCategory}
                  onChange={(e) => setFormData({ ...formData, menuCategory: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition animate-none"
                >
                  <option value="PLATO_FUERTE">Plato Fuerte</option>
                  <option value="POSTRE">Postre</option>
                  <option value="BEBIDA">Bebida</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Descripción</label>
                <textarea
                  value={formData.menuDescription}
                  onChange={(e) => setFormData({ ...formData, menuDescription: e.target.value })}
                  placeholder="Describe el plato..."
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition resize-none animate-none"
                />
              </div>

              {/* Status Switch (Only displayed when editing) */}
              {editingMenu && (
                <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                  <div>
                    <span className="block text-xs font-bold text-slate-800">Plato Activo</span>
                    <span className="block text-[10px] text-slate-400 font-semibold leading-tight mt-0.5">Determina si está disponible en la carta</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.menuActive}
                      onChange={(e) => setFormData({ ...formData, menuActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingMenu(null)
                }}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitMenu}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
              >
                {editingMenu ? 'Guardar Cambios' : 'Crear Plato'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
