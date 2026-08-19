// ============================================================
// Módulo Conector para Gateway de WhatsApp (Railway / Baileys)
// ============================================================
import { getEmisor, getMHAmbienteActivo } from './db.js';

function getNombreTipoDTE(tipo) {
  switch (tipo) {
    case '01': return 'FACTURA ELECTRÓNICA';
    case '03': return 'COMPROBANTE DE CRÉDITO FISCAL';
    case '05': return 'NOTA DE CRÉDITO';
    case '04': return 'NOTA DE REMISIÓN';
    default: return `DTE TIPO ${tipo}`;
  }
}

export function normalizeGatewayUrl(url) {
  if (!url) return '';
  let u = String(url).trim();
  if (!/^https?:\/\//i.test(u)) {
    u = 'https://' + u;
  }
  return u.replace(/\/+$/, '');
}

export async function getWhatsAppConfig(DB) {
  if (!DB) return { url: '', auto: false, phone: '50372554916' };
  const urlRow = await DB.prepare("SELECT valor FROM app_config WHERE clave = 'whatsapp_gateway_url'").first();
  const autoRow = await DB.prepare("SELECT valor FROM app_config WHERE clave = 'auto_enviar_whatsapp'").first();
  const phoneRow = await DB.prepare("SELECT valor FROM app_config WHERE clave = 'whatsapp_notificaciones'").first();
  const keyRow = await DB.prepare("SELECT valor FROM app_config WHERE clave = 'whatsapp_api_key'").first();

  const rawUrl = urlRow?.valor || '';
  return {
    url: normalizeGatewayUrl(rawUrl),
    rawUrl,
    auto: autoRow?.valor === '1',
    phone: phoneRow?.valor || '50372554916',
    apiKey: keyRow?.valor || 'spacio_sec_2026',
  };
}

export async function enviarWhatsAppGateway({ DB, dte, phone, pdfBase64, customMessage }) {
  const config = await getWhatsAppConfig(DB);
  if (!config.url) {
    return { ok: false, error: 'URL del Gateway de WhatsApp no configurada en el sistema' };
  }

  const ident = dte.identificacion || {};
  const receptor = dte.receptor || {};
  const resumen = dte.resumen || {};
  const tipo = ident.tipoDte || '01';
  const tipoNom = getNombreTipoDTE(tipo);
  const numControl = ident.numeroControl || 'DTE';
  const codGen = ident.codigoGeneracion || '';
  const fechaEmi = ident.fecEmi || new Date().toISOString().slice(0, 10);
  const totalPagar = Number(resumen.totalPagar !== undefined ? resumen.totalPagar : (resumen.montoTotalOperacion || 0)).toFixed(2);
  const receptorNombre = receptor.nombre || 'CLIENTE';
  const ambiente = ident.ambiente || (DB ? await getMHAmbienteActivo(DB) : '00') || '00';

  const targetPhone = phone || config.phone || '50372554916';
  const urlConsulta = `https://admin.factura.gob.sv/consultaPublica?ambiente=${ambiente}&codGen=${codGen}&fechaEmi=${fechaEmi}`;

  const defaultMessage = 
`📄 *DOCUMENTO TRIBUTARIO ELECTRÓNICO (DTE)*
*Emisor:* Spacio Rotulos (NIT: 1201-260869-101-8)

Estimado(a) *${receptorNombre}*:
Se ha generado su Documento Tributario Electrónico con la siguiente información:

🔹 *Tipo de Comprobante:* ${tipoNom}
🔹 *N° de Control:* ${numControl}
🔹 *Código de Generación:* ${codGen}
🔹 *Fecha de Emisión:* ${fechaEmi}
🔹 *Monto Total:* USD $${totalPagar}

✅ *Documento autorizado por el Ministerio de Hacienda (MH).*
🔍 *Consulta Pública Oficial:*
${urlConsulta}

📎 _Adjuntamos a continuación su Comprobante Oficial en formato PDF y archivo JSON firmado._

© 2026 Spacio Rotulos. - Todos los derechos reservados -`;

  const finalMessage = customMessage || defaultMessage;
  const jsonStr = typeof dte === 'string' ? dte : JSON.stringify(dte, null, 2);
  const jsonBase64 = typeof btoa === 'function'
    ? btoa(unescape(encodeURIComponent(jsonStr)))
    : Buffer.from(jsonStr).toString('base64');

  const cleanReceptor = (receptorNombre || 'CLIENTE').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 20);
  const baseName = `${tipoNom.replace(/\s+/g, '_')}_${numControl}_${cleanReceptor}`;

  const payload = {
    phone: targetPhone,
    message: finalMessage,
    jsonBase64: jsonBase64,
    jsonFileName: `${baseName}.json`,
  };

  if (pdfBase64) {
    payload.pdfBase64 = pdfBase64;
    payload.pdfFileName = `${baseName}.pdf`;
  }

  const endpoint = config.url.replace(/\/+$/, '') + '/send-dte';

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();
    if (resp.ok && data.ok) {
      return {
        ok: true,
        enviado: true,
        message: data.message || `DTE enviado con éxito por WhatsApp a ${targetPhone}`,
        phone: targetPhone
      };
    } else {
      return {
        ok: false,
        error: data.error || 'Error reportado por el Gateway de WhatsApp',
        detalle: data
      };
    }
  } catch (err) {
    return {
      ok: false,
      error: `No se pudo conectar con el Gateway de WhatsApp en (${config.url}): ${err.message}`
    };
  }
}
