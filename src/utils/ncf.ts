import type { NCFSequence, NCFType } from '@/types';

export const NCF_TYPES: Record<NCFType, string> = {
  B01: 'Crédito Fiscal',
  B02: 'Consumidor Final',
  B14: 'Gubernamental',
  B15: 'Exportaciones',
};

export const generateNCF = (sequence: NCFSequence): string => {
  const nextNumber = sequence.lastNumber + 1;
  const padded = String(nextNumber).padStart(8, '0');
  return `${sequence.prefix}${padded}`;
};

export const formatNCF = (ncf: string): string => {
  if (ncf.length === 11) {
    return `${ncf.slice(0, 1)}${ncf.slice(1, 3)}-${ncf.slice(3)}`;
  }
  return ncf;
};

export const getDGIIVerificationUrl = (ncf: string, rnc: string): string => {
  return `https://dgii.gov.do/app/WebApps/ConsultasWeb/consultas/ncf.aspx?ncf=${ncf}&rnc=${rnc}`;
};

export const DEFAULT_NCF_SEQUENCES: NCFSequence[] = [
  { type: 'B02', label: 'Consumidor Final', prefix: 'B0200000', lastNumber: 0, limit: 9999999, isActive: true },
  { type: 'B01', label: 'Crédito Fiscal', prefix: 'B0100000', lastNumber: 0, limit: 9999999, isActive: true },
  { type: 'B14', label: 'Gubernamental', prefix: 'B1400000', lastNumber: 0, limit: 9999999, isActive: true },
  { type: 'B15', label: 'Exportaciones', prefix: 'B1500000', lastNumber: 0, limit: 9999999, isActive: true },
];
