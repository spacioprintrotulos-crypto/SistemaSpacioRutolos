-- ============================================================
-- SISTEMA FAC2026 - Módulo de Cotizaciones Spacio
-- ============================================================

CREATE TABLE IF NOT EXISTS cotizaciones (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  correlativo         TEXT UNIQUE NOT NULL,
  fecha               TEXT NOT NULL,
  cliente_nombre      TEXT NOT NULL,
  telefono            TEXT,
  dias_entrega        INTEGER DEFAULT 1,
  condiciones_pago    TEXT DEFAULT 'Contra entrega',
  notas               TEXT,
  items_json          TEXT NOT NULL,
  subtotal            REAL NOT NULL,
  iva                 REAL NOT NULL,
  total               REAL NOT NULL,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO correlativos (tipo_dte, ultimo) VALUES ('COT', 10);

-- Migración inicial de cotizaciones existentes
INSERT OR IGNORE INTO cotizaciones (id, correlativo, fecha, cliente_nombre, telefono, dias_entrega, condiciones_pago, notas, items_json, subtotal, iva, total, created_at)
VALUES 
  (1, '0001', '2026-05-11', 'FAEMCRFA', '63053974', 3, '50% Anticipo y 50% Contra Entrega', '', '[{"quantity":5,"description":"Cartel de bienvenida 45x60 cms, vinil sobre lamina en PVC","price":10}]', 50.0, 6.5, 56.5, '2026-05-11T00:00:00.000Z'),
  (2, '0002', '2026-05-11', 'Carlos Melgar', '+50377874317', 4, 'Credito 30 Dias', '', '[{"quantity":1,"description":"CUADRO ARTISTICO PINTADO CON TECNICA ACRILICA Y MIXTA CON OLEO DE 0.60X 0.80 CM.","price":175},{"quantity":2,"description":"CUADRO ARTISTICO PINTADO CON TECNICA ACRILICA Y MIXTA CON OLEO DE 0.80X 1.00 MTS.","price":250}]', 675.0, 87.75, 762.75, '2026-05-11T17:00:51.399Z'),
  (3, '0003', '2026-05-11', 'Carlos Melgar', '+50377874317', 4, 'Credito 30 Dias', '', '[{"quantity":1,"description":"CUADRO ARTISTICO PINTADO CON TECNICA ACRILICA Y MIXTA CON OLEO DE 0.80X 1.00 MTS.","price":250}]', 250.0, 32.5, 282.5, '2026-05-11T17:10:07.675Z'),
  (4, '0004', '2026-06-23', 'FAEMCRFA', '63053974', 1, 'Contra entrega', '', '[{"quantity":1,"description":"Marca shjd","price":12}]', 12.0, 1.56, 13.56, '2026-06-23T14:30:11.243Z'),
  (5, '0005', '2026-06-23', 'Carlos Melgar', '+50377874317', 1, 'Contra entrega', '', '[{"quantity":1,"description":"JODARE","price":125}]', 125.0, 16.25, 141.25, '2026-06-23T14:36:55.453Z'),
  (6, '0006', '2026-06-23', 'Carlos Melgar', '+50377874317', 1, 'Contra entrega', 'Esta nota se agrega', '[{"quantity":1,"description":"Barcos","price":78}]', 78.0, 10.14, 88.14, '2026-06-23T15:03:13.161Z'),
  (7, '0007', '2026-07-08', 'Cotre Suprema de Justicia', '+503 6111 1900', 2, 'Contra entrega', 'No incluye instalación', '[{"quantity":2,"description":"Rótulos en lámina PVC de 5 mm de 1x0.50 mts Laminado","price":25},{"quantity":1,"description":"Servicio de envío","price":5}]', 55.0, 7.15, 62.15, '2026-07-08T21:53:35.047Z'),
  (8, '0008', '2026-07-17', 'FAEMCRFA', '63053974', 1, 'Contra entrega', 'dsds', '[{"quantity":1,"description":"sDsdsadsdasdsadjdhsakjdjksadkjhsakjdhsakhdkjashdkjhaskjdhlaskhdkjsahdkjhsakjdh","price":20}]', 20.0, 2.6, 22.6, '2026-07-17T23:42:42.245Z'),
  (9, '0009', '2026-07-17', 'Carlos Melgar', '+50377874317', 1, 'Contra entrega', '', '[{"quantity":1,"description":"Mil cuatrocientos 30 km de Ida","price":12}]', 12.0, 1.56, 13.56, '2026-07-17T23:44:39.234Z'),
  (10, '0010', '2026-07-22', 'FAEMCRFA', '63053974', 2, 'Contra entrega', '', '[{"quantity":1,"description":"Rótulo lámina pvc de 2.40x0.20 mts con laminado","price":25}]', 25.0, 3.25, 28.25, '2026-07-22T21:19:50.753Z');
