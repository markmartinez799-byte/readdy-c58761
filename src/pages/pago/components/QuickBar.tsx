interface QuickBarProps {
  onNewSale: () => void;
  onFocusSearch: () => void;
  onOpenClient: () => void;
  onOpenInsurance: () => void;
  onOpenStock: () => void;
  onSaveTicket: () => void;
  onOpenExpiring: () => void;
  onOpenDiscount: () => void;
  onCheckout: () => void;
  savedTicketsCount: number;
  expiringCount: number;
}

const SHORTCUTS = [
  { key: 'F1', label: 'Nueva venta', color: 'text-slate-500 dark:text-slate-400' },
  { key: 'F3', label: 'Cliente', color: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'F4', label: 'Seguro', color: 'text-teal-600 dark:text-teal-400' },
  { key: 'F5', label: 'Sucursal', color: 'text-slate-500 dark:text-slate-400' },
  { key: 'F6', label: 'Ticket', color: 'text-amber-600 dark:text-amber-400' },
  { key: 'F7', label: 'Vencer', color: 'text-rose-600 dark:text-rose-400' },
  { key: 'F8', label: 'Descuento', color: 'text-orange-500 dark:text-orange-400' },
  { key: 'F9', label: 'Pagar', color: 'text-emerald-700 dark:text-emerald-300 font-bold' },
];

export default function QuickBar({
  onNewSale,
  onFocusSearch,
  onOpenClient,
  onOpenInsurance,
  onOpenStock,
  onSaveTicket,
  onOpenExpiring,
  onOpenDiscount,
  onCheckout,
  savedTicketsCount,
  expiringCount,
}: QuickBarProps) {
  const handlers = [
    onNewSale,
    onOpenClient,
    onOpenInsurance,
    onOpenStock,
    onSaveTicket,
    onOpenExpiring,
    onOpenDiscount,
    onCheckout,
  ];

  const badges: Record<number, number> = {
    4: savedTicketsCount,
    5: expiringCount,
  };

  return (
    <div className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 flex items-center gap-1 overflow-x-auto">
      {SHORTCUTS.map((s, i) => (
        <button
          key={s.key}
          onClick={handlers[i]}
          className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer group ${s.color}`}
          title={s.label}
        >
          <span className="text-xs font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
            {s.key}
          </span>
          <span className={`text-xs ${s.color}`}>{s.label}</span>
          {badges[i] > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
              {badges[i] > 9 ? '9+' : badges[i]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
