import type { SupplierPurchase, ReturnToSupplier } from '@/types';

export const mockSupplierPurchases: SupplierPurchase[] = [
  {
    id: 'sp-001',
    supplierId: 'sup-1',
    supplierName: 'Carlos Méndez',
    supplierCompany: 'Distribuidora Farma RD',
    invoiceNumber: 'FAC-2026-0041',
    purchaseDate: '2026-03-15T09:00:00Z',
    createdAt: '2026-03-15T09:00:00Z',
    total: 12500,
    items: [
      { productId: 'p-01', productName: 'Acetaminofén 500mg', quantity: 200, unitCost: 18, expiryDate: '2027-08-15' },
      { productId: 'p-02', productName: 'Ibuprofeno 400mg', quantity: 150, unitCost: 22, expiryDate: '2027-06-30' },
      { productId: 'p-05', productName: 'Loratadina 10mg', quantity: 100, unitCost: 28, expiryDate: '2027-12-01' },
    ],
  },
  {
    id: 'sp-002',
    supplierId: 'sup-2',
    supplierName: 'Luisa Peña',
    supplierCompany: 'MedSupply Dominicana',
    invoiceNumber: 'MS-2026-0118',
    purchaseDate: '2026-03-20T10:30:00Z',
    createdAt: '2026-03-20T10:30:00Z',
    total: 28750,
    items: [
      { productId: 'p-07', productName: 'Atorvastatina 20mg', quantity: 80, unitCost: 95, expiryDate: '2027-07-20' },
      { productId: 'p-09', productName: 'Losartán 50mg', quantity: 90, unitCost: 58, expiryDate: '2027-03-14' },
      { productId: 'p-20', productName: 'Insulina Glargina 100U/ml', quantity: 10, unitCost: 950, expiryDate: '2026-08-01' },
    ],
  },
  {
    id: 'sp-003',
    supplierId: 'sup-3',
    supplierName: 'Roberto Almonte',
    supplierCompany: 'Laboratorios Almonte & Cia',
    invoiceNumber: 'LA-2026-0055',
    purchaseDate: '2026-03-25T08:00:00Z',
    createdAt: '2026-03-25T08:00:00Z',
    total: 9800,
    items: [
      { productId: 'p-03', productName: 'Amoxicilina 500mg', quantity: 120, unitCost: 42, expiryDate: '2026-12-20' },
      { productId: 'p-13', productName: 'Ciprofloxacina 500mg', quantity: 60, unitCost: 78, expiryDate: '2027-04-30' },
    ],
  },
  {
    id: 'sp-004',
    supplierId: 'sup-1',
    supplierName: 'Carlos Méndez',
    supplierCompany: 'Distribuidora Farma RD',
    invoiceNumber: 'FAC-2026-0058',
    purchaseDate: '2026-04-01T11:00:00Z',
    createdAt: '2026-04-01T11:00:00Z',
    total: 7200,
    items: [
      { productId: 'p-10', productName: 'Vitamina C 500mg', quantity: 200, unitCost: 36, expiryDate: '2027-01-15' },
      { productId: 'p-11', productName: 'Complejo B Forte', quantity: 100, unitCost: 45, expiryDate: '2027-06-01' },
    ],
  },
  {
    id: 'sp-005',
    supplierId: 'sup-4',
    supplierName: 'Patricia Soto',
    supplierCompany: 'Importadora Salud Plus',
    invoiceNumber: 'ISP-2026-0022',
    purchaseDate: '2026-04-02T09:30:00Z',
    createdAt: '2026-04-02T09:30:00Z',
    total: 15600,
    items: [
      { productId: 'p-04', productName: 'Omeprazol 20mg', quantity: 150, unitCost: 62, expiryDate: '2026-05-10' },
      { productId: 'p-16', productName: 'Pantoprazol 40mg', quantity: 80, unitCost: 80, expiryDate: '2026-01-15' },
      { productId: 'p-17', productName: 'Metronidazol 500mg', quantity: 100, unitCost: 48, expiryDate: '2025-09-10' },
    ],
  },
];

export const mockReturnsToSupplier: ReturnToSupplier[] = [
  {
    id: 'ret-001',
    supplierId: 'sup-4',
    supplierName: 'Patricia Soto',
    supplierCompany: 'Importadora Salud Plus',
    purchaseId: 'sp-005',
    status: 'pendiente',
    createdAt: '2026-04-02T14:00:00Z',
    items: [
      { productId: 'p-16', productName: 'Pantoprazol 40mg', quantity: 20, reason: 'Próximo a vencer (Ene 2026)', expiryDate: '2026-01-15' },
      { productId: 'p-17', productName: 'Metronidazol 500mg', quantity: 15, reason: 'Producto vencido (Sep 2025)', expiryDate: '2025-09-10' },
    ],
  },
];
