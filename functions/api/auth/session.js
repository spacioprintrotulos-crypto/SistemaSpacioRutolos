// GET /api/auth/session  → datos del usuario logueado
import { json } from '../_middleware.js';

export async function onRequestGet({ data }) {
  return json({ ok: true, usuario: { usuario: data.usuario } });
}
