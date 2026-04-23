import { useState } from 'react';
import { usePOSStore } from '@/store/posStore';
import { formatCurrency, formatDateShort } from '@/utils/formatters';
import type { SupplierPurchase } from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ConfirmDeleteProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function ConfirmDeleteModal({ onConfirm, onCancel, loading }: ConfirmDeleteProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm p-6 space-y-4">
        <div className="w-12 h-12 flex items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-full mx-auto">
          <i className="ri-delete-bin-2-line text-red-600 text-2xl"></i>
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-slate-800 dark:text-white text-base">¿Eliminar esta compra?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Esta acción eliminará permanentemente la compra y todos sus registros. No se puede deshacer.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={loading} className="flex-1 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm cursor-pointer whitespace-nowrap">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm cursor-pointer whitespace-nowrap flex items-center justify-center gap-2">
            {loading ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-delete-bin-line"></i>}
            {loading ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  purchase: SupplierPurchase;
  onClose: () => void;
}

export default function DetalleCompraModal({ purchase, onClose }: Props) {
  const { markPurchasePaid, addAbono, deletePurchase } = usePOSStore();
  const [showAbonoForm, setShowAbonoForm] = useState(false);
  const [abonoMonto, setAbonoMonto] = useState('');
  const [abonoNotas, setAbonoNotas] = useState('');
  const [saving, setSaving] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const totalAbonado = (purchase.abonos || []).reduce((s, a) => s + a.monto, 0);
  const saldoPendiente = purchase.total - totalAbonado;

  // Rentabilidad
  const totalInversion = purchase.items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const gananciaEstimada = purchase.items.reduce((s, i) => {
    const sp = (i as { salePrice?: number }).salePrice ?? 0;
    if (sp <= 0) return s;
    return s + (sp - i.unitCost) * i.quantity;
  }, 0);
  const itemsWithSalePrice = purchase.items.filter((i) => (i as { salePrice?: number }).salePrice ?? 0 > 0);
  const margenPromedio = itemsWithSalePrice.length > 0
    ? itemsWithSalePrice.reduce((s, i) => {
        const sp = (i as { salePrice?: number }).salePrice ?? 0;
        return s + ((sp - i.unitCost) / i.unitCost) * 100;
      }, 0) / itemsWithSalePrice.length
    : null;

  const getDaysUntilDue = () => {
    if (!purchase.fechaLimitePago) return null;
    return Math.ceil((new Date(purchase.fechaLimitePago).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };
  const daysUntilDue = getDaysUntilDue();

  const getStatusColor = () => {
    if (purchase.estadoPago === 'pagado') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (purchase.estadoPago === 'vencido') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (daysUntilDue !== null && daysUntilDue <= 5) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
  };

  const handleMarkPaid = async () => {
    setSaving(true);
    await markPurchasePaid(purchase.id);
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deletePurchase(purchase.id);
    setDeleting(false);
    setShowConfirmDelete(false);
    onClose();
  };

  const handleAddAbono = async () => {
    const monto = parseFloat(abonoMonto);
    if (!monto || monto <= 0 || monto > saldoPendiente) return;
    setSaving(true);
    await addAbono({
      compraId: purchase.id,
      monto,
      fechaAbono: new Date().toISOString().split('T')[0],
      notas: abonoNotas || undefined,
    });
    setSaving(false);
    setShowAbonoForm(false);
    setAbonoMonto('');
    setAbonoNotas('');
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA DE COMPRA — GENOSAN', pageW / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Proveedor: ${purchase.supplierCompany} — ${purchase.supplierName}`, 14, 35);
    doc.text(`Fecha: ${formatDateShort(purchase.purchaseDate)}`, 14, 42);
    if (purchase.invoiceNumber) doc.text(`N° Factura: ${purchase.invoiceNumber}`, 14, 49);
    doc.text(`Tipo: ${purchase.tipoPago === 'contado' ? 'Contado' : 'Crédito'}`, 14, 56);

    autoTable(doc, {
      startY: 65,
      head: [['Producto', 'Lote', 'Cant.', 'Costo', 'P.Venta', 'Margen', 'Vence', 'Subtotal']],
      body: purchase.items.map((item) => {
        const sp = (item as { salePrice?: number }).salePrice ?? 0;
        const lote = (item as { lote?: string }).lote ?? '';
        const margin = sp > 0 && item.unitCost > 0 ? `${(((sp - item.unitCost) / item.unitCost) * 100).toFixed(1)}%` : '—';
        return [
          item.productName,
          lote || '—',
          item.quantity.toString(),
          formatCurrency(item.unitCost),
          sp > 0 ? formatCurrency(sp) : '—',
          margin,
          item.expiryDate,
          formatCurrency(item.quantity * item.unitCost),
        ];
      }),
      foot: [['', '', '', '', '', '', 'TOTAL', formatCurrency(purchase.total)]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] },
      footStyles: { fontStyle: 'bold', fillColor: [240, 253, 244] },
    });
    doc.save(`compra_${purchase.supplierCompany.replace(/\s/g, '_')}_${purchase.id.slice(0, 6)}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white">Detalle de Compra</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{purchase.supplierCompany} — {purchase.supplierName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={downloadPDF} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs flex items-center gap-1 hover:bg-slate-200 cursor-pointer whitespace-nowrap">
              <i className="ri-file-pdf-line"></i> PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer w-8 h-8 flex items-center justify-center">
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Info general */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-0.5">Fecha Compra</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{formatDateShort(purchase.purchaseDate)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-0.5">Tipo Pago</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white capitalize">{purchase.tipoPago}</p>
            </div>
            {purchase.fechaLimitePago && (
              <div className={`rounded-lg p-3 ${daysUntilDue !== null && daysUntilDue <= 5 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-slate-50 dark:bg-slate-900'}`}>
                <p className="text-xs text-slate-400 mb-0.5">Fecha Límite</p>
                <p className={`text-sm font-semibold ${daysUntilDue !== null && daysUntilDue <= 5 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-800 dark:text-white'}`}>
                  {formatDateShort(purchase.fechaLimitePago)}
                  {daysUntilDue !== null && daysUntilDue > 0 && <span className="text-xs ml-1">({daysUntilDue}d)</span>}
                </p>
              </div>
            )}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-0.5">Estado</p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor()}`}>
                {purchase.estadoPago === 'pagado' ? 'Pagado' : purchase.estadoPago === 'vencido' ? 'Vencido' : 'Pendiente'}
              </span>
            </div>
          </div>

          {/* Alertas */}
          {purchase.estadoPago === 'pendiente' && daysUntilDue !== null && daysUntilDue <= 5 && daysUntilDue > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
              <i className="ri-alarm-warning-fill text-amber-500 text-lg"></i>
              <p className="text-sm text-amber-700 dark:text-amber-400"><strong>¡Atención!</strong> Vence en {daysUntilDue} día(s).</p>
            </div>
          )}
          {purchase.estadoPago === 'vencido' && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <i className="ri-error-warning-fill text-red-500 text-lg"></i>
              <p className="text-sm text-red-700 dark:text-red-400"><strong>Factura vencida.</strong> La fecha límite ya pasó.</p>
            </div>
          )}

          {/* ── Resumen de Rentabilidad ── */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <p className="text-xs text-slate-400 mb-1">Total Invertido</p>
              <p className="text-base font-bold font-mono text-slate-800 dark:text-white">{formatCurrency(totalInversion)}</p>
            </div>
            <div className={`p-3 rounded-xl border text-center ${gananciaEstimada < 0 ? 'bg-red-50 dark:bg-red-900/10 border-red-200' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200'}`}>
              <p className="text-xs text-slate-400 mb-1">Ganancia Estimada</p>
              <p className={`text-base font-bold font-mono ${gananciaEstimada < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {gananciaEstimada >= 0 ? '+' : ''}{formatCurrency(gananciaEstimada)}
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <p className="text-xs text-slate-400 mb-1">Margen Promedio</p>
              <p className={`text-base font-bold font-mono ${margenPromedio === null ? 'text-slate-400' : margenPromedio < 0 ? 'text-red-600' : margenPromedio < 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {margenPromedio !== null ? `${margenPromedio.toFixed(1)}%` : '—'}
              </p>
            </div>
          </div>

          {/* Tabla de productos */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Detalle de Productos</p>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="text-left p-2.5 text-xs text-slate-500 font-medium">Producto</th>
                    <th className="text-center p-2.5 text-xs text-slate-500 font-medium">Lote</th>
                    <th className="text-center p-2.5 text-xs text-slate-500 font-medium">Cant.</th>
                    <th className="text-right p-2.5 text-xs text-slate-500 font-medium">Costo</th>
                    <th className="text-right p-2.5 text-xs text-slate-500 font-medium">P.Venta</th>
                    <th className="text-center p-2.5 text-xs text-slate-500 font-medium">Margen</th>
                    <th className="text-center p-2.5 text-xs text-slate-500 font-medium">Vence</th>
                    <th className="text-right p-2.5 text-xs text-slate-500 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {purchase.items.map((item, idx) => {
                    const sp = (item as { salePrice?: number }).salePrice ?? 0;
                    const lote = (item as { lote?: string }).lote ?? '';
                    const margin = sp > 0 && item.unitCost > 0 ? ((sp - item.unitCost) / item.unitCost) * 100 : null;
                    const isLoss = margin !== null && margin < 0;

                    // Expiry alert
                    const today = new Date();
                    const expiry = item.expiryDate ? new Date(item.expiryDate) : null;
                    const expiryDays = expiry ? Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
                    const isExpiring = expiryDays !== null && expiryDays <= 60 && expiryDays > 0;
                    const isExpired = expiryDays !== null && expiryDays <= 0;

                    return (
                      <tr key={idx} className={`border-t border-slate-100 dark:border-slate-700 ${isLoss ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                        <td className="p-2.5 text-slate-800 dark:text-slate-200 text-sm font-medium">{item.productName}</td>
                        <td className="p-2.5 text-center">
                          {lote ? (
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-mono">{lote}</span>
                          ) : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                        </td>
                        <td className="p-2.5 text-center font-mono text-slate-700 dark:text-slate-300">{item.quantity}</td>
                        <td className="p-2.5 text-right font-mono text-slate-700 dark:text-slate-300 text-xs">{formatCurrency(item.unitCost)}</td>
                        <td className="p-2.5 text-right font-mono text-xs">
                          {sp > 0 ? (
                            <span className={isLoss ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}>{formatCurrency(sp)}</span>
                          ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>
                        <td className="p-2.5 text-center">
                          {margin !== null ? (
                            <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold ${
                              isLoss ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                              margin < 10 ? 'bg-amber-100 text-amber-600' :
                              'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                            }`}>
                              {margin.toFixed(1)}%
                            </span>
                          ) : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`text-xs ${isExpired ? 'text-red-600 font-semibold' : isExpiring ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}>
                            {item.expiryDate}
                            {isExpiring && <i className="ri-alarm-warning-line ml-1"></i>}
                            {isExpired && <i className="ri-error-warning-line ml-1"></i>}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-semibold text-slate-800 dark:text-white text-xs">{formatCurrency(item.quantity * item.unitCost)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-emerald-50 dark:bg-emerald-900/20">
                  <tr>
                    <td colSpan={7} className="p-2.5 text-right font-semibold text-slate-700 dark:text-slate-300 text-sm">Total Compra</td>
                    <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(purchase.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Abonos */}
          {purchase.tipoPago === 'credito' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Abonos Parciales</p>
                {purchase.estadoPago !== 'pagado' && (
                  <button onClick={() => setShowAbonoForm(!showAbonoForm)} className="text-xs text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-1">
                    <i className="ri-add-line"></i> Registrar abono
                  </button>
                )}
              </div>

              {showAbonoForm && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 mb-3 space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-slate-500 mb-1 block">Monto (máx. {formatCurrency(saldoPendiente)})</label>
                      <input type="number" min={1} max={saldoPendiente} step={0.01} value={abonoMonto} onChange={(e) => setAbonoMonto(e.target.value)} placeholder="0.00" className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-slate-500 mb-1 block">Notas (opcional)</label>
                      <input type="text" value={abonoNotas} onChange={(e) => setAbonoNotas(e.target.value)} placeholder="Ej: Transferencia bancaria" className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowAbonoForm(false)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg text-xs cursor-pointer whitespace-nowrap">Cancelar</button>
                    <button onClick={handleAddAbono} disabled={saving || !abonoMonto || parseFloat(abonoMonto) <= 0} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700 disabled:opacity-50 cursor-pointer whitespace-nowrap">
                      Guardar Abono
                    </button>
                  </div>
                </div>
              )}

              {(purchase.abonos || []).length > 0 ? (
                <div className="space-y-1.5">
                  {(purchase.abonos || []).map((abono) => (
                    <div key={abono.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <div>
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(abono.monto)}</p>
                        {abono.notas && <p className="text-xs text-slate-400">{abono.notas}</p>}
                      </div>
                      <span className="text-xs text-slate-400">{formatDateShort(abono.fechaAbono)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-2.5 bg-slate-100 dark:bg-slate-700 rounded-lg mt-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Saldo pendiente</span>
                    <span className={`font-bold font-mono text-sm ${saldoPendiente <= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.max(0, saldoPendiente))}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-3">Sin abonos registrados</p>
              )}
            </div>
          )}

          {purchase.notas && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Notas</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{purchase.notas}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {purchase.estadoPago !== 'pagado' && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm cursor-pointer whitespace-nowrap">Cerrar</button>
            <button onClick={handleMarkPaid} disabled={saving} className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm cursor-pointer whitespace-nowrap flex items-center gap-2">
              <i className="ri-checkbox-circle-line"></i> Marcar como Pagado
            </button>
          </div>
        )}
        {purchase.estadoPago === 'pagado' && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <button onClick={() => setShowConfirmDelete(true)} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-lg text-sm cursor-pointer whitespace-nowrap flex items-center gap-2 border border-red-200 dark:border-red-800">
              <i className="ri-delete-bin-line"></i> Eliminar
            </button>
            <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm cursor-pointer whitespace-nowrap">Cerrar</button>
          </div>
        )}
      </div>

      {showConfirmDelete && <ConfirmDeleteModal onConfirm={handleDelete} onCancel={() => setShowConfirmDelete(false)} loading={deleting} />}
    </div>
  );
}
