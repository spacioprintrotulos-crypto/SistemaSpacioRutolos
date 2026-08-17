// ============================================================
// Utilidades criptográficas (WebCrypto - compatible con Workers)
// - PBKDF2 para contraseñas de usuarios
// - HMAC para tokens de sesión
// - JWS RS512 para firmar DTEs (estándar que exige el MH)
// ============================================================

const enc = new TextEncoder();

// ---------- Base64 / Base64URL ----------
export function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function b64ToBuf(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export function b64url(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ---------- PBKDF2 (contraseñas de usuarios) ----------
export async function hashPassword(password, iterations = 100000) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return `pbkdf2$${iterations}$${bufToB64(salt.buffer)}$${bufToB64(bits)}`;
}

export async function verifyPassword(password, stored) {
  try {
    const [scheme, iterStr, saltB64, hashB64] = String(stored).split('$');
    if (scheme !== 'pbkdf2') return false;
    const iterations = parseInt(iterStr, 10);
    const salt = new Uint8Array(b64ToBuf(saltB64));
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
    return bufToB64(bits) === hashB64;
  } catch {
    return false;
  }
}

// ---------- Tokens de sesión (HMAC-SHA256) ----------
// token = base64url(json).base64url(firma)
async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signSession(payload, secret) {
  const data = b64url(bufToB64(enc.encode(JSON.stringify(payload))));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return `${data}.${b64url(bufToB64(sig))}`;
}

export async function verifySession(token, secret) {
  try {
    const [data, sig] = String(token).split('.');
    if (!data || !sig) return null;
    const key = await hmacKey(secret);
    const ok = await crypto.subtle.verify('HMAC', key, b64ToBuf(sig.replace(/-/g, '+').replace(/_/g, '/')), enc.encode(data));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64ToBuf(data.replace(/-/g, '+').replace(/_/g, '/'))));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------- JWS RS512 (firma de DTEs para el MH) ----------
// Convierte PEM PKCS8 a CryptoKey y firma: header.payload.firma (compact JWS)
function pemToDer(pem) {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\s+/g, '');
  return b64ToBuf(b64);
}

export async function firmarJWS(jsonString, pemPrivada) {
  const der = pemToDer(pemPrivada);
  const key = await crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const header = b64url(bufToB64(enc.encode(JSON.stringify({ alg: 'RS512', typ: 'JWT' }))));
  const payload = b64url(bufToB64(enc.encode(jsonString)));
  const data = `${header}.${payload}`;
  const firma = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(data));
  return `${data}.${b64url(bufToB64(firma))}`;
}

// ---------- Varios ----------
export function uuidUpper() {
  return crypto.randomUUID().toUpperCase();
}

export function randomSecret() {
  return bufToB64(crypto.getRandomValues(new Uint8Array(32)).buffer);
}
