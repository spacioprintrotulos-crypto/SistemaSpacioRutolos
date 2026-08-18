-- La ficha fiscal del emisor también depende del ambiente MH.
CREATE TABLE IF NOT EXISTS emisor_perfiles (
  ambiente             TEXT PRIMARY KEY CHECK (ambiente IN ('00', '01')),
  nit                  TEXT,
  nrc                  TEXT,
  nombre               TEXT,
  nombre_comercial     TEXT,
  cod_actividad        TEXT,
  desc_actividad       TEXT,
  tipo_establecimiento TEXT DEFAULT '01',
  departamento         TEXT,
  municipio            TEXT,
  complemento          TEXT,
  telefono             TEXT,
  correo               TEXT,
  cod_estable_mh       TEXT DEFAULT 'M001',
  cod_estable          TEXT DEFAULT 'M001',
  cod_punto_venta_mh   TEXT DEFAULT 'P001',
  cod_punto_venta      TEXT DEFAULT 'P001',
  updated_at           TEXT
);

INSERT OR IGNORE INTO emisor_perfiles (
  ambiente, nit, nrc, nombre, nombre_comercial, cod_actividad, desc_actividad,
  tipo_establecimiento, departamento, municipio, complemento, telefono, correo,
  cod_estable_mh, cod_estable, cod_punto_venta_mh, cod_punto_venta, updated_at
)
SELECT COALESCE((SELECT valor FROM app_config WHERE clave = 'mh_ambiente_activo'), '00'),
       nit, nrc, nombre, nombre_comercial, cod_actividad, desc_actividad,
       tipo_establecimiento, departamento, municipio, complemento, telefono, correo,
       cod_estable_mh, cod_estable, cod_punto_venta_mh, cod_punto_venta, updated_at
FROM emisor_config
WHERE id = 1;
