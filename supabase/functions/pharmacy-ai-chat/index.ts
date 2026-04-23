import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Normalización de texto ───────────────────────────────────────────────────
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Corrección básica de errores comunes ─────────────────────────────────────
const TYPO_MAP: Record<string, string> = {
  'paracetamol': 'paracetamol',
  'paracetamol': 'paracetamol',
  'ibuprofeno': 'ibuprofeno',
  'ibuprofeno': 'ibuprofeno',
  'amoxicilina': 'amoxicilina',
  'amoxicilina': 'amoxicilina',
  'fievre': 'fiebre',
  'fiebre': 'fiebre',
  'gripe': 'gripe',
  'gripa': 'gripe',
  'dolor': 'dolor',
  'dolores': 'dolor',
  'tos': 'tos',
  'toce': 'tos',
  'alerjia': 'alergia',
  'alergia': 'alergia',
  'diabetis': 'diabetes',
  'diabetes': 'diabetes',
  'presion': 'presion',
  'presión': 'presion',
  'hipertension': 'hipertension',
  'hipertensión': 'hipertension',
  'antibiotico': 'antibiotico',
  'antibiótico': 'antibiotico',
  'vitamina': 'vitamina',
  'vitaminas': 'vitamina',
  'antiinflamatorio': 'antiinflamatorio',
  'antiinflamatorios': 'antiinflamatorio',
  'analgesico': 'analgesico',
  'analgésico': 'analgesico',
  'antipiretico': 'antipiretico',
  'antipiréticos': 'antipiretico',
  'estomago': 'estomago',
  'estómago': 'estomago',
  'gastritis': 'gastritis',
  'diarrea': 'diarrea',
  'nausea': 'nausea',
  'náusea': 'nausea',
  'vomito': 'vomito',
  'vómito': 'vomito',
  'insomnio': 'insomnio',
  'ansiedad': 'ansiedad',
  'depresion': 'depresion',
  'depresión': 'depresion',
  'colesterol': 'colesterol',
  'tiroides': 'tiroides',
  'asma': 'asma',
  'bronquitis': 'bronquitis',
  'sinusitis': 'sinusitis',
  'infeccion': 'infeccion',
  'infección': 'infeccion',
  'herida': 'herida',
  'cicatriz': 'cicatriz',
  'crema': 'crema',
  'jarabe': 'jarabe',
  'capsula': 'capsula',
  'cápsula': 'capsula',
  'tableta': 'tableta',
  'tabletas': 'tableta',
  'pastilla': 'pastilla',
  'pastillas': 'pastilla',
  'inyeccion': 'inyeccion',
  'inyección': 'inyeccion',
  'suero': 'suero',
  'stock': 'stock',
  'inventario': 'inventario',
  'disponible': 'disponible',
  'disponibles': 'disponible',
  'tienes': 'tienes',
  'hay': 'hay',
  'que': 'que',
  'para': 'para',
};

function correctTypos(text: string): string {
  const words = normalize(text).split(' ');
  return words.map((w) => TYPO_MAP[w] || w).join(' ');
}

// ─── Extracción de palabras clave ─────────────────────────────────────────────
const STOP_WORDS = new Set([
  'que', 'hay', 'para', 'tienes', 'tiene', 'tengo', 'me', 'un', 'una', 'el', 'la',
  'los', 'las', 'de', 'del', 'en', 'con', 'por', 'y', 'o', 'a', 'al', 'se', 'es',
  'son', 'como', 'si', 'no', 'mi', 'tu', 'su', 'algo', 'algun', 'alguna', 'alguno',
  'quiero', 'necesito', 'busco', 'dame', 'dime', 'puedes', 'puede', 'favor', 'porfavor',
  'hola', 'buenas', 'buenos', 'dias', 'tardes', 'noches', 'gracias', 'ok', 'bien',
  'disponible', 'disponibles', 'stock', 'inventario', 'medicamento', 'medicina',
  'producto', 'productos', 'farmacia', 'tienda',
]);

function extractKeywords(text: string): string[] {
  const corrected = correctTypos(text);
  return corrected
    .split(' ')
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

// ─── Detección de intención ───────────────────────────────────────────────────
type Intent =
  | 'buscar_producto'
  | 'consultar_stock'
  | 'ver_vencimientos'
  | 'saludo'
  | 'ayuda'
  | 'desconocido';

function detectIntent(text: string): Intent {
  const n = normalize(text);
  if (/^(hola|buenas|buenos|buen dia|buen tarde|buen noche|hey|saludos)/.test(n)) return 'saludo';
  if (/ayuda|como funciona|que puedes|que haces|instrucciones/.test(n)) return 'ayuda';
  if (/venc|caducar|caducado|expirar|expirado|fecha/.test(n)) return 'ver_vencimientos';
  if (/stock|inventario|cuanto hay|cuantos hay|cuanto tiene|cuantos tiene|disponible/.test(n)) return 'consultar_stock';
  return 'buscar_producto';
}

// ─── Generador de respuesta natural ──────────────────────────────────────────
interface ProductResult {
  nombre: string;
  nombre_generico: string | null;
  descripcion: string | null;
  presentacion: string | null;
  precio: string;
  stock: number;
  fecha_vencimiento: string | null;
  dias_para_vencer: number | null;
}

function buildResponse(
  intent: Intent,
  keywords: string[],
  products: ProductResult[],
  rol: string,
  originalMessage: string
): string {
  // Saludos
  if (intent === 'saludo') {
    return `¡Hola! Soy el asistente de inventario de Farmacia Genosan. Puedo ayudarte a:\n\n• Buscar medicamentos por nombre o síntoma\n• Consultar stock disponible\n• Ver productos próximos a vencer\n\n¿En qué te puedo ayudar hoy?`;
  }

  // Ayuda
  if (intent === 'ayuda') {
    return `Puedo responder preguntas como:\n\n• "¿Qué tienes para la fiebre?"\n• "¿Tienes paracetamol?"\n• "¿Qué hay en stock?"\n• "¿Qué productos vencen pronto?"\n\nBusco en el inventario en tiempo real y te muestro solo productos con stock disponible.`;
  }

  // Sin productos encontrados
  if (products.length === 0) {
    const kw = keywords.join(', ');
    return `No tengo productos disponibles para "${kw || originalMessage}" en este momento.\n\nPuede que el producto esté agotado o no exista en el inventario. Intenta con otro nombre o síntoma.`;
  }

  // Vencimientos (solo admin)
  if (intent === 'ver_vencimientos') {
    if (rol !== 'admin') {
      return 'No tienes permisos para ver información de vencimientos. Consulta con el administrador.';
    }
    const expiring = products
      .filter((p) => p.dias_para_vencer !== null && p.dias_para_vencer <= 60)
      .sort((a, b) => (a.dias_para_vencer ?? 999) - (b.dias_para_vencer ?? 999));

    if (expiring.length === 0) {
      return '✅ No hay productos próximos a vencer en los próximos 60 días.';
    }

    const lines = expiring.map((p) => {
      const urgency = (p.dias_para_vencer ?? 0) <= 15 ? '🔴' : (p.dias_para_vencer ?? 0) <= 30 ? '🟡' : '🟢';
      return `${urgency} **${p.nombre}** — Vence en ${p.dias_para_vencer} días (Stock: ${p.stock})`;
    });

    return `⚠️ Productos próximos a vencer:\n\n${lines.join('\n')}\n\nSe recomienda priorizar la venta de estos productos.`;
  }

  // Consulta de stock general
  if (intent === 'consultar_stock' && keywords.length === 0) {
    const total = products.length;
    const lowStock = products.filter((p) => p.stock <= 5).length;
    const lines = products.slice(0, 10).map((p) => {
      const badge = p.stock <= 5 ? '🔴' : p.stock <= 15 ? '🟡' : '🟢';
      if (rol === 'cliente') return `${badge} **${p.nombre}** — Disponible`;
      return `${badge} **${p.nombre}** — Stock: ${p.stock} unidades`;
    });

    let response = `📦 Inventario actual (${total} productos con stock):\n\n${lines.join('\n')}`;
    if (total > 10) response += `\n\n...y ${total - 10} productos más.`;
    if (lowStock > 0 && rol === 'admin') response += `\n\n⚠️ ${lowStock} producto(s) con stock bajo (≤5 unidades).`;
    return response;
  }

  // Búsqueda de productos por síntoma/nombre
  const intro = keywords.length > 0
    ? `Tengo estos productos disponibles para "${keywords.join(' ')}"`
    : 'Tengo estos productos disponibles';

  const lines = products.map((p, i) => {
    const num = i + 1;
    const generico = p.nombre_generico ? ` (${p.nombre_generico})` : '';
    const desc = p.descripcion ? `\n   📝 ${p.descripcion.slice(0, 100)}${p.descripcion.length > 100 ? '...' : ''}` : '';
    const presentacion = p.presentacion ? `\n   💊 ${p.presentacion}` : '';

    if (rol === 'cliente') {
      return `${num}. **${p.nombre}**${generico}${presentacion}${desc}`;
    }

    const precio = `\n   💰 ${p.precio}`;
    const stock = `\n   📦 Stock: ${p.stock} unidades`;
    return `${num}. **${p.nombre}**${generico}${presentacion}${desc}${precio}${stock}`;
  });

  return `${intro}:\n\n${lines.join('\n\n')}\n\n---\n_Consulte con un médico antes de consumir medicamentos._`;
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, branchId, userRole } = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Mensaje requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rol: string = ['admin', 'empleado', 'cliente'].includes(userRole) ? userRole : 'cliente';

    // Conectar a Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split('T')[0];
    const intent = detectIntent(message);
    const keywords = extractKeywords(message);

    // ── Construir query de búsqueda ──────────────────────────────────────────
    let query = supabase
      .from('productos_farmacia')
      .select('id, nombre, nombre_generico, descripcion, presentacion, precio_venta, fecha_vencimiento, activo')
      .eq('activo', true);

    // Si hay palabras clave, buscar con ILIKE en nombre, nombre_generico, descripcion
    if (keywords.length > 0 && intent !== 'ver_vencimientos' && intent !== 'consultar_stock') {
      // Construir filtro OR para cada keyword
      const filters = keywords.map((kw) =>
        `nombre.ilike.%${kw}%,nombre_generico.ilike.%${kw}%,descripcion.ilike.%${kw}%`
      ).join(',');
      query = query.or(filters);
    }

    const { data: products, error: productsError } = await query.limit(50);

    if (productsError) {
      console.error('Supabase error:', productsError);
      return new Response(JSON.stringify({ error: 'Error al consultar la base de datos' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Obtener stock ────────────────────────────────────────────────────────
    let stockQuery = supabase
      .from('stock_farmacia')
      .select('producto_id, cantidad');

    if (branchId) {
      stockQuery = stockQuery.eq('sucursal_id', branchId);
    }

    const { data: stocks } = await stockQuery;

    // Mapa de stock por producto
    const stockMap: Record<string, number> = {};
    (stocks || []).forEach((s: { producto_id: string; cantidad: number }) => {
      const pid = s.producto_id;
      stockMap[pid] = (stockMap[pid] || 0) + (Number(s.cantidad) || 0);
    });

    // ── Filtrar y mapear productos ───────────────────────────────────────────
    const filtered: ProductResult[] = (products || [])
      .filter((p: Record<string, unknown>) => {
        const stock = stockMap[p.id as string] || 0;
        const expiry = p.fecha_vencimiento as string | null;
        const notExpired = !expiry || expiry >= today;

        // Para vencimientos, mostrar todos (incluso sin stock)
        if (intent === 'ver_vencimientos') return notExpired;

        return stock > 0 && notExpired;
      })
      .map((p: Record<string, unknown>) => {
        const expiry = p.fecha_vencimiento as string | null;
        const daysToExpiry = expiry
          ? Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null;
        return {
          nombre: p.nombre as string,
          nombre_generico: (p.nombre_generico as string) || null,
          descripcion: (p.descripcion as string) || null,
          presentacion: (p.presentacion as string) || null,
          precio: `RD$ ${Number(p.precio_venta || 0).toFixed(2)}`,
          stock: stockMap[p.id as string] || 0,
          fecha_vencimiento: expiry,
          dias_para_vencer: daysToExpiry,
        };
      })
      .slice(0, 15); // Máximo 15 resultados para respuestas claras

    // ── Generar respuesta ────────────────────────────────────────────────────
    const reply = buildResponse(intent, keywords, filtered, rol, message);

    return new Response(
      JSON.stringify({
        reply,
        productsCount: filtered.length,
        intent,
        keywords,
        rol,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
