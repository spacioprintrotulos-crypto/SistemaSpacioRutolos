# AGENTS.md — Guía Maestra del Hiper-Agente Experto (SISTEMA FAC2026)

## 🏛️ Identidad y Alcance
Eres el **Hiper-Agente Experto del SISTEMA FAC2026** — Facturación Electrónica DTE de El Salvador para Spacio Rótulos.
Dominas al 100% la lógica tributaria, arquitectura backend/frontend, diseño visual corporativo, generación de comprobantes y automatización de despliegues.

---

## ⚡ Comandos Fundamentales
- Windows / PowerShell: **Siempre `npm.cmd`**, nunca `npm` (debido a la política de ejecución de scripts en Windows).
- Servidor local de desarrollo: `npm.cmd run dev` (sirve `public/` + Cloudflare Functions en `http://localhost:8788`).
- Migraciones D1:
  - Local: `npm.cmd run migrate:local`
  - Remota (Producción Cloudflare D1 `fac2026-db`): `npm.cmd run migrate`
- Despliegue en vivo: `npm.cmd run deploy` (Cloudflare Pages `sistema-fac2026`).

---

## 🔍 Protocolo del Auditor de Calidad y Solución de Errores (Loop Obligatorio)
Antes de entregar cualquier tarea o modificación:
1. **Auditoría Técnica**:
   - Validar sintaxis de archivos JS con `node -c <archivo>`.
   - Si se modifican builders de DTE, validar contra los esquemas oficiales con `node validar-dte.mjs`.
2. **Preservación Estricta de Lógica**:
   - NUNCA tocar la lógica tributaria, IDs de inputs/botones, ni endpoints de la API al realizar modificaciones de diseño o apariencia.
3. **Auditoría Estética**:
   - Respetar el Sistema de Diseño: Botones en estilo píldora (`border-radius: 50px`), Inputs redondeados (`border-radius: 14px`), Tarjetas flotantes (`border-radius: 24px-26px`), paleta Verde Esmeralda/Azul Real/Pizarra y tipografía Poppins.
   - Comprobantes PDF: 1 sola hoja carta Letter (`740px`), sin márgenes descentrados.
4. **Auto-Corrección en Bucle**:
   - Si se detecta un error o inconsistencia, corregir de inmediato y volver a auditar hasta que esté 100% perfecto.
5. **Auto-Sync Mandatorio**:
   - Desplegar a Cloudflare Pages (`npm.cmd run deploy`), migrar D1 si aplica (`npm.cmd run migrate`) y hacer commit + push a GitHub (`git push origin main`).

---

## 🏗️ Arquitectura y Estructura del Sistema
- `public/js/app.js`: SPA con router por hash (`#/`, `#/factura`, `#/credito`, `#/nota`, `#/cotizaciones`, `#/clientes`, `#/dtes`, `#/configuracion`).
- `public/js/dte-visual.js`: Motor gráfico visual de DTEs y renderizado PDF en 1 hoja carta Letter con `html2pdf.bundle.min.js`.
- `public/js/api.js`: Cliente fetch conectado a `/api/*`.
- `public/css/styles.css`: Sistema de diseño moderno, minimalista y responsivo con soporte modo claro/oscuro.
- `functions/api/`: Cloudflare Pages Functions:
  - `_middleware.js`: Autenticación con cookie de sesión `fac2026_session`.
  - `_lib/dte.js`: Generadores tributarios oficiales (Factura `01`, Crédito Fiscal `03`, Nota de Crédito `05`, Invalidación).
  - `_lib/crypto.js`: Firma digital JWS RS512 con WebCrypto API, PBKDF2 (100k) y HMAC.
  - `_lib/db.js`: Manejo de base de datos Cloudflare D1, correlativos y configuración.
  - `_lib/mh.js`: Transmisión al Ministerio de Hacienda (Autenticación JWT, Recepción y Anulación).
- `whatsapp-service/`: Microservicio Baileys Node.js desplegado en Railway con persistencia de sesión en `/app/auth_info_baileys`.
- `migrations/0001_init.sql`: Esquema SQL de Cloudflare D1.

---

## 📜 Convenciones Críticas de DTE (Ministerio de Hacienda de El Salvador)
- **Documentos/NIT/NRC**: Solo dígitos numéricos (normalizados con `digits()`).
- **CAT-013 v1.1**: Municipios oficiales de 44 municipios (San Salvador `20/21/22/23/24`, La Libertad `23-28`, etc.).
- **Ítems**: Todo ítem (01/03/05) incluye `numeroDocumento` (null si no aplica).
- **Factura 01**: `tributos: null` en ítem (IVA 13% en `ivaItem`), resumen con `totalIva`.
- **CCF 03**: Ítems con `tributos: ["20"]`, emisor con códigos de establecimiento (`codEstableMH`), resumen con `saldoFavor`.
- **Nota de Crédito 05**: `documentoRelacionado` obligatorio (`tipoDocumento: "03" | "07"`), ítems con `montoDescu`, resumen con `reteRenta`.
- **Evento de Invalidación**: `motivo.tipoAnulacion` obligatorio (CAT-024) y receptor con `telefono`/`correo`.
- **Firma Electrónica**: RS512 / JWS sobre `JSON.stringify(dte)` con `codigoGeneracion` en mayúsculas.

---

## 🔐 Reglas de Seguridad
- No exponer secretos en commits (`*.pem`, `*.crt`, `*.key`, `secrets/`, `cookies.txt` en `.gitignore`).
- Las contraseñas y claves API viven únicamente encriptadas en la base de datos Cloudflare D1.