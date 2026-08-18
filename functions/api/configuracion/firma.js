// POST /api/configuracion/firma
// Recibe el certificado de firma del MH en uno de dos formatos:
//  - Archivo .crt XML entregado por el MH (contiene privateKey + certificado descompuesto)
//  - Archivo PKCS#12 tradicional (.p12/.pfx)
// Guarda la llave privada como PEM PKCS8 y los datos de visualización.
import { json } from '../_middleware.js';
import { getMHAmbienteActivo } from '../_lib/db.js';
import forge from 'node-forge';

function decodeB64(str) {
  const clean = str.replace(/\s+/g, '');
  return forge.util.decode64(clean);
}

function derToPemPkcs8(der) {
  const asn1 = forge.asn1.fromDer(der);
  return forge.pki.privateKeyInfoToPem(asn1);
}

function parseXmlTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`, 's'));
  return m ? m[1].trim() : '';
}

function parseMhXml(xml) {
  // Llave privada PKCS8 en base64 dentro de <privateKey><encodied>
  const privateKeyXml = parseXmlTag(xml, 'privateKey');
  const encodied = parseXmlTag(privateKeyXml, 'encodied');
  if (!encodied) throw new Error('No se encontró la llave privada en el certificado MH');
  const der = decodeB64(encodied);
  const pem = derToPemPkcs8(der);

  // Subject: preferir commonName del subject, luego organizationName
  const subjectXml = parseXmlTag(xml, 'subject');
  const cn = parseXmlTag(subjectXml, 'commonName') || parseXmlTag(subjectXml, 'organizationName') || 'Emisor';

  // Fecha de vencimiento
  const validityXml = parseXmlTag(xml, 'validity');
  const notAfter = parseXmlTag(validityXml, 'notAfter');
  let vence = null;
  if (notAfter) {
    const ts = parseFloat(notAfter) * 1000;
    if (!isNaN(ts)) vence = new Date(ts).toISOString().slice(0, 10);
  }

  return { pem, subject: cn, vence };
}

function parseP12(der, password) {
  const asn1 = forge.asn1.fromDer(der);
  let p12;
  try {
    p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password);
  } catch {
    throw new Error('No se pudo abrir el certificado: contraseña incorrecta o archivo inválido');
  }

  let keyBag = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag];
  if (!keyBag || !keyBag.length) {
    keyBag = p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag];
  }
  if (!keyBag || !keyBag.length) {
    throw new Error('El certificado no contiene una llave privada');
  }
  const llave = keyBag[0].key;
  const pem = forge.pki.privateKeyInfoToPem(
    forge.pki.wrapRsaPrivateKey(forge.pki.privateKeyToAsn1(llave))
  );

  let subject = null, vence = null;
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];
  if (certBags && certBags.length && certBags[0].cert) {
    const cert = certBags[0].cert;
    const cn = cert.subject.getField('CN');
    subject = cn ? cn.value : cert.subject.attributes.map((a) => a.value).join(', ');
    vence = cert.validity.notAfter.toISOString().slice(0, 10);
  }
  return { pem, subject, vence };
}

export async function onRequestPost({ request, env }) {
  try {
    const { archivoB64, password, ambiente: ambienteSolicitado } = await request.json();
    if (!archivoB64 || !password) {
      return json({ ok: false, error: 'Archivo de certificado y contraseña son requeridos' }, 400);
    }

    const raw = atob(archivoB64);
    let result;
    if (raw.trim().startsWith('<CertificadoMH>')) {
      // Certificado entregado por el portal del MH (XML con llave privada PKCS8)
      result = parseMhXml(raw);
    } else {
      // PKCS#12 tradicional
      const der = forge.util.decode64(archivoB64);
      result = parseP12(der, password);
    }

    const { pem, subject, vence } = result;

    const ambiente = ambienteSolicitado === '01' ? '01' : ambienteSolicitado === '00' ? '00' : await getMHAmbienteActivo(env.DB);
    await env.DB.prepare(
      `INSERT INTO mh_perfiles (ambiente, firma_privada_pem, firma_activa, cert_subject, cert_vence, updated_at)
       VALUES (?, ?, 1, ?, ?, datetime('now'))
       ON CONFLICT(ambiente) DO UPDATE SET firma_privada_pem=excluded.firma_privada_pem,
         firma_activa=1, cert_subject=excluded.cert_subject, cert_vence=excluded.cert_vence,
         updated_at=excluded.updated_at`
    ).bind(ambiente, pem, subject, vence).run();

    return json({ ok: true, cert_subject: subject, cert_vence: vence });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}

// DELETE /api/configuracion/firma → quitar certificado
export async function onRequestDelete({ request, env }) {
  const solicitado = new URL(request.url).searchParams.get('ambiente');
  const ambiente = solicitado === '01' ? '01' : solicitado === '00' ? '00' : await getMHAmbienteActivo(env.DB);
  await env.DB.prepare(
    'UPDATE mh_perfiles SET firma_privada_pem = NULL, firma_activa = 0, cert_subject = NULL, cert_vence = NULL WHERE ambiente = ?'
  ).bind(ambiente).run();
  return json({ ok: true });
}
