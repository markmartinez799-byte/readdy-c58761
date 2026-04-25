interface Props {
  type: 'success' | 'error' | 'info';
  message: string;
}

const config = {
  success: {
    bg: 'bg-emerald-50 border-emerald-200',
    icon: 'ri-checkbox-circle-line text-emerald-500',
    text: 'text-emerald-800',
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: 'ri-error-warning-line text-red-500',
    text: 'text-red-800',
  },
  info: {
    bg: 'bg-sky-50 border-sky-200',
    icon: 'ri-information-line text-sky-500',
    text: 'text-sky-800',
  },
};

export function ListaInteresNotification({ type, message }: Props) {
  const c = config[type];
  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border ${c.bg} max-w-sm animate-fade-in`}
      style={{ animation: 'slideIn 0.3s ease' }}
    >
      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
        <i className={`${c.icon} text-lg`}></i>
      </div>
      <p className={`text-sm font-medium ${c.text}`}>{message}</p>
    </div>
  );
}
