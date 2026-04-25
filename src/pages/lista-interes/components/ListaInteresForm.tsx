import { useState } from 'react';

interface Props {
  onAdd: (nombre: string, cliente: string, nota: string) => Promise<void>;
}

export function ListaInteresForm({ onAdd }: Props) {
  const [nombre, setNombre] = useState('');
  const [cliente, setCliente] = useState('');
  const [nota, setNota] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSaving(true);
    await onAdd(nombre, cliente, nota);
    setSaving(false);
    setNombre('');
    setCliente('');
    setNota('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 flex items-center justify-center bg-emerald-50 rounded-lg">
          <i className="ri-add-circle-line text-emerald-600"></i>
        </div>
        <h2 className="text-sm font-semibold text-slate-700">Agregar producto de interés</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre del producto */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Nombre del producto <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Amoxicilina 500mg"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-slate-50 placeholder-slate-400"
            required
          />
        </div>

        {/* Nombre del cliente */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Cliente (opcional)
          </label>
          <input
            type="text"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Ej: Juan Pérez"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-slate-50 placeholder-slate-400"
          />
        </div>

        {/* Nota */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Nota adicional (opcional)
          </label>
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej: Necesita presentación en jarabe"
            rows={3}
            maxLength={300}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-slate-50 placeholder-slate-400 resize-none"
          />
          <p className="text-xs text-slate-400 text-right mt-0.5">{nota.length}/300</p>
        </div>

        <button
          type="submit"
          disabled={saving || !nombre.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          {saving ? (
            <>
              <i className="ri-loader-4-line animate-spin"></i>
              Guardando...
            </>
          ) : (
            <>
              <i className="ri-heart-add-line"></i>
              Agregar a Lista de Interés
            </>
          )}
        </button>
      </form>

      {/* Info box */}
      <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
        <div className="flex gap-2">
          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">
            <i className="ri-information-line text-amber-500 text-sm"></i>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">
            Si el producto ya existe en inventario con stock disponible, se notificará automáticamente y no se agregará a la lista.
          </p>
        </div>
      </div>
    </div>
  );
}
