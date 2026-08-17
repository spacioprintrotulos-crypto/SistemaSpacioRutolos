// GET    /api/clientes/:id  → detalle
// PUT    /api/clientes/:id  → actualizar
// DELETE /api/clientes/:id  → eliminar
import { json } from '../_middleware.js';

const CAMPOS = ['tipo_documento', 'num_documento', 'nrc', 'nombre', 'nombre_comercial', 'cod_actividad', 'desc_actividad', 'departamento', 'municipio', 'complemento', 'telefono', 'correo'];

export async function onRequestGet({ params, env }) {
  const cliente = await env.DB.prepare('SELECT * FROM clientes WHERE id = ?').bind(params.id).first();
  if (!cliente) return json({ ok: false, error: 'Cliente no encontrado' }, 404);
  return json({ ok: true, cliente });
}

export async function onRequestPut({ params, request, env }) {
  try {
    const body = await request.json();
    if (!body.nombre || !String(body.nombre).trim()) {
      return json({ ok: false, error: 'El nombre del cliente es requerido' }, 400);
    }
    const valores = CAMPOS.map((c) => (body[c] === '' || body[c] === undefined ? null : body[c]));
    await env.DB.prepare(
      `UPDATE clientes SET ${CAMPOS.map((c) => `${c} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`
    ).bind(...valores, params.id).run();
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}

export async function onRequestDelete({ params, env }) {
  await env.DB.prepare('DELETE FROM clientes WHERE id = ?').bind(params.id).run();
  return json({ ok: true });
}
