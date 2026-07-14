export const ReservationStats = ({ total, pending, canceled }) => {
  return (
    <div className="grid grid-cols-3 gap-3 pt-2">
      {[
        { label: 'Total', value: total, bg: 'bg-slate-950/60 text-slate-300 border-slate-800' },
        { label: 'Pendientes', value: pending, bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
        { label: 'Canceladas', value: canceled, bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
      ].map((card) => (
        <div key={card.label} className={`rounded-xl border p-3 ${card.bg}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{card.label}</p>
          <p className="mt-1 text-xl font-bold tracking-tight">{card.value}</p>
        </div>
      ))}
    </div>
  )
}
