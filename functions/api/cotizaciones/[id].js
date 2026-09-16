// Cloudflare Pages Functions - /api/cotizaciones/:id
import { json } from '../_middleware.js';

export async function onRequestGet({ params, env }) {
  try {
    const id = params.id;
    const c = await env.DB.prepare('SELECT * FROM cotizaciones WHERE id = ?').bind(id).first();
    if (!c) return json({ ok: false, error: 'Cotización no encontrada' }, 404);

    let items = [];
    try { items = JSON.parse(c.items_json); } catch {}
    const hasIva = c.aplica_iva !== undefined && c.aplica_iva !== null
      ? Boolean(c.aplica_iva)
      : (Number(c.iva || 0) > 0);

    return json({
      ok: true,
      cotizacion: {
        ...c,
        aplica_iva: hasIva,
        items,
      },
    });
  } catch (e) {
    return json({ ok: false, error: e.message || 'Error al obtener la cotización' }, 500);
  }
}

export async function onRequestDelete({ params, env }) {
  try {
    const id = params.id;
    await env.DB.prepare('DELETE FROM cotizaciones WHERE id = ?').bind(id).run();
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: e.message || 'Error al eliminar la cotización' }, 500);
  }
}
