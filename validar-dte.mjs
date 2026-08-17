// Valida el último DTE emitido (o uno por id) contra el esquema oficial en schemas/
// Uso: node validar-dte.mjs [id]
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { createRequire } from 'module';
const Ajv = createRequire(import.meta.url)('ajv');

const SCHEMAS = { '01': 'DTE-FE-v1.json', '03': 'DTE-CCFE-v3.json', '05': 'DTE-NCE-v3.json' };

// Limpieza documentada en AGENTS.md: quitar bloques if/then viejos de municipio (CAT-013 pre-v1.1)
function limpiarSchema(schema) {
  const s = JSON.parse(JSON.stringify(schema));
  const limpiarAllOf = (arr) => arr.filter((b) => {
    const str = JSON.stringify(b);
    return !(str.includes('"municipio"') && (str.includes('"if"') || str.includes('"then"')));
  });
  const walk = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj.allOf)) {
      obj.allOf = limpiarAllOf(obj.allOf);
      if (!obj.allOf.length) delete obj.allOf;
    }
    for (const k of Object.keys(obj)) walk(obj[k]);
  };
  walk(s);
  return s;
}

const id = process.argv[2] || null;
const where = id ? `id = ${Number(id)}` : 'id = (SELECT MAX(id) FROM dtes)';
const out = execSync(
  `npx wrangler d1 execute fac2026-db --local --json --command "SELECT tipo_dte, dte_json FROM dtes WHERE ${where}"`,
  { encoding: 'utf8' }
);
const rows = JSON.parse(out)[0].results;
if (!rows.length) { console.error('No hay DTEs en la BD local'); process.exit(1); }
const { tipo_dte, dte_json } = rows[0];
const dte = JSON.parse(dte_json);

const schema = limpiarSchema(JSON.parse(readFileSync(`schemas/${SCHEMAS[tipo_dte]}`, 'utf8')));
// multipleOfPrecision: 7 — con 8, valores como 1.15 (float binario) fallan multipleOf 1e-8 por 1.49e-8
const ajv = new Ajv({ allErrors: true, multipleOfPrecision: 7, jsonPointers: true });
const validate = ajv.compile(schema);
const ok = validate(dte);
if (ok) {
  console.log(`DTE ${tipo_dte} VALIDO contra ${SCHEMAS[tipo_dte]}`);
} else {
  console.log(`DTE ${tipo_dte} INVALIDO contra ${SCHEMAS[tipo_dte]}:`);
  for (const e of validate.errors) console.log(` - ${e.dataPath || '/'} | ${e.schemaPath} | ${e.message}`);
}
process.exit(ok ? 0 : 1);
