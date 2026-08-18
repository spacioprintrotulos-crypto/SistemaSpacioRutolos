---
name: auto-sync
description: >-
  Flujo automatizado para compilar, migrar base de datos D1 remota, desplegar a Cloudflare Pages
  y sincronizar los commits en GitHub automáticamente después de cualquier cambio en el sistema.
---

# Procedimiento de Auto-Sincronización (Cloudflare + GitHub)

Este skill define los pasos obligatorios que el agente ejecuta tras realizar modificaciones en el código, configuraciones o esquemas del sistema.

## Pasos del Flujo Automatizado

1. **Validación y Pruebas**:
   - Si se modificó la lógica de DTEs o esquemas, validar contra los esquemas oficiales:
     ```powershell
     node validar-dte.mjs
     ```

2. **Migración de Base de Datos Remota (Cloudflare D1)**:
   - Si se agregaron o editaron archivos en `migrations/`:
     ```powershell
     npm.cmd run migrate
     ```

3. **Despliegue a Cloudflare Pages**:
   - Compilar y desplegar automáticamente la carpeta `public/` y Functions:
     ```powershell
     npm.cmd run deploy
     ```

4. **Sincronización con GitHub**:
   - Verificar archivos modificados asegurando que ningún secreto (`.crt`, `.pem`, `.env`, contraseñas) esté incluido:
     ```powershell
     git status
     ```
   - Añadir archivos y crear commit descriptivo:
     ```powershell
     git add .
     git commit -m "Descripción clara de los cambios realizados"
     ```
   - Enviar commits a la rama `main` en GitHub:
     ```powershell
     git push origin main
     ```

5. **Reporte al Usuario**:
   - Incluir en la respuesta final la confirmación del despliegue en Cloudflare (URL) y el commit enviado a GitHub.
