import { useState } from 'react';
import { usePOSStore } from '@/store/posStore';
import { mockInsurancePlans } from '@/mocks/insurance';
import { X, Shield } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface InsuranceModalProps {
  onClose: () => void;
}

export default function InsuranceModal({ onClose }: InsuranceModalProps) {
  const { activeInsurance, setActiveInsurance, calcTotals } = usePOSStore();
  const [selectedPlanId, setSelectedPlanId] = useState(activeInsurance?.planId || '');
  const [affiliateNumber, setAffiliateNumber] = useState(activeInsurance?.affiliateNumber || '');
  const [coveragePercent, setCoveragePercent] = useState(activeInsurance?.coveragePercent ?? 80);

  const { beforeInsurance, insuranceCoverage, total } = (() => {
    const t = calcTotals();
    const before = t.afterDiscount + t.itbis;
    const cov = selectedPlanId ? before * (coveragePercent / 100) : 0;
    return { beforeInsurance: before, insuranceCoverage: cov, total: before - cov };
  })();

  const handleApply = () => {
    if (!selectedPlanId) { setActiveInsurance(null); onClose(); return; }
    const plan = mockInsurancePlans.find((p) => p.id === selectedPlanId);
    if (!plan) return;
    setActiveInsurance({
      planId: plan.id,
      planName: plan.name,
      affiliateNumber,
      coveragePercent,
    });
    onClose();
  };

  const handleRemove = () => {
    setActiveInsurance(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-bounce-in">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-500" />
            Seguro Médico (ARS)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">
              Seleccionar ARS
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto">
              {mockInsurancePlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-2.5 rounded-lg border text-sm font-medium text-left transition-all cursor-pointer ${
                    selectedPlanId === plan.id
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: plan.logoColor }}
                    />
                    <span className="truncate text-xs">{plan.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedPlanId && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                  Número de Afiliado
                </label>
                <input
                  type="text"
                  value={affiliateNumber}
                  onChange={(e) => setAffiliateNumber(e.target.value)}
                  placeholder="Ej: ARS-123456789"
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                  Cobertura: <span className="font-bold text-teal-600 dark:text-teal-400">{coveragePercent}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={coveragePercent}
                  onChange={(e) => setCoveragePercent(parseInt(e.target.value))}
                  className="w-full accent-teal-500"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Subtotal factura:</span>
                  <span className="font-mono">{formatCurrency(beforeInsurance)}</span>
                </div>
                <div className="flex justify-between text-sm text-teal-600 dark:text-teal-400">
                  <span>Cobertura ARS ({coveragePercent}%):</span>
                  <span className="font-mono">-{formatCurrency(insuranceCoverage)}</span>
                </div>
                <div className="flex justify-between font-semibold text-sm border-t border-slate-200 dark:border-slate-700 pt-2">
                  <span className="text-slate-800 dark:text-white">Cliente paga:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(total)}</span>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            {activeInsurance && (
              <button
                onClick={handleRemove}
                className="flex-1 py-2 border border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 rounded-lg text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer transition-colors"
              >
                Quitar Seguro
              </button>
            )}
            <button
              onClick={handleApply}
              disabled={!selectedPlanId}
              className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg text-sm font-semibold cursor-pointer transition-colors"
            >
              Aplicar Seguro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
