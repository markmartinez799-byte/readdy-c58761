import { usePOSStore } from '@/store/posStore';
import { X, Bookmark, Trash2, RotateCcw, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface SavedTicketsModalProps {
  onClose: () => void;
}

export default function SavedTicketsModal({ onClose }: SavedTicketsModalProps) {
  const { savedTickets, restoreTicket, deleteTicket } = usePOSStore();

  const handleRestore = (id: string) => {
    restoreTicket(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-bounce-in flex flex-col max-h-[70vh]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-500" />
            Tickets Guardados
            <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
              {savedTickets.length}
            </span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {savedTickets.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Bookmark className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay tickets guardados</p>
              <p className="text-xs mt-1">Usa F6 para guardar la venta actual</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedTickets.map((ticket) => {
                const total = ticket.cart.reduce(
                  (s, i) => s + i.quantity * i.unitPrice * (1 - i.lineDiscount / 100),
                  0
                );
                const itemCount = ticket.cart.reduce((s, i) => s + i.quantity, 0);
                return (
                  <div
                    key={ticket.id}
                    className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{ticket.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(ticket.savedAt).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
                          {ticket.client && ` · ${ticket.client.name}`}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3" />
                            {itemCount} artículos
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(total)}
                          </span>
                          {ticket.ncfType && (
                            <span className="text-xs px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                              {ticket.ncfType}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {ticket.cart.slice(0, 3).map((item) => (
                            <span
                              key={item.product.id}
                              className="text-xs px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded"
                            >
                              {item.product.commercialName}
                            </span>
                          ))}
                          {ticket.cart.length > 3 && (
                            <span className="text-xs text-slate-400">+{ticket.cart.length - 3} más</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => deleteTicket(ticket.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-500 hover:text-rose-600 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Eliminar
                      </button>
                      <button
                        onClick={() => handleRestore(ticket.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded-lg cursor-pointer transition-colors font-medium"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Recuperar Ticket
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg text-sm font-medium cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
