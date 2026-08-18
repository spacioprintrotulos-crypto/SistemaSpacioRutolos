-- Perfiles MH independientes para Pruebas (00) y Producción (01).
-- Conserva la configuración previa en el perfil que estaba activo.
CREATE TABLE IF NOT EXISTS mh_perfiles (
  ambiente          TEXT PRIMARY KEY CHECK (ambiente IN ('00', '01')),
  api_user          TEXT,
  api_pwd           TEXT,
  firma_privada_pem TEXT,
  firma_activa      INTEGER NOT NULL DEFAULT 0,
  cert_subject      TEXT,
  cert_vence        TEXT,
  updated_at        TEXT
);

INSERT OR IGNORE INTO mh_perfiles (
  ambiente, api_user, api_pwd, firma_privada_pem, firma_activa,
  cert_subject, cert_vence, updated_at
)
SELECT ambiente, api_user, api_pwd, firma_privada_pem, firma_activa,
       cert_subject, cert_vence, updated_at
FROM mh_config
WHERE id = 1;

INSERT OR IGNORE INTO app_config (clave, valor)
VALUES ('mh_ambiente_activo', COALESCE((SELECT ambiente FROM mh_config WHERE id = 1), '00'));
