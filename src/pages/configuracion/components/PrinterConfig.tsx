import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';

type PrinterType = '58mm' | '80mm' | 'A4';
type FontSize = 'small' | 'medium' | 'large';

export default function PrinterConfig() {
  const { settings, printerSettings, updatePrinterSettings } = useAppStore();
  const [testStatus, setTestStatus] = useState<'idle' | 'printing' | 'success' | 'error'>('idle');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [manualName, setManualName] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [printerReady, setPrinterReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Al montar, verificar si ya hay una impresora guardada
  useEffect(() => {
    if (printerSettings.printerName && printerSettings.printerName !== '') {
      setPrinterReady(true);
    }
  }, [printerSettings.printerName]);

  // Abrir diálogo de impresión del sistema para que el usuario vea sus impresoras
  const openSystemPrinterDialog = () => {
    const paperWidth =
      printerSettings.printerType === '58mm' ? '58mm' :
      printerSettings.printerType === '80mm' ? '80mm' : '210mm';

    const fontSize =
      printerSettings.fontSize === 'small' ? '10px' :
      printerSettings.fontSize === 'large' ? '14px' : '12px';

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Seleccionar Impresora</title>
  <style>
    @page { size: ${paperWidth} auto; margin: 4mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; font-size: ${fontSize}; width: ${paperWidth === '210mm' ? '190mm' : paperWidth}; color: #000; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 4px 0; }
    .row { display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  ${printerSettings.printLogo ? `<div class="center bold" style="font-size:15px">${settings.name}</div>` : ''}
  <div class="center">${settings.address || 'Dirección de la farmacia'}</div>
  <div class="center">Tel: ${settings.phone || '000-000-0000'}</div>
  <div class="center">RNC: ${settings.rnc || '000-00000-0'}</div>
  <div class="divider"></div>
  <div class="center bold">*** PÁGINA DE PRUEBA ***</div>
  <div class="divider"></div>
  <div class="row"><span>Tipo papel:</span><span>${printerSettings.printerType}</span></div>
  <div class="row"><span>Copias:</span><span>${printerSettings.copies}</span></div>
  <div class="row"><span>Fecha:</span><span>${new Date().toLocaleDateString('es-DO')}</span></div>
  <div class="row"><span>Hora:</span><span>${new Date().toLocaleTimeString('es-DO')}</span></div>
  <div class="divider"></div>
  <div class="row"><span>Amoxicilina 500mg x2</span><span>RD$180.00</span></div>
  <div class="row"><span>Ibuprofeno 400mg x1</span><span>RD$95.00</span></div>
  <div class="divider"></div>
  <div class="row bold"><span>TOTAL:</span><span>RD$275.00</span></div>
  <div class="divider"></div>
  ${printerSettings.printFooter ? `<div class="center">${printerSettings.footerText}</div>` : ''}
  <div class="center" style="margin-top:8px;font-size:9px">Sistema Farmacia GENOSAN</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=500,height=700');
    if (!win) {
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 3000);
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    // Esperar a que cargue y luego imprimir
    win.onload = () => {
      win.print();
      win.close();
    };
    // Fallback si onload no dispara
    setTimeout(() => {
      try { win.print(); win.close(); } catch { /* ya cerró */ }
    }, 800);
  };

  const handleTestPrint = () => {
    setTestStatus('printing');
    try {
      openSystemPrinterDialog();
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch {
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  const handleSavePrinter = () => {
    const name = manualName.trim();
    if (!name) return;
    updatePrinterSettings({ printerName: name });
    setPrinterReady(true);
    setShowManualInput(false);
    setManualName('');
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2500);
  };

  const handleSave = () => {
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2500);
  };

  const handleRemovePrinter = () => {
    updatePrinterSettings({ printerName: '' });
    setPrinterReady(false);
  };

  return (
    <div className="space-y-6">

      {/* Banner informativo */}
      <div className="flex items-start gap-3 p-4 rounded-xl border bg-blue-50 border-blue-200">
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
          <i className="ri-information-line text-blue-600 text-lg" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-700">¿Cómo funciona la impresión?</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Al imprimir, el sistema abre el diálogo de impresión de tu sistema operativo donde puedes seleccionar cualquier impresora instalada.
            Guarda el nombre de tu impresora predeterminada para referencia.
          </p>
        </div>
      </div>

      {/* Impresora configurada */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-printer-line text-emerald-600 text-lg" />
            </div>
            Impresora Predeterminada
          </h3>
          {printerReady && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <i className="ri-checkbox-circle-fill text-sm" />
              Configurada
            </span>
          )}
        </div>

        {/* Estado actual */}
        <div className={`flex items-center gap-4 p-4 rounded-xl border ${
          printerReady
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className={`w-12 h-12 flex items-center justify-center rounded-xl flex-shrink-0 ${
            printerReady ? 'bg-emerald-100' : 'bg-slate-100'
          }`}>
            <i className={`ri-printer-fill text-2xl ${printerReady ? 'text-emerald-600' : 'text-slate-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm ${printerReady ? 'text-emerald-800' : 'text-slate-500'}`}>
              {printerSettings.printerName || 'Sin impresora configurada'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {printerReady
                ? 'Lista para imprimir — el diálogo del sistema usará esta impresora'
                : 'Ingresa el nombre de tu impresora para guardarla'}
            </p>
          </div>
          {printerReady && (
            <button
              onClick={handleRemovePrinter}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Quitar impresora"
            >
              <i className="ri-close-line text-lg" />
            </button>
          )}
        </div>

        {/* Cómo encontrar el nombre */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-amber-700 mb-1">
            <i className="ri-lightbulb-line mr-1" />
            ¿Cómo saber el nombre de tu impresora?
          </p>
          <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
            <li><strong>Windows:</strong> Panel de control → Dispositivos e impresoras</li>
            <li><strong>Mac:</strong> Preferencias del sistema → Impresoras y escáneres</li>
            <li>O haz clic en <strong>"Abrir diálogo de impresión"</strong> y verás el nombre ahí</li>
          </ul>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setShowManualInput(!showManualInput);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-edit-line text-sm" />
            {printerReady ? 'Cambiar impresora' : 'Ingresar nombre de impresora'}
          </button>
          <button
            onClick={() => {
              const win = window.open('', '_blank', 'width=400,height=300');
              if (win) {
                win.document.write('<html><body><p style="font-family:sans-serif;padding:20px">Abre el diálogo de impresión para ver tus impresoras instaladas.</p></body></html>');
                win.document.close();
                win.focus();
                setTimeout(() => { try { win.print(); } catch { /* ignore */ } }, 300);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-external-link-line text-sm" />
            Abrir diálogo de impresión
          </button>
        </div>

        {/* Input manual */}
        {showManualInput && (
          <div className="flex gap-2 mt-1">
            <input
              ref={inputRef}
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSavePrinter(); }}
              placeholder="Ej: HP LaserJet Pro M404n, Epson TM-T20..."
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            />
            <button
              onClick={handleSavePrinter}
              disabled={!manualName.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              Guardar
            </button>
            <button
              onClick={() => { setShowManualInput(false); setManualName(''); }}
              className="px-3 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Configuración de papel y opciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración General */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-5">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-settings-3-line text-emerald-600 text-lg" />
            </div>
            Configuración General
          </h3>

          {/* Tipo de papel */}
          <div>
            <label className="text-sm font-medium text-slate-600 mb-2 block">
              Tipo / Tamaño de Papel
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['58mm', '80mm', 'A4'] as PrinterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => updatePrinterSettings({ printerType: type })}
                  className={`py-3 px-2 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                    printerSettings.printerType === type
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-base font-bold">{type}</div>
                    <div className="text-xs opacity-70">
                      {type === '58mm' ? 'Térmica pequeña' : type === '80mm' ? 'Térmica estándar' : 'Hoja carta'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Copias */}
          <div>
            <label className="text-sm font-medium text-slate-600 mb-2 block">
              Número de Copias
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updatePrinterSettings({ copies: Math.max(1, printerSettings.copies - 1) })}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer font-bold text-lg"
              >
                -
              </button>
              <span className="w-12 text-center font-bold text-xl text-slate-800">
                {printerSettings.copies}
              </span>
              <button
                onClick={() => updatePrinterSettings({ copies: Math.min(5, printerSettings.copies + 1) })}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer font-bold text-lg"
              >
                +
              </button>
              <span className="text-sm text-slate-500">copia(s) por factura</span>
            </div>
          </div>

          {/* Tamaño de fuente */}
          <div>
            <label className="text-sm font-medium text-slate-600 mb-2 block">
              Tamaño de Fuente
            </label>
            <div className="flex gap-2">
              {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => updatePrinterSettings({ fontSize: size })}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                    printerSettings.fontSize === size
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {size === 'small' ? 'Pequeño' : size === 'medium' ? 'Mediano' : 'Grande'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Opciones de impresión */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-5">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-file-list-3-line text-emerald-600 text-lg" />
            </div>
            Opciones de Impresión
          </h3>

          <div className="space-y-3">
            {[
              { key: 'autoPrint', label: 'Imprimir automáticamente al completar venta', desc: 'Sin mostrar diálogo de impresión' },
              { key: 'printLogo', label: 'Imprimir nombre/logo de la empresa', desc: 'Encabezado con datos de la farmacia' },
              { key: 'printFooter', label: 'Imprimir mensaje de pie de página', desc: 'Texto personalizable al final del recibo' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-700">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => updatePrinterSettings({ [key]: !printerSettings[key as keyof typeof printerSettings] })}
                  className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    printerSettings[key as keyof typeof printerSettings]
                      ? 'bg-emerald-500'
                      : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    printerSettings[key as keyof typeof printerSettings] ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            ))}
          </div>

          {printerSettings.printFooter && (
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">
                Texto del pie de página
              </label>
              <textarea
                value={printerSettings.footerText}
                onChange={(e) => updatePrinterSettings({ footerText: e.target.value })}
                rows={2}
                maxLength={120}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm resize-none focus:outline-none focus:border-emerald-400"
                placeholder="Ej: Gracias por su compra. ¡Vuelva pronto!"
              />
              <p className="text-xs text-slate-400 mt-1 text-right">{printerSettings.footerText.length}/120</p>
            </div>
          )}
        </div>
      </div>

      {/* Vista previa */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ri-eye-line text-emerald-600 text-lg" />
          </div>
          Vista Previa del Recibo
        </h3>
        <div className="flex justify-center">
          <div
            className="bg-white border border-dashed border-slate-300 rounded p-4 font-mono text-black"
            style={{
              width: printerSettings.printerType === '58mm' ? '200px' : printerSettings.printerType === '80mm' ? '280px' : '400px',
              fontSize: printerSettings.fontSize === 'small' ? '9px' : printerSettings.fontSize === 'large' ? '13px' : '11px',
            }}
          >
            {printerSettings.printLogo && (
              <div className="text-center font-bold text-sm mb-1">{settings.name}</div>
            )}
            <div className="text-center">{settings.address || 'Dirección de la farmacia'}</div>
            <div className="text-center">Tel: {settings.phone || '000-000-0000'}</div>
            <div className="text-center">RNC: {settings.rnc || '000-00000-0'}</div>
            <div className="border-t border-dashed border-slate-400 my-1" />
            <div className="text-center font-bold">FACTURA B02-00000001</div>
            <div className="text-center">{new Date().toLocaleDateString('es-DO')} {new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="border-t border-dashed border-slate-400 my-1" />
            <div className="flex justify-between"><span>Amoxicilina 500mg x2</span><span>RD$180</span></div>
            <div className="flex justify-between"><span>Ibuprofeno 400mg x1</span><span>RD$95</span></div>
            <div className="border-t border-dashed border-slate-400 my-1" />
            <div className="flex justify-between font-bold"><span>TOTAL:</span><span>RD$275.00</span></div>
            <div className="flex justify-between"><span>Efectivo:</span><span>RD$300.00</span></div>
            <div className="flex justify-between"><span>Cambio:</span><span>RD$25.00</span></div>
            {printerSettings.printFooter && (
              <>
                <div className="border-t border-dashed border-slate-400 my-1" />
                <div className="text-center">{printerSettings.footerText}</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Acciones finales */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleTestPrint}
          disabled={testStatus === 'printing'}
          className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          {testStatus === 'printing' ? (
            <><i className="ri-loader-4-line animate-spin" /> Abriendo diálogo...</>
          ) : testStatus === 'success' ? (
            <><i className="ri-checkbox-circle-line text-emerald-500" /> Diálogo abierto</>
          ) : testStatus === 'error' ? (
            <><i className="ri-error-warning-line text-red-500" /> Error — revisa el bloqueador de popups</>
          ) : (
            <><i className="ri-printer-line" /> Imprimir página de prueba</>
          )}
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
        >
          {saveStatus === 'saved' ? (
            <><i className="ri-checkbox-circle-line" /> Configuración guardada</>
          ) : (
            <><i className="ri-save-line" /> Guardar configuración</>
          )}
        </button>
      </div>
    </div>
  );
}
