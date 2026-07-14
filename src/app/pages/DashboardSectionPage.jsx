export const DashboardSectionPage = ({ title, description }) => {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-main-blue">
        Dashboard
      </p>
      <h1 className="mt-3 text-3xl font-bold text-slate-900">{title}</h1>
      <p className="mt-3 max-w-2xl text-base text-slate-600">{description}</p>
    </section>
  )
}