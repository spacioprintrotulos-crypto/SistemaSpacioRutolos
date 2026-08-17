// POST /api/auth/logout
import { json } from '../_middleware.js';

export async function onRequestPost() {
  return json({ ok: true }, 200, {
    'Set-Cookie': 'fac2026_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
  });
}
