import { useEffect, useMemo, useState } from 'react'
import { exportInvoicePdf, getInvoices } from '../../shared/api/invoices'
import { showError, showSuccess } from '../../shared/utils/toast'
import { FilterBar } from '../../shared/components/ui/FilterBar'

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors?.length) {
    return data.errors[0].message
  }

  return data?.message || error?.message || fallback
}

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    maximumFractionDigits: 2,
  }).format(amount)
}

const formatDateTime = (value) => {
  if (!value) return 'Sin fecha'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'

  return date.toLocaleString('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const isSameDay = (dateA, dateB) => {
  return (
    dateA.getDate() === dateB.getDate() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getFullYear() === dateB.getFullYear()
  )
}

const invoiceStatusLabel = (status) => {
  if (status === 'ENTREGADO') return 'Entregada'
  if (status === 'LISTO') return 'Lista'
  if (status === 'EN_PREPARACION') return 'En preparación'
  if (status === 'CANCELADO') return 'Cancelada'
  return 'Emitida'
}

export const Facturas = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadInvoices = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data } = await getInvoices()
      setInvoices(data?.invoices || [])
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar las facturas.'))
    } finally {
      document.body.classList.add('dark') // Asegura entorno de renderizado
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  const downloadBlobAsFile = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(url)
  }

  const handleDownloadInvoice = async (invoice) => {
    if (!invoice?.invoiceId) {
      showError('No se encontró el identificador de la factura para descargar el PDF.')
      return
    }

    setDownloadingInvoiceId(invoice.invoiceId)

    try {
      const response = await exportInvoicePdf(invoice.invoiceId)
      const fileName = `factura_${invoice.id || invoice.invoiceId}.pdf`
      downloadBlobAsFile(response.data, fileName)
      showSuccess('PDF descargado correctamente.')
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo descargar el PDF de la factura.'))
    } finally {
      setDownloadingInvoiceId(null)
    }
  }

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const searchLower = searchTerm.toLowerCase()
      const invoiceNumber = invoice.invoiceNumber || invoice._id || ''
      const customerName = invoice.customer?.name || ''
      const restaurantName = invoice.restaurantId?.restaurantName || ''
      const status = invoiceStatusLabel(invoice.orderId?.status) || ''

      const matchesSearch =
        !searchTerm ||
        invoiceNumber.toLowerCase().includes(searchLower) ||
        customerName.toLowerCase().includes(searchLower) ||
        restaurantName.toLowerCase().includes(searchLower) ||
        status.toLowerCase().includes(searchLower)

      let matchesDate = true
      if (startDate || endDate) {
        const itemDate = new Date(invoice.issuedAt || invoice.createdAt)
        if (!Number.isNaN(itemDate.getTime())) {
          if (startDate) {
            matchesDate = matchesDate && itemDate >= new Date(startDate + 'T00:00:00')
          }
          if (endDate) {
            matchesDate = matchesDate && itemDate <= new Date(endDate + 'T23:59:59')
          }
        }
      }

      return matchesSearch && matchesDate
    })
  }, [invoices, searchTerm, startDate, endDate])

  const invoiceRows = useMemo(() => {
    return filteredInvoices.map((invoice) => ({
      invoiceId: invoice._id,
      id: invoice.invoiceNumber || invoice._id,
      customer: invoice.customer?.name || 'Cliente no disponible',
      restaurant: invoice.restaurantId?.restaurantName || 'Restaurante no disponible',
      issuedAt: formatDateTime(invoice.issuedAt),
      totalBeforeDiscount: formatCurrency(invoice.totalBeforeDiscount),
      total: formatCurrency(invoice.total),
      status: invoiceStatusLabel(invoice.orderId?.status),
      coupon: invoice.coupon || 'Sin cupón',
      shippingFee: formatCurrency(invoice.shippingFee),
      subtotal: formatCurrency(invoice.subtotal),
      discountPercentage: Number(invoice.discountPercentage || 0),
    }))
  }, [filteredInvoices])

  const invoiceSummary = useMemo(() => {
    const now = new Date()
    const issuedToday = filteredInvoices.filter((invoice) => {
      if (!invoice?.issuedAt) return false
      const issuedDate = new Date(invoice.issuedAt)
      if (Number.isNaN(issuedDate.getTime())) return false
      return isSameDay(issuedDate, now)
    }).length

    const totalIncome = filteredInvoices.reduce((acc, invoice) => acc + Number(invoice?.total || 0), 0)
    const averageTicket = filteredInvoices.length > 0 ? totalIncome / filteredInvoices.length : 0

    return [
      { label: 'Emitidas hoy', value: String(issuedToday), color: 'text-white' },
      { label: 'Ingresos facturados', value: totalIncome > 0 ? formatCurrency(totalIncome) : 'Q0.00', color: 'text-emerald-400' },
      { label: 'Ticket promedio', value: averageTicket > 0 ? formatCurrency(averageTicket) : 'Q0.00', color: 'text-sky-400' },
    ]
  }, [filteredInvoices])

  const featuredInvoice = invoiceRows[0] || null

  const invoiceHighlights = useMemo(() => {
    return [
      `Comprobantes totales en auditoría: ${invoiceRows.length}`,
      'Sincronización transaccional acoplada al endpoint primario /invoices.',
    ]
  }, [invoiceRows.length])

  return (
    <section className="space-y-6 font-sans text-slate-300 antialiased max-w-[1600px] mx-auto p-4 md:p-6">
      
      {/* Header Estilo Premium */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Módulo de Auditoría</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Control de Facturación
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitorea cierres de caja, validez de comprobantes contables y conciliación fiscal por sucursal.
          </p>
        </div>
      </header>

      {/* Grid de Métricas / Resumen Superior */}
      <section className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {invoiceSummary.map((item) => (
          <article key={item.label} className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-4 shadow-xl">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
            <p className={`mt-1 text-2xl font-black tracking-tight ${item.color}`}>{item.value}</p>
          </article>
        ))}
      </section>

      {/* Distribución del Panel de Trabajo */}
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        
        {/* Bloque Izquierdo: Listado Principal Reciente */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-5 shadow-xl space-y-4">
          <div className="flex flex-col gap-3 border-b border-slate-800/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Libro contable reciente</h2>
              <p className="text-xs text-slate-400">Lista consolidada de transacciones procesadas.</p>
            </div>
            
            <div className="flex flex-wrap gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Hoy</span>
              <span className="px-1.5 py-0.5 text-emerald-400">Con Descuento</span>
              <span className="px-1.5 py-0.5 text-sky-400">Domicilio</span>
            </div>
          </div>

          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            searchPlaceholder="Buscar por ID, cliente, restaurante o estado..."
          />

          {/* Tabla de Facturas */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-slate-950/20">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3.5">Factura ID</th>
                  <th className="px-4 py-3.5">Cliente</th>
                  <th className="px-4 py-3.5">Restaurante Sede</th>
                  <th className="px-4 py-3.5">Emisión</th>
                  <th className="px-4 py-3.5">Corte de Caja</th>
                  <th className="px-4 py-3.5">Estado</th>
                  <th className="px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {loading && (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm text-slate-400 animate-pulse font-medium" colSpan={7}>
                      Sincronizando registros fiscales del backend...
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td className="px-4 py-4 text-center text-sm text-rose-400 font-medium" colSpan={7}>
                      {error}
                    </td>
                  </tr>
                )}

                {!loading && !error && invoiceRows.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm text-slate-500 rounded-xl" colSpan={7}>
                      No se registran comprobantes en este período.
                    </td>
                  </tr>
                )}

                {invoiceRows.map((invoice) => (
                  <tr key={invoice.id} className="align-top transition-colors hover:bg-slate-800/20">
                    <td className="px-4 py-4">
                      <p className="font-bold text-white truncate max-w-[100px]" title={invoice.id}>{invoice.id}</p>
                      <p className="mt-1 text-[10px] uppercase font-bold text-indigo-400 tracking-wider">{invoice.coupon}</p>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-200">{invoice.customer}</td>
                    <td className="px-4 py-4 text-slate-400">{invoice.restaurant}</td>
                    <td className="px-4 py-4 text-xs text-slate-400 leading-normal">{invoice.issuedAt}</td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-white">{invoice.total}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Base: {invoice.totalBeforeDiscount} • Delivery: {invoice.shippingFee}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        invoice.status === 'Cancelada' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(invoice)}
                        disabled={!invoice.invoiceId || downloadingInvoiceId === invoice.invoiceId}
                        className="rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {downloadingInvoiceId === invoice.invoiceId ? '...' : 'PDF'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Bloque Derecho: Sidebar Informativo y Ficha Destacada */}
        <aside className="space-y-4">
          
          {/* Ficha Destacada de Factura */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2.5">Comprobante Destacado</h2>
            
            <div className="mt-4">
              {!featuredInvoice && (
                <p className="text-xs text-slate-500 text-center py-6">No hay registros cargados hoy.</p>
              )}

              {featuredInvoice && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Número de control</p>
                      <p className="text-lg font-black text-white truncate max-w-[200px]" title={featuredInvoice.id}>
                        {featuredInvoice.id}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        {featuredInvoice.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(featuredInvoice)}
                        disabled={!featuredInvoice.invoiceId || downloadingInvoiceId === featuredInvoice.invoiceId}
                        className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-200 hover:bg-slate-700"
                      >
                        {downloadingInvoiceId === featuredInvoice.invoiceId ? 'Descargando' : 'Exportar PDF'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 space-y-2 text-xs border-t border-b border-slate-800/60 py-3 text-slate-400 font-normal">
                    <div className="flex items-center justify-between">
                      <span>Titular de la cuenta</span>
                      <span className="font-semibold text-slate-200">{featuredInvoice.customer}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Subtotal Recaudado</span>
                      <span className="font-semibold text-slate-200">{featuredInvoice.subtotal}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Descuento por Cupón</span>
                      <span className="font-bold text-emerald-400">-{featuredInvoice.discountPercentage}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Recargo de Envío / Courier</span>
                      <span className="font-semibold text-slate-200">{featuredInvoice.shippingFee}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Monto Neto Liquidado</p>
                    <p className="mt-1 text-2xl font-black text-white tracking-tight">{featuredInvoice.total}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Notas Técnicas / Auditoría */}
        
        </aside>

      </div>
    </section>
  )
}