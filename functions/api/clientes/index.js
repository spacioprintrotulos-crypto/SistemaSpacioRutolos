// GET /api/clientes?q=texto   → lista (con buscador)
// POST /api/clientes          → crear cliente
import { json } from '../_middleware.js';

const CAMPOS = ['tipo_documento', 'num_documento', 'nrc', 'nombre', 'nombre_comercial', 'cod_actividad', 'desc_actividad', 'departamento', 'municipio', 'complemento', 'telefono', 'correo'];

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  let stmt;
  if (q) {
    stmt = env.DB.prepare(
      `SELECT * FROM clientes WHERE nombre LIKE ? OR num_documento LIKE ? OR nrc LIKE ? ORDER BY nombre LIMIT 200`
    ).bind(`%${q}%`, `%${q}%`, `%${q}%`);
  } else {
    stmt = env.DB.prepare('SELECT * FROM clientes ORDER BY nombre LIMIT 500');
  }
  const { results } = await stmt.all();
  return json({ ok: true, clientes: results });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    if (!body.nombre || !String(body.nombre).trim()) {
      return json({ ok: false, error: 'El nombre del cliente es requerido' }, 400);
    }
    const valores = CAMPOS.map((c) => (body[c] === '' || body[c] === undefined ? null : body[c]));
    const res = await env.DB.prepare(
      `INSERT INTO clientes (${CAMPOS.join(', ')}) VALUES (${CAMPOS.map(() => '?').join(', ')})`
    ).bind(...valores).run();
    return json({ ok: true, id: res.meta.last_row_id });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
