import { useState, useMemo } from 'react';
import { usePOSStore } from '@/store/posStore';
import { useAuthStore } from '@/store/authStore';
import { formatDateShort, formatCurrency } from '@/utils/formatters';
import { AlertTriangle, Clock, CheckCircle, Package, MapPin, Search, X } from 'lucide-react';
import type { Product } from '@/types';

type RangeFilter = '30' | '60' | '90' | '150' | 'expired' | 'all';

interface ProductWithDays extends Product {
  daysLeft: number;
}

function getDaysLeft(expiryDate: string): number {
  if (!expiryDate) return 9999;
  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) return 9999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = expiry.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getStatusBadge(days: number) {
  if (days < 0) {
    return { label: 'VENCIDO', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <AlertTriangle className="w-3 h-3" /> };
  }
  if (days <= 30) {
    return { label: `${days}d`, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <AlertTriangle className="w-3 h-3" /> };
  }
  if (days <= 60) {
    return { label: `${days}d`, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: <Clock className="w-3 h-3" /> };
  }
  if (days <= 90) {
    return { label: `${days}d`, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: <Clock className="w-3 h-3" /> };
  }
  return { label: `${days}d`, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <Clock className="w-3 h-3" /> };
}

export default function VencimientosPage() {
  const { products } = usePOSStore();
  const { branches, currentUser } = useAuthStore();
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>('150');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstante, setFilterEstante] = useState('all');

  const estantes = useMemo(
    () => Array.from(new Set(products.map((p) => p.estante).filter(Boolean))) as string[],
    [products]
  );

  const productsWithDays = useMemo<ProductWithDays[]>(() => {
    return products
      .filter((p) => p.isActive)
      .map((p) => ({ ...p, daysLeft: getDaysLeft(p.expiryDate) }))
      .filter((p) => p.expiryDate); // only products with expiry date
  }, [products]);

  const filtered = useMemo(() => {
    return productsWithDays.filter((p) => {
      const matchRange =
        rangeFilter === 'all' ||
        (rangeFilter === 'expired' && p.daysLeft < 0) ||
        (rangeFilter === '30' && p.daysLeft >= 0 && p.daysLeft <= 30) ||
        (rangeFilter === '60' && p.daysLeft >= 0 && p.daysLeft <= 60) ||
        (rangeFilter === '90' && p.daysLeft <= 90) ||
        (rangeFilter === '150' && p.daysLeft <= 150);

      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        p.commercialName.toLowerCase().includes(q) ||
        p.genericName.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        (p.estante && p.estante.toLowerCase().includes(q));

      const matchEstante = filterEstante === 'all' || p.estante === filterEstante;

      return matchRange && matchSearch && matchEstante;
    }).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [productsWithDays, rangeFilter, searchQuery, filterEstante]);

  // Summary counts
  const counts = useMemo(() => ({
    expired: productsWithDays.filter((p) => p.daysLeft < 0).length,
    d30: productsWithDays.filter((p) => p.daysLeft >= 0 && p.daysLeft <= 30).length,
    d60: productsWithDays.filter((p) => p.daysLeft > 30 && p.daysLeft <= 60).length,
    d90: productsWithDays.filter((p) => p.daysLeft > 60 && p.daysLeft <= 90).length,
    d150: productsWithDays.filter((p) => p.daysLeft > 90 && p.daysLeft <= 150).length,
  }), [productsWithDays]);

  const branchId = currentUser?.branchId || (branches[0]?.id ?? '');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sora font-bold text-slate-800 dark:text-white">Alertas de Vencimiento</h1>
          <p className="text-slate-500 dark:text-slate-400">Productos próximos a vencer o ya vencidos</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <button
          onClick={() => setRangeFilter('expired')}
          className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
            rangeFilter === 'expired'
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-red-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Vencidos</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{counts.expired}</p>
          <p className="text-xs text-slate-400 mt-1">productos</p>
        </button>

        <button
          onClick={() => setRangeFilter('30')}
          className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
            rangeFilter === '30'
              ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-red-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <Clock className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Próximos 30 días</span>
          </div>
          <p className="text-2xl font-bold text-red-500">{counts.d30}</p>
          <p className="text-xs text-slate-400 mt-1">productos</p>
        </button>

        <button
          onClick={() => setRangeFilter('60')}
          className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
            rangeFilter === '60'
              ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">31 - 60 días</span>
          </div>
          <p className="text-2xl font-bold text-orange-500">{counts.d60}</p>
          <p className="text-xs text-slate-400 mt-1">productos</p>
        </button>

        <button
          onClick={() => setRangeFilter('90')}
          className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
            rangeFilter === '90'
              ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">61 - 90 días</span>
          </div>
          <p className="text-2xl font-bold text-amber-500">{counts.d90}</p>
          <p className="text-xs text-slate-400 mt-1">productos</p>
        </button>

        <button
          onClick={() => setRangeFilter('150')}
          className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
            rangeFilter === '150'
              ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-yellow-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">91 - 150 días</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{counts.d150}</p>
          <p className="text-xs text-slate-400 mt-1">productos</p>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={rangeFilter}
                onChange={(e) => setRangeFilter(e.target.value as RangeFilter)}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm cursor-pointer"
              >
                <option value="all">Todos</option>
                <option value="expired">Vencidos</option>
                <option value="30">Próximos 30 días</option>
                <option value="60">Próximos 60 días</option>
                <option value="90">Próximos 90 días</option>
              <option value="150">Próximos 150 días</option>
              </select>
              {estantes.length > 0 && (
                <select
                  value={filterEstante}
                  onChange={(e) => setFilterEstante(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm cursor-pointer"
                >
                  <option value="all">Estante: Todos</option>
                  {estantes.map((e) => (
                    <option key={e} value={e}>Estante {e}</option>
                  ))}
                </select>
              )}
              {(searchQuery || filterEstante !== 'all') && (
                <button
                  onClick={() => { setSearchQuery(''); setFilterEstante('all'); }}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm cursor-pointer flex items-center gap-1 whitespace-nowrap"
                >
                  <X className="w-3.5 h-3.5" /> Limpiar
                </button>
              )}
            </div>
            <span className="text-xs text-slate-400 self-center whitespace-nowrap">
              {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="text-left p-3 text-slate-600 dark:text-slate-400 font-medium">Producto</th>
                <th className="text-center p-3 text-slate-600 dark:text-slate-400 font-medium">Ubicación</th>
                <th className="text-center p-3 text-slate-600 dark:text-slate-400 font-medium">Fecha Vence</th>
                <th className="text-center p-3 text-slate-600 dark:text-slate-400 font-medium">Estado</th>
                <th className="text-right p-3 text-slate-600 dark:text-slate-400 font-medium">Stock</th>
                <th className="text-right p-3 text-slate-600 dark:text-slate-400 font-medium">Precio</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const status = getStatusBadge(product.daysLeft);
                const stockQty = product.stock[branchId] || 0;
                return (
                  <tr
                    key={product.id}
                    className={`border-t border-slate-100 dark:border-slate-700 transition-colors ${
                      product.daysLeft < 0
                        ? 'bg-red-50/50 dark:bg-red-900/10'
                        : product.daysLeft <= 30
                        ? 'bg-red-50/30 dark:bg-red-900/5'
                        : product.daysLeft <= 60
                        ? 'bg-orange-50/30 dark:bg-orange-900/5'
                        : product.daysLeft <= 150
                        ? 'bg-yellow-50/20 dark:bg-yellow-900/5'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                          {product.image ? (
                            <img src={product.image} alt="" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Package className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">{product.commercialName}</p>
                          <p className="text-xs text-slate-500">{product.genericName} · {product.presentation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {product.estante ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
                          <MapPin className="w-3 h-3" />
                          {product.posicion || `Est. ${product.estante}`}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-3 text-center text-slate-700 dark:text-slate-300 font-mono text-xs">
                      {formatDateShort(product.expiryDate)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                        {status.icon}
                        {product.daysLeft < 0 ? 'VENCIDO' : `${product.daysLeft} días`}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`font-mono text-sm font-semibold ${
                        stockQty === 0 ? 'text-slate-400' : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {stockQty}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">uds</span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-800 dark:text-slate-200">
                      {formatCurrency(product.price)}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No hay productos en este rango</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {rangeFilter === 'expired' ? 'No tienes productos vencidos' : `Ningún producto vence en los próximos ${rangeFilter} días`}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
