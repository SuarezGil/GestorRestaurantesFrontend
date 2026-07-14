import { useEffect, useMemo, useState } from 'react'
import { getRestaurants } from '../../shared/api/restaurants'
import { getMenus, createMenu, updateMenu, deleteMenu } from '../../shared/api/menus'
import { getInventories, createInventory, updateInventory } from '../../shared/api/inventory'
import { getActivePromotions } from '../../shared/api/promotions'
import { showError, showSuccess } from '../../shared/utils/toast'
import { FilterBar } from '../../shared/components/ui/FilterBar'
import { useAuthStore } from '../auth/store/authStore'

const CATEGORIES = [
  { value: '', label: 'Todas' },
  { value: 'ENTRADA', label: 'Entrada' },
  { value: 'PLATO_FUERTE', label: 'Plato Fuerte' },
  { value: 'POSTRE', label: 'Postre' },
  { value: 'BEBIDA', label: 'Bebida' }
]

const CATEGORY_COLORS = {
  ENTRADA: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PLATO_FUERTE: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  POSTRE: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  BEBIDA: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
}

const CATEGORY_LABELS = {
  ENTRADA: 'Entrada',
  PLATO_FUERTE: 'Plato Fuerte',
  POSTRE: 'Postre',
  BEBIDA: 'Bebida'
}

const emptyForm = {
  menuName: '',
  menuDescription: '',
  menuPrice: '',
  menuCategory: 'PLATO_FUERTE',
  restaurantId: '',
  menuActive: true,
  menuAvailable: true,
  menuPhoto: null,
  stockQuantity: '0'
}

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors?.length > 0) return data.errors[0].message
  return data?.message || error?.message || fallback
}

// COMPONENTE MODAL REESTILIZADO (Contraste Limpio)
function MenuFormModal({ form, setForm, editing, saving, photoPreview, setPhotoPreview, restaurants, onSubmit, onClose }) {
  const handleChange = (e) => {
    const { name, value, type, files } = e.target
    if (type === 'file') {
      const file = files?.[0] || null
      setForm(prev => ({ ...prev, menuPhoto: file }))
      setPhotoPreview(file ? URL.createObjectURL(file) : null)
      return
    }
    setForm(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl">
        
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">
              {editing ? 'Editar Platillo' : 'Nuevo Platillo'}
            </h2>
            <p className="text-xs text-slate-400">Completa los campos del catálogo gastronómico.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={onSubmit} className="grid gap-4 p-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
              Nombre del platillo *
            </label>
            <input
              name="menuName"
              value={form.menuName}
              onChange={handleChange}
              placeholder="Ej: Tacos al pastor"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
              Descripción
            </label>
            <textarea
              name="menuDescription"
              value={form.menuDescription}
              onChange={handleChange}
              rows={2}
              placeholder="Ingredientes, alérgenos o detalles extras..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                Precio (Q) *
              </label>
              <input
                type="number"
                name="menuPrice"
                value={form.menuPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                Categoría
              </label>
              <select
                name="menuCategory"
                value={form.menuCategory}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              >
                {CATEGORIES.filter(c => c.value).map(c => (
                  <option key={c.value} value={c.value} className="bg-slate-950">{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
              Restaurante Destino *
            </label>
            <select
              name="restaurantId"
              value={form.restaurantId}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              required
            >
              <option value="" className="bg-slate-950">Selecciona un restaurante</option>
              {restaurants.map(r => (
                <option key={r._id} value={r._id} className="bg-slate-950">{r.restaurantName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                Stock inicial disponible
              </label>
              <input
                type="number"
                name="stockQuantity"
                value={form.stockQuantity}
                onChange={handleChange}
                min="0"
                placeholder="0"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                Foto del platillo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="w-full text-xs text-slate-400 file:mr-3 file:rounded-xl file:border-0 file:bg-orange-500/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-orange-400 hover:file:bg-orange-500/20 file:transition-colors cursor-pointer"
              />
            </div>
          </div>

          {photoPreview && (
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 h-32 w-full">
              <img src={photoPreview} alt="Vista previa" className="h-full w-full object-cover" />
            </div>
          )}

          {/* Toggles Operativos */}
          <div className="grid gap-3 rounded-xl bg-slate-950 border border-slate-800/80 p-4 mt-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-200">Visible en catálogo</p>
                <p className="text-xs text-slate-500">Determina si el platillo aparece listado al público.</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, menuActive: !prev.menuActive }))}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${form.menuActive ? 'bg-emerald-500' : 'bg-slate-800'}`}
              >
                <span className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${form.menuActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="border-t border-slate-800/60" />

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-200">Disponibilidad de cocina</p>
                <p className="text-xs text-slate-500">Márcalo como "Agotado temporalmente" si faltan insumos.</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, menuAvailable: !prev.menuAvailable }))}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${form.menuAvailable ? 'bg-emerald-500' : 'bg-rose-500/50'}`}
              >
                <span className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${form.menuAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-3 border-t border-slate-800 mt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 active:bg-orange-700 transition-all disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editing ? 'Actualizar Platillo' : 'Crear Platillo'}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// COMPONENTE PRINCIPAL
export const Menus = () => {
  const user = useAuthStore((state) => state.user)
  const currentUserId = String(user?.Id || user?.id || user?._id || '')
  
  const [menus, setMenus] = useState([])
  const [inventories, setInventories] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [filterRestaurant, setFilterRestaurant] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredMenus = useMemo(() => {
    return menus.filter(menu => {
      const searchLower = searchTerm.toLowerCase()
      const name = menu.menuName || ''
      const category = menu.menuCategory || ''
      const price = String(menu.menuPrice || '')

      return !searchTerm || 
        name.toLowerCase().includes(searchLower) ||
        category.toLowerCase().includes(searchLower) ||
        price.toLowerCase().includes(searchLower)
    })
  }, [menus, searchTerm])

  const stats = useMemo(() => {
    return {
      total: filteredMenus.length,
      active: filteredMenus.filter(m => m.menuActive !== false).length,
      inactive: filteredMenus.filter(m => m.menuActive === false).length
    }
  }, [filteredMenus])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [restRes, menusRes, invRes, promoRes] = await Promise.all([
        getRestaurants({ limit: 100 }),
        getMenus().catch(() => ({ data: { menus: [] } })),
        getInventories().catch(() => ({ data: { inventories: [] } })),
        getActivePromotions().catch(() => ({ data: { promotions: [] } }))
      ])
      setRestaurants(restRes.data?.data || [])
      setMenus(menusRes.data?.menus || [])
      setInventories(invRes.data?.inventories || [])
      setPromotions(promoRes.data?.promotions || [])
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar la información.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [currentUserId])

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target
    if (type === 'file') {
      const file = files?.[0] || null
      setForm(prev => ({ ...prev, menuPhoto: file }))
      setPhotoPreview(file ? URL.createObjectURL(file) : null)
      return
    }
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setEditing(null)
    setForm({ ...emptyForm, restaurantId: filterRestaurant || '' })
    setPhotoPreview(null)
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, restaurantId: filterRestaurant || '' })
    setPhotoPreview(null)
    setShowModal(true)
  }

  const handleEdit = (menu) => {
    setEditing(menu)
    const menuInventory = inventories.find(inv => (inv.menuId?._id || inv.menuId) === menu._id)
    setForm({
      menuName: menu.menuName || '',
      menuDescription: menu.menuDescription || '',
      menuPrice: menu.menuPrice || '',
      menuCategory: menu.menuCategory || 'PLATO_FUERTE',
      restaurantId: menu.restaurantId?._id || menu.restaurantId || '',
      menuActive: menu.menuActive !== false,
      menuAvailable: menu.menuAvailable !== false,
      menuPhoto: null,
      stockQuantity: menuInventory ? String(menuInventory.quantity) : '0'
    })
    setPhotoPreview(menu.menuPhoto || null)
    setShowModal(true)
  }

  const handleToggleAvailable = async (menu) => {
    try {
      await updateMenu(menu._id, { menuAvailable: !menu.menuAvailable })
      showSuccess(menu.menuAvailable ? 'Marcado como agotado.' : 'Marcado como disponible.')
      await loadData()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo actualizar disponibilidad.'))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.menuName || !form.menuPrice || !form.restaurantId) {
      showError('Nombre, precio y restaurante son obligatorios.')
      return
    }
    setSaving(true)
    try {
      const menuPayload = {
        menuName: form.menuName,
        menuDescription: form.menuDescription,
        menuPrice: form.menuPrice,
        menuCategory: form.menuCategory,
        restaurantId: form.restaurantId,
        menuActive: form.menuActive,
        menuPhoto: form.menuPhoto
      }

      const inventoryPayload = {
        menuId: editing?._id,
        restaurantId: form.restaurantId,
        quantity: Number(form.stockQuantity) || 0
      }

      if (editing) {
        await updateMenu(editing._id, menuPayload)
        
        const menuInventory = inventories.find(inv => (inv.menuId?._id || inv.menuId) === editing._id)
        if (menuInventory) {
          await updateInventory(menuInventory._id, { quantity: inventoryPayload.quantity })
        } else {
          await createInventory(inventoryPayload)
        }
        showSuccess('Platillo actualizado.')
      } else {
        const createdMenuRes = await createMenu(menuPayload)
        const createdMenuId = createdMenuRes.data?.menu?._id
        
        if (createdMenuId) {
           await createInventory({
             menuId: createdMenuId,
             restaurantId: form.restaurantId,
             quantity: Number(form.stockQuantity) || 0
           })
        }
        showSuccess('Platillo creado.')
      }
      setShowModal(false)
      setEditing(null)
      setPhotoPreview(null)
      await loadData()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo guardar el platillo.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (menu) => {
    if (!window.confirm(`¿Eliminar "${menu.menuName}"?`)) return
    try {
      await deleteMenu(menu._id)
      showSuccess('Platillo eliminado.')
      await loadData()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo eliminar el platillo.'))
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditing(null)
    setPhotoPreview(null)
  }

  return (
    <section className="space-y-6 font-sans text-slate-300 antialiased max-w-[1600px] mx-auto p-4 md:p-6">
      
      {/* Header Dinámico para Fondos Oscuros */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Catálogo e Inventario</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Gestión de Platillos
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Administra los menús comerciales, controla precios, categorías y disponibilidad en tiempo real.
          </p>
        </div>

        <div>
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-500 active:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo platillo
          </button>
        </div>
      </header>

      {/* Grid Principal Modificado */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        
        {/* Sección Izquierda: Listado Central */}
        <div className="space-y-6">
          
          {/* Módulo de Filtros Integrado */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Catálogo de cocina</h2>
                <p className="text-xs text-slate-400">Búsqueda rápida parametrizada por término y stock.</p>
              </div>

              {/* Mini Stats inline */}
              <div className="flex gap-2">
                <span className="inline-flex items-center border border-slate-800 bg-slate-950 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300">
                  Total: {stats.total}
                </span>
                <span className="inline-flex items-center border border-emerald-950 bg-emerald-500/10 px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-400">
                  Activos: {stats.active}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <FilterBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Buscar por nombre, categoría o precio..."
                hideDateFilters={true}
              />
            </div>
          </div>

          {/* Listado Principal en Formato Cards Elegantes */}
          <div className="space-y-4">
            {loading && (
              <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/20 text-slate-400">
                <span className="animate-pulse font-medium">Sincronizando recetas del backend...</span>
              </div>
            )}

            {!loading && error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-center text-sm text-rose-400 font-medium">
                {error}
              </div>
            )}

            {!loading && !error && filteredMenus.length === 0 && (
              <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 text-slate-500 text-sm">
                No hay recetas registradas bajo este parámetro de búsqueda.
              </div>
            )}

            {!loading && filteredMenus.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                {filteredMenus.map(menu => {
                  const menuStock = inventories.find(inv => (inv.menuId?._id || inv.menuId) === menu._id)?.quantity ?? 0
                  const hasStock = menuStock > 0
                  const categoryClass = CATEGORY_COLORS[menu.menuCategory] || 'bg-slate-800 text-slate-300 border-slate-700'

                  return (
                    <article 
                      key={menu._id} 
                      className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shadow-sm transition-all hover:border-slate-700 flex gap-4 items-start relative group overflow-hidden"
                    >
                      {/* Imagen o Placeholder */}
                      {menu.menuPhoto ? (
                        <img src={menu.menuPhoto} alt={menu.menuName} className="h-20 w-20 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0" />
                      ) : (
                        <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-slate-400 border border-slate-800 flex items-center justify-center font-bold text-xl shrink-0">
                          {menu.menuName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Info de comida */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-white text-base truncate group-hover:text-orange-400 transition-colors">
                            {menu.menuName}
                          </h3>
                          <span className="font-bold text-emerald-400 text-base shrink-0">
                            Q{Number(menu.menuPrice).toFixed(2)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${categoryClass}`}>
                            {CATEGORY_LABELS[menu.menuCategory] || menu.menuCategory}
                          </span>
                          
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${hasStock ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                            Stock: {menuStock} {menuStock === 1 ? 'ud' : 'uds'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2 pt-1 font-normal leading-relaxed">
                          {menu.menuDescription || 'Sin descripción adicional en el catálogo.'}
                        </p>
                        
                        {/* Botonera integrada */}
                        <div className="pt-3 flex gap-2 justify-end border-t border-slate-800/60 mt-2">
                          <button 
                            type="button"
                            onClick={() => handleEdit(menu)} 
                            className="rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                          >
                            Editar
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDelete(menu)} 
                            className="rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sección Derecha: Sidebar Informativo Limpio */}
        <aside className="space-y-4">
          
          {/* Módulo de Promociones Integradas en UI */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400">Promociones Activas</h3>
              <p className="text-xs text-slate-400 mt-0.5">Campañas vigentes detectadas en el servidor.</p>
            </div>

            {promotions.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center text-xs text-slate-500">
                No hay promociones corriendo hoy.
              </div>
            ) : (
              <div className="space-y-2">
                {promotions.map((promo, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-200">{promo.promotionName || 'Descuento General'}</p>
                      <p className="text-slate-500 text-[11px]">Corte comercial activo</p>
                    </div>
                    <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold px-2 py-0.5 rounded">
                      -{promo.discountPercentage}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Estado de Sincronización del Módulo */}
          
        </aside>

      </div>

      {/* Modal Flotante de CRUD */}
      {showModal && (
        <MenuFormModal
          form={form}
          setForm={setForm}
          editing={editing}
          saving={saving}
          photoPreview={photoPreview}
          setPhotoPreview={setPhotoPreview}
          restaurants={restaurants}
          onSubmit={handleSubmit}
          onClose={handleCloseModal}
        />
      )}
    </section>
  )
}