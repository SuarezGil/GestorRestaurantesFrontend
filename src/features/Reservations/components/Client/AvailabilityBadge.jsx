export const AvailabilityBadge = ({ checking, conflict }) => {
  if (checking)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
        <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
        Verificando disponibilidad…
      </span>
    )
  if (conflict === null) return null
  if (conflict)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">
        ✕ Horario con conflicto
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
      ✓ Horario disponible
    </span>
  )
}
