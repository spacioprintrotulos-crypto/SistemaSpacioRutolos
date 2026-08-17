# AGENTS.md — Guía para agentes de IA

## Comandos
- Windows/PowerShell: **siempre `npm.cmd`**, nunca `npm` (npm.ps1 está bloqueado por la política de ejecución).
- Servidor local: `npm.cmd run dev` (sirve `public/` + Functions en http://localhost:8788).
- Migraciones locales: `npm.cmd run migrate:local`. Remotas: `npm.cmd run migrate`.
- Despliegue: `npm.cmd run deploy` (Cloudflare Pages). El `database_id` real está en `wrangler.toml`.
- Para validar un DTE contra el esquema oficial, ver notas en `schemas/` y el flujo descrito abajo.

## Estructura
- `public/js/app.js` — SPA: router por hash + vistas (login, menú, emisión, clientes, DTEs, configuración).
- `public/js/api.js` — cliente fetch (`API.get/post/put/del`), enrutado a `/api/...`.
- `functions/api/` — Cloudflare Pages Functions:
  - `_middleware.js` aplica a TODO `/api/*`: lee cookie `fac2026_session`, verifica con `verifySession`; rutas públicas: solo `/api/auth/login`.
  - `_lib/dte.js` — builders `buildFactura`/`buildCCF`/`buildNotaCredito` (`BUILDERS`), `buildEventoInvalidacion`, `numeroALetras`, `r2`.
  - `_lib/crypto.js` — PBKDF2 (100k), HMAC sesión, `firmarJWS` (RS512/WebCrypto), `uuidUpper`.
  - `_lib/db.js` — `ensureSeed` (admin/fac2026), `getEmisor`, `getMHConfig`, `nextCorrelativo`/`setCorrelativo`.
  - `_lib/mh.js` — `mhAutenticar`, `mhRecepcionDTE`, `mhAnularDTE` (ambientes `00` test / `01` prod).
- `migrations/0001_init.sql` — tablas: usuarios, emisor_config, mh_config, correlativos, clientes, dtes, app_config.
- `public/data/catalogos.json` — catálogos oficiales; se regenera con `node scripts/generar_catalogos.mjs` (lee `scripts/data/l10n_sv.actividad_economica.csv`, UTF-8).

## Convenciones críticas de DTE (validado contra esquemas oficiales y contra el MH en vivo, ambiente 00)
- **NIT/NRC/docus**: solo dígitos. `digits()` en `dte.js` los normaliza.
- **CAT-013 v1.1** (44 municipios): San Salvador `20/21/22/23/24`, La Libertad `23-28`, etc. No usar los rangos viejos.
- **Todos los ítems** (01/03/05) llevan `numeroDocumento` (null si no aplica): el MH lo exige presente aunque el esquema local no.
- **Factura 01**: `tributos` del ítem = `null` (el 13% va en `ivaItem`); resumen con `totalIva`; `tributos:null`.
- **CCF 03**: ítems llevan `tributos:["20"]`; `extension` incluye `placaVehiculo` (null si no aplica); emisor REQUIERE `codEstableMH/codEstable/codPuntoVentaMH/codPuntoVenta`; resumen REQUIERE `saldoFavor`.
- **NC 05**: emisor SIN códigos de establecimiento; `extension` SIN `placaVehiculo`; `documentoRelacionado` obligatorio y su `tipoDocumento` solo admite `"03"|"07"` (la NC no aplica a facturas 01); ítems SÍ llevan `montoDescu` (lo exige el MH en vivo); resumen REQUIERE `reteRenta` (el esquema local NCE-v3 no lo tiene aún).
- **Evento de invalidación**: `motivo.tipoAnulacion` (CAT-024, enum 1-3; por defecto 2) y `documento.telefono`/`documento.correo` (del receptor) son obligatorios ante el MH aunque el esquema local no los marque required.
- El emisor debe coincidir con la ficha del portal MH (codActividad, dirección, teléfono, correo) o rechaza con `[emisor.X] NO CORRESPONDE A CONTRIBUYENTE`. Receptor de CCF/NC debe ser un NIT registrado en el ambiente (`NIT CONTRIBUYENTE NO EXISTE` si no).
- **pagos** crédito: `periodo` = número, `plazo` = `"01"|"02"|"03"` (CAT-018: días/meses/años). `montoPago` 0 → el backend usa `totalPagar`.
- `extension` es SIEMPRE objeto (nunca `null`).
- La firma se hace sobre `JSON.stringify(dte)` (sin espacios). `codigoGeneracion` en mayúsculas.
- JWS: header `{"alg":"RS512","typ":"JWT"}`, separador `.`, carga útil = DTE JSON.

## Flujo de emisión (endpoint `POST /api/dtes/emitir`)
1. Valida `tipoDte`, receptor, ítems (y `docRelacionado` para NC).
2. `getEmisor` (requiere NIT) + `getMHConfig`.
3. `nextCorrelativo(tipoDte)` → `BUILDERS[tipoDte](...)` → `dte` + `total`.
4. Si `mh.firma_activa && api_user && api_pwd`: `firmarJWS` → `mhAutenticar` → `mhRecepcionDTE`.
   - `PROCESADO` → estado `PROCESADO`, guarda `selloRecibido`; si no → `RECHAZADO` con `observaciones`.
5. Sin credenciales → estado `SIMULADO` (no transmite).
6. Inserta en `dtes` con `dte_json` (y `dte_firmado` si aplica).

## Estados de `dtes`
`SIMULADO`, `PROCESADO`, `RECHAZADO`, `ERROR`, `ANULADO`.

## Pruebas rápidas (curl)
```powershell
# Login (guarda cookie en cookies.txt)
curl.exe -s -c cookies.txt -H "Content-Type: application/json" -d '{"usuario":"admin","clave":"fac2026"}' http://127.0.0.1:8788/api/auth/login
# Emitir factura simulada
curl.exe -s -b cookies.txt -H "Content-Type: application/json" -d '{...}' http://127.0.0.1:8788/api/dtes/emitir
```
Nota: PowerShell 5.1 (`Invoke-RestMethod`) falla con el server local ("protocol violation") → usar `curl.exe`.

## Estado de ambientes (2026-08-17)
- **Local** (`.wrangler` D1): ambiente `00` (apitest) — para desarrollo/pruebas sin riesgo fiscal.
- **Remota** (Cloudflare D1 `fac2026-db`): ambiente `01` (producción). Emisor `nit = 12012608691018` (NIT real; el DUI `016419144` es solo login alterno — el token JWT lo confirma: `c_nit` vs `c_dui`). Certificado de firma de producción cargado en `mh_config.firma_privada_pem` (sujeto "Spacio Rotulos", vence 2030-07-02, del XML `Certificado_12012608691018.crt`).
- La clave API de cada ambiente vive solo en D1 (`mh_config.api_pwd`), nunca en el repo.
- Sitio desplegado: https://sistema-fac2026-26c.pages.dev (Pages project `sistema-fac2026`).

## Reglas
- No usar emojis en archivos. No exponer secretos. `*.pem`/`*.crt`/`secrets/` en `.gitignore`.
- NO hacer commit salvo que el usuario lo pida explícitamente.
- Si se cambia un esquema DTE, revalidar contra `schemas/DTE-*.json` con `node validar-dte.mjs [id]` (ajv@6, `multipleOfPrecision: 7` — con 8 falla por flotantes como 1.15 — y eliminando los bloques `if/then` viejos de municipio del CAT-013 pre-v1.1). Ojo: el esquema local puede ir por detrás del MH en vivo; la respuesta del MH es la autoridad final.