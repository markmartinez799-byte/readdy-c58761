import { createPortal } from 'react-dom';
import type { Product } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';

type MatchType = 'barcode' | 'commercial_name' | 'generic_name';

export type DuplicateAction = 'replace' | 'create_new' | 'cancel';

interface Props {
  existingProduct: Product;
  matchType: MatchType;
  onAction: (action: DuplicateAction) => void;
}

const MATCH_LABELS: Record<MatchType, { label: string; icon: string; color: string }> = {
  barcode: {
    label: 'Mismo código de barras',
    icon: 'ri-barcode-line',
    color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  },
  commercial_name: {
    label: 'Mismo nombre comercial y presentación',
    icon: 'ri-medicine-bottle-line',
    color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
  },
  generic_name: {
    label: 'Mismo nombre genérico',
    icon: 'ri-capsule-line',
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  },
};

export default function DuplicateProductModal({ existingProduct, matchType, onAction }: Props) {
  const { branches } = useAuthStore();
  const matchInfo = MATCH_LABELS[matchType];

  const totalStock = Object.values(existingProduct.stock).reduce((a, b) => a + b, 0);
  const activeBranches = branches.filter((b) => b.isActive);

  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 rounded-xl flex-shrink-0">
              <i className="ri-error-warning-fill text-amber-500 text-2xl"></i>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">
                Producto duplicado detectado
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Este producto ya existe en el sistema
              </p>
            </div>
          </div>

          {/* Match type badge */}
          <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${matchInfo.color}`}>
            <i className={matchInfo.icon}></i>
            {matchInfo.label}
          </div>
        </div>

        {/* Existing product details */}
        <div className="p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Producto existente en la base de datos:
          </p>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3">
              {existingProduct.image ? (
                <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
                  <img
                    src={existingProduct.image}
                    alt={existingProduct.commercialName}
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 border border-emerald-200 dark:border-emerald-800">
                  <i className="ri-medicine-bottle-line text-emerald-600 text-xl"></i>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">
                  {existingProduct.commercialName}
                </p>
                {existingProduct.genericName && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{existingProduct.genericName}</p>
                )}
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                  {existingProduct.barcode && (
                    <span className="text-xs text-slate-400 font-mono">
                      <i className="ri-barcode-line mr-1"></i>{existingProduct.barcode}
                    </span>
                  )}
                  {existingProduct.presentation && (
                    <span className="text-xs text-slate-400">
                      <i className="ri-archive-line mr-1"></i>{existingProduct.presentation}
                    </span>
                  )}
                  {existingProduct.lab && (
                    <span className="text-xs text-slate-400">
                      <i className="ri-flask-line mr-1"></i>{existingProduct.lab}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Price + stock grid */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-0.5">Precio venta</p>
                <p className="text-sm font-bold font-mono text-slate-800 dark:text-white">
                  {formatCurrency(existingProduct.price)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-0.5">Costo</p>
                <p className="text-sm font-bold font-mono text-slate-600 dark:text-slate-300">
                  {existingProduct.purchaseCost ? formatCurrency(existingProduct.purchaseCost) : '—'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-0.5">Stock total</p>
                <p className={`text-sm font-bold ${totalStock === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {totalStock} uds.
                </p>
              </div>
            </div>

            {/* Stock by branch */}
            {activeBranches.length > 1 && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Stock por sucursal:</p>
                <div className="flex flex-wrap gap-2">
                  {activeBranches.map((branch) => {
                    const qty = existingProduct.stock[branch.id] || 0;
                    return (
                      <span
                        key={branch.id}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          qty === 0
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700'
                        }`}
                      >
                        {branch.name}: {qty}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action options */}
        <div className="px-5 pb-5 space-y-2.5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            ¿Qué deseas hacer?
          </p>

          {/* Option 1: Replace */}
          <button
            onClick={() => onAction('replace')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-slate-50 dark:bg-slate-900 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all cursor-pointer text-left group"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30 group-hover:bg-emerald-200 transition-colors flex-shrink-0">
              <i className="ri-refresh-line text-emerald-600 text-lg"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 dark:text-white text-sm">Reemplazar producto</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Actualiza los datos con los nuevos valores. Mantiene el mismo ID y conserva el historial de compras y ventas.
              </p>
            </div>
            <i className="ri-arrow-right-line text-slate-300 group-hover:text-emerald-500 transition-colors flex-shrink-0"></i>
          </button>

          {/* Option 2: Create anyway */}
          <button
            onClick={() => onAction('create_new')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-slate-50 dark:bg-slate-900 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all cursor-pointer text-left group"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30 group-hover:bg-amber-200 transition-colors flex-shrink-0">
              <i className="ri-add-circle-line text-amber-600 text-lg"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 dark:text-white text-sm">Crear como nuevo (permitir duplicado)</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Genera un nuevo ID independiente. Puede causar inconsistencias en el inventario y reportes.
              </p>
            </div>
            <i className="ri-arrow-right-line text-slate-300 group-hover:text-amber-500 transition-colors flex-shrink-0"></i>
          </button>

          {/* Option 3: Cancel */}
          <button
            onClick={() => onAction('cancel')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-slate-50 dark:bg-slate-900 hover:border-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all cursor-pointer text-left group"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors flex-shrink-0">
              <i className="ri-close-circle-line text-slate-500 text-lg"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 dark:text-white text-sm">Cancelar</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                No guardar nada. Regresa al formulario para corregir los datos.
              </p>
            </div>
            <i className="ri-arrow-right-line text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0"></i>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
