-- ============================================================
-- SISTEMA FAC2026 - Esquema inicial (Cloudflare D1 / SQLite)
-- Facturación Electrónica DTE - El Salvador
-- ============================================================

-- Usuarios del sistema (login de la app)
CREATE TABLE IF NOT EXISTS usuarios (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario     TEXT UNIQUE NOT NULL,
  pass_hash   TEXT NOT NULL,           -- formato: pbkdf2$iteraciones$sal$hash (base64)
  nombre      TEXT NOT NULL,
  rol         TEXT NOT NULL DEFAULT 'ADMIN',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Datos fiscales del emisor (la empresa)
CREATE TABLE IF NOT EXISTS emisor_config (
  id                  INTEGER PRIMARY KEY CHECK (id = 1),
  nit                 TEXT,
  nrc                 TEXT,
  nombre              TEXT,
  nombre_comercial    TEXT,
  cod_actividad       TEXT,
  desc_actividad      TEXT,
  tipo_establecimiento TEXT DEFAULT '01',
  departamento        TEXT,
  municipio           TEXT,
  complemento         TEXT,
  telefono            TEXT,
  correo              TEXT,
  cod_estable_mh      TEXT DEFAULT 'M001',
  cod_estable         TEXT DEFAULT 'M001',
  cod_punto_venta_mh  TEXT DEFAULT 'P001',
  cod_punto_venta     TEXT DEFAULT 'P001',
  updated_at          TEXT
);

-- Configuración de conexión con el Ministerio de Hacienda
CREATE TABLE IF NOT EXISTS mh_config (
  id                INTEGER PRIMARY KEY CHECK (id = 1),
  ambiente          TEXT NOT NULL DEFAULT '00',   -- 00 = Pruebas, 01 = Producción
  api_user          TEXT,                          -- usuario API (NIT)
  api_pwd           TEXT,                          -- contraseña API
  firma_privada_pem TEXT,                          -- llave privada PKCS8 en PEM (extraída del .crt)
  firma_activa      INTEGER NOT NULL DEFAULT 0,
  cert_subject      TEXT,
  cert_vence        TEXT,
  updated_at        TEXT
);

-- Correlativos del número de control por tipo de DTE
CREATE TABLE IF NOT EXISTS correlativos (
  tipo_dte  TEXT PRIMARY KEY,      -- 01, 03, 05
  ultimo    INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO correlativos (tipo_dte, ultimo) VALUES ('01', 0), ('03', 0), ('05', 0);

-- Clientes (receptores a quienes se factura)
CREATE TABLE IF NOT EXISTS clientes (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo_documento    TEXT,            -- CAT-022: 13 DUI, 36 NIT, 03 Pasaporte, 02 Carnet, 37 Otro (null = consumidor final)
  num_documento     TEXT,
  nrc               TEXT,
  nombre            TEXT NOT NULL,
  nombre_comercial  TEXT,
  cod_actividad     TEXT,
  desc_actividad    TEXT,
  departamento      TEXT,
  municipio         TEXT,
  complemento       TEXT,
  telefono          TEXT,
  correo            TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT
);

-- DTEs generados / transmitidos
CREATE TABLE IF NOT EXISTS dtes (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo_dte          TEXT NOT NULL,              -- 01 Factura, 03 CCF, 05 NC
  numero_control    TEXT UNIQUE NOT NULL,
  codigo_generacion TEXT UNIQUE NOT NULL,
  fec_emi           TEXT,
  hor_emi           TEXT,
  cliente_id        INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  receptor_nombre   TEXT,
  total             REAL NOT NULL DEFAULT 0,
  dte_json          TEXT NOT NULL,              -- JSON del DTE construido
  dte_firmado       TEXT,                       -- JWS compacto (RS512)
  sello_recibido    TEXT,                       -- sello de recepción del MH
  fh_procesamiento  TEXT,
  estado            TEXT NOT NULL DEFAULT 'SIMULADO',  -- SIMULADO | PROCESADO | RECHAZADO | ANULADO
  observaciones     TEXT,                       -- JSON array
  respuesta_mh      TEXT,                       -- JSON completo de respuesta del MH
  dte_relacionado   TEXT,                       -- codigoGeneracion del documento original (NC)
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dtes_tipo ON dtes (tipo_dte, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dtes_estado ON dtes (estado);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes (nombre);

-- Config interna de la app (secreto de sesiones, etc.)
CREATE TABLE IF NOT EXISTS app_config (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);
