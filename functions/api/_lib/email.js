// ============================================================
// Módulo de Envío Automático de Correos Transaccionales (Resend)
// ============================================================
import { getEmisor, getMHAmbienteActivo } from './db.js';

function formatNIT(nit) {
  const d = String(nit || '').replace(/\D/g, '');
  if (d.length === 14) return `${d.slice(0,4)}-${d.slice(4,10)}-${d.slice(10,13)}-${d.slice(13)}`;
  if (d.length === 9) return `${d.slice(0,8)}-${d.slice(8)}`;
  return nit || '1201-260869-101-8';
}

function getNombreTipoDTE(tipo) {
  switch (tipo) {
    case '01': return 'FACTURA ELECTRÓNICA';
    case '03': return 'COMPROBANTE DE CRÉDITO FISCAL';
    case '05': return 'NOTA DE CRÉDITO';
    case '04': return 'NOTA DE REMISIÓN';
    default: return `DTE TIPO ${tipo}`;
  }
}

function formatFechaDDMMYYYY(fec) {
  if (!fec) return new Date().toLocaleDateString('es-SV');
  const parts = String(fec).split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return fec;
}

export function buildEmailTemplate({ dte, emisor, ambiente, destinatario, customAsunto }) {
  const tipoDte = dte.identificacion?.tipoDte || '01';
  const tipoNombre = getNombreTipoDTE(tipoDte);
  const numControl = dte.identificacion?.numeroControl || 'DTE';
  const codGen = dte.identificacion?.codigoGeneracion || '';
  const fechaEmi = formatFechaDDMMYYYY(dte.identificacion?.fecEmi);

  const receptorNombre = dte.receptor?.nombre || 'CLIENTE';
  const receptorDoc = dte.receptor?.nrc || dte.receptor?.nit || dte.receptor?.numDocumento || '';
  const receptorSaludo = receptorDoc ? `${receptorDoc} ${receptorNombre}` : receptorNombre;

  const nitEmisor = formatNIT(emisor?.nit || '12012608691018');
  const totalPagar = Number(dte.resumen?.totalPagar !== undefined ? dte.resumen.totalPagar : (dte.resumen?.montoTotalOperacion || 0)).toFixed(2);
  const asunto = customAsunto || `Factura Electrónica DTE ${tipoNombre} Spacio Rotulos`;
  const urlConsulta = `https://admin.factura.gob.sv/consultaPublica?ambiente=${ambiente || '00'}&codGen=${codGen}&fechaEmi=${dte.identificacion?.fecEmi || ''}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${asunto}</title>
</head>
<body style="font-family: 'Segoe UI', Arial, Helvetica, sans-serif; background-color: #f4f7fb; margin: 0; padding: 24px 12px; color: #111827; -webkit-font-smoothing: antialiased;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.07); border: 1px solid #e2e8f0; margin: 0 auto;">
    <!-- Encabezado superior sutil -->
    <tr>
      <td align="center" style="padding: 24px 30px 10px 30px; font-size: 13px; color: #64748b; font-weight: 500; letter-spacing: 0.2px;">
        Comprobante de documento tributario electrónico
      </td>
    </tr>
    
    <!-- Logo Centrado Spacio Rotulos -->
    <tr>
      <td align="center" style="padding: 10px 30px 16px 30px;">
        <img src="https://sistema-fac2026-26c.pages.dev/img/logo_spacio.png" alt="Spacio Rótulos" width="240" style="display: block; max-width: 240px; height: auto; border: 0;">
      </td>
    </tr>

    <!-- Icono de Comprobante Verificado -->
    <tr>
      <td align="center" style="padding: 0 30px 22px 30px;">
        <div style="width: 68px; height: 68px; border-radius: 50%; background-color: #eff6ff; display: inline-block; text-align: center; line-height: 68px; border: 2.5px solid #0d47c9;">
          <span style="font-size: 34px; color: #0d47c9; vertical-align: middle;">📄</span>
        </div>
      </td>
    </tr>

    <!-- Saludo y Mensaje Principal -->
    <tr>
      <td style="padding: 0 36px 14px 36px; font-size: 14.5px; line-height: 1.5; color: #1e293b;">
        <p style="margin: 0 0 12px 0; font-weight: 800; font-size: 15.5px; color: #0f172a;">
          Estimado(a) ${receptorSaludo},
        </p>
        <p style="margin: 0 0 16px 0; color: #334155; line-height: 1.55;">
          <strong>Spacio Rotulos. -${nitEmisor}-</strong> ha emitido un Documento Tributario Electrónico -DTE- con la siguiente información:
        </p>
      </td>
    </tr>

    <!-- Tarjeta Destacada con Borde Naranja Oficial -->
    <tr>
      <td style="padding: 0 36px 20px 36px;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fffdfa; border: 2px solid #f59e0b; border-radius: 14px; overflow: hidden;">
          <tr>
            <td style="padding: 16px 20px; font-size: 14px; color: #0f172a; line-height: 1.6;">
              <div style="margin-bottom: 7px;">
                <strong style="color: #1e293b;">Código de Generación:</strong> 
                <span style="font-family: monospace; font-size: 13.5px; font-weight: 700; color: #0f172a; word-break: break-all;">${codGen}</span>
              </div>
              <div style="margin-bottom: 7px;">
                <strong style="color: #1e293b;">Fecha de emisión:</strong> ${fechaEmi}
              </div>
              <div style="margin-bottom: 7px;">
                <strong style="color: #1e293b;">Tipo de Comprobante:</strong> <span style="font-weight: 700; color: #0d47c9;">${tipoNombre}</span>
              </div>
              <div>
                <strong style="color: #1e293b;">Monto Total:</strong> <span style="font-weight: 800; font-size: 15px; color: #16a34a;">USD $${totalPagar}</span>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Mensaje de Adjuntos y Validez MH -->
    <tr>
      <td style="padding: 0 36px 20px 36px; font-size: 13.5px; color: #475569; line-height: 1.55;">
        <p style="margin: 0 0 10px 0;">
          Adjunto podrá descargar un archivo <strong>PDF</strong> y <strong>JSON</strong> el cual está firmado electrónicamente y autorizado por el Ministerio de Hacienda (MH).
        </p>
        <p style="margin: 0; font-size: 12.5px;">
          🔍 También puede consultar su documento en el portal oficial del MH: <br>
          <a href="${urlConsulta}" target="_blank" style="color: #0d47c9; text-decoration: underline; word-break: break-all;">${urlConsulta}</a>
        </p>
      </td>
    </tr>

    <!-- Línea Divisoria Azul -->
    <tr>
      <td style="padding: 0 36px;">
        <hr style="border: none; border-top: 1.5px solid #0d47c9; margin: 0;">
      </td>
    </tr>

    <!-- Horario y Contacto -->
    <tr>
      <td style="padding: 18px 36px 20px 36px; font-size: 12.5px; color: #64748b; line-height: 1.5;">
        Te recordamos que nuestro horario de atención es de 8:00 a.m. a 5:00 p.m. de lunes a viernes. Para cualquier consulta o información adicional puedes escribirnos a <a href="mailto:spacioprintrotulos@gmail.com" style="color: #0d47c9; text-decoration: underline; font-weight: 600;">spacioprintrotulos@gmail.com</a> o contactarnos al <strong>+503 7210-8369</strong>.
      </td>
    </tr>

    <!-- Pie de Página -->
    <tr>
      <td align="center" style="background-color: #f8fafc; padding: 16px 30px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; font-weight: 500;">
        © 2026 Spacio Rotulos. - Todos los derechos reservados -
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return {
    asunto,
    html,
    tipoNombre,
    numControl,
    codGen,
    fechaEmi,
    totalPagar,
    receptorNombre,
    urlConsulta,
  };
}

export async function enviarEmailDTE({ DB, env, dte, destinatario, customAsunto, pdfBase64 }) {
  // 1. Obtener API Key de Resend (desde DB app_config o env)
  let apiKey = env?.RESEND_API_KEY;
  if (!apiKey && DB) {
    const row = await DB.prepare("SELECT valor FROM app_config WHERE clave = 'resend_api_key'").first();
    if (row && row.valor) apiKey = row.valor;
  }
  if (!apiKey) {
    return { ok: false, error: 'API Key de Resend no configurada. Ingrésela en Configuración.' };
  }

  // 2. Obtener configuración de remitente
  let fromEmail = 'Spacio Rótulos <onboarding@resend.dev>';
  if (DB) {
    const fromRow = await DB.prepare("SELECT valor FROM app_config WHERE clave = 'email_remitente'").first();
    if (fromRow && fromRow.valor) fromEmail = fromRow.valor;
  }

  const ambiente = dte.identificacion?.ambiente || (DB ? await getMHAmbienteActivo(DB) : '00') || '00';
  const emisor = DB ? ((await getEmisor(DB, ambiente)) || {}) : {};

  const targetEmail = destinatario || 'spacioprintrotulos@gmail.com';
  const template = buildEmailTemplate({ dte, emisor, ambiente, destinatario: targetEmail, customAsunto });

  const attachments = [];

  // Adjunto JSON oficial del DTE
  const jsonFilename = `${template.tipoNombre.replace(/\s+/g, '_')}_${template.numControl}_${template.receptorNombre.slice(0, 20)}.json`;
  let jsonBase64 = '';
  try {
    const rawJson = JSON.stringify(dte, null, 2);
    const bytes = new TextEncoder().encode(rawJson);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    jsonBase64 = btoa(binary);
  } catch {
    jsonBase64 = Buffer.from(JSON.stringify(dte, null, 2)).toString('base64');
  }

  attachments.push({
    filename: jsonFilename,
    content: jsonBase64,
  });

  // Adjunto PDF si está disponible
  if (pdfBase64) {
    const cleanB64 = String(pdfBase64).includes(',') ? String(pdfBase64).split(',')[1].trim() : String(pdfBase64).trim();
    if (cleanB64.length > 50) {
      attachments.push({
        filename: `${template.tipoNombre.replace(/\s+/g, '_')}_${template.numControl}_${template.receptorNombre.slice(0, 20)}.pdf`.replace(/[^\w\d\.-]/g, '_'),
        content: cleanB64,
      });
    }
  }

  try {
    // Si se usa el dominio de prueba sandbox onboarding@resend.dev, Resend solo permite enviar a la cuenta verificada
    let toAddress = targetEmail;
    if (fromEmail.includes('resend.dev') && targetEmail !== 'spacioprintrotulos@gmail.com') {
      toAddress = 'spacioprintrotulos@gmail.com';
    }

    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toAddress],
        subject: template.asunto,
        html: template.html,
        attachments,
      }),
    });

    const resendData = await resendResp.json();

    if (resendResp.ok) {
      return {
        ok: true,
        enviado: true,
        id: resendData.id,
        destinatario: toAddress,
        destinatarioOriginal: targetEmail,
        asunto: template.asunto,
      };
    } else {
      console.warn('Resend error response:', resendData);
      return {
        ok: false,
        error: resendData.message || 'Error en el servicio de correo Resend',
        detalle: resendData,
      };
    }
  } catch (err) {
    console.error('Error al conectar con Resend:', err);
    return {
      ok: false,
      error: err.message || 'Error de red al conectar con el servidor de correo',
    };
  }
}
