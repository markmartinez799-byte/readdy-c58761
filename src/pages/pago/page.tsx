import { useState, useEffect, useRef } from 'react';
import { usePOSStore } from '@/store/posStore';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { playBeep, playCashRegister } from '@/utils/sounds';
import { formatCurrency } from '@/utils/formatters';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Calculator,
  CreditCard, Banknote, ArrowRightLeft, Printer, X, Package,
  User, Shield, Bookmark, AlertTriangle, CheckCircle, Loader,
} from 'lucide-react';
import type { Product, PaymentMethod, NCFType } from '@/types';
import QuickBar from './components/QuickBar';
import ClientPanel from './components/ClientPanel';
import InsuranceModal from './components/InsuranceModal';
import StockModal from './components/StockModal';
import ExpiringModal from './components/ExpiringModal';
import SavedTicketsModal from './components/SavedTicketsModal';
import BuscadorStockModal from './components/BuscadorStockModal';
import ProductPreviewModal from './components/ProductPreviewModal';
import { saveBillingToSupabase } from '@/services/billingService';

const NCF_OPTIONS: { value: NCFType; label: string; color: string }[] = [
  { value: 'B02', label: 'B02 – Consumidor Final', color: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' },
  { value: 'B01', label: 'B01 – Crédito Fiscal', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
  { value: 'B14', label: 'B14 – Gubernamental', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  { value: 'B15', label: 'B15 – Exportaciones', color: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300' },
];

export default function PagoPage() {
  const { currentUser, currentBranch } = useAuthStore();
  const { isSoundEnabled } = useAppStore();
  const {
    products, cart, addToCart, removeFromCart, updateCartQuantity,
    updateLineDiscount, clearCart, globalDiscount, setGlobalDiscount,
    ncfType, setNCFType, clientRnc, clientName, setClientInfo,
    completeSale, getStockInBranch, getStockInOtherBranches,
    currentClient, setCurrentClient, activeInsurance, setActiveInsurance,
    savedTickets, saveTicket, calcTotals, getExpiringProducts,
  } = usePOSStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showBuscadorStock, setShowBuscadorStock] = useState(false);
  const [showClientPanel, setShowClientPanel] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showExpiringModal, setShowExpiringModal] = useState(false);
  const [showSavedTickets, setShowSavedTickets] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');
  const [showDiscountPanel, setShowDiscountPanel] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [cashReceived, setCashReceived] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [localClientRnc, setLocalClientRnc] = useState(clientRnc);
  const [localClientName, setLocalClientName] = useState(clientName);
  // Billing state
  const [isSaving, setIsSaving] = useState(false);
  const [saleResult, setSaleResult] = useState<{ ncf: string; total: number; facturaId: string } | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const discountRef = useRef<HTMLInputElement>(null);
  const saveLabelRef = useRef<HTMLInputElement>(null);

  const expiringProducts = getExpiringProducts(30);
  const { subtotal, discountAmount, itbis, insuranceCoverage, total } = calcTotals();
  const change = paymentMethod === 'efectivo' ? parseFloat(cashReceived || '0') - total : 0;
  const ncfOption = NCF_OPTIONS.find((o) => o.value === ncfType) || NCF_OPTIONS[0];

  // Keyboard shortcuts F1–F9
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const fKeys: Record<string, () => void> = {
        F1: () => { if (window.confirm('¿Vaciar carrito y comenzar nueva venta?')) clearCart(); },
        F2: () => searchInputRef.current?.focus(),
        F3: () => setShowClientPanel(true),
        F4: () => setShowInsuranceModal(true),
        F5: () => setShowBuscadorStock(true),
        F6: () => { if (cart.length > 0) setShowSaveDialog(true); else setShowSavedTickets(true); },
        F7: () => setShowExpiringModal(true),
        F8: () => { setShowDiscountPanel(true); setTimeout(() => discountRef.current?.focus(), 100); },
        F9: () => { if (cart.length > 0) setShowCheckout(true); },
      };
      if (fKeys[e.key]) {
        e.preventDefault();
        fKeys[e.key]();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, clearCart]);

  const filteredProducts = products.filter(
    (p) =>
      p.isActive &&
      (p.commercialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery))
  );

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    if (isSoundEnabled) playBeep();
  };

  const handleProductClick = (product: Product) => {
    const stock = getStockInBranch(product.id, currentBranch?.id || '');
    if (stock <= 0) {
      setSelectedProductForStock(product);
      setShowStockModal(true);
      return;
    }
    handleAddToCart(product);
  };

  const handleCompleteSale = async () => {
    if (!currentUser || !currentBranch) return;
    setIsSaving(true);
    setBillingError(null);
    setClientInfo(localClientRnc, localClientName);

    // 1. Guardar en Supabase (NCF real desde trigger)
    const billingResult = await saveBillingToSupabase({
      usuarioId: currentUser.id,
      sucursalId: currentBranch.id,
      clienteId: currentClient?.id,
      tipoNcf: ncfType,
      metodoPago: paymentMethod,
      subtotal,
      itbisTotal: itbis,
      descuento: globalDiscount,
      total,
      items: cart,
    });

    if (!billingResult.success) {
      setIsSaving(false);
      setBillingError(billingResult.error || 'Error al guardar la factura en Supabase');
      return;
    }

    // 2. Completar venta local (actualiza stock local y limpia carrito)
    const sale = completeSale(paymentMethod, currentUser.id, currentUser.name, currentBranch.id);

    if (sale && isSoundEnabled) playCashRegister();

    setIsSaving(false);
    setShowCheckout(false);
    setCashReceived('');
    setCardAmount('');

    // 3. Mostrar modal de éxito con NCF real
    setSaleResult({
      ncf: billingResult.ncf || sale?.ncf || '',
      total,
      facturaId: billingResult.facturaId || '',
    });
  };

  const handleSaveTicket = () => {
    if (!saveLabel.trim()) return;
    saveTicket(saveLabel.trim());
    setSaveLabel('');
    setShowSaveDialog(false);
  };

  const getStockBadgeClass = (stock: number) => {
    if (stock <= 0) return 'bg-rose-100 dark:bg-rose-900/30 text-rose-600';
    if (stock <= 5) return 'bg-rose-100 dark:bg-rose-900/30 text-rose-600';
    if (stock <= 15) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600';
    return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600';
  };

  const getDaysUntilExpiry = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex flex-col animate-fade-in" style={{ height: 'calc(100vh - 128px)', overflow: 'hidden' }}>
      {/* Quick Access Bar */}
      <QuickBar
        onNewSale={() => { if (cart.length === 0 || window.confirm('¿Vaciar carrito?')) clearCart(); }}
        onFocusSearch={() => searchInputRef.current?.focus()}
        onOpenClient={() => setShowClientPanel(true)}
        onOpenInsurance={() => setShowInsuranceModal(true)}
        onOpenStock={() => setShowBuscadorStock(true)}
        onSaveTicket={() => { if (cart.length > 0) setShowSaveDialog(true); else setShowSavedTickets(true); }}
        onOpenExpiring={() => setShowExpiringModal(true)}
        onOpenDiscount={() => { setShowDiscountPanel(true); setTimeout(() => discountRef.current?.focus(), 100); }}
        onCheckout={() => { if (cart.length > 0) setShowCheckout(true); }}
        savedTicketsCount={savedTickets.length}
        expiringCount={expiringProducts.length}
      />

      {/* Main 2-column layout — fills remaining height, no external scroll */}
      <div className="flex-1 flex gap-4 mt-3 overflow-hidden min-h-0">

        {/* ── LEFT PANEL: Product search & grid (scrollable) ── */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0">
          {/* Search bar */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="F2 – Buscar producto o escanear código de barras..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Expiring alert banner */}
          {expiringProducts.length > 0 && (
            <button
              onClick={() => setShowExpiringModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-300 text-xs hover:bg-amber-100 dark:hover:bg-amber-900/30 cursor-pointer transition-colors text-left flex-shrink-0"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>{expiringProducts.length} productos</strong> vencen en los próximos 30 días.
                Ofrécelos con prioridad — haz clic para ver el listado.
              </span>
            </button>
          )}

          {/* Product grid — this is the ONLY scrollable area on the left */}
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col min-h-0">
            <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex-shrink-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {filteredProducts.length} productos encontrados
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {filteredProducts.map((product) => {
                  const stock = getStockInBranch(product.id, currentBranch?.id || '');
                  const inCart = cart.find((c) => c.product.id === product.id)?.quantity || 0;
                  const daysToExpiry = getDaysUntilExpiry(product.expiryDate);
                  const isExpiringSoon = daysToExpiry <= 30;
                  const otherBranchStock = stock <= 0
                    ? getStockInOtherBranches(product.id, currentBranch?.id || '').filter((s) => s.stock > 0)
                    : [];
                  return (
                    <div
                      key={product.id}
                      className={`relative p-3 rounded-lg border text-left transition-all ${
                        stock <= 0
                          ? 'opacity-60 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                          : inCart > 0
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-600'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'
                      }`}
                    >
                      {/* Preview button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreviewProduct(product); }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 rounded-full text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-all z-10"
                        title="Ver detalles del producto"
                      >
                        <i className="ri-eye-line text-xs"></i>
                      </button>

                      {isExpiringSoon && (
                        <div className="absolute top-1.5 left-1.5 w-4 h-4 flex items-center justify-center">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                      )}
                      {inCart > 0 && (
                        <div className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none z-10">
                          {inCart}
                        </div>
                      )}
                      <button
                        onClick={() => handleProductClick(product)}
                        className="block w-full text-left cursor-pointer"
                      >
                      <div className="aspect-square rounded-lg bg-slate-100 dark:bg-slate-700 mb-2 overflow-hidden">
                        {product.image ? (
                          <img src={product.image} alt={product.commercialName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <p className="font-medium text-slate-800 dark:text-white text-xs line-clamp-2 leading-tight">
                        {product.commercialName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{product.lab}</p>
                      {(product.estante || product.descripcion) && (
                        <div className="mt-1 space-y-0.5">
                          {product.estante && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 truncate">
                              <i className="ri-map-pin-line text-[10px]"></i>
                              Est. {product.estante}{product.posicion ? ` · ${product.posicion}` : ''}
                            </p>
                          )}
                          {product.descripcion && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-2 leading-tight">
                              {product.descripcion}
                            </p>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                          {formatCurrency(product.price)}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${getStockBadgeClass(stock)}`}>
                          {stock}
                        </span>
                      </div>
                      {stock <= 0 && otherBranchStock.length > 0 && (
                        <div className="mt-1.5 text-xs text-center bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400 py-1 px-1.5 rounded leading-tight">
                          Hay en {otherBranchStock.length} suc.
                        </div>
                      )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Cart — FULLY FIXED, never scrolls externally ── */}
        <div className="w-[340px] xl:w-[380px] flex-shrink-0 flex flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">

          {/* A) HEADER — fixed, never scrolls */}
          <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            {/* NCF + item count */}
            <div className="flex items-center gap-2 px-3 pt-3 pb-2">
              <select
                value={ncfType}
                onChange={(e) => setNCFType(e.target.value as NCFType)}
                className={`flex-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border-0 outline-none cursor-pointer ${ncfOption.color}`}
              >
                {NCF_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 whitespace-nowrap">
                <ShoppingCart className="w-3.5 h-3.5" />
                {cart.reduce((s, i) => s + i.quantity, 0)} ítem(s)
              </span>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
                  title="Vaciar carrito"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Client + Insurance + Save */}
            <div className="flex gap-2 px-3 pb-3">
              <button
                onClick={() => setShowClientPanel(true)}
                className={`flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                  currentClient
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-400'
                }`}
              >
                <User className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{currentClient ? currentClient.name : '&nbsp;Cliente'}</span>
                {currentClient && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setCurrentClient(null); }}
                    className="ml-auto text-emerald-400 hover:text-rose-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </button>

              <button
                onClick={() => setShowInsuranceModal(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                  activeInsurance
                    ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-400'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                {activeInsurance ? (
                  <span className="truncate max-w-[60px]">{activeInsurance.planName.replace('ARS ', '')}</span>
                ) : (
                  <span>ARS</span>
                )}
                {activeInsurance && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveInsurance(null); }}
                    className="ml-1 text-teal-400 hover:text-rose-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </button>

              <button
                onClick={() => setShowSaveDialog(true)}
                disabled={cart.length === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-amber-400 hover:text-amber-600 disabled:opacity-40 cursor-pointer transition-all"
                title="F6 – Guardar ticket"
              >
                <Bookmark className="w-3.5 h-3.5" />
                {savedTickets.length > 0 && (
                  <span className="bg-amber-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                    {savedTickets.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* B) CART ITEMS — scrollable internally */}
          <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                <ShoppingCart className="w-14 h-14 mb-3 opacity-20" />
                <p className="text-sm font-medium">Carrito vacío</p>
                <p className="text-xs mt-1 text-center">Haz clic en un producto<br />o escanea el código de barras</p>
              </div>
            ) : (
              cart.map((item) => {
                const lineTotal = item.quantity * item.unitPrice * (1 - item.lineDiscount / 100);
                return (
                  <div
                    key={item.product.id}
                    className="bg-slate-50 dark:bg-slate-900 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 dark:text-white text-sm truncate leading-tight">
                          {item.product.commercialName}
                        </p>
                        <p className="text-xs text-slate-500">{item.product.presentation}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setPreviewProduct(item.product)}
                          className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-emerald-500 cursor-pointer transition-colors"
                          title="Ver detalles"
                        >
                          <i className="ri-eye-line text-xs"></i>
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-rose-500 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-mono font-bold text-sm text-slate-800 dark:text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-400">Desc.</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={item.lineDiscount}
                            onChange={(e) => updateLineDiscount(item.product.id, Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                            className="w-10 text-center text-xs border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 py-0.5 outline-none"
                          />
                          <span className="text-xs text-slate-400">%</span>
                        </div>
                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                          {formatCurrency(lineTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* C) FOOTER — ALWAYS VISIBLE, never scrolls */}
          <div className="flex-shrink-0 border-t-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            {/* Global discount toggle */}
            <div className="flex items-center gap-2 px-3 pt-2.5">
              <button
                onClick={() => setShowDiscountPanel(!showDiscountPanel)}
                className="text-xs text-slate-500 hover:text-orange-500 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <i className="ri-percent-line"></i>
                Descuento global
              </button>
              {showDiscountPanel && (
                <div className="flex items-center gap-1 ml-auto">
                  <input
                    ref={discountRef}
                    type="number"
                    min={0}
                    max={100}
                    value={globalDiscount}
                    onChange={(e) => setGlobalDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    className="w-16 text-center text-sm border border-orange-300 dark:border-orange-700 rounded-lg bg-white dark:bg-slate-800 py-1 px-2 outline-none focus:ring-1 focus:ring-orange-400"
                  />
                  <span className="text-sm text-slate-500">%</span>
                  <button
                    onClick={() => { setShowDiscountPanel(false); setGlobalDiscount(0); }}
                    className="text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {!showDiscountPanel && globalDiscount > 0 && (
                <span className="text-xs font-bold text-orange-500 ml-auto">{globalDiscount}% activo</span>
              )}
            </div>

            {/* Totals */}
            <div className="px-3 pt-2 pb-1 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-orange-600 dark:text-orange-400">
                  <span>Descuento ({globalDiscount}%)</span>
                  <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">ITBIS (18%)</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(itbis)}</span>
              </div>
              {insuranceCoverage > 0 && activeInsurance && (
                <div className="flex justify-between text-sm text-teal-600 dark:text-teal-400">
                  <span>{activeInsurance.planName} ({activeInsurance.coveragePercent}%)</span>
                  <span className="font-mono">-{formatCurrency(insuranceCoverage)}</span>
                </div>
              )}
            </div>

            {/* TOTAL — big and prominent */}
            <div className="mx-3 mb-3 mt-1 bg-slate-900 dark:bg-slate-950 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total</span>
              <span className="text-3xl font-mono font-black text-emerald-400 leading-none">
                {formatCurrency(total)}
              </span>
            </div>

            {/* COBRAR button */}
            <div className="px-3 pb-3">
              <button
                onClick={() => setShowCheckout(true)}
                disabled={cart.length === 0}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 cursor-pointer transition-all whitespace-nowrap"
              >
                <Calculator className="w-6 h-6" />
                <span>Pagar</span>
                {cart.length > 0 && (
                  <span className="ml-auto bg-white/20 text-white text-sm font-semibold px-2 py-0.5 rounded-lg">
                    {cart.reduce((s, i) => s + i.quantity, 0)} ítem(s)
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CHECKOUT MODAL ── */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-bounce-in max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
              <h3 className="font-semibold text-slate-800 dark:text-white">Finalizar Venta</h3>
              <button onClick={() => { setShowCheckout(false); setBillingError(null); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Tipo de Comprobante</label>
                <select
                  value={ncfType}
                  onChange={(e) => setNCFType(e.target.value as NCFType)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm"
                >
                  {NCF_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {(ncfType === 'B01' || currentClient) && (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">RNC / Cédula Cliente</label>
                    <input
                      type="text"
                      value={localClientRnc}
                      onChange={(e) => setLocalClientRnc(e.target.value)}
                      placeholder="001-1234567-1"
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Nombre / Razón Social</label>
                    <input
                      type="text"
                      value={localClientName}
                      onChange={(e) => setLocalClientName(e.target.value)}
                      placeholder="Nombre del cliente"
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Método de Pago</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'efectivo', label: 'Efectivo', icon: Banknote },
                    { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                    { value: 'mixto', label: 'Mixto', icon: ArrowRightLeft },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPaymentMethod(opt.value as PaymentMethod)}
                      className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                        paymentMethod === opt.value
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                      }`}
                    >
                      <opt.icon className="w-5 h-5" />
                      <span className="text-xs">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {(paymentMethod === 'efectivo' || paymentMethod === 'mixto') && (
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Monto en Efectivo (RD$)</label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-mono text-lg"
                    placeholder="0.00"
                    autoFocus
                  />
                  {parseFloat(cashReceived || '0') > 0 && (
                    <p className="text-sm mt-1.5">
                      Vuelto: <span className={`font-mono font-bold ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(change)}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {(paymentMethod === 'tarjeta' || paymentMethod === 'mixto') && (
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Monto Tarjeta (RD$)</label>
                  <input
                    type="number"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-mono text-lg"
                    placeholder="0.00"
                  />
                </div>
              )}

              {activeInsurance && (
                <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                  <p className="text-xs font-semibold text-teal-700 dark:text-teal-300 mb-1">
                    Seguro: {activeInsurance.planName}
                  </p>
                  <p className="text-xs text-teal-600 dark:text-teal-400">
                    Afiliado: {activeInsurance.affiliateNumber || 'No especificado'} ·
                    Cobertura: {activeInsurance.coveragePercent}%
                    ({formatCurrency(insuranceCoverage)})
                  </p>
                </div>
              )}

              {/* Error de facturación */}
              {billingError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-800">
                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-1">Error al guardar factura</p>
                  <p className="text-xs text-rose-600 dark:text-rose-400">{billingError}</p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-slate-800 dark:text-white">Total cobrado</span>
                  <span className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(total)}
                  </span>
                </div>
                <button
                  onClick={handleCompleteSale}
                  disabled={
                    isSaving ||
                    (paymentMethod === 'efectivo' && parseFloat(cashReceived || '0') < total) ||
                    (paymentMethod === 'mixto' &&
                      parseFloat(cashReceived || '0') + parseFloat(cardAmount || '0') < total)
                  }
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
                >
                  {isSaving ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Guardando en Supabase...
                    </>
                  ) : (
                    <>
                      <Printer className="w-5 h-5" />
                      Completar e Imprimir
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SALE SUCCESS MODAL — TICKET DESIGN ── */}
      {saleResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm animate-bounce-in overflow-hidden">
            {/* Header verde */}
            <div className="bg-emerald-600 px-6 py-5 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">¡Venta Completada!</h3>
              <p className="text-emerald-100 text-xs mt-0.5">{new Date().toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>

            {/* Ticket body */}
            <div className="px-5 py-4">
              {/* Empresa */}
              <div className="text-center mb-4">
                <p className="font-bold text-slate-800 dark:text-white text-sm">Farmacia GENOSAN</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">RNC: 1-01-00000-0</p>
                {currentBranch && <p className="text-xs text-slate-500 dark:text-slate-400">{currentBranch.name}</p>}
              </div>

              {/* Línea punteada */}
              <div className="border-t border-dashed border-slate-300 dark:border-slate-600 my-3" />

              {/* Items del carrito */}
              <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                      {item.quantity}x {item.product.commercialName}
                    </span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 flex-shrink-0 ml-2">
                      {formatCurrency(item.quantity * item.unitPrice * (1 - item.lineDiscount / 100))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Línea punteada */}
              <div className="border-t border-dashed border-slate-300 dark:border-slate-600 my-3" />

              {/* Totales */}
              <div className="space-y-1 text-xs mb-3">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Descuento ({globalDiscount}%)</span>
                    <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>ITBIS (18%)</span>
                  <span className="font-mono">{formatCurrency(itbis)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 dark:text-white text-sm pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>TOTAL</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(saleResult.total)}</span>
                </div>
              </div>

              {/* Línea punteada */}
              <div className="border-t border-dashed border-slate-300 dark:border-slate-600 my-3" />

              {/* NCF + ID */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">NCF (DGII)</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">{saleResult.ncf}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Método de pago</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Cajero</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{currentUser?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">ID Factura</span>
                  <span className="font-mono text-slate-400 text-xs">{saleResult.facturaId.slice(0, 8)}...</span>
                </div>
              </div>

              <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4 italic">
                ¡Gracias por su compra!
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setSaleResult(null)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors whitespace-nowrap"
              >
                Nueva Venta
              </button>
              <button
                onClick={() => {
                  if (saleResult) {
                    const lines = [
                      '================================',
                      '       FARMACIA GENOSAN         ',
                      '      RNC: 1-01-00000-0         ',
                      currentBranch?.name || '',
                      '================================',
                      `Fecha: ${new Date().toLocaleString('es-DO')}`,
                      '--------------------------------',
                      ...cart.map((i) => `${i.quantity}x ${i.product.commercialName.slice(0,20).padEnd(20)} ${formatCurrency(i.quantity * i.unitPrice * (1 - i.lineDiscount / 100))}`),
                      '--------------------------------',
                      `Subtotal:  ${formatCurrency(subtotal)}`,
                      `ITBIS 18%: ${formatCurrency(itbis)}`,
                      `TOTAL:     ${formatCurrency(saleResult.total)}`,
                      '================================',
                      `NCF: ${saleResult.ncf}`,
                      `ID:  ${saleResult.facturaId}`,
                      '================================',
                      '      ¡Gracias por su compra!   ',
                    ];
                    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `factura_${saleResult.ncf}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                  setSaleResult(null);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SAVE TICKET DIALOG ── */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm animate-bounce-in">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-500" />
                Guardar Ticket
              </h3>
              <button onClick={() => setShowSaveDialog(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                El ticket se guardará para retomarlo después. El carrito actual quedará vacío.
              </p>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                  Nombre o referencia del ticket
                </label>
                <input
                  ref={saveLabelRef}
                  type="text"
                  value={saveLabel}
                  onChange={(e) => setSaveLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTicket(); }}
                  placeholder="Ej: Cliente mesa 3, Pedido Juan..."
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-medium hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveTicket}
                  disabled={!saveLabel.trim()}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg text-sm font-semibold cursor-pointer transition-colors"
                >
                  Guardar Ticket
                </button>
              </div>
              {savedTickets.length > 0 && (
                <button
                  onClick={() => { setShowSaveDialog(false); setShowSavedTickets(true); }}
                  className="w-full text-xs text-amber-600 hover:text-amber-700 cursor-pointer text-center"
                >
                  Ver {savedTickets.length} ticket(s) guardado(s)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ALL MODALS ── */}
      {showClientPanel && <ClientPanel onClose={() => setShowClientPanel(false)} />}
      {showInsuranceModal && <InsuranceModal onClose={() => setShowInsuranceModal(false)} />}
      {showStockModal && (
        <StockModal
          product={selectedProductForStock}
          onClose={() => { setShowStockModal(false); setSelectedProductForStock(null); }}
        />
      )}
      {showBuscadorStock && (
        <BuscadorStockModal
          onClose={() => setShowBuscadorStock(false)}
          onAddToCart={handleAddToCart}
        />
      )}
      {showExpiringModal && (
        <ExpiringModal
          onClose={() => setShowExpiringModal(false)}
          onAddToCart={handleAddToCart}
        />
      )}
      {showSavedTickets && <SavedTicketsModal onClose={() => setShowSavedTickets(false)} />}
      {previewProduct && (
        <ProductPreviewModal
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
          onAddToCart={(p) => {
            const s = getStockInBranch(p.id, currentBranch?.id || '');
            if (s <= 0) {
              setSelectedProductForStock(p);
              setShowStockModal(true);
            } else {
              handleAddToCart(p);
            }
          }}
        />
      )}
    </div>
  );
}
