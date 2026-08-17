// GET /api/dtes/:id  → detalle completo (incluye JSON y firmado)
import { json } from '../_middleware.js';

export async function onRequestGet({ params, env }) {
  const dte = await env.DB.prepare('SELECT * FROM dtes WHERE id = ?').bind(params.id).first();
  if (!dte) return json({ ok: false, error: 'DTE no encontrado' }, 404);
  return json({ ok: true, dte });
}
