-- ============================================================
-- SISTEMA FAC2026 - Módulo de Cotizaciones Spacio
-- Migración 0005: Columna aplica_iva para habilitar/deshabilitar IVA
-- ============================================================

ALTER TABLE cotizaciones ADD COLUMN aplica_iva INTEGER DEFAULT 1;

