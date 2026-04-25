interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function ListaInteresSearch({ value, onChange }: Props) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center pointer-events-none">
        <i className="ri-search-line text-slate-400 text-sm"></i>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar producto o cliente..."
        className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-slate-50 placeholder-slate-400 w-56"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <i className="ri-close-line text-sm"></i>
        </button>
      )}
    </div>
  );
}
