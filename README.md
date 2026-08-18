# SISTEMA FAC2026 — Facturación Electrónica DTE

Sistema web de facturación electrónica para **El Salvador**, conectado al
Ministerio de Hacienda (MH) a través del API de Documentos Tributarios
Electrónicos (DTE). Corre 100% en **Cloudflare Pages + Functions + D1**.

## Documentos soportados

| Código | Documento | Esquema oficial |
| ------ | --------- | --------------- |
| `01` | Factura (precios con IVA incluido) | DTE-FE-v1 |
| `03` | Comprobante de Crédito Fiscal | DTE-CCFE-v3 |
| `05` | Nota de Crédito (sobre DTE 01/03) | DTE-NCE-v3 |

También genera el **Evento de Invalidación v2** para anular DTEs ya procesados.

## Funcionalidades

- Login con sesión por cookie firmada (HMAC-SHA256), usuario inicial `admin` / `fac2026`.
- Menú principal con acceso a cada tipo de documento, clientes, historial y configuración.
- Formularios de emisión con ítems dinámicos (gravada / exenta / no sujeta),
  condición de operación (contado / crédito / anticipos), forma de pago,
  retenciones (IVA 1%, renta), percepción y extensión de entrega/recepción.
- Generación de `numeroControl` (DTE-XX-MMMMPPPP-000000000000000) y
  `codigoGeneracion` (UUID v4) con correlativos automáticos por tipo de DTE.
- Firma **JWS RS512** con el certificado electrónico del MH (archivo `.crt`
  PKCS#12, se importa con node-forge y se guarda como PEM PKCS8).
- Transmisión al MH (`/fesv/recepciondte`) y anulación (`/fesv/anulardte`).
- **Modo SIMULADO**: sin credenciales/firma configuradas genera el DTE sin transmitir.
- Gestión de clientes (receptores) con catálogos oficiales.
- Historial de DTEs emitidos con consulta del JSON completo y descarga.

## Arquitectura

```
public/                  # Frontend SPA (estático)
  index.html
  css/styles.css
  js/api.js              # Cliente fetch de la API
  js/app.js              # Router + vistas
  data/catalogos.json    # Catálogos oficiales MH (CAT-013 v1.1, CAT-019, ...)
functions/api/           # Cloudflare Pages Functions (backend)
  _middleware.js         # Sesión + JSON helpers
  _lib/
    crypto.js            # PBKDF2, HMAC sesión, JWS RS512, UUID
    db.js                # Semillas, correlativos, acceso a config
    dte.js               # Builders Factura/CCF/NC + evento invalidación
    mh.js                # Cliente API del Ministerio de Hacienda
  auth/                  # login, logout, session
  clientes/              # CRUD de clientes
  dtes/                  # emitir, listar, detalle, anular
  configuracion/         # emisor, credenciales MH, firma
migrations/0001_init.sql # Esquema D1
schemas/                 # Esquemas JSON oficiales del MH (referencia/validación)
scripts/
  generar_catalogos.mjs  # Regenera catalogos.json desde scripts/data/
```

## Requisitos

- Node.js 18+ y cuenta de Cloudflare con `wrangler` autenticado.
- Certificado de firma electrónica del MH (`*.crt`, PKCS#12) y credenciales del
  portal DTE (usuario = NIT, contraseña).

## Puesta en marcha

```bash
npm install

# 1. Crear la base D1 y copiar el database_id a wrangler.toml
npx wrangler d1 create fac2026-db

# 2. Aplicar migraciones en local
npm run migrate:local

# 3. Servidor de desarrollo (http://localhost:8788)
npm run dev
```

> En Windows, si `npm.ps1` está bloqueado por la política de ejecución, use `npm.cmd`.

### Producción

```bash
npm run migrate   # aplica migraciones en la DB remota
npm run deploy    # publica en Cloudflare Pages
```

O desde el dashboard de Cloudflare Pages, conectando el repositorio de GitHub
(comando de build vacío, directorio de salida `public`, binding D1 `DB`).

## Configuración inicial

1. Inicie sesión con `admin` / `fac2026`.
2. En **Configuración**: cargue los datos del emisor (NIT, NRC, actividad CAT-019,
   dirección, códigos de establecimiento y punto de venta).
3. Configure cada perfil de **ambiente** (Pruebas `00` y Producción `01`) con sus propias credenciales de **aplicación/API** MH, ficha del emisor y certificado. No use la clave de acceso al portal web del MH: el equipo de Facturación Electrónica entrega una clave API independiente. El botón **Probar conexión** valida las credenciales sin guardarlas ni emitir un DTE.
4. Use **Guardar y activar ambiente** solo después de una prueba exitosa. La emisión siempre usa el perfil activo.
5. Si desea, ajuste los **correlativos** iniciales por tipo de DTE.

Sin paso 4 (o sin credenciales), la emisión funciona en **modo SIMULADO**.

## Notas técnicas importantes

- **CAT-013 v1.1 (nov-2024)**: los municipios usan el esquema de 44 municipios
  (p. ej. San Salvador = `20` Norte, `21` Centro, `22` Sur, `23` Oeste, `24` Este).
  Los esquemas JSON descargados de terceros pueden traer los rangos antiguos
  (262 municipios); al transmitir, manda el MH con los códigos v1.1 de `catalogos.json`.
- **NIT / NRC**: se normalizan eliminando guiones (el esquema exige solo dígitos,
  NIT = 14 dígitos, DUI = 9).
- **Factura**: precios incluyen IVA; el 13% se desagrega en `ivaItem` y `resumen.totalIva`.
  `tributos` del ítem NO lleva `"20"` (solo tributos adicionales).
- **CCF**: precios sin IVA; el 13% va en `resumen.tributos` y como `"20"` en cada ítem;
  `extension` requiere `observaciones` y `placaVehiculo` (va `null` si no aplica);
  `emisor` requiere los códigos de establecimiento.
- **NC**: no admite `codEstableMH`/`codPuntoVentaMH` en emisor ni `placaVehiculo`
  en extension; requiere `documentoRelacionado` con el `codigoGeneracion` del original.
- **pagos** (crédito): `periodo` = número (p. ej. 30) y `plazo` = unidad CAT-018
  (`01` Días, `02` Meses, `03` Años).
- **idEnvio**: entero ≥ 1 (se usa `Date.now()`).

## Seguridad

- La contraseña se guarda con PBKDF2 (100 000 iteraciones).
- La sesión es una cookie `HttpOnly` firmada con HMAC-SHA256.
- La llave privada del certificado y las credenciales MH viven en `mh_config` de D1.
- `*.pem`, `*.crt` y `secrets/` están en `.gitignore` (nunca subirlos a GitHub).

## Scripts

| Script             | Descripción                                        |
| ------------------ | -------------------------------------------------- |
| `npm run dev`      | Servidor local de Pages (wrangler)                 |
| `npm run migrate:local` | Aplica migraciones en la D1 local             |
| `npm run migrate`  | Aplica migraciones en la D1 remota                 |
| `npm run deploy`   | Publica `public/` en Cloudflare Pages              |

## Fuentes oficiales

- Normativa DTE y catálogos: <https://factura.gob.sv>
- API de transmisión (pruebas): `https://apitest.dtes.mh.gob.sv`
- API de transmisión (producción): `https://api.dtes.mh.gob.sv`
- Esquemas JSON: repositorio `herson/dte-json-schemas` (ver `schemas/`)
