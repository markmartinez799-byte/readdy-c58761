import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';

export default function FacturaEditor() {
  const { settings, updateSettings, printerSettings, updatePrinterSettings } = useAppStore();
  const { companySettings, currentUser, currentBranch } = useAuthStore();
  // Datos de empresa: prioridad companySettings (DB) > settings (local)
  const company = companySettings ?? settings;

  const [invoiceHeader, setInvoiceHeader] = useState(
    (settings as unknown as Record<string, string>).invoiceHeader || ''
  );
  const [invoiceFooter, setInvoiceFooter] = useState(
    printerSettings.footerText || 'Gracias por su compra. ¡Vuelva pronto!'
  );
  const [invoiceColor, setInvoiceColor] = useState(
    (settings as unknown as Record<string, string>).invoiceColor || '#10b981'
  );
  const [showLogo, setShowLogo] = useState(printerSettings.printLogo);
  const [printFormat, setPrintFormat] = useState<'80mm' | 'carta'>(settings.printFormat || '80mm');
  const [saved, setSaved] = useState(false);

  // Barcode canvas ref for preview
  const barcodeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = barcodeRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Draw a simple fake barcode for preview
    canvas.width = 180;
    canvas.height = 40;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 180, 40);
    ctx.fillStyle = '#1e293b';
    const pattern = [2,1,3,1,2,2,1,3,2,1,1,2,3,1,2,1,3,2,1,2,1,1,3,2,1,2,2,1,3,1,2,1,2,3,1,2,1,3,1,2];
    let x = 4;
    pattern.forEach((w, i) => {
      if (i % 2 === 0) {
        ctx.fillRect(x, 4, w * 2.5, 28);
      }
      x += w * 2.5;
    });
  }, []);

  const handleSave = () => {
    updateSettings({
      printFormat,
      ...(({ invoiceHeader, invoiceColor }) => ({ invoiceHeader, invoiceColor } as unknown as import('@/types').CompanySettings))({ invoiceHeader, invoiceColor }),
    });
    updatePrinterSettings({
      footerText: invoiceFooter,
      printLogo: showLogo,
      printFooter: invoiceFooter.trim().length > 0,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const colorOptions = [
    { label: 'Verde Esmeralda', value: '#10b981' },
    { label: 'Rojo', value: '#dc2626' },
    { label: 'Naranja', value: '#ea580c' },
    { label: 'Negro', value: '#1e293b' },
    { label: 'Teal', value: '#0d9488' },
    { label: 'Índigo', value: '#4f46e5' },
  ];

  const today = new Date().toLocaleDateString('es-DO');
  const timeNow = new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
  const branchName = currentBranch?.name || 'SUCURSAL PRINCIPAL';
  const companyName = company.name || 'FARMACIA GENOSAN';

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <i className="ri-file-text-line text-emerald-600"></i>
          Editor de Factura / Recibo
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Columna izquierda: configuración */}
          <div className="space-y-4">
            {/* Formato de impresión */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                Formato de Impresión
              </label>
              <div className="flex gap-2">
                {(['80mm', 'carta'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setPrintFormat(fmt)}
                    className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                      printFormat === fmt
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <i className={`${fmt === '80mm' ? 'ri-receipt-line' : 'ri-file-line'} mr-2`}></i>
                    {fmt === '80mm' ? 'Ticket 80mm' : 'Carta / A4'}
                  </button>
                ))}
              </div>
            </div>

            {/* Mostrar logo */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Mostrar logo en factura</p>
                <p className="text-xs text-slate-400 mt-0.5">Imprime el logo de la empresa en el encabezado</p>
              </div>
              <button
                onClick={() => setShowLogo(!showLogo)}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${showLogo ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${showLogo ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Color de acento */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                Color de Acento
              </label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setInvoiceColor(c.value)}
                    title={c.label}
                    className={`w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 ${invoiceColor === c.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={invoiceColor}
                    onChange={(e) => setInvoiceColor(e.target.value)}
                    className="w-8 h-8 rounded-full cursor-pointer border-0 p-0"
                    title="Color personalizado"
                  />
                  <span className="text-xs text-slate-400">Personalizado</span>
                </div>
              </div>
            </div>

            {/* Encabezado adicional */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">
                Texto de Encabezado Adicional
              </label>
              <textarea
                value={invoiceHeader}
                onChange={(e) => setInvoiceHeader(e.target.value)}
                rows={2}
                maxLength={200}
                placeholder="Ej: Horario: Lun-Sáb 8am-8pm | Entrega a domicilio disponible"
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm resize-none"
              />
              <p className="text-xs text-slate-400 mt-0.5">{invoiceHeader.length}/200 caracteres</p>
            </div>

            {/* Pie de página */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">
                Mensaje de Pie de Página
              </label>
              <textarea
                value={invoiceFooter}
                onChange={(e) => setInvoiceFooter(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="Ej: Gracias por su compra. ¡Vuelva pronto!"
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm resize-none"
              />
              <p className="text-xs text-slate-400 mt-0.5">{invoiceFooter.length}/300 caracteres</p>
            </div>
          </div>

          {/* Columna derecha: vista previa */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
              Vista Previa del Recibo
            </label>

            {/* Ticket container */}
            <div
              className={`bg-white border border-slate-200 rounded-lg overflow-hidden font-mono shadow-sm ${
                printFormat === '80mm' ? 'max-w-[290px] mx-auto' : 'w-full'
              }`}
              style={{ fontSize: '11px' }}
            >
              {/* ── ENCABEZADO: barra de color con nombre sucursal ── */}
              <div
                className="px-4 pt-4 pb-3 text-center"
                style={{ borderBottom: `3px solid ${invoiceColor}` }}
              >
                {/* Logo */}
                {showLogo && settings.logo && (
                  <img
                    src={settings.logo}
                    alt="Logo"
                    className="h-9 mx-auto mb-2 object-contain"
                  />
                )}

                {/* SUCURSAL — grande y prominente */}
                <p
                  className="font-black tracking-wide leading-tight"
                  style={{ fontSize: '15px', color: invoiceColor }}
                >
                  {branchName.toUpperCase()}
                </p>

                {/* Empresa — pequeña, debajo */}
                <p className="text-slate-500 mt-0.5" style={{ fontSize: '10px' }}>
                  {companyName}
                </p>

                {/* Datos de contacto */}
                {company.rnc && (
                  <p className="text-slate-500 mt-1" style={{ fontSize: '10px' }}>
                    RNC: {company.rnc}
                  </p>
                )}
                {company.address && (
                  <p className="text-slate-400 leading-tight" style={{ fontSize: '9px' }}>
                    {company.address}
                  </p>
                )}
                {company.phone && (
                  <p className="text-slate-500" style={{ fontSize: '10px' }}>
                    Tel: {company.phone}
                  </p>
                )}
                {invoiceHeader && (
                  <p className="text-slate-500 italic mt-1" style={{ fontSize: '9px' }}>
                    {invoiceHeader}
                  </p>
                )}
              </div>

              {/* ── INFO FACTURA ── */}
              <div
                className="px-3 py-2"
                style={{ backgroundColor: invoiceColor + '18' }}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold tracking-wider" style={{ color: invoiceColor, fontSize: '11px' }}>
                    FACTURA
                  </span>
                  <span className="text-slate-500 font-mono" style={{ fontSize: '10px' }}>
                    B0200000001
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 mt-0.5" style={{ fontSize: '9px' }}>
                  <span>Fecha: {today} {timeNow}</span>
                  <span>Cajero: {currentUser?.name || 'Admin'}</span>
                </div>
                <div className="text-slate-400 mt-0.5" style={{ fontSize: '9px' }}>
                  Cliente: Consumidor Final
                </div>
              </div>

              {/* ── LÍNEA PUNTEADA ── */}
              <div className="mx-3 border-t border-dashed border-slate-300 my-2" />

              {/* ── ITEMS ── */}
              <div className="px-3 space-y-1.5">
                {[
                  { name: 'Paracetamol 500mg', qty: 2, price: 'RD$120.00' },
                  { name: 'Amoxicilina 500mg', qty: 1, price: 'RD$85.00' },
                  { name: 'Vitamina C 1000mg', qty: 3, price: 'RD$210.00' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-slate-700">
                    <div className="flex-1 min-w-0">
                      <span className="block truncate">{item.name}</span>
                      <span className="text-slate-400" style={{ fontSize: '9px' }}>
                        {item.qty} x {item.price.replace('RD$', 'RD$').split('.')[0].replace(/\d+$/, (n) => String(Math.round(parseInt(n) / item.qty)))}
                      </span>
                    </div>
                    <span className="font-mono ml-2 flex-shrink-0">{item.price}</span>
                  </div>
                ))}
              </div>

              {/* ── LÍNEA PUNTEADA ── */}
              <div className="mx-3 border-t border-dashed border-slate-300 my-2" />

              {/* ── TOTALES ── */}
              <div className="px-3 space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-mono">RD$415.00</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>ITBIS (18%)</span>
                  <span className="font-mono">RD$0.00</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Descuento</span>
                  <span className="font-mono">RD$0.00</span>
                </div>
                <div
                  className="flex justify-between font-black pt-1 border-t border-slate-200"
                  style={{ color: invoiceColor, fontSize: '13px' }}
                >
                  <span>TOTAL</span>
                  <span className="font-mono">RD$415.00</span>
                </div>
                <div className="flex justify-between text-slate-500 pt-0.5" style={{ fontSize: '9px' }}>
                  <span>Método de pago</span>
                  <span className="font-medium">Efectivo</span>
                </div>
                <div className="flex justify-between text-slate-500" style={{ fontSize: '9px' }}>
                  <span>Vuelto</span>
                  <span className="font-mono">RD$85.00</span>
                </div>
              </div>

              {/* ── LÍNEA PUNTEADA ── */}
              <div className="mx-3 border-t border-dashed border-slate-300 my-2" />

              {/* ── CÓDIGO DE BARRAS ── */}
              <div className="px-3 pb-1 flex flex-col items-center">
                <p className="text-slate-400 uppercase tracking-widest mb-1" style={{ fontSize: '8px' }}>
                  Código de Factura
                </p>
                <canvas ref={barcodeRef} className="w-full max-w-[180px]" style={{ height: '40px' }} />
                <p className="font-mono font-black text-slate-800 tracking-[0.15em] mt-0.5" style={{ fontSize: '12px' }}>
                  0000001001
                </p>
                <p className="text-slate-400" style={{ fontSize: '8px' }}>N° Factura</p>
              </div>

              {/* ── LÍNEA PUNTEADA ── */}
              <div className="mx-3 border-t border-dashed border-slate-300 my-2" />

              {/* ── NCF ── */}
              <div className="px-3 pb-2 text-center">
                <p className="text-slate-400 uppercase tracking-widest" style={{ fontSize: '8px' }}>
                  Comprobante Fiscal (DGII)
                </p>
                <p className="font-mono font-bold tracking-wider" style={{ color: invoiceColor, fontSize: '11px' }}>
                  B0200000001
                </p>
              </div>

              {/* ── PIE DE PÁGINA ── */}
              {invoiceFooter && (
                <div
                  className="px-3 py-2 text-center"
                  style={{ backgroundColor: invoiceColor + '12', borderTop: `1px dashed ${invoiceColor}40` }}
                >
                  <p className="text-slate-500 italic" style={{ fontSize: '9px' }}>
                    {invoiceFooter}
                  </p>
                </div>
              )}

              {/* Website */}
              {company.website && (
                <div className="px-3 pb-3 text-center">
                  <p className="text-slate-400" style={{ fontSize: '9px' }}>{company.website}</p>
                </div>
              )}
            </div>

            {/* Nota informativa */}
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
              <i className="ri-information-line mr-1"></i>
              Vista previa — los datos reales se toman de Configuración
            </p>
          </div>
        </div>

        {/* Botón guardar */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSave}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold cursor-pointer whitespace-nowrap flex items-center gap-2 transition-all ${
              saved
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {saved ? (
              <><i className="ri-checkbox-circle-line"></i> Guardado</>
            ) : (
              <><i className="ri-save-line"></i> Guardar Cambios</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
