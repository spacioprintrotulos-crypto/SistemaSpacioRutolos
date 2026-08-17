// POST /api/dtes/anular  { dteId, motivo, responsable: {nombre, tipoDocumento, numDocumento}, solicita: {...} }
// Genera el evento de invalidación, lo firma y lo envía al MH.
import { json } from '../_middleware.js';
import { getEmisor, getMHConfig } from '../_lib/db.js';
import { buildEventoInvalidacion } from '../_lib/dte.js';
import { firmarJWS } from '../_lib/crypto.js';
import { mhAutenticar, mhAnularDTE } from '../_lib/mh.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const dte = await env.DB.prepare('SELECT * FROM dtes WHERE id = ?').bind(body.dteId).first();
    if (!dte) return json({ ok: false, error: 'DTE no encontrado' }, 404);
    if (dte.estado !== 'PROCESADO') {
      return json({ ok: false, error: 'Solo se pueden anular DTEs procesados por el MH' }, 400);
    }
    if (!body.motivo || !body.responsable || !body.solicita) {
      return json({ ok: false, error: 'Motivo, responsable y solicitante son requeridos' }, 400);
    }

    const emisor = await getEmisor(env.DB);
    const mh = await getMHConfig(env.DB);
    if (!mh || !mh.firma_activa || !mh.api_user) {
      return json({ ok: false, error: 'Credenciales MH no configuradas' }, 400);
    }

    // Extraer datos del receptor desde el JSON guardado
    const dteJson = JSON.parse(dte.dte_json);
    const rec = dteJson.receptor || {};
    const dteParaEvento = {
      tipo_dte: dte.tipo_dte,
      codigo_generacion: dte.codigo_generacion,
      sello_recibido: dte.sello_recibido,
      numero_control: dte.numero_control,
      fec_emi: dte.fec_emi,
      receptor_nombre: rec.nombre || dte.receptor_nombre,
      receptor_tipo_documento: dte.tipo_dte === '01' ? rec.tipoDocumento : '36',
      receptor_num_documento: dte.tipo_dte === '01' ? rec.numDocumento : rec.nit,
      receptor_telefono: rec.telefono || null,
      receptor_correo: rec.correo || null,
    };

    const evento = buildEventoInvalidacion({
      ambiente: mh.ambiente || '00',
      emisor,
      dte: dteParaEvento,
      motivo: body.motivo,
      tipoAnulacion: body.tipoAnulacion,
      responsable: body.responsable,
      solicita: body.solicita,
    });

    const firmado = await firmarJWS(JSON.stringify(evento), mh.firma_privada_pem);
    const token = await mhAutenticar(mh.ambiente || '00', mh.api_user, mh.api_pwd);
    const { httpStatus, data } = await mhAnularDTE(mh.ambiente || '00', token, {
      idEnvio: Date.now(),
      documento: firmado,
    });

    if (data && data.estado === 'PROCESADO') {
      await env.DB.prepare("UPDATE dtes SET estado = 'ANULADO' WHERE id = ?").bind(dte.id).run();
      return json({ ok: true, estado: 'ANULADO', selloRecibido: data.selloRecibido, respuesta: data });
    }
    return json({ ok: false, error: 'El MH no procesó la anulación', respuesta: { httpStatus, ...data } }, 400);
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
