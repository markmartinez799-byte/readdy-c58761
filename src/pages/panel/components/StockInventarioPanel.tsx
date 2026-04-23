import { useState, useCallback, useRef } from 'react';
import { usePOSStore } from '@/store/posStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import type { Product, Branch } from '@/types';

interface StockRow {
  product: Product;
  stockBySucursal: Record<string, number>;
  total: number;
}

interface EditingCell {
  productId: string;
  branchId: string;
  value: string;
}

export default function StockInventarioPanel() {
  const { products, loadFromSupabase } = usePOSStore();
  const { branches } = useAuthStore();
  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedCell, setSavedCell] = useState<string | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);
  // Ref to track if save is already in progress to prevent double-save
  const isSavingRef = useRef(false);

  const activeBranches = branches.filter((b) => b.isActive);
  const activeProducts = products.filter((p) => p.isActive);

  const rows: StockRow[] = activeProducts
    .filter((p) => {
      const matchSearch =
        p.commercialName.toLowerCase().includes(search.toLowerCase()) ||
        p.genericName.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search);
      const matchLow = showLowStock
        ? activeBranches.some((b) => (p.stock[b.id] || 0) <= 5)
        : true;
      return matchSearch && matchLow;
    })
    .map((p) => {
      const stockBySucursal: Record<string, number> = {};
      activeBranches.forEach((b) => {
        stockBySucursal[b.id] = p.stock[b.id] || 0;
      });
      const total = Object.values(stockBySucursal).reduce((s, v) => s + v, 0);
      return { product: p, stockBySucursal, total };
    });

  const filteredRows =
    filterBranch === 'all'
      ? rows
      : rows.filter((r) => (r.stockBySucursal[filterBranch] || 0) > 0 || true);

  const totalGeneral = rows.reduce((s, r) => s + r.total, 0);
  const lowStockCount = rows.filter((r) =>
    activeBranches.some((b) => (r.stockBySucursal[b.id] || 0) <= 5)
  ).length;

  const handleCellClick = (productId: string, branchId: string, currentValue: number) => {
    setEditingCell({ productId, branchId, value: String(currentValue) });
  };

  const handleSaveCell = useCallback(async (cellToSave?: EditingCell) => {
    // Use provided cell or current editingCell
    const cell = cellToSave ?? editingCell;
    if (!cell) return;
    // Prevent double-save (Enter + blur firing together)
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    const newQty = parseInt(cell.value, 10);
    if (isNaN(newQty) || newQty < 0) {
      setEditingCell(null);
      isSavingRef.current = false;
      return;
    }

    setSaving(true);
    setEditingCell(null); // Close input immediately

    try {
      const { error } = await supabase.from('stock_farmacia').upsert(
        {
          producto_id: cell.productId,
          sucursal_id: cell.branchId,
          cantidad: newQty,
        },
        { onConflict: 'producto_id,sucursal_id' }
      );

      if (!error) {
        // Update local store state immediately without full reload
        usePOSStore.setState((state) => ({
          products: state.products.map((p) => {
            if (p.id !== cell.productId) return p;
            return {
              ...p,
              stock: { ...p.stock, [cell.branchId]: newQty },
            };
          }),
        }));

        const cellKey = `${cell.productId}-${cell.branchId}`;
        setSavedCell(cellKey);
        setTimeout(() => setSavedCell(null), 2000);
      } else {
        console.error('[StockInventarioPanel] Error saving stock:', error.message);
        // On error, reload from Supabase to get correct state
        await loadFromSupabase();
      }
    } catch (err) {
      console.error('[StockInventarioPanel] Unexpected error:', err);
    } finally {
      setSaving(false);
      isSavingRef.current = false;
    }
  }, [editingCell, loadFromSupabase]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Capture current cell value before state clears
      const currentCell = editingCell;
      handleSaveCell(currentCell ?? undefined);
    }
    if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const getStockColor = (qty: number) => {
    if (qty === 0) return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
    if (qty <= 5) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400';
    if (qty <= 15) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
    return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <i className="ri-store-2-line text-emerald-600"></i>
              Inventario por Sucursal
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Haz clic en cualquier cantidad para editarla · Enter para guardar · Esc para cancelar
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm">
              <span className="text-slate-500 dark:text-slate-400">Total unidades:</span>
              <span className="font-bold text-slate-800 dark:text-white">{totalGeneral.toLocaleString()}</span>
            </div>
            {lowStockCount > 0 && (
              <button
                onClick={() => setShowLowStock((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  showLowStock
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                }`}
              >
                <i className="ri-alert-line"></i>
                {lowStockCount} con stock bajo
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <div className="relative flex-1">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">Todas las sucursales</option>
            {activeBranches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4 text-xs flex-wrap">
        <span className="text-slate-500 dark:text-slate-400 font-medium">Leyenda:</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Normal (&gt;15)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Bajo (6-15)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span> Crítico (1-5)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Sin stock (0)</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {filteredRows.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <i className="ri-inbox-line text-4xl block mb-2 opacity-40"></i>
            No se encontraron productos
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
              <tr>
                <th className="text-left p-3 text-slate-600 dark:text-slate-400 font-medium min-w-[200px]">Producto</th>
                {activeBranches.map((b) => (
                  <th key={b.id} className="text-center p-3 text-slate-600 dark:text-slate-400 font-medium min-w-[130px]">
                    <div className="flex flex-col items-center gap-0.5">
                      <i className="ri-building-line text-xs opacity-60"></i>
                      <span className="text-xs leading-tight">{b.name.replace('GENOSAN – ', '')}</span>
                    </div>
                  </th>
                ))}
                <th className="text-center p-3 text-slate-600 dark:text-slate-400 font-medium min-w-[90px]">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={row.product.id}
                  className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="p-3">
                    <p className="font-medium text-slate-800 dark:text-white leading-tight">{row.product.commercialName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{row.product.genericName}</p>
                    {row.product.estante && (
                      <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-xs">
                        <i className="ri-map-pin-line text-xs"></i>
                        {row.product.estante}
                      </span>
                    )}
                  </td>
                  {activeBranches.map((b) => {
                    const qty = row.stockBySucursal[b.id] || 0;
                    const cellKey = `${row.product.id}-${b.id}`;
                    const isEditing =
                      editingCell?.productId === row.product.id &&
                      editingCell?.branchId === b.id;
                    const isSaved = savedCell === cellKey;

                    return (
                      <td key={b.id} className="p-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={editingCell.value}
                              onChange={(e) =>
                                setEditingCell((prev) =>
                                  prev ? { ...prev, value: e.target.value } : null
                                )
                              }
                              onKeyDown={handleKeyDown}
                              autoFocus
                              className="w-20 text-center px-2 py-1 border-2 border-emerald-500 rounded-lg text-sm font-mono focus:outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                            />
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault(); // prevent blur before click
                                handleSaveCell(editingCell);
                              }}
                              className="w-7 h-7 flex items-center justify-center bg-emerald-500 text-white rounded-lg cursor-pointer hover:bg-emerald-600 transition-colors"
                              title="Guardar"
                            >
                              <i className="ri-check-line text-xs"></i>
                            </button>
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setEditingCell(null);
                              }}
                              className="w-7 h-7 flex items-center justify-center bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                              title="Cancelar"
                            >
                              <i className="ri-close-line text-xs"></i>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCellClick(row.product.id, b.id, qty)}
                            className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-mono font-semibold text-sm cursor-pointer transition-all hover:scale-105 hover:ring-2 hover:ring-emerald-400 ${
                              isSaved
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-400'
                                : getStockColor(qty)
                            }`}
                          >
                            {isSaved ? (
                              <>
                                <i className="ri-check-line text-xs"></i>
                                {qty}
                              </>
                            ) : (
                              <>
                                {qty}
                                <i className="ri-pencil-line text-xs opacity-40"></i>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-3 text-center">
                    <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                      {row.total}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700">
              <tr>
                <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                  TOTALES ({filteredRows.length} productos)
                </td>
                {activeBranches.map((b) => {
                  const branchTotal = filteredRows.reduce(
                    (s, r) => s + (r.stockBySucursal[b.id] || 0),
                    0
                  );
                  return (
                    <td key={b.id} className="p-3 text-center font-bold text-slate-800 dark:text-white font-mono">
                      {branchTotal.toLocaleString()}
                    </td>
                  );
                })}
                <td className="p-3 text-center font-bold text-emerald-700 dark:text-emerald-400 font-mono text-base">
                  {filteredRows.reduce((s, r) => s + r.total, 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 z-50">
          <i className="ri-loader-4-line animate-spin"></i>
          Guardando...
        </div>
      )}
    </div>
  );
}
