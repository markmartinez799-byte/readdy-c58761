import { usePOSStore } from '@/store/posStore';
import { X, AlertTriangle, Package, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface ExpiringModalProps {
  onClose: () => void;
  onAddToCart: (product: import('@/types').Product) => void;
}

function getDaysLeft(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getUrgencyLevel(days: number): {
  label: string;
  badgeColor: string;
  rowColor: string;
  icon: React.ReactNode;
} {
  if (days < 0) return {
    label: 'VENCIDO',
    badgeColor: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    rowColor: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  };
  if (days <= 30) return {
    label: `${days} días`,
    badgeColor: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    rowColor: 'border-red-200 dark:border-red-800 bg-red-50/70 dark:bg-red-900/10',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  };
  if (days <= 60) return {
    label: `${days} días`,
    badgeColor: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    rowColor: 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/5',
    icon: <Clock className="w-3.5 h-3.5" />,
  };
  if (days <= 90) return {
    label: `${days} días`,
    badgeColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    rowColor: 'border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-900/5',
    icon: <Clock className="w-3.5 h-3.5" />,
  };
  return {
    label: `${days} días`,
    badgeColor: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    rowColor: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-900/5',
    icon: <Clock className="w-3.5 h-3.5" />,
  };
}

const URGENCY_GROUPS = [
  { key: 'vencido',   label: 'Vencidos',           range: (d: number) => d < 0,           color: 'text-red-600',    dot: 'bg-red-500' },
  { key: 'd30',       label: 'Crítico — 0 a 30 días',  range: (d: number) => d >= 0 && d <= 30,  color: 'text-red-500',    dot: 'bg-red-400' },
  { key: 'd60',       label: 'Urgente — 31 a 60 días', range: (d: number) => d > 30 && d <= 60,  color: 'text-orange-600', dot: 'bg-orange-400' },
  { key: 'd90',       label: 'Atención — 61 a 90 días',range: (d: number) => d > 60 && d <= 90,  color: 'text-amber-600',  dot: 'bg-amber-400' },
  { key: 'd150',      label: 'Aviso — 91 a 150 días',  range: (d: number) => d > 90 && d <= 150, color: 'text-yellow-600', dot: 'bg-yellow-400' },
];

export default function ExpiringModal({ onClose, onAddToCart }: ExpiringModalProps) {
  const { getExpiringProducts } = usePOSStore();
  // Fetch all products expiring within 150 days (includes already expired)
  const expiring = getExpiringProducts(150)
    .filter((p) => p.expiryDate)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  const totalCount = expiring.length;
  const criticalCount = expiring.filter((p) => getDaysLeft(p.expiryDate) <= 30).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-800 dark:text-white">Próximos a Vencer</h3>
            <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full font-medium">
              {totalCount} productos
            </span>
            {criticalCount > 0 && (
              <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full font-bold animate-pulse">
                {criticalCount} críticos
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer w-7 h-7 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="px-4 pt-3 pb-1 flex flex-wrap gap-x-4 gap-y-1 flex-shrink-0">
          {URGENCY_GROUPS.map((g) => {
            const count = expiring.filter((p) => g.range(getDaysLeft(p.expiryDate))).length;
            if (count === 0) return null;
            return (
              <div key={g.key} className="flex items-center gap-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${g.dot}`}></span>
                <span className={`font-medium ${g.color}`}>{count}</span>
                <span className="text-slate-400">{g.label}</span>
              </div>
            );
          })}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {expiring.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Todo está bien</p>
              <p className="text-xs mt-1">No hay productos por vencer en los próximos 150 días</p>
            </div>
          ) : (
            expiring.map((product) => {
              const days = getDaysLeft(product.expiryDate);
              const urgency = getUrgencyLevel(days);
              return (
                <div
                  key={product.id}
                  className={`flex items-center justify-between p-3 rounded-xl border ${urgency.rowColor}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      {product.image ? (
                        <img src={product.image} alt="" className="w-full h-full object-cover rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <Package className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate leading-tight">{product.commercialName}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {product.presentation && <span>{product.presentation} · </span>}
                        Vence: {new Date(product.expiryDate + 'T00:00:00').toLocaleDateString('es-DO')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap ${urgency.badgeColor}`}>
                      {urgency.icon}
                      {urgency.label}
                    </span>
                    <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatCurrency(product.price)}
                    </span>
                    <button
                      onClick={() => { onAddToCart(product); onClose(); }}
                      className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 cursor-pointer transition-colors whitespace-nowrap"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
          <p className="text-xs text-slate-500 mb-3">
            💡 Prioriza la venta de los productos más críticos para reducir pérdidas. Los avisos comienzan desde 150 días antes del vencimiento.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-lg text-sm font-medium cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
