import { InteresItem } from '../page';

interface Props {
  items: InteresItem[];
  loading: boolean;
  onDelete: (id: string) => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDaysAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return `Hace ${diff} días`;
}

export function ListaInteresTable({ items, loading, onDelete }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <i className="ri-loader-4-line text-3xl text-emerald-500 animate-spin"></i>
          <p className="text-sm text-slate-500">Cargando lista...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 flex items-center justify-center bg-slate-100 rounded-full mb-3">
          <i className="ri-heart-line text-3xl text-slate-400"></i>
        </div>
        <p className="text-sm font-medium text-slate-600 mb-1">Lista vacía</p>
        <p className="text-xs text-slate-400 text-center">
          No hay productos registrados. Agrega productos que los clientes soliciten y no estén en inventario.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group"
        >
          {/* Icon */}
          <div className="w-9 h-9 flex items-center justify-center bg-rose-50 rounded-lg flex-shrink-0 mt-0.5">
            <i className="ri-medicine-bottle-line text-rose-500"></i>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {item.nombre_producto}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {item.nombre_cliente && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <i className="ri-user-line text-slate-400"></i>
                      {item.nombre_cliente}
                    </span>
                  )}
                  {item.nota && (
                    <span className="flex items-center gap-1 text-xs text-slate-500 italic truncate max-w-[200px]">
                      <i className="ri-sticky-note-line text-slate-400"></i>
                      {item.nota}
                    </span>
                  )}
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={() => onDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer flex-shrink-0"
                title="Eliminar de la lista"
              >
                <i className="ri-delete-bin-line text-sm"></i>
              </button>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">
                {getDaysAgo(item.fecha_registro)}
              </span>
              <span className="text-xs text-slate-400">
                {formatDate(item.fecha_registro)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
