import { useState, useRef, useEffect } from 'react';
import { X, Lock, ShieldCheck } from 'lucide-react';

interface PinModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

const ADMIN_PIN = '940249';

export default function PinModal({ onSuccess, onClose }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = () => {
    if (pin === ADMIN_PIN) {
      setError('');
      onSuccess();
    } else {
      setError('PIN incorrecto. Inténtalo de nuevo.');
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 500);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden ${shake ? 'animate-shake' : ''}`}>
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 px-6 py-5 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-14 h-14 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Verificación de Acceso</h3>
          <p className="text-slate-400 text-xs mt-1">Ingresa el PIN de administrador para consultar facturas</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block uppercase tracking-wider">
              PIN de Administrador
            </label>
            <input
              ref={inputRef}
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              maxLength={10}
              placeholder="••••••"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-center text-2xl font-mono tracking-[0.5em] outline-none focus:border-emerald-500 transition-colors"
            />
            {error && (
              <p className="text-rose-500 text-xs mt-2 text-center font-medium">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={pin.length === 0}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4" />
              Verificar
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}
