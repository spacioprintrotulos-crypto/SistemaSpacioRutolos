---
name: auditor-calidad
description: >-
  Protocolo de auditoría técnica, validación de esquemas DTE y verificación estética
  para asegurar cero errores antes del despliegue y entrega al usuario.
---

# Skill de Auditoría de Calidad y Solución de Errores

Este skill describe el procedimiento obligatorio para auditar cualquier cambio en el sistema.

## 🚀 Pasos de Ejecución

### 1. Auditoría de Sintaxis y Scripts
Ejecuta la validación de sintaxis en todos los archivos modificados:
```powershell
node -c public/js/app.js
node -c public/js/dte-visual.js
node -c functions/api/_lib/dte.js
```

### 2. Auditoría de Esquemas DTE (si aplica)
Si se modificaron los generadores de DTE o estructuras JSON tributarias:
```powershell
node validar-dte.mjs
```

### 3. Verificación de Preservación de Lógica
- Confirmar que ningún `id` de HTML necesario para el funcionamiento fue renombrado ni eliminado (e.g. `#login-btn`, `#btn-emitir`, `#receptor-form`, `#items-body`, `#resumen`).
- Confirmar que los endpoints fetch (`API.get`, `API.post`, etc.) conservan sus contratos de datos.

### 4. Verificación de Generación de PDFs
- Asegurar que `public/js/dte-visual.js` mantenga las reglas de dimensionamiento exacto de 740px sin desbordamiento para impresión de 1 hoja carta Letter.

### 5. Loop de Auto-Corrección
Si cualquier paso arroja un error:
1. Revisa el log detallado.
2. Aplica la corrección correspondiente.
3. Vuelve a ejecutar este skill hasta que todos los pasos devuelvan éxito (código de salida 0).
