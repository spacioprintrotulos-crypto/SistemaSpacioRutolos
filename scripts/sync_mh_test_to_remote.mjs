// Sincroniza las credenciales y certificado de pruebas (00) de local a remoto D1
import { execSync } from 'child_process';

const outLocal = execSync(
  `npx wrangler d1 execute fac2026-db --local --json --command "SELECT * FROM mh_perfiles WHERE ambiente = '00'"`,
  { encoding: 'utf8' }
);
const localPerfil = JSON.parse(outLocal)[0].results[0];

if (!localPerfil || !localPerfil.firma_privada_pem) {
  console.error('No hay certificado de pruebas en local D1');
  process.exit(1);
}

console.log('Certificado de pruebas local:', localPerfil.cert_subject, localPerfil.cert_vence);

// Escapar comillas para SQL
const pemEscaped = localPerfil.firma_privada_pem.replace(/'/g, "''");
const apiPwdEscaped = (localPerfil.api_pwd || '').replace(/'/g, "''");
const apiUserEscaped = (localPerfil.api_user || '').replace(/'/g, "''");
const subjectEscaped = (localPerfil.cert_subject || '').replace(/'/g, "''");
const venceEscaped = (localPerfil.cert_vence || '').replace(/'/g, "''");

const sql = `
  INSERT INTO mh_perfiles (ambiente, api_user, api_pwd, firma_privada_pem, firma_activa, cert_subject, cert_vence, updated_at)
  VALUES ('00', '${apiUserEscaped}', '${apiPwdEscaped}', '${pemEscaped}', 1, '${subjectEscaped}', '${venceEscaped}', datetime('now'))
  ON CONFLICT(ambiente) DO UPDATE SET
    api_user = excluded.api_user,
    api_pwd = excluded.api_pwd,
    firma_privada_pem = excluded.firma_privada_pem,
    firma_activa = 1,
    cert_subject = excluded.cert_subject,
    cert_vence = excluded.cert_vence,
    updated_at = excluded.updated_at;
`;

const res = execSync(
  `npx wrangler d1 execute fac2026-db --remote --command "${sql.replace(/\r?\n/g, ' ')}"`,
  { encoding: 'utf8' }
);
console.log('Resultado en D1 remoto:\n', res);
