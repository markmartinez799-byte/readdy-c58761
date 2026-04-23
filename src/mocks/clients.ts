import type { Client } from '@/types';

export const mockClients: Client[] = [
  {
    id: 'cli-001',
    name: 'María Rodríguez',
    cedula: '001-1234567-8',
    phone: '809-555-0101',
    defaultNCF: 'B02',
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    id: 'cli-002',
    name: 'Farmacia La Salud SRL',
    rnc: '130-12345-6',
    phone: '809-555-0202',
    defaultNCF: 'B01',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'cli-003',
    name: 'Juan Carlos Pérez',
    cedula: '402-9876543-1',
    phone: '829-555-0303',
    defaultNCF: 'B02',
    createdAt: '2024-02-01T09:00:00Z',
  },
  {
    id: 'cli-004',
    name: 'Hospital General del Sur',
    rnc: '430-98765-4',
    phone: '849-555-0404',
    defaultNCF: 'B14',
    createdAt: '2024-02-10T11:00:00Z',
  },
  {
    id: 'cli-005',
    name: 'Ana Belén Torres',
    cedula: '225-5678901-2',
    phone: '809-555-0505',
    defaultNCF: 'B02',
    createdAt: '2024-03-01T08:30:00Z',
  },
  {
    id: 'cli-006',
    name: 'Distribuidora Médica Caribe SA',
    rnc: '101-23456-7',
    phone: '809-555-0606',
    defaultNCF: 'B01',
    createdAt: '2024-03-15T14:00:00Z',
  },
];
