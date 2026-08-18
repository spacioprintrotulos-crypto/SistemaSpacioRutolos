# Regla de Auto-Despliegue y Sincronización Automática (Cloudflare + GitHub)

## Instrucción Mandatoria
Siempre que el usuario solicite cambios, mejoras, correcciones o nuevas funcionalidades en el proyecto:

1. **Al finalizar la implementación**:
   - Ejecutar la migración remota si hubo cambios de base de datos (`npm.cmd run migrate`).
   - Desplegar la aplicación a Cloudflare Pages (`npm.cmd run deploy`).
   - Crear un commit con los cambios y subirlo a GitHub (`git add .`, `git commit -m "..."`, `git push origin main`).
2. **Seguridad**:
   - Mantener siempre archivos sensibles (`*.pem`, `*.crt`, `*.key`, `secrets/`, `cookies.txt`) fuera del control de versiones (`.gitignore`).
