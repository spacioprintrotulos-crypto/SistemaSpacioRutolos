// GET /api/dtes?tipo=01&estado=PROCESADO  → historial de DTEs
import { json } from '../_middleware.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const tipo = url.searchParams.get('tipo');
  const estado = url.searchParams.get('estado');

  let sql = `SELECT id, tipo_dte, numero_control, codigo_generacion, fec_emi, hor_emi,
                    cliente_id, receptor_nombre, total, estado, sello_recibido, fh_procesamiento,
                    dte_relacionado, created_at
             FROM dtes`;
  const cond = [];
  const binds = [];
  if (tipo) { cond.push('tipo_dte = ?'); binds.push(tipo); }
  if (estado) { cond.push('estado = ?'); binds.push(estado); }
  if (cond.length) sql += ' WHERE ' + cond.join(' AND ');
  sql += ' ORDER BY id DESC LIMIT 300';

  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  return json({ ok: true, dtes: results });
}
