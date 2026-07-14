export const StepDot = ({ n, active, done }) => (
  <div
    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all
      ${done ? 'border-sky-600 bg-sky-600 text-white' : active ? 'border-sky-500 bg-sky-50 text-sky-600' : 'border-slate-200 bg-white text-slate-400'}`}
  >
    {done ? '✓' : n}
  </div>
)
