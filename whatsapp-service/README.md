# 📱 Spacio Rótulos — Microservicio WhatsApp Gateway (Railway)

Este microservicio conecta una sesión de WhatsApp mediante código QR (protocolo Baileys) y expone una API REST para enviar Documentos Tributarios Electrónicos (DTEs) con **mensajes de texto**, **archivos PDF oficiales** y **archivos JSON firmados** automáticamente.

---

## 🚀 Despliegue en Railway (en 3 pasos)

1. Ingresa a [railway.app](https://railway.app) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"New Project"** → **"Deploy from GitHub repo"** y selecciona tu repositorio `SistemaSpacioRutolos`.
3. En la configuración del servicio:
   * **Root Directory**: `whatsapp-service`
   * **Variables de entorno**:
     * `PORT`: `3000`
     * `API_SECRET`: `spacio_sec_2026`
4. Railway generará un dominio público automáticamente (ejemplo: `https://whatsapp-spacio-production.up.railway.app`).

---

## 📱 Vinculación de tu WhatsApp (+503 7255 4916)

1. En tu sistema de facturación, ve a **Configuración** → sección **"💬 Gateway de WhatsApp (Railway / Conexión QR)"**.
2. Pega la URL de Railway en el campo *"URL del Gateway en Railway"*.
3. Haz clic en **"📱 Escanear QR / Estado"**.
4. Abre WhatsApp en tu celular (`+503 7255 4916`) → **Dispositivos vinculados** → **Vincular un dispositivo** y escanea el código que aparece en la pantalla.
5. ¡Listo! A partir de ese momento, cada DTE emitido enviará automáticamente el mensaje, el PDF y el JSON en segundo plano.
