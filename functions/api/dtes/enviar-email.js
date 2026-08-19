// ============================================================
// POST /api/dtes/enviar-email
// Envía el correo electrónico oficial con el diseño Spacio Rótulos
// y adjuntos de PDF y JSON
// ============================================================
import { json } from '../_middleware.js';
import { getEmisor, getMHAmbienteActivo } from '../_lib/db.js';

function formatNIT(nit) {
  const d = String(nit || '').replace(/\D/g, '');
  if (d.length === 14) return `${d.slice(0,4)}-${d.slice(4,10)}-${d.slice(10,13)}-${d.slice(13)}`;
  if (d.length === 9) return `${d.slice(0,8)}-${d.slice(8)}`;
  return nit || '12012608691018';
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

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { dteId, dteObj: directDte, destinatario: targetEmail, asunto: customAsunto, pdfBase64 } = body;

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

    const ambiente = dte.identificacion?.ambiente || (await getMHAmbienteActivo(env.DB)) || '00';
    const emisor = (await getEmisor(env.DB, ambiente)) || {};

    const tipoDte = dte.identificacion?.tipoDte || '01';
    const tipoNombre = getNombreTipoDTE(tipoDte);
    const numControl = dte.identificacion?.numeroControl || dteRecord?.numero_control || 'DTE';
    const codGen = dte.identificacion?.codigoGeneracion || dteRecord?.codigo_generacion || '';
    const fechaEmi = formatFechaDDMMYYYY(dte.identificacion?.fecEmi);

    const receptorNombre = dte.receptor?.nombre || dteRecord?.receptor_nombre || 'CLIENTE';
    const receptorDoc = dte.receptor?.nrc || dte.receptor?.nit || dte.receptor?.numDocumento || '';
    const receptorSaludo = receptorDoc ? `${receptorDoc} ${receptorNombre}` : receptorNombre;

    const nitEmisor = formatNIT(emisor.nit || '12012608691018');
    const totalPagar = Number(dte.resumen?.totalPagar || dte.resumen?.montoTotalOperacion || dteRecord?.total || 0).toFixed(2);

    // Destinatario: por defecto spacioprintrotulos@gmail.com para pruebas iniciales
    const destinatario = targetEmail || 'spacioprintrotulos@gmail.com';
    const asunto = customAsunto || `Factura Electrónica DTE ${tipoNombre} Spacio Rotulos`;

    const urlConsulta = `https://admin.factura.gob.sv/consultaPublica?ambiente=${ambiente}&codGen=${codGen}&fechaEmi=${dte.identificacion?.fecEmi || ''}`;

    // Construcción de plantilla HTML oficial idéntica al diseño solicitado
    const htmlEmail = `
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

    // Envío por Resend API si existe clave configurada en env
    let envioResend = null;
    if (env.RESEND_API_KEY) {
      try {
        const attachments = [];
        // Adjunto JSON
        attachments.push({
          filename: `${tipoNombre.replace(/\s+/g, '_')}_${numControl}_${receptorNombre.slice(0, 25)}.json`,
          content: Buffer.from(JSON.stringify(dte, null, 2)).toString('base64'),
        });
        // Adjunto PDF si viene provisto
        if (pdfBase64) {
          const cleanB64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
          attachments.push({
            filename: `${tipoNombre.replace(/\s+/g, '_')}_${numControl}_${receptorNombre.slice(0, 25)}.pdf`,
            content: cleanB64,
          });
        }

        const resendResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Spacio Rótulos <facturacion@sistema-fac2026-26c.pages.dev>',
            to: [destinatario],
            subject: asunto,
            html: htmlEmail,
            attachments,
          }),
        });

        if (resendResp.ok) {
          envioResend = await resendResp.json();
        }
      } catch (err) {
        console.warn('Error enviando con Resend:', err);
      }
    }

    return json({
      ok: true,
      mensaje: `Correo preparado con éxito para ${destinatario}`,
      destinatario,
      asunto,
      html: htmlEmail,
      envioReal: !!envioResend,
      resendId: envioResend?.id || null,
      dteInfo: {
        tipoNombre,
        numControl,
        codGen,
        fechaEmi,
        totalPagar,
        receptorNombre,
        urlConsulta,
      }
    });
  } catch (e) {
    return json({ ok: false, error: e.message || 'Error al procesar el envío de correo' }, 500);
  }
}
