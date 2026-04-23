import { usePOSStore } from '@/store/posStore';
import { useAuthStore } from '@/store/authStore';
import type { Product } from '@/types';
import { X, MapPin, Package, AlertCircle } from 'lucide-react';


interface StockModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function StockModal({ product, onClose }: StockModalProps) {
  const { branches, currentBranch } = useAuthStore();
  const { getStockInBranch } = usePOSStore();

  if (!product) return null;

  const allBranchStock = branches
    .filter((b) => b.isActive)
    .map((b) => ({
      branch: b,
      stock: getStockInBranch(product.id, b.id),
      isCurrent: b.id === currentBranch?.id,
    }));

  const totalStock = allBranchStock.reduce((sum, b) => sum + b.stock, 0);
  const hasAnyStock = totalStock > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm animate-bounce-in">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-500" />
            Disponibilidad por Sucursal
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Product info */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="w-10 h-10 flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded-lg flex-shrink-0 overflow-hidden">
              {product.image ? (
                <img src={product.image} alt={product.commercialName} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <Package className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{product.commercialName}</p>
              <p className="text-xs text-slate-500">{product.presentation} · {product.lab}</p>
              {product.estante && (
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
                  <MapPin className="w-3 h-3" />
                  Ubicación: Estante {product.estante}{product.posicion ? ` · Pos. ${product.posicion}` : ''}
                </span>
              )}
            </div>
            <div className={`text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap ${
              totalStock === 0
                ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              Total: {totalStock} und.
            </div>
          </div>

          {/* No stock anywhere alert */}
          {!hasAnyStock && (
            <div className="flex items-start gap-2 p-3 mb-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">Sin stock en ninguna sucursal</p>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                  Este medicamento está agotado en todas las sucursales. Considera hacer un pedido al proveedor.
                </p>
              </div>
            </div>
          )}

          {/* Branch list */}
          <div className="space-y-2">
            {allBranchStock.map(({ branch, stock, isCurrent }) => (
              <div
                key={branch.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isCurrent
                    ? 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900'
                    : stock > 0
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/10'
                    : 'border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-900/10 opacity-70'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-white flex items-center gap-1.5 flex-wrap">
                    {branch.name}
                    {isCurrent && (
                      <span className="text-xs px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                        Actual
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{branch.address}</p>
                </div>
                <div className={`ml-3 text-sm font-bold font-mono px-3 py-1.5 rounded-lg whitespace-nowrap flex-shrink-0 ${
                  stock === 0
                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                    : stock <= 5
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {`${stock} und.`}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full mt-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg text-sm font-medium cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
