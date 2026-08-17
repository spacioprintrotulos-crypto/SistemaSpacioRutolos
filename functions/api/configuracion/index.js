// GET /api/configuracion  → emisor + estado MH (sin exponer secretos)
// PUT /api/configuracion  → guardar emisor y/o credenciales MH
import { json } from '../_middleware.js';
import { getEmisor, getMHConfig } from '../_lib/db.js';

export async function onRequestGet({ env }) {
  const emisor = (await getEmisor(env.DB)) || {};
  const mh = (await getMHConfig(env.DB)) || {};
  const correlativos = await env.DB.prepare('SELECT tipo_dte, ultimo FROM correlativos').all();
  return json({
    ok: true,
    emisor,
    mh: {
      ambiente: mh.ambiente || '00',
      api_user: mh.api_user || '',
      api_pwd_configurada: !!mh.api_pwd,
      firma_activa: !!mh.firma_activa,
      cert_subject: mh.cert_subject || null,
      cert_vence: mh.cert_vence || null,
    },
    correlativos: correlativos.results || [],
  });
}

export async function onRequestPut({ request, env }) {
  try {
    const body = await request.json();

    if (body.emisor) {
      const e = body.emisor;
      await env.DB.prepare(
        `INSERT INTO emisor_config (id, nit, nrc, nombre, nombre_comercial, cod_actividad, desc_actividad,
           tipo_establecimiento, departamento, municipio, complemento, telefono, correo,
           cod_estable_mh, cod_estable, cod_punto_venta_mh, cod_punto_venta, updated_at)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           nit=excluded.nit, nrc=excluded.nrc, nombre=excluded.nombre, nombre_comercial=excluded.nombre_comercial,
           cod_actividad=excluded.cod_actividad, desc_actividad=excluded.desc_actividad,
           tipo_establecimiento=excluded.tipo_establecimiento, departamento=excluded.departamento,
           municipio=excluded.municipio, complemento=excluded.complemento, telefono=excluded.telefono,
           correo=excluded.correo, cod_estable_mh=excluded.cod_estable_mh, cod_estable=excluded.cod_estable,
           cod_punto_venta_mh=excluded.cod_punto_venta_mh, cod_punto_venta=excluded.cod_punto_venta,
           updated_at=excluded.updated_at`
      ).bind(
        e.nit || null, e.nrc || null, e.nombre || null, e.nombre_comercial || null,
        e.cod_actividad || null, e.desc_actividad || null, e.tipo_establecimiento || '01',
        e.departamento || null, e.municipio || null, e.complemento || null,
        e.telefono || null, e.correo || null,
        e.cod_estable_mh || 'M001', e.cod_estable || 'M001',
        e.cod_punto_venta_mh || 'P001', e.cod_punto_venta || 'P001'
      ).run();
    }

    if (body.mh) {
      const m = body.mh;
      const actual = await getMHConfig(env.DB);
      const apiPwd = m.api_pwd ? m.api_pwd : (actual ? actual.api_pwd : null);
      await env.DB.prepare(
        `INSERT INTO mh_config (id, ambiente, api_user, api_pwd, updated_at)
         VALUES (1, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET ambiente=excluded.ambiente, api_user=excluded.api_user,
           api_pwd=excluded.api_pwd, updated_at=excluded.updated_at`
      ).bind(m.ambiente || '00', m.api_user || null, apiPwd).run();
    }

    if (body.correlativos && typeof body.correlativos === 'object') {
      for (const [tipo, valor] of Object.entries(body.correlativos)) {
        await env.DB.prepare('INSERT OR IGNORE INTO correlativos (tipo_dte, ultimo) VALUES (?, 0)').bind(tipo).run();
        await env.DB.prepare('UPDATE correlativos SET ultimo = ? WHERE tipo_dte = ?').bind(Number(valor) || 0, tipo).run();
      }
    }

    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
