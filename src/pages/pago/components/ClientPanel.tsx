import { useState } from 'react';
import { usePOSStore } from '@/store/posStore';
import type { Client, NCFType } from '@/types';
import { X, Search, UserPlus, Check, Phone, CreditCard } from 'lucide-react';

interface ClientPanelProps {
  onClose: () => void;
}

const NCF_OPTIONS: { value: NCFType; label: string }[] = [
  { value: 'B02', label: 'B02 – Consumidor Final' },
  { value: 'B01', label: 'B01 – Crédito Fiscal' },
  { value: 'B14', label: 'B14 – Gubernamental' },
  { value: 'B15', label: 'B15 – Exportaciones' },
];

export default function ClientPanel({ onClose }: ClientPanelProps) {
  const { currentClient, setCurrentClient, addClient, searchClients } = usePOSStore();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'search' | 'new'>('search');
  const [form, setForm] = useState({ name: '', cedula: '', rnc: '', phone: '', defaultNCF: 'B02' as NCFType });
  const [formError, setFormError] = useState('');

  const results = searchClients(query);

  const handleSelectClient = (client: Client) => {
    setCurrentClient(client);
    onClose();
  };

  const handleRemoveClient = () => {
    setCurrentClient(null);
    onClose();
  };

  const handleAddNew = () => {
    if (!form.name.trim()) { setFormError('El nombre es obligatorio'); return; }
    if (!form.cedula && !form.rnc) { setFormError('Ingresa cédula o RNC'); return; }
    setFormError('');
    const newClient = addClient({
      name: form.name,
      cedula: form.cedula || undefined,
      rnc: form.rnc || undefined,
      phone: form.phone || undefined,
      defaultNCF: form.defaultNCF,
    });
    setCurrentClient(newClient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-800 h-full shadow-2xl flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 flex items-center justify-center"><i className="ri-user-line text-emerald-500"></i></span>
            Agregar Cliente
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentClient && (
          <div className="mx-4 mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{currentClient.name}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {currentClient.cedula || currentClient.rnc} · {currentClient.defaultNCF}
                </p>
              </div>
              <button
                onClick={handleRemoveClient}
                className="text-xs text-rose-500 hover:text-rose-600 cursor-pointer"
              >
                Quitar
              </button>
            </div>
          </div>
        )}

        <div className="flex border-b border-slate-200 dark:border-slate-700 mt-4">
          <button
            onClick={() => setMode('search')}
            className={`flex-1 py-2 text-sm font-medium cursor-pointer ${mode === 'search' ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
          >
            Buscar
          </button>
          <button
            onClick={() => setMode('new')}
            className={`flex-1 py-2 text-sm font-medium cursor-pointer ${mode === 'new' ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
          >
            Nuevo Cliente
          </button>
        </div>

        {mode === 'search' ? (
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, cédula o RNC..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-auto space-y-2">
              {results.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{client.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {(client.cedula || client.rnc) && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {client.cedula || client.rnc}
                          </span>
                        )}
                        {client.phone && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {client.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        client.defaultNCF === 'B01' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                        client.defaultNCF === 'B14' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                        'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {client.defaultNCF}
                      </span>
                      {currentClient?.id === client.id && (
                        <Check className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {results.length === 0 && query && (
                <div className="text-center py-6 text-slate-400 text-sm">
                  <p>No se encontraron clientes</p>
                  <button
                    onClick={() => setMode('new')}
                    className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
                  >
                    ¿Registrar nuevo cliente?
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                Nombre completo / Razón social *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Juan Rodríguez"
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Cédula</label>
              <input
                type="text"
                value={form.cedula}
                onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                placeholder="001-1234567-8"
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">RNC (empresa)</label>
              <input
                type="text"
                value={form.rnc}
                onChange={(e) => setForm({ ...form, rnc: e.target.value })}
                placeholder="130-12345-6"
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Teléfono</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="809-555-0000"
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Tipo de Comprobante</label>
              <select
                value={form.defaultNCF}
                onChange={(e) => setForm({ ...form, defaultNCF: e.target.value as NCFType })}
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {NCF_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {formError && (
              <p className="text-xs text-rose-500">{formError}</p>
            )}
            <button
              onClick={handleAddNew}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors mt-2"
            >
              <UserPlus className="w-4 h-4" />
              Registrar y Seleccionar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
