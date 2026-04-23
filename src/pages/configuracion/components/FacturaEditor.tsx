import { useState } from 'react';
import { useAppStore } from '@/store/appStore';

export default function FacturaEditor() {
  const { settings, updateSettings, printerSettings, updatePrinterSettings } = useAppStore();

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
    { label: 'Azul Marino', value: '#1e40af' },
    { label: 'Rojo', value: '#dc2626' },
    { label: 'Naranja', value: '#ea580c' },
    { label: 'Morado', value: '#7c3aed' },
    { label: 'Negro', value: '#1e293b' },
  ];

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
              Vista Previa
            </label>
            <div className={`bg-white border border-slate-200 rounded-lg overflow-hidden ${printFormat === '80mm' ? 'max-w-[280px] mx-auto' : 'w-full'}`}>
              {/* Header de factura */}
              <div className="p-3 text-center" style={{ borderBottom: `3px solid ${invoiceColor}` }}>
                {showLogo && settings.logo && (
                  <img src={settings.logo} alt="Logo" className="h-10 mx-auto mb-2 object-contain" />
                )}
                <p className="font-bold text-slate-800 text-sm">{settings.name}</p>
                <p className="text-xs text-slate-500">RNC: {settings.rnc}</p>
                <p className="text-xs text-slate-500">{settings.address}</p>
                <p className="text-xs text-slate-500">Tel: {settings.phone}</p>
                {invoiceHeader && (
                  <p className="text-xs mt-1 text-slate-600 italic">{invoiceHeader}</p>
                )}
              </div>

              {/* Línea de factura */}
              <div className="px-3 py-2" style={{ backgroundColor: invoiceColor + '15' }}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold" style={{ color: invoiceColor }}>FACTURA</span>
                  <span className="text-xs text-slate-500 font-mono">B0200000001</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-0.5">
                  <span>Fecha: {new Date().toLocaleDateString('es-DO')}</span>
                  <span>Cajero: Admin</span>
                </div>
              </div>

              {/* Items de ejemplo */}
              <div className="px-3 py-2 space-y-1">
                <div className="flex justify-between text-xs text-slate-700">
                  <span>Paracetamol 500mg x2</span>
                  <span className="font-mono">RD$120.00</span>
                </div>
                <div className="flex justify-between text-xs text-slate-700">
                  <span>Amoxicilina 500mg x1</span>
                  <span className="font-mono">RD$85.00</span>
                </div>
              </div>

              {/* Totales */}
              <div className="px-3 py-2 border-t border-dashed border-slate-200 space-y-0.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span><span className="font-mono">RD$205.00</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>ITBIS (18%)</span><span className="font-mono">RD$0.00</span>
                </div>
                <div className="flex justify-between text-sm font-bold mt-1" style={{ color: invoiceColor }}>
                  <span>TOTAL</span><span className="font-mono">RD$205.00</span>
                </div>
              </div>

              {/* Footer */}
              {invoiceFooter && (
                <div className="px-3 py-2 text-center border-t border-dashed border-slate-200">
                  <p className="text-xs text-slate-500 italic">{invoiceFooter}</p>
                </div>
              )}
              {settings.website && (
                <div className="px-3 pb-2 text-center">
                  <p className="text-xs text-slate-400">{settings.website}</p>
                </div>
              )}
            </div>
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
