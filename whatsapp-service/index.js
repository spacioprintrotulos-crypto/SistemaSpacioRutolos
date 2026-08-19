// ============================================================
// SPACIO RÓTULOS — MICROSERVICIO WHATSAPP GATEWAY (BAILEYS)
// Diseñado para Railway / Render / Node.js
// ============================================================
const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const PORT = process.env.PORT || 3000;
const API_SECRET = process.env.API_SECRET || 'spacio_sec_2026';
const AUTH_DIR = process.env.AUTH_DIR || path.join(__dirname, 'auth_info_baileys');

let sock = null;
let currentQr = null;
let currentQrDataUrl = null;
let isConnected = false;
let connectedUser = null;

// Logger silencioso para Baileys
const logger = pino({ level: 'silent' });

async function initWhatsApp() {
  try {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    
    let version = [2, 3000, 1015901307];
    try {
      const v = await fetchLatestBaileysVersion();
      if (v && v.version) version = v.version;
    } catch (e) {
      console.log('Usando versión Baileys por defecto:', version);
    }

    console.log('Iniciando socket Baileys con versión:', version);

    sock = makeWASocket({
      version,
      logger,
      auth: state,
      browser: ['Spacio Facturacion DTE', 'Chrome', '1.0.0'],
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQr = qr;
        console.log('⚡ Nuevo código QR de WhatsApp recibido. Generando imagen DataURL...');
        try {
          currentQrDataUrl = await qrcode.toDataURL(qr, { margin: 2, scale: 6 });
          console.log('✅ Código QR DataURL listo para ser escaneado.');
        } catch (err) {
          console.error('Error generando QR DataURL:', err);
        }
      }

      if (connection === 'close') {
        isConnected = false;
        connectedUser = null;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`Conexión cerrada. Código: ${statusCode}. Reconectando: ${shouldReconnect}`);

        if (shouldReconnect) {
          setTimeout(initWhatsApp, 4000);
        } else {
          console.log('Sesión cerrada por el usuario. Limpiando credenciales...');
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          setTimeout(initWhatsApp, 2000);
        }
      } else if (connection === 'open') {
        isConnected = true;
        currentQr = null;
        currentQrDataUrl = null;
        connectedUser = sock.user;
        console.log(`✅ WhatsApp Conectado exitosamente como: ${sock.user?.id || sock.user?.name}`);
      }
    });
  } catch (err) {
    console.error('Error inicializando WhatsApp socket:', err);
    setTimeout(initWhatsApp, 5000);
  }
}

// Iniciar conexión al arrancar el servidor
initWhatsApp();

// Middleware de verificación de API Key opcional
function checkAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['x-api-key'];
  if (API_SECRET && API_SECRET !== 'none') {
    if (!authHeader) return next(); // Permite si no está estricto, o verifica si viene
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token && token !== API_SECRET) {
      return res.status(401).json({ ok: false, error: 'API Secret inválido' });
    }
  }
  next();
}

// ---------- ENDPOINTS ----------

// 1. Estado de conexión
app.get('/status', (req, res) => {
  res.json({
    ok: true,
    connected: isConnected,
    user: connectedUser ? {
      id: connectedUser.id,
      name: connectedUser.name || 'Spacio Rótulos',
      phone: (connectedUser.id || '').split(':')[0]
    } : null,
    hasQr: !!currentQrDataUrl,
  });
});

// 2. Obtener Código QR
app.get('/qr', (req, res) => {
  if (isConnected) {
    return res.json({
      ok: true,
      connected: true,
      message: 'WhatsApp ya está conectado y listo',
      user: connectedUser
    });
  }

  if (!currentQrDataUrl) {
    return res.json({
      ok: false,
      connected: false,
      message: 'Generando nuevo código QR, por favor espere unos segundos...'
    });
  }

  res.json({
    ok: true,
    connected: false,
    qrDataUrl: currentQrDataUrl,
    rawQr: currentQr
  });
});

// 3. Enviar DTE (Texto + PDF + JSON)
app.post('/send-dte', checkAuth, async (req, res) => {
  try {
    if (!isConnected || !sock) {
      return res.status(503).json({
        ok: false,
        error: 'El servicio de WhatsApp no está conectado. Por favor escanee el código QR.'
      });
    }

    const {
      phone,
      message,
      pdfBase64,
      pdfFileName,
      jsonBase64,
      jsonFileName
    } = req.body;

    if (!phone) {
      return res.status(400).json({ ok: false, error: 'El número de teléfono es requerido' });
    }

    // Normalizar número internacional (eliminar +, espacios y guiones)
    let cleanPhone = String(phone).replace(/\D/g, '');
    // Si tiene 8 dígitos (ej: 72554916), agregar código de El Salvador 503
    if (cleanPhone.length === 8) {
      cleanPhone = `503${cleanPhone}`;
    }

    const jid = `${cleanPhone}@s.whatsapp.net`;

    console.log(`Enviando DTE por WhatsApp a: ${jid}`);

    // 1. Enviar mensaje de texto oficial
    let textResult = null;
    if (message) {
      textResult = await sock.sendMessage(jid, { text: message });
    }

    // 2. Enviar archivo PDF adjunto
    let pdfResult = null;
    if (pdfBase64) {
      const cleanB64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      const pdfBuffer = Buffer.from(cleanB64, 'base64');
      const filename = pdfFileName || 'Comprobante_DTE.pdf';

      pdfResult = await sock.sendMessage(jid, {
        document: pdfBuffer,
        mimetype: 'application/pdf',
        fileName: filename,
        caption: `📄 Comprobante Tributario Electrónico Oficial: ${filename}`
      });
    }

    // 3. Enviar archivo JSON firmado adjunto
    let jsonResult = null;
    if (jsonBase64) {
      const cleanB64 = jsonBase64.replace(/^data:application\/json;base64,/, '');
      const jsonBuffer = Buffer.from(cleanB64, 'base64');
      const filename = jsonFileName || 'DTE_Firmado.json';

      jsonResult = await sock.sendMessage(jid, {
        document: jsonBuffer,
        mimetype: 'application/json',
        fileName: filename,
        caption: `📦 Archivo JSON Firmado y Autorizado por el MH: ${filename}`
      });
    }

    return res.json({
      ok: true,
      message: `DTE enviado con éxito a +${cleanPhone}`,
      phone: cleanPhone,
      textSent: !!textResult,
      pdfSent: !!pdfResult,
      jsonSent: !!jsonResult,
    });
  } catch (err) {
    console.error('Error enviando mensaje por WhatsApp:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Error interno al enviar mensaje por WhatsApp'
    });
  }
});

// 4. Desconectar sesión (Cerrar sesión para escanear otro número)
app.post('/logout', checkAuth, async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
    }
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    isConnected = false;
    connectedUser = null;
    setTimeout(initWhatsApp, 1500);
    res.json({ ok: true, message: 'Sesión cerrada exitosamente' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 5. Página de bienvenida / Health check
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Spacio Rótulos — WhatsApp Gateway</title>
      <style>
        body { font-family: Arial, sans-serif; background: #0f172a; color: #fff; text-align: center; padding: 40px 20px; }
        .box { background: #1e293b; max-width: 500px; margin: 0 auto; padding: 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-weight: bold; margin-bottom: 20px; }
        .online { background: #15803d; color: #86efac; }
        .offline { background: #991b1b; color: #fca5a5; }
        img { border-radius: 12px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="box">
        <h2>🚀 Spacio Rótulos WhatsApp Gateway</h2>
        <div class="badge ${isConnected ? 'online' : 'offline'}">
          ${isConnected ? '🟢 Conectado' : '🔴 Desconectado (Requiere Escanear QR)'}
        </div>
        ${isConnected
          ? `<p>Sesión activa para: <b>${connectedUser?.name || connectedUser?.id}</b></p>`
          : (currentQrDataUrl
              ? `<div><p>Escanea este código QR con tu WhatsApp (+503 7255 4916):</p><img src="${currentQrDataUrl}" alt="QR WhatsApp" width="260"></div>`
              : `<p>Generando código QR...</p>`)}
      </div>
    </body>
    </html>
  `);
});

const mainPort = Number(process.env.PORT) || 3000;
app.listen(mainPort, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🟢 WhatsApp Gateway corriendo en puerto principal: ${mainPort} (0.0.0.0)`);
  console.log(`====================================================`);
});

// Puertos secundarios de respaldo para proxy de Railway
[3000, 8080].forEach((p) => {
  if (p !== mainPort) {
    try {
      const s = app.listen(p, '0.0.0.0', () => {
        console.log(`🟢 WhatsApp Gateway escuchando en puerto de respaldo: ${p} (0.0.0.0)`);
      });
      s.on('error', () => {});
    } catch {}
  }
});
