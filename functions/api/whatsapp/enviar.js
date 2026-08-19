// POST /api/whatsapp/enviar → Envía DTE por WhatsApp a través del Gateway
import { json } from '../_middleware.js';
import { enviarWhatsAppGateway } from '../_lib/whatsapp.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { dteId, dteObj: directDte, phone, customMessage, pdfBase64 } = body;

    let dte = directDte;
    if (!dte && dteId) {
      const row = await env.DB.prepare('SELECT * FROM dtes WHERE id = ?').bind(dteId).first();
      if (row && row.dte_json) {
        dte = JSON.parse(row.dte_json);
      }
    }

    if (!dte) {
      return json({ ok: false, error: 'DTE no encontrado o no proporcionado' }, 400);
    }

    const result = await enviarWhatsAppGateway({
      DB: env.DB,
      dte,
      phone,
      pdfBase64,
      customMessage
    });

    return json(result, result.ok ? 200 : 400);
  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}
