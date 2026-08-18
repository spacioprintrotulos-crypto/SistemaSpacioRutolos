// ============================================================
// Cliente del API del Ministerio de Hacienda (MH) - El Salvador
//   Pruebas:     https://apitest.dtes.mh.gob.sv
//   Producción:  https://api.dtes.mh.gob.sv
// ============================================================

const BASE_URL = {
  '00': 'https://apitest.dtes.mh.gob.sv',
  '01': 'https://api.dtes.mh.gob.sv',
};

export function mhBaseUrl(ambiente) {
  return BASE_URL[ambiente] || BASE_URL['00'];
}

// Autenticación: devuelve token Bearer (cacheable ~24h)
export async function mhAutenticar(ambiente, user, pwd) {
  const url = `${mhBaseUrl(ambiente)}/seguridad/auth`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ user, pwd }).toString(),
  });
  const data = await resp.json().catch(() => null);
  if (!resp.ok || !data || data.status !== 'OK') {
    const msg = data?.body?.descripcionMsg ? `${data.body.descripcionMsg} (${data.body.codigoMsg || resp.status})` : (data ? JSON.stringify(data) : `HTTP ${resp.status}`);
    throw new Error(`Autenticación MH fallida: ${msg}`);
  }
  // El MH a veces devuelve el token con prefijo 'Bearer' ya incluido.
  const token = String(data.body.token || '').replace(/^Bearer\s+/i, '');
  return token;
}

// Recepción de DTE firmado (JWS)
export async function mhRecepcionDTE(ambiente, token, { version, tipoDte, idEnvio, documento }) {
  const url = `${mhBaseUrl(ambiente)}/fesv/recepciondte`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ambiente, idEnvio, version, tipoDte, documento }),
  });
  const data = await resp.json().catch(() => null);
  return { httpStatus: resp.status, data };
}

// Anulación de DTE (evento de invalidación firmado)
export async function mhAnularDTE(ambiente, token, { idEnvio, documento }) {
  const url = `${mhBaseUrl(ambiente)}/fesv/anulardte`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ambiente, idEnvio, version: 2, documento }),
  });
  const data = await resp.json().catch(() => null);
  return { httpStatus: resp.status, data };
}
