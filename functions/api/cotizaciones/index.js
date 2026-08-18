// Cloudflare Pages Functions - /api/cotizaciones
import { json } from '../_middleware.js';

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();

    let sql = 'SELECT * FROM cotizaciones ORDER BY id DESC';
    let params = [];
    if (q) {
      sql = `SELECT * FROM cotizaciones 
             WHERE LOWER(cliente_nombre) LIKE ? 
                OR LOWER(correlativo) LIKE ? 
                OR LOWER(telefono) LIKE ? 
                OR LOWER(items_json) LIKE ?
             ORDER BY id DESC`;
      const pattern = `%${q}%`;
      params = [pattern, pattern, pattern, pattern];
    }

    const { results: rawCotizaciones } = await env.DB.prepare(sql).bind(...params).all();

    const cotizaciones = (rawCotizaciones || []).map((c) => {
      let items = [];
      try { items = JSON.parse(c.items_json); } catch {}
      return {
        ...c,
        items,
      };
    });

    // Calcular el siguiente número correlativo
    const maxRow = await env.DB.prepare('SELECT MAX(CAST(correlativo AS INTEGER)) AS max_corr FROM cotizaciones').first();
    const nextNum = (maxRow?.max_corr || 0) + 1;
    const nextCorrelativo = String(nextNum).padStart(4, '0');

    // Clientes para autocompletado
    const { results: clientes } = await env.DB.prepare('SELECT nombre, telefono FROM clientes ORDER BY nombre ASC').all();

    return json({
      ok: true,
      cotizaciones,
      nextCorrelativo,
      clientes: clientes || [],
    });
  } catch (e) {
    return json({ ok: false, error: e.message || 'Error al obtener cotizaciones' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    const clienteNombre = String(body.cliente_nombre || body.customer || '').trim();
    if (!clienteNombre) {
      return json({ ok: false, error: 'El nombre del cliente es obligatorio' }, 400);
    }

    const rawItems = Array.isArray(body.items) ? body.items : [];
    const items = rawItems
      .map((it) => ({
        quantity: Number(it.quantity || it.cantidad || 0),
        description: String(it.description || it.descripcion || '').trim(),
        price: Number(it.price || it.precio || 0),
      }))
      .filter((it) => it.quantity > 0 && it.description);

    if (!items.length) {
      return json({ ok: false, error: 'Agrega al menos un ítem con cantidad y descripción' }, 400);
    }

    const subtotal = Number(items.reduce((sum, it) => sum + (it.quantity * it.price), 0).toFixed(2));
    const iva = Number((subtotal * 0.13).toFixed(2));
    const total = Number((subtotal + iva).toFixed(2));

    // Determinar correlativo
    let correlativo = String(body.correlativo || '').trim();
    if (!correlativo) {
      const maxRow = await env.DB.prepare('SELECT MAX(CAST(correlativo AS INTEGER)) AS max_corr FROM cotizaciones').first();
      const nextNum = (maxRow?.max_corr || 0) + 1;
      correlativo = String(nextNum).padStart(4, '0');
    }

    const fecha = String(body.fecha || body.date || new Date().toISOString().slice(0, 10)).trim();
    const telefono = String(body.telefono || body.phone || '').trim();
    const diasEntrega = Number(body.dias_entrega ?? body.deliveryDays ?? 1);
    const condicionesPago = String(body.condiciones_pago || body.paymentTerms || 'Contra entrega').trim();
    const notas = String(body.notas || body.notes || '').trim();
    const itemsJson = JSON.stringify(items);

    const res = await env.DB.prepare(
      `INSERT INTO cotizaciones (correlativo, fecha, cliente_nombre, telefono, dias_entrega, condiciones_pago, notas, items_json, subtotal, iva, total, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      correlativo, fecha, clienteNombre, telefono, diasEntrega, condicionesPago, notas, itemsJson, subtotal, iva, total
    ).run();

    const id = res.meta?.last_row_id;

    // Actualizar correlativos generales si es numérico
    const corrNum = Number(correlativo);
    if (Number.isFinite(corrNum)) {
      await env.DB.prepare('INSERT OR IGNORE INTO correlativos (tipo_dte, ultimo) VALUES (?, 0)').bind('COT').run();
      await env.DB.prepare('UPDATE correlativos SET ultimo = MAX(ultimo, ?) WHERE tipo_dte = ?').bind(corrNum, 'COT').run();
    }

    // Guardar o actualizar teléfono en clientes si no existe
    try {
      const existing = await env.DB.prepare('SELECT id, telefono FROM clientes WHERE LOWER(nombre) = LOWER(?)').bind(clienteNombre).first();
      if (existing) {
        if (!existing.telefono && telefono) {
          await env.DB.prepare('UPDATE clientes SET telefono = ? WHERE id = ?').bind(telefono, existing.id).run();
        }
      } else {
        await env.DB.prepare(
          `INSERT INTO clientes (tipo_documento, num_documento, nombre, telefono, created_at)
           VALUES ('36', '', ?, ?, datetime('now'))`
        ).bind(clienteNombre, telefono).run();
      }
    } catch {}

    const cotizacion = {
      id,
      correlativo,
      fecha,
      cliente_nombre: clienteNombre,
      telefono,
      dias_entrega: diasEntrega,
      condiciones_pago: condicionesPago,
      notas,
      items,
      subtotal,
      iva,
      total,
    };

    return json({ ok: true, cotizacion }, 201);
  } catch (e) {
    return json({ ok: false, error: e.message || 'Error al guardar cotización' }, 500);
  }
}
