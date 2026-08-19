// GET /api/whatsapp/status → Obtiene el estado y QR del Gateway de WhatsApp
import { json } from '../_middleware.js';
import { getWhatsAppConfig } from '../_lib/whatsapp.js';

export async function onRequestGet({ env }) {
  const config = await getWhatsAppConfig(env.DB);
  if (!config.url) {
    return json({
      ok: true,
      configurado: false,
      connected: false,
      message: 'Gateway de WhatsApp no configurado aún',
    });
  }

  const baseUrl = config.url.replace(/\/+$/, '');

  try {
    const statusResp = await fetch(`${baseUrl}/status`);
    const statusData = await statusResp.json();

    let qrData = null;
    if (!statusData.connected) {
      try {
        const qrResp = await fetch(`${baseUrl}/qr`);
        qrData = await qrResp.json();
      } catch {}
    }

    return json({
      ok: true,
      configurado: true,
      url: config.url,
      connected: statusData.connected,
      user: statusData.user,
      qrDataUrl: qrData?.qrDataUrl || null,
      auto: config.auto,
      phone: config.phone,
    });
  } catch (err) {
    return json({
      ok: false,
      configurado: true,
      url: config.url,
      connected: false,
      error: `No se pudo contactar al Gateway (${config.url}): ${err.message}`,
    });
  }
}
