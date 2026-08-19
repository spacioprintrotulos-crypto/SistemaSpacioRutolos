-- ============================================================
-- SISTEMA FAC2026 - Registro de Clientes Oficiales en Directorio
-- ============================================================

-- 1. DESARROLLADORA FISHER HILLS, S.A. DE C.V.
INSERT INTO clientes (tipo_documento, num_documento, nrc, nombre, nombre_comercial, cod_actividad, desc_actividad, departamento, municipio, complemento, telefono, correo, created_at, updated_at)
SELECT '36', '06142712161010', '2562100', 'DESARROLLADORA FISHER HILLS, S.A. DE C.V.', 'DESARROLLADORA FISHER HILLS, S.A. DE C.V.', '66290', 'Otras actividades auxiliares de seguros y fondos de pensiones', '06', '21', 'PSJ. 6, COL. SAN BENITO #114, SAN SALVADOR', '72873539', 'administracion@fishermanwm.com', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE num_documento = '06142712161010' OR nombre = 'DESARROLLADORA FISHER HILLS, S.A. DE C.V.');

-- 2. FONDO DE ACTIVIDADES ESPECIALES DE MEDIOS DE COMUNICACIÓN Y REPRODUCCIÓN DE LA FUERZA ARMADA
INSERT INTO clientes (tipo_documento, num_documento, nrc, nombre, nombre_comercial, cod_actividad, desc_actividad, departamento, municipio, complemento, telefono, correo, created_at, updated_at)
SELECT '36', '06140606951050', NULL, 'FONDO DE ACTIVIDADES ESPECIALES DE MEDIOS DE COMUNICACIÓN Y REPRODUCCIÓN DE LA FUERZA ARMADA', NULL, '60209', 'Programación y transmisión de radio y televisión', '06', '21', 'KM. 5 1/2 CARRETERA A SANTA TECLA, SAN SALVADOR', '70329607', 'proveedorfaemcrfa@gmail.com', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE num_documento = '06140606951050' OR nombre = 'FONDO DE ACTIVIDADES ESPECIALES DE MEDIOS DE COMUNICACIÓN Y REPRODUCCIÓN DE LA FUERZA ARMADA');

-- 3. Magica Sorpresa SV, S.A de C.V
INSERT INTO clientes (tipo_documento, num_documento, nrc, nombre, nombre_comercial, cod_actividad, desc_actividad, departamento, municipio, complemento, telefono, correo, created_at, updated_at)
SELECT '36', '06231201261213', '3789978', 'Magica Sorpresa SV, S.A de C.V', 'Magica Sorpresa SV, S.A de C.V', '96099', 'Servicios n.c.p.', '06', '21', 'Calle Escorial, Block E, Res. Escalon, #23, SAN SALVADOR', '71556934', 'magicasorpresasv@gmail.com', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE num_documento = '06231201261213' OR nombre = 'Magica Sorpresa SV, S.A de C.V');
