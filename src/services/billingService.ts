import { supabase } from '@/lib/supabase';
import type { CartItem, NCFType, PaymentMethod } from '@/types';

export interface BillingPayload {
  usuarioId: string;
  sucursalId: string;
  clienteId?: string;
  tipoNcf: NCFType;
  metodoPago: PaymentMethod;
  subtotal: number;
  itbisTotal: number;
  descuento: number;
  total: number;
  items: CartItem[];
}

export interface BillingResult {
  success: boolean;
  facturaId?: string;
  ncf?: string;
  error?: string;
}

/**
 * Busca el lote más próximo a vencer con stock disponible para un producto en una sucursal.
 * Estrategia FEFO (First Expired, First Out).
 */
async function getLoteFefo(
  productoId: string,
  sucursalId: string,
  cantidadNecesaria: number
): Promise<{ loteId: string; numeroLote: string; fechaVencimiento: string } | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('lotes')
    .select('id, numero_lote, fecha_vencimiento, stock')
    .eq('producto_id', productoId)
    .eq('sucursal_id', sucursalId)
    .eq('activo', true)
    .gt('fecha_vencimiento', today)
    .gt('stock', 0)
    .order('fecha_vencimiento', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    // Intentar sin filtro de sucursal (stock global)
    const { data: globalData } = await supabase
      .from('lotes')
      .select('id, numero_lote, fecha_vencimiento, stock')
      .eq('producto_id', productoId)
      .eq('activo', true)
      .gt('fecha_vencimiento', today)
      .gt('stock', 0)
      .order('fecha_vencimiento', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!globalData) return null;
    return {
      loteId: globalData.id,
      numeroLote: globalData.numero_lote,
      fechaVencimiento: globalData.fecha_vencimiento,
    };
  }

  return {
    loteId: data.id,
    numeroLote: data.numero_lote,
    fechaVencimiento: data.fecha_vencimiento,
  };
}

/**
 * Guarda una venta completa en Supabase:
 * 1. Inserta en facturas_farmacia (el trigger asigna NCF real automáticamente)
 * 2. Inserta cada línea en detalle_factura_farmacia (el trigger descuenta stock del lote)
 */
export async function saveBillingToSupabase(payload: BillingPayload): Promise<BillingResult> {
  try {
    // 1. Insertar cabecera de factura
    // El trigger BEFORE INSERT asigna el NCF real desde ncf_control_farmacia
    // Validate UUIDs — mock IDs like 'branch-1' or 'admin-1' are not valid UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validSucursalId = payload.sucursalId && uuidRegex.test(payload.sucursalId) ? payload.sucursalId : null;
    const validUsuarioId = payload.usuarioId && uuidRegex.test(payload.usuarioId) ? payload.usuarioId : null;
    const validClienteId = payload.clienteId && uuidRegex.test(payload.clienteId) ? payload.clienteId : null;

    if (!validUsuarioId) {
      return { success: false, error: 'ID de usuario inválido. Por favor cierra sesión y vuelve a entrar.' };
    }

    const { data: factura, error: facturaError } = await supabase
      .from('facturas_farmacia')
      .insert({
        usuario_id: validUsuarioId,
        sucursal_id: validSucursalId,
        cliente_id: validClienteId,
        tipo_ncf: payload.tipoNcf,
        // ncf se omite para que el trigger lo genere automáticamente
        metodo_pago: payload.metodoPago,
        subtotal: payload.subtotal,
        itbis_total: payload.itbisTotal,
        descuento: payload.descuento,
        total: payload.total,
        estado: 'activa',
      })
      .select('id, ncf')
      .single();

    if (facturaError) {
      console.error('[billing] Error insertando factura:', facturaError);
      return { success: false, error: facturaError.message };
    }

    const facturaId = factura.id;
    const ncfReal = factura.ncf;

    // 2. Insertar líneas de detalle con lote FEFO
    const detalles = await Promise.all(
      payload.items.map(async (item) => {
        const lote = await getLoteFefo(
          item.product.id,
          validSucursalId || '',
          item.quantity
        );

        const lineBase = item.quantity * item.unitPrice;
        const lineAfterDiscount = lineBase * (1 - item.lineDiscount / 100);
        const itbisMonto = item.product.itbisApplicable ? lineAfterDiscount * 0.18 : 0;
        const subtotalLine = lineAfterDiscount + itbisMonto;

        return {
          factura_id: facturaId,
          producto_id: item.product.id,
          lote_id: lote?.loteId || null,
          nombre_producto: item.product.commercialName,
          numero_lote: lote?.numeroLote || null,
          fecha_vencimiento: lote?.fechaVencimiento || null,
          cantidad: item.quantity,
          precio: item.unitPrice,
          itbis_pct: item.product.itbisApplicable ? 0.18 : 0,
          itbis_monto: itbisMonto,
          descuento: item.lineDiscount,
          subtotal: subtotalLine,
        };
      })
    );

    const { error: detalleError } = await supabase
      .from('detalle_factura_farmacia')
      .insert(detalles);

    if (detalleError) {
      console.error('[billing] Error insertando detalles:', detalleError);
      // La factura ya fue creada, retornamos éxito parcial con advertencia
      return {
        success: true,
        facturaId,
        ncf: ncfReal,
        error: `Factura creada (${ncfReal}) pero hubo un error en el detalle: ${detalleError.message}`,
      };
    }

    return { success: true, facturaId, ncf: ncfReal };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[billing] Error inesperado:', msg);
    return { success: false, error: msg };
  }
}
