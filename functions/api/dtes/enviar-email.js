// ============================================================
// POST /api/dtes/enviar-email
// Envía el correo electrónico oficial con el diseño Spacio Rótulos
// y adjuntos de PDF y JSON a través de Resend
// ============================================================
import { json } from '../_middleware.js';
import { enviarEmailDTE, buildEmailTemplate } from '../_lib/email.js';
import { getEmisor, getMHAmbienteActivo } from '../_lib/db.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { dteId, dteObj: directDte, destinatario, asunto, pdfBase64 } = body;

    let dte = directDte;
    let dteRecord = null;

    if (!dte && dteId) {
      dteRecord = await env.DB.prepare('SELECT * FROM dtes WHERE id = ?').bind(dteId).first();
      if (dteRecord && dteRecord.dte_json) {
        dte = JSON.parse(dteRecord.dte_json);
      }
    }

    if (!dte) {
      return json({ ok: false, error: 'No se proporcionó información válida del DTE' }, 400);
    }

    const targetEmail = destinatario || 'spacioprintrotulos@gmail.com';

    const result = await enviarEmailDTE({
      DB: env.DB,
      env,
      dte,
      destinatario: targetEmail,
      customAsunto: asunto,
      pdfBase64,
    });

    const ambiente = dte.identificacion?.ambiente || (await getMHAmbienteActivo(env.DB)) || '00';
    const emisor = (await getEmisor(env.DB, ambiente)) || {};
    const template = buildEmailTemplate({ dte, emisor, ambiente, destinatario: targetEmail, customAsunto: asunto });

    return json({
      ok: result.ok,
      enviado: result.enviado,
      mensaje: result.ok ? `Correo enviado con éxito a ${targetEmail}` : (result.error || 'No se pudo enviar el correo'),
      destinatario: targetEmail,
      asunto: template.asunto,
      html: template.html,
      resendId: result.id || null,
      error: result.error || null,
    }, result.ok ? 200 : 400);
  } catch (e) {
    return json({ ok: false, error: e.message || 'Error al procesar el envío de correo' }, 500);
  }
}
