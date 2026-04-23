import { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePOSStore } from '@/store/posStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDateShort } from '@/utils/formatters';
import { Search, Plus, Edit2, Trash2, Package, Upload, Download, X, MapPin } from 'lucide-react';
import type { Product } from '@/types';
import ExcelImportModal from './components/ExcelImportModal';
import ProductoModal from './components/ProductoModal';

export default function ProductosPage() {
  const { products, deleteProduct } = usePOSStore();
  const { branches } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [filterItbis, setFilterItbis] = useState<'all' | 'yes' | 'no'>('all');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterEstante, setFilterEstante] = useState<string>('all');

  const estantes = Array.from(new Set(products.map((p) => p.estante).filter(Boolean))) as string[];

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      p.commercialName.toLowerCase().includes(q) ||
      p.genericName.toLowerCase().includes(q) ||
      p.barcode.includes(q) ||
      p.lab.toLowerCase().includes(q) ||
      p.presentation.toLowerCase().includes(q) ||
      (p.estante && p.estante.toLowerCase().includes(q));
    const matchItbis =
      filterItbis === 'all' ||
      (filterItbis === 'yes' && p.itbisApplicable) ||
      (filterItbis === 'no' && !p.itbisApplicable);
    const matchActive =
      filterActive === 'all' ||
      (filterActive === 'active' && p.isActive) ||
      (filterActive === 'inactive' && !p.isActive);
    const matchEstante = filterEstante === 'all' || p.estante === filterEstante;
    return matchSearch && matchItbis && matchActive && matchEstante;
  });

  const handleOpenModal = (product?: Product) => {
    setEditingProduct(product || null);
    setShowModal(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sora font-bold text-slate-800 dark:text-white">Productos</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestión de inventario y medicamentos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-2 hover:bg-slate-200 cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-4 h-4" /> Importar Excel
          </button>
          <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-2 hover:bg-slate-200 cursor-pointer whitespace-nowrap">
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2 hover:bg-emerald-700 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, código, estante..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {estantes.length > 0 && (
                <select
                  value={filterEstante}
                  onChange={(e) => setFilterEstante(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm cursor-pointer"
                >
                  <option value="all">Estante: Todos</option>
                  {estantes.map((e) => <option key={e} value={e}>Estante {e}</option>)}
                </select>
              )}
              <select
                value={filterItbis}
                onChange={(e) => setFilterItbis(e.target.value as 'all' | 'yes' | 'no')}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm cursor-pointer"
              >
                <option value="all">ITBIS: Todos</option>
                <option value="yes">Con ITBIS</option>
                <option value="no">Sin ITBIS</option>
              </select>
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm cursor-pointer"
              >
                <option value="all">Estado: Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
              {(searchQuery || filterItbis !== 'all' || filterActive !== 'all' || filterEstante !== 'all') && (
                <button
                  onClick={() => { setSearchQuery(''); setFilterItbis('all'); setFilterActive('all'); setFilterEstante('all'); }}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm cursor-pointer whitespace-nowrap flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Limpiar
                </button>
              )}
            </div>
            <span className="text-xs text-slate-400 self-center whitespace-nowrap">
              {filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="text-left p-3 text-slate-600 dark:text-slate-400 font-medium">Producto</th>
                <th className="text-left p-3 text-slate-600 dark:text-slate-400 font-medium">Laboratorio</th>
                <th className="text-left p-3 text-slate-600 dark:text-slate-400 font-medium">Presentación</th>
                <th className="text-center p-3 text-slate-600 dark:text-slate-400 font-medium">Ubicación</th>
                <th className="text-right p-3 text-slate-600 dark:text-slate-400 font-medium">Costo</th>
                <th className="text-right p-3 text-slate-600 dark:text-slate-400 font-medium">Precio</th>
                <th className="text-center p-3 text-slate-600 dark:text-slate-400 font-medium">Stock</th>
                <th className="text-center p-3 text-slate-600 dark:text-slate-400 font-medium">Vence</th>
                <th className="text-center p-3 text-slate-600 dark:text-slate-400 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                          {product.image ? (
                            <img src={product.image} alt="" className="w-full h-full object-cover rounded" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">{product.commercialName}</p>
                          <p className="text-xs text-slate-500">{product.genericName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 text-xs">{product.lab}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 text-xs">{product.presentation}</td>
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
                    <td className="p-3 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                      {product.purchaseCost ? formatCurrency(product.purchaseCost) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-800 dark:text-slate-200">{formatCurrency(product.price)}</td>
                    <td className="p-3 text-center">
                      {branches.filter((b) => b.isActive).length > 0 ? (
                        <div className="flex flex-col gap-0.5 items-center">
                          {branches.filter((b) => b.isActive).map((b) => {
                            const qty = product.stock[b.id] || 0;
                            return (
                              <span key={b.id} className={`text-xs font-mono ${qty === 0 ? 'text-slate-300 dark:text-slate-600' : qty <= 5 ? 'text-red-500 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}>
                                {b.name.split(' ')[0]}: <strong>{qty}</strong>
                              </span>
                            );
                          })}
                        </div>
                      ) : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="p-3 text-center text-slate-700 dark:text-slate-300 text-xs">{formatDateShort(product.expiryDate)}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showImportModal && createPortal(
        <ExcelImportModal onClose={() => setShowImportModal(false)} />,
        document.body
      )}

      {showModal && (
        <ProductoModal
          product={editingProduct}
          onClose={() => { setShowModal(false); setEditingProduct(null); }}
        />
      )}
    </div>
  );
}
