// POST /api/configuracion/probar-mh
// Comprueba autenticación contra MH sin guardar ni devolver credenciales o token.
import { json } from '../_middleware.js';
import { getMHConfig } from '../_lib/db.js';
import { mhAutenticar } from '../_lib/mh.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const ambiente = body.ambiente === '01' ? '01' : body.ambiente === '00' ? '00' : null;
    if (!ambiente) return json({ ok: false, error: 'Ambiente MH inválido' }, 400);

    const perfil = await getMHConfig(env.DB, ambiente);
    const user = String(body.api_user || perfil?.api_user || '').trim();
    const pwd = String(body.api_pwd || perfil?.api_pwd || '');
    if (!user || !pwd) return json({ ok: false, error: 'Ingrese usuario y contraseña MH' }, 400);

    await mhAutenticar(ambiente, user, pwd);
    return json({ ok: true, mensaje: `Conexión con MH ${ambiente === '01' ? 'Producción' : 'Pruebas'} confirmada` });
  } catch (e) {
    return json({ ok: false, error: 'MH rechazó las credenciales API. Use las credenciales de aplicación entregadas por MH, no las del portal web.' }, 400);
  }
}
