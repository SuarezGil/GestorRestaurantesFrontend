import React from 'react'

export const FilterBar = ({
  searchTerm,
  onSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  searchPlaceholder = 'Buscar...',
  hideDateFilters = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-end bg-slate-950/40 backdrop-blur-md p-4 rounded-xl border border-slate-800/80 w-full mt-4 mb-2">
      
      {/* Input de Búsqueda General */}
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
          Búsqueda General
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
        />
      </div>

      {/* Inputs de Fechas Condicionales */}
      {!hideDateFilters && (
        <>
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Fecha desde
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all [color-scheme:dark]"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Fecha hasta
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all [color-scheme:dark]"
            />
          </div>
        </>
      )}

      {/* Botón de Limpieza */}
      <div className="w-full sm:w-auto">
        <button
          type="button"
          onClick={() => {
            onSearchChange('')
            if (!hideDateFilters) {
              onStartDateChange('')
              onEndDateChange('')
            }
          }}
          title="Limpiar filtros"
          className="w-full sm:w-auto rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          Limpiar
        </button>
      </div>
    </div>
  )
}