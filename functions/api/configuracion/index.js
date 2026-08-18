// GET /api/configuracion  → emisor + estado MH (sin exponer secretos)
// PUT /api/configuracion  → guardar emisor y/o credenciales MH
import { json } from '../_middleware.js';
import { getEmisor, getMHConfig, getMHAmbienteActivo } from '../_lib/db.js';

export async function onRequestGet({ request, env }) {
  const requested = new URL(request.url).searchParams.get('ambiente');
  const ambiente = requested === '01' ? '01' : requested === '00' ? '00' : await getMHAmbienteActivo(env.DB);
  const ambienteActivo = await getMHAmbienteActivo(env.DB);
  const emisor = (await getEmisor(env.DB, ambiente)) || {};
  const mh = (await getMHConfig(env.DB, ambiente)) || { ambiente };
  const correlativos = await env.DB.prepare('SELECT tipo_dte, ultimo FROM correlativos').all();
  const logoRow = await env.DB.prepare("SELECT valor FROM app_config WHERE clave = 'empresa_logo_b64'").first();
  const colorRow = await env.DB.prepare("SELECT valor FROM app_config WHERE clave = 'dte_color_primario'").first();
  return json({
    ok: true,
    emisor,
    ambiente_activo: ambienteActivo,
    apariencia: {
      logo_b64: logoRow?.valor || null,
      color_primario: colorRow?.valor || '#1b365d',
    },
    mh: {
      ambiente,
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
      if (!['00', '01'].includes(e.ambiente)) {
        return json({ ok: false, error: 'Seleccione un ambiente MH válido para el emisor' }, 400);
      }
      await env.DB.prepare(
        `INSERT INTO emisor_perfiles (ambiente, nit, nrc, nombre, nombre_comercial, cod_actividad, desc_actividad,
           tipo_establecimiento, departamento, municipio, complemento, telefono, correo,
           cod_estable_mh, cod_estable, cod_punto_venta_mh, cod_punto_venta, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(ambiente) DO UPDATE SET
           nit=excluded.nit, nrc=excluded.nrc, nombre=excluded.nombre, nombre_comercial=excluded.nombre_comercial,
           cod_actividad=excluded.cod_actividad, desc_actividad=excluded.desc_actividad,
           tipo_establecimiento=excluded.tipo_establecimiento, departamento=excluded.departamento,
           municipio=excluded.municipio, complemento=excluded.complemento, telefono=excluded.telefono,
           correo=excluded.correo, cod_estable_mh=excluded.cod_estable_mh, cod_estable=excluded.cod_estable,
           cod_punto_venta_mh=excluded.cod_punto_venta_mh, cod_punto_venta=excluded.cod_punto_venta,
           updated_at=excluded.updated_at`
      ).bind(
        e.ambiente, e.nit || null, e.nrc || null, e.nombre || null, e.nombre_comercial || null,
        e.cod_actividad || null, e.desc_actividad || null, e.tipo_establecimiento || '01',
        e.departamento || null, e.municipio || null, e.complemento || null,
        e.telefono || null, e.correo || null,
        e.cod_estable_mh || 'M001', e.cod_estable || 'M001',
        e.cod_punto_venta_mh || 'P001', e.cod_punto_venta || 'P001'
      ).run();
    }

    if (body.mh) {
      const m = body.mh;
      if (!['00', '01'].includes(m.ambiente)) {
        return json({ ok: false, error: 'Ambiente MH inválido' }, 400);
      }
      const actual = await getMHConfig(env.DB, m.ambiente);
      const apiPwd = m.api_pwd ? m.api_pwd : (actual ? actual.api_pwd : null);
      await env.DB.prepare(
        `INSERT INTO mh_perfiles (ambiente, api_user, api_pwd, updated_at)
         VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT(ambiente) DO UPDATE SET api_user=excluded.api_user,
         api_pwd=excluded.api_pwd, updated_at=excluded.updated_at`
      ).bind(m.ambiente || '00', m.api_user || null, apiPwd).run();
      await env.DB.prepare(
        `INSERT INTO app_config (clave, valor) VALUES ('mh_ambiente_activo', ?)
         ON CONFLICT(clave) DO UPDATE SET valor=excluded.valor`
      ).bind(m.ambiente).run();
    }

    if (body.correlativos && typeof body.correlativos === 'object') {
      for (const [tipo, valor] of Object.entries(body.correlativos)) {
        await env.DB.prepare('INSERT OR IGNORE INTO correlativos (tipo_dte, ultimo) VALUES (?, 0)').bind(tipo).run();
        await env.DB.prepare('UPDATE correlativos SET ultimo = ? WHERE tipo_dte = ?').bind(Number(valor) || 0, tipo).run();
      }
    }

    if (body.apariencia && typeof body.apariencia === 'object') {
      const ap = body.apariencia;
      if (ap.logo_b64 !== undefined) {
        await env.DB.prepare(
          `INSERT INTO app_config (clave, valor) VALUES ('empresa_logo_b64', ?)
           ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor`
        ).bind(ap.logo_b64 || '').run();
      }
      if (ap.color_primario !== undefined) {
        await env.DB.prepare(
          `INSERT INTO app_config (clave, valor) VALUES ('dte_color_primario', ?)
           ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor`
        ).bind(ap.color_primario || '#1b365d').run();
      }
    }

    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
