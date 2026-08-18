// ============================================================
// Acceso a datos (Cloudflare D1) y semillas iniciales
// ============================================================
import { hashPassword, randomSecret } from './crypto.js';

// Garantiza usuario admin inicial y secreto de sesiones
export async function ensureSeed(DB) {
  const usuarios = await DB.prepare('SELECT COUNT(*) AS n FROM usuarios').first();
  if (!usuarios || usuarios.n === 0) {
    const pass = await hashPassword('fac2026');
    await DB.prepare('INSERT INTO usuarios (usuario, pass_hash, nombre, rol) VALUES (?, ?, ?, ?)')
      .bind('admin', pass, 'Administrador', 'ADMIN')
      .run();
  }
  let cfg = await DB.prepare("SELECT valor FROM app_config WHERE clave = 'session_secret'").first();
  if (!cfg) {
    await DB.prepare('INSERT INTO app_config (clave, valor) VALUES (?, ?)')
      .bind('session_secret', randomSecret())
      .run();
    cfg = { valor: null };
  }
}

export async function getSessionSecret(DB) {
  const cfg = await DB.prepare("SELECT valor FROM app_config WHERE clave = 'session_secret'").first();
  return cfg ? cfg.valor : null;
}

export async function getEmisor(DB, ambiente = null) {
  const perfil = ambiente || await getMHAmbienteActivo(DB);
  try {
    const row = await DB.prepare('SELECT * FROM emisor_perfiles WHERE ambiente = ?').bind(perfil).first();
    if (row) return row;
  } catch (e) {
    // Compatibilidad durante la primera ejecución antes de aplicar la migración.
  }
  return DB.prepare('SELECT * FROM emisor_config WHERE id = 1').first();
}

export async function getMHAmbienteActivo(DB) {
  const row = await DB.prepare("SELECT valor FROM app_config WHERE clave = 'mh_ambiente_activo'").first();
  return row?.valor === '01' ? '01' : '00';
}

export async function getMHConfig(DB, ambiente = null) {
  const perfil = ambiente || await getMHAmbienteActivo(DB);
  try {
    const row = await DB.prepare('SELECT * FROM mh_perfiles WHERE ambiente = ?').bind(perfil).first();
    if (row) return row;
  } catch (e) {
    // Compatibilidad durante la primera ejecución antes de aplicar la migración.
  }
  return DB.prepare('SELECT * FROM mh_config WHERE id = 1').first();
}

// Siguiente correlativo (transacción implícita con batch)
export async function nextCorrelativo(DB, tipoDte) {
  await DB.prepare('INSERT OR IGNORE INTO correlativos (tipo_dte, ultimo) VALUES (?, 0)').bind(tipoDte).run();
  await DB.prepare('UPDATE correlativos SET ultimo = ultimo + 1 WHERE tipo_dte = ?').bind(tipoDte).run();
  const row = await DB.prepare('SELECT ultimo FROM correlativos WHERE tipo_dte = ?').bind(tipoDte).first();
  return row.ultimo;
}

export async function setCorrelativo(DB, tipoDte, valor) {
  await DB.prepare('INSERT OR IGNORE INTO correlativos (tipo_dte, ultimo) VALUES (?, 0)').bind(tipoDte).run();
  await DB.prepare('UPDATE correlativos SET ultimo = ? WHERE tipo_dte = ?').bind(valor, tipoDte).run();
}
