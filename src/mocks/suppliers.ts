import type { Supplier } from '@/types';

export const mockSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Carlos Méndez',
    company: 'Distribuidora Farma RD',
    phone: '809-555-1001',
    email: 'carlos@farmaRD.com',
    isActive: true,
    createdAt: '2023-01-10T00:00:00Z',
  },
  {
    id: 'sup-2',
    name: 'Luisa Peña',
    company: 'MedSupply Dominicana',
    phone: '809-555-2002',
    email: 'luisa@medsupply.do',
    isActive: true,
    createdAt: '2023-02-15T00:00:00Z',
  },
  {
    id: 'sup-3',
    name: 'Roberto Almonte',
    company: 'Laboratorios Almonte & Cia',
    phone: '829-555-3003',
    email: 'roberto@almonte.com',
    isActive: true,
    createdAt: '2023-03-20T00:00:00Z',
  },
  {
    id: 'sup-4',
    name: 'Patricia Soto',
    company: 'Importadora Salud Plus',
    phone: '849-555-4004',
    email: 'patricia@saludplus.do',
    isActive: true,
    createdAt: '2023-04-05T00:00:00Z',
  },
  {
    id: 'sup-5',
    name: 'Miguel Ángel Reyes',
    company: 'Genéricos del Caribe',
    phone: '809-555-5005',
    email: 'miguel@genericoscaribe.com',
    isActive: false,
    createdAt: '2023-05-12T00:00:00Z',
  },
];
