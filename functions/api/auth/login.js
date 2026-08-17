// POST /api/auth/login  { usuario, clave }
import { json } from '../_middleware.js';
import { verifyPassword, signSession } from '../_lib/crypto.js';
import { getSessionSecret } from '../_lib/db.js';

export async function onRequestPost({ request, env }) {
  try {
    const { usuario, clave } = await request.json();
    if (!usuario || !clave) return json({ ok: false, error: 'Usuario y contraseña requeridos' }, 400);

    const row = await env.DB.prepare('SELECT * FROM usuarios WHERE usuario = ?').bind(String(usuario).trim()).first();
    if (!row) return json({ ok: false, error: 'Credenciales incorrectas' }, 401);

    const valida = await verifyPassword(clave, row.pass_hash);
    if (!valida) return json({ ok: false, error: 'Credenciales incorrectas' }, 401);

    const secret = await getSessionSecret(env.DB);
    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 12; // 12 horas
    const token = await signSession({ u: row.usuario, nombre: row.nombre, rol: row.rol, exp }, secret);

    return json(
      { ok: true, usuario: { usuario: row.usuario, nombre: row.nombre, rol: row.rol } },
      200,
      { 'Set-Cookie': `fac2026_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 12}` }
    );
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
