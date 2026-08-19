// POST /api/dtes/emitir
// Construye el DTE, lo firma (si hay certificado configurado) y lo transmite al MH.
// Si no hay credenciales MH configuradas → modo SIMULADO (solo genera el JSON).
import { json } from '../_middleware.js';
import { getEmisor, getMHConfig, nextCorrelativo } from '../_lib/db.js';
import { BUILDERS } from '../_lib/dte.js';
import { firmarJWS } from '../_lib/crypto.js';
import { mhAutenticar, mhRecepcionDTE } from '../_lib/mh.js';
import { enviarEmailDTE } from '../_lib/email.js';
import { enviarWhatsAppGateway } from '../_lib/whatsapp.js';

const VERSIONES = { '01': 1, '03': 3, '05': 3 };

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { tipoDte } = body;

    if (!['01', '03', '05'].includes(tipoDte)) {
      return json({ ok: false, error: 'tipoDte inválido (01, 03 o 05)' }, 400);
    }
    if (!body.receptor || !body.receptor.nombre) {
      return json({ ok: false, error: 'Datos del receptor requeridos' }, 400);
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return json({ ok: false, error: 'Debe agregar al menos un ítem' }, 400);
    }
    for (const [i, it] of body.items.entries()) {
      if (!it.descripcion || !(Number(it.cantidad) > 0) || !(Number(it.precioUni) >= 0)) {
        return json({ ok: false, error: `Ítem ${i + 1}: descripción, cantidad y precio son requeridos` }, 400);
      }
    }
    if (tipoDte === '05') {
      const dr = body.docRelacionado;
      if (!dr || !dr.tipoDocumento || !dr.numeroDocumento || !dr.fechaEmision) {
        return json({ ok: false, error: 'Nota de Crédito requiere el documento relacionado (DTE original)' }, 400);
      }
    }

    const emisor = await getEmisor(env.DB);
    if (!emisor || !emisor.nit) {
      return json({ ok: false, error: 'Primero complete los datos del emisor en Configuración' }, 400);
    }
    const mh = await getMHConfig(env.DB);
    const ambiente = (mh && mh.ambiente) || '00';

    const correlativo = await nextCorrelativo(env.DB, tipoDte);
    const builder = BUILDERS[tipoDte];
    const { dte, total } = builder({
      emisor,
      ambiente,
      correlativo,
      receptor: body.receptor,
      items: body.items,
      condicionOperacion: Number(body.condicionOperacion || 1),
      pagos: body.pagos || null,
      ivaPerci1: Number(body.ivaPerci1 || 0),
      ivaRete1: Number(body.ivaRete1 || 0),
      reteRenta: Number(body.reteRenta || 0),
      extension: body.extension || null,
      apendice: body.apendice || null,
      docRelacionado: body.docRelacionado || null,
    });

    const dteStr = JSON.stringify(dte);
    let dteFirmado = null;
    let estado = 'SIMULADO';
    let respuesta = null;
    let sello = null;
    let fhProcesamiento = null;
    let observaciones = null;

    const mhListo = mh && mh.firma_activa && mh.firma_privada_pem && mh.api_user && mh.api_pwd;

    if (mhListo) {
      try {
        dteFirmado = await firmarJWS(dteStr, mh.firma_privada_pem);
        const token = await mhAutenticar(ambiente, mh.api_user, mh.api_pwd);
        const { httpStatus, data } = await mhRecepcionDTE(ambiente, token, {
          version: VERSIONES[tipoDte],
          tipoDte,
          idEnvio: Date.now(),
          documento: dteFirmado,
        });
        respuesta = { httpStatus, ...data };
        if (data && data.estado === 'PROCESADO') {
          estado = 'PROCESADO';
          sello = data.selloRecibido || null;
          fhProcesamiento = data.fhProcesamiento || null;
          observaciones = JSON.stringify(data.observaciones || []);
        } else {
          estado = 'RECHAZADO';
          observaciones = JSON.stringify(data ? (data.observaciones || [data.descripcionMsg || JSON.stringify(data)]) : ['Sin respuesta del MH']);
        }
      } catch (e) {
        estado = 'ERROR';
        respuesta = { error: e.message };
      }
    } else {
      respuesta = { aviso: 'Credenciales MH no configuradas: DTE generado en modo SIMULADO (no transmitido)' };
    }

    const res = await env.DB.prepare(
      `INSERT INTO dtes (tipo_dte, numero_control, codigo_generacion, fec_emi, hor_emi, cliente_id,
                         receptor_nombre, total, dte_json, dte_firmado, sello_recibido, fh_procesamiento,
                         estado, observaciones, respuesta_mh, dte_relacionado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      tipoDte,
      dte.identificacion.numeroControl,
      dte.identificacion.codigoGeneracion,
      dte.identificacion.fecEmi,
      dte.identificacion.horEmi,
      body.clienteId || null,
      body.receptor.nombre,
      total,
      dteStr,
      dteFirmado,
      sello,
      fhProcesamiento,
      estado,
      observaciones,
      respuesta ? JSON.stringify(respuesta) : null,
      tipoDte === '05' ? body.docRelacionado.numeroDocumento : null
    ).run();

    // Envío automático de correo con adjunto JSON
    let emailStatus = { ok: false };
    try {
      // Revisa si el envío automático está activo (por defecto sí)
      const autoEmailRow = await env.DB.prepare("SELECT valor FROM app_config WHERE clave = 'auto_enviar_email'").first();
      const autoActivo = !autoEmailRow || autoEmailRow.valor !== '0';

      if (autoActivo && (estado === 'PROCESADO' || estado === 'SIMULADO')) {
        const dest = 'spacioprintrotulos@gmail.com';
        emailStatus = await enviarEmailDTE({
          DB: env.DB,
          env,
          dte,
          destinatario: dest,
        });
      }
    } catch (emailErr) {
      console.warn('Error en envío automático de correo:', emailErr);
    }

    // Envío automático de WhatsApp si el gateway está activo
    let waStatus = { ok: false };
    try {
      const autoWaRow = await env.DB.prepare("SELECT valor FROM app_config WHERE clave = 'auto_enviar_whatsapp'").first();
      const autoWaActivo = autoWaRow?.valor === '1';

      if (autoWaActivo && (estado === 'PROCESADO' || estado === 'SIMULADO')) {
        waStatus = await enviarWhatsAppGateway({
          DB: env.DB,
          dte,
        });
      }
    } catch (waErr) {
      console.warn('Error en envío automático de WhatsApp:', waErr);
    }

    return json({
      ok: estado !== 'ERROR',
      id: res.meta.last_row_id,
      estado,
      numeroControl: dte.identificacion.numeroControl,
      codigoGeneracion: dte.identificacion.codigoGeneracion,
      selloRecibido: sello,
      total,
      dte,
      respuesta,
      emailEnviado: emailStatus.ok,
      emailDestinatario: emailStatus.destinatario || 'spacioprintrotulos@gmail.com',
      emailId: emailStatus.id || null,
      whatsappEnviado: waStatus.ok,
      whatsappMensaje: waStatus.message || null,
    });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
