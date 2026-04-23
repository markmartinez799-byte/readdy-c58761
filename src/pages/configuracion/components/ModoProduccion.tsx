import { useState } from 'react';
import { usePOSStore } from '@/store/posStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, Rocket, CheckCircle, Loader, ShieldAlert, Trash2, CloudOff } from 'lucide-react';

type Step = 'idle' | 'confirm1' | 'confirm2' | 'deleting' | 'done' | 'error';

export default function ModoProduccion() {
  const { currentUser } = useAuthStore();
  const posStore = usePOSStore();
  const [step, setStep] = useState<Step>('idle');
  const [confirmText, setConfirmText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  const handleActivate = async () => {
    if (confirmText !== 'ELIMINAR TODO') return;
    setStep('deleting');
    setErrorMsg('');

    try {
      setProgress('Eliminando datos de prueba de productos...');
      await supabase.from('product_stock').delete().neq('product_id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('productos_farmacia').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      setProgress('Eliminando clientes de prueba...');
      await supabase.from('clientes_farmacia').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      setProgress('Eliminando proveedores de prueba...');
      await supabase.from('detalle_compras_farmacia').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('abonos_compras_farmacia').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('compras_proveedores_farmacia').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('detalle_devoluciones_farmacia').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('devoluciones_proveedores_farmacia').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('proveedores_farmacia').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      setProgress('Limpiando datos locales...');
      // Clear local store state
      posStore.clearLocalDemoData();

      setStep('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido al limpiar datos');
      setStep('error');
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
          <ShieldAlert className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <p className="text-sm text-rose-700 dark:text-rose-300">Solo el administrador puede acceder a esta función.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cloud sync status */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-emerald-600" />
          Estado del Sistema
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Información sobre el modo actual del sistema</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Supabase</span>
            </div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Conectado</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Guardado en tiempo real activo</p>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CloudOff className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Modo Actual</span>
            </div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Demo / Prueba</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Contiene datos de ejemplo</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Acceso</span>
            </div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Administrador</p>
            <p className="text-xs text-slate-500 mt-0.5">Solo admin puede limpiar datos</p>
          </div>
        </div>
      </div>

      {/* Production mode activation */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-rose-200 dark:border-rose-800">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-rose-500" />
          Activar Modo Producción
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          Elimina todos los datos de prueba y deja el sistema listo para uso real
        </p>

        {step === 'idle' && (
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-rose-700 dark:text-rose-300 mb-1">Advertencia importante</p>
                  <ul className="text-sm text-rose-600 dark:text-rose-400 space-y-1 list-disc list-inside">
                    <li>Se eliminarán <strong>todos los productos</strong> de prueba</li>
                    <li>Se eliminarán <strong>todos los clientes</strong> de prueba</li>
                    <li>Se eliminarán <strong>todos los proveedores</strong> y compras de prueba</li>
                    <li>Esta acción <strong>no se puede deshacer</strong></li>
                    <li>Las ventas históricas <strong>no se eliminan</strong></li>
                  </ul>
                </div>
              </div>
            </div>
            <button
              onClick={() => setStep('confirm1')}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-sm flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
            >
              <Rocket className="w-4 h-4" />
              Activar Modo Producción
            </button>
          </div>
        )}

        {step === 'confirm1' && (
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-300 dark:border-rose-700 rounded-lg">
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300 mb-2">
                ¿Estás completamente seguro?
              </p>
              <p className="text-sm text-rose-600 dark:text-rose-400">
                Esta acción eliminará permanentemente todos los datos de prueba de la base de datos en la nube. No hay forma de recuperarlos.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep('idle')}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm cursor-pointer whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                onClick={() => setStep('confirm2')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold cursor-pointer whitespace-nowrap"
              >
                Sí, continuar
              </button>
            </div>
          </div>
        )}

        {step === 'confirm2' && (
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-300 dark:border-rose-700 rounded-lg">
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300 mb-3">
                Confirmación final — Escribe exactamente:
              </p>
              <code className="block text-center text-lg font-bold text-rose-600 dark:text-rose-400 mb-3 tracking-widest">
                ELIMINAR TODO
              </code>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Escribe aquí..."
                className="w-full p-2 rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-mono"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setStep('idle'); setConfirmText(''); }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm cursor-pointer whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                onClick={handleActivate}
                disabled={confirmText !== 'ELIMINAR TODO'}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold cursor-pointer whitespace-nowrap transition-colors"
              >
                Eliminar datos y activar modo producción
              </button>
            </div>
          </div>
        )}

        {step === 'deleting' && (
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <Loader className="w-5 h-5 text-emerald-500 animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Procesando...</p>
              <p className="text-xs text-slate-500 mt-0.5">{progress}</p>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                ¡Modo Producción activado!
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                Todos los datos de prueba han sido eliminados. El sistema está listo para uso real. Ahora puedes comenzar a registrar tus productos, clientes y proveedores reales.
              </p>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">Error al limpiar datos</p>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errorMsg}</p>
              </div>
            </div>
            <button
              onClick={() => { setStep('idle'); setConfirmText(''); }}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm cursor-pointer whitespace-nowrap"
            >
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
