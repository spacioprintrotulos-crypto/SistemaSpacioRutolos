# Regla del Auditor de Calidad y Solución de Errores

## Propósito
Garantizar que ninguna modificación, función, estilo o componente sea entregado al usuario con errores de sintaxis, fallas de cálculo, inconsistencias tributarias DTE o desbordamientos visuales.

---

## 🔍 Checklist Obligatorio de Auditoría

### 1. Integridad de Código y Sintaxis
- [ ] Ejecutar `node -c public/js/app.js`
- [ ] Ejecutar `node -c public/js/dte-visual.js`
- [ ] Ejecutar `node -c functions/api/_lib/dte.js`
- [ ] Asegurar que no existan variables no declaradas o referencias rotas.

### 2. Estándar de DTE y Ministerio de Hacienda (MH SV)
- [ ] **Factura 01**: Ítems con `tributos: null`, `ivaItem` calculado al 13%, resumen con `totalIva`.
- [ ] **CCF 03**: Ítems con `tributos: ["20"]`, emisor con códigos de establecimiento (`codEstableMH`), resumen con `saldoFavor`.
- [ ] **Nota de Crédito 05**: `documentoRelacionado` presente y válido (`03` o `07`), ítems con `montoDescu`, resumen con `reteRenta`.
- [ ] **Evento de Invalidación**: `motivo.tipoAnulacion` presente (CAT-024) y receptor con `telefono`/`correo`.
- [ ] Validación con esquema: Si se modifican builders, ejecutar `node validar-dte.mjs`.

### 3. Sistema Visual y Diseño
- [ ] Tarjetas con esquinas redondeadas (`border-radius: 24px` a `26px`).
- [ ] Botones en estilo píldora (`border-radius: 50px`).
- [ ] Inputs y selects con esquinas redondeadas (`border-radius: 14px`) y aro de enfoque suave (`#10b981`).
- [ ] Paleta armónica corporativa (Verde Esmeralda `#059669`/`#10b981`, Azul Real `#0d47c9`, Cyan `#0284c7`, Pizarra `#334155`).
- [ ] Comprobantes PDF: Renderizado exacto de 1 hoja carta Letter (`740px` a `750px`), sin márgenes descentrados ni páginas blancas extra.
- [ ] Soporte completo para Modo Oscuro (`[data-theme="dark"]`).

### 4. Ciclo de Auto-Recuperación
- Si se encuentra un error durante la auditoría:
  1. Identificar la causa raíz con `view_file` o herramientas de diagnóstico.
  2. Aplicar la solución con `replace_file_content` o `write_to_file`.
  3. Re-ejecutar el checklist completo de auditoría.
  4. Repetir hasta alcanzar 100% de cumplimiento.
