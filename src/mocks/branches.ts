import type { Branch } from '@/types';

export const mockBranches: Branch[] = [
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000001',
    name: 'GENOSAN – Sede Principal',
    address: 'Av. 27 de Febrero #48, Santiago de los Caballeros',
    phone: '809-555-1001',
    rnc: '1-31-00254-8',
    isActive: true,
    createdAt: '2023-01-10T08:00:00Z',
  },
  {
    id: 'a1b2c3d4-0002-0002-0002-000000000002',
    name: 'GENOSAN – Sucursal Este',
    address: 'C/ Las Américas Km 12, Santo Domingo Este',
    phone: '809-555-2002',
    rnc: undefined,
    isActive: true,
    createdAt: '2023-03-15T08:00:00Z',
  },
  {
    id: 'a1b2c3d4-0003-0003-0003-000000000003',
    name: 'GENOSAN – Sucursal Norte',
    address: 'C/ Separación #23, Puerto Plata',
    phone: '809-555-3003',
    rnc: undefined,
    isActive: true,
    createdAt: '2023-06-20T08:00:00Z',
  },
];
