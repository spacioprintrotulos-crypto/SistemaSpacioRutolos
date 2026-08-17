// ============================================================
// Middleware global /api/* : sesión por cookie firmada (HMAC)
// ============================================================
import { verifySession } from './_lib/crypto.js';
import { ensureSeed, getSessionSecret } from './_lib/db.js';

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

const RUTAS_PUBLICAS = ['/api/auth/login'];

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Semillas (usuario admin inicial, secreto de sesión)
  await ensureSeed(env.DB);

  if (RUTAS_PUBLICAS.includes(url.pathname)) {
    return next();
  }

  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)fac2026_session=([^;]+)/);
  const secret = await getSessionSecret(env.DB);
  const sesion = match ? await verifySession(match[1], secret) : null;

  if (!sesion) {
    return json({ ok: false, error: 'No autenticado' }, 401);
  }

  context.data = context.data || {};
  context.data.usuario = sesion.u;
  return next();
}
