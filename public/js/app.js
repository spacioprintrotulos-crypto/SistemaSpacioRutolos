// ============================================================
// SISTEMA FAC2026 — SPA (router por hash + vistas)
// ============================================================

const state = {
  usuario: null,
  cat: null,           // catálogos
  tipoDte: '01',       // tipo activo en el formulario
  items: [],
  ultimoResultado: null,
};

// ---------- Utilidades ----------
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtMoneda = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const numVal = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

function toast(msg, tipo = 'info') {
  const root = $('#toast-root');
  const t = document.createElement('div');
  t.className = `toast ${tipo}`;
  t.textContent = msg;
  root.appendChild(t);
  setTimeout(() => t.remove(), 4200);
}

// ---------- Iconos (SVG) ----------
const ICONS = {
  factura: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>',
  credito: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M14 2v6h6"/><path d="M8 12h8M8 16h8"/></svg>',
  nota: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v2"/></svg>',
  clientes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  dtes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  config: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  iva: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
  cotizacion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
};

// ---------- Router ----------
function route() {
  const h = location.hash || '#/login';
  const [ruta, ...rest] = h.replace(/^\#\/?/, '').split('/');
  const app = $('#app');

  if (!state.usuario && ruta !== 'login') { renderLogin(app); return; }

  switch (ruta) {
    case 'login': renderLogin(app); break;
    case '': renderMenu(app); break;
    case 'factura': state.tipoDte = '01'; renderFormulario(app); break;
    case 'credito': state.tipoDte = '03'; renderFormulario(app); break;
    case 'nota': state.tipoDte = '05'; renderFormulario(app); break;
    case 'cotizaciones': renderCotizaciones(app); break;
    case 'clientes': renderClientes(app); break;
    case 'dtes': renderDTEs(app, rest[0]); break;
    case 'configuracion': renderConfiguracion(app); break;
    case 'iva': renderEnConstruccion(app, 'Sección de IVA'); break;
    default: renderMenu(app);
  }
}

window.addEventListener('hashchange', route);

// ---------- Modo Oscuro / Claro ----------
function getThemeIcon() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return isDark
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}

window.toggleTheme = () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('fac2026_theme', next);
  document.querySelectorAll('.btn-theme-toggle').forEach((btn) => {
    btn.innerHTML = getThemeIcon();
    btn.setAttribute('title', next === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  });
};

// ---------- Layout común ----------
function appShell(contenido) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const currentHash = location.hash || '#/';
  return `
  <div class="app-shell">
    <header class="app-top">
      <div class="app-brand">
        <a href="#/" class="app-brand-link">
          <span class="app-logo-badge">
            <img src="img/logo.svg" alt="Logo">
          </span>
          <div class="app-brand-text">
            <strong>SISTEMA FAC2026</strong>
            <span class="app-brand-tag">DTE El Salvador</span>
          </div>
        </a>
      </div>
      <nav class="app-nav-bar">
        <a href="#/" class="app-nav-link ${currentHash === '#/' || currentHash === '' ? 'active' : ''}">Inicio</a>
        <a href="#/factura" class="app-nav-link ${currentHash === '#/factura' ? 'active' : ''}">Factura</a>
        <a href="#/credito" class="app-nav-link ${currentHash === '#/credito' ? 'active' : ''}">Crédito Fiscal</a>
        <a href="#/nota" class="app-nav-link ${currentHash === '#/nota' ? 'active' : ''}">Nota Crédito</a>
        <a href="#/cotizaciones" class="app-nav-link ${currentHash === '#/cotizaciones' ? 'active' : ''}">Cotizaciones</a>
        <a href="#/clientes" class="app-nav-link ${currentHash === '#/clientes' ? 'active' : ''}">Clientes</a>
        <a href="#/dtes" class="app-nav-link ${currentHash.startsWith('#/dtes') ? 'active' : ''}">DTEs</a>
        <a href="#/configuracion" class="app-nav-link ${currentHash === '#/configuracion' ? 'active' : ''}">Configuración</a>
      </nav>
      <div class="app-userbox">
        <div class="app-user-pill">
          <span class="app-user-avatar">${(state.usuario?.usuario || 'A')[0].toUpperCase()}</span>
          <span class="app-user-name">${esc(state.usuario?.nombre || state.usuario?.usuario || 'Administrador')}</span>
        </div>
        <button type="button" class="btn-theme-toggle" onclick="toggleTheme()" title="${isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}" aria-label="Cambiar tema">
          ${getThemeIcon()}
        </button>
        <a href="#" class="btn-logout-pill" onclick="logout(event)">Salir</a>
      </div>
    </header>
    <main class="app-body">${contenido}</main>
  </div>`;
}

async function logout(e) {
  e.preventDefault();
  await API.logout();
  state.usuario = null;
  location.hash = '#/login';
}

// ---------- VISTA: Login (Estilo Minimalista) ----------
function renderLogin(app) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  app.innerHTML = `
  <div class="login-minimal-page">
    <header class="login-minimal-nav">
      <div class="login-nav-brand">
        <div class="login-nav-logo">
          <img src="img/logo.svg" alt="Logo">
        </div>
        <span class="login-nav-title">SISTEMA FAC2026</span>
      </div>
      <nav class="login-nav-links">
        <span class="nav-item active">Facturación DTE</span>
        <span class="nav-item">Ministerio de Hacienda</span>
        <span class="nav-item">El Salvador</span>
      </nav>
      <div class="login-nav-actions">
        <button type="button" class="btn-theme-toggle login-minimal-theme-btn" onclick="toggleTheme()" title="${isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}" aria-label="Cambiar tema">
          ${getThemeIcon()}
        </button>
        <span class="login-status-pill">
          <span class="status-dot"></span> Online
        </span>
      </div>
    </header>

    <div class="login-minimal-main">
      <div class="login-minimal-grid">
        <div class="login-minimal-form-side">
          <div class="login-tabs-header">
            <span class="login-tab">Iniciar sesión</span>
            <span class="login-tab-badge">DTE v1.0</span>
          </div>

          <p class="login-minimal-desc">Acceso seguro para emisión de Facturación Electrónica DTE.</p>

          <div id="login-alert"></div>

          <form class="login-minimal-form" onsubmit="return false;">
            <div class="minimal-field">
              <div class="field-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <input id="login-user" type="text" autocomplete="username" placeholder="Usuario o correo" required>
            </div>

            <div class="minimal-field">
              <div class="field-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <input id="login-pass" type="password" autocomplete="current-password" placeholder="Contraseña de acceso" required>
            </div>

            <div class="login-minimal-actions">
              <span class="login-environment-tag">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Ambiente SV
              </span>
              <button class="btn-minimal-submit" id="login-btn">
                <span>Entrar</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            </div>
          </form>

          <div class="login-minimal-credits">
            <span>by <strong>Jovas-Motion</strong> Designer &amp; Desarrollo.</span>
          </div>
        </div>

        <div class="login-minimal-visual-side">
          <div class="visual-arc-bg visual-arc-1"></div>
          <div class="visual-arc-bg visual-arc-2"></div>
          <div class="visual-arc-bg visual-arc-3"></div>
          <div class="visual-card-frame">
            <img src="img/login-desk.jpg" alt="Escritorio de Facturación" class="visual-illustration-img">
          </div>
        </div>
      </div>
    </div>
  </div>`;

  const entrar = async () => {
    const user = $('#login-user').value.trim();
    const pass = $('#login-pass').value;
    if (!user || !pass) { $('#login-alert').innerHTML = '<div class="alert alert-error">Usuario y contraseña son requeridos</div>'; return; }
    const btn = $('#login-btn');
    btn.disabled = true; btn.innerHTML = '<span>Entrando...</span>';
    try {
      const r = await API.login(user, pass);
      state.usuario = r.usuario;
      location.hash = '#/';
    } catch (e) {
      $('#login-alert').innerHTML = `<div class="alert alert-error">${esc(e.error || 'No se pudo iniciar sesión')}</div>`;
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<span>Entrar</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
    }
  };
  $('#login-btn').addEventListener('click', entrar);
  $('#login-pass').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') entrar(); });
  $('#login-user').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') $('#login-pass').focus(); });
}

// ---------- VISTA: Menú ----------
function renderMenu(app) {
  const tarjetas = [
    { ruta: '#/factura', cls: 'card-emerald', cat: 'DOCUMENTO TRIBUTARIO', t: 'Factura', s: 'Consumidor Final. Precios con IVA 13% incluido.', icon: 'factura', badge: 'DTE 01' },
    { ruta: '#/credito', cls: 'card-royal', cat: 'CONTRIBUYENTE', t: 'Crédito Fiscal', s: 'CCF para empresas con desglose de IVA y retenciones.', icon: 'credito', badge: 'DTE 03' },
    { ruta: '#/nota', cls: 'card-cyan', cat: 'ANULACIÓN / AJUSTE', t: 'Nota de Crédito', s: 'Anula o modifica una Factura o CCF emitida.', icon: 'nota', badge: 'DTE 05' },
    { ruta: '#/cotizaciones', cls: 'card-amber', cat: 'PROPUESTAS', t: 'Cotizaciones', s: 'Crea presupuestos rápidos con cálculo automático de IVA.', icon: 'cotizacion', badge: 'PDF' },
    { ruta: '#/clientes', cls: 'card-indigo', cat: 'DIRECTORIO', t: 'Clientes', s: 'Gestión y consulta de receptores y contribuyentes.', icon: 'clientes', badge: 'Base D1' },
    { ruta: '#/dtes', cls: 'card-slate', cat: 'HISTORIAL TRIBUTARIO', t: 'DTEs Emitidos', s: 'Consulta, descarga de JSON/PDF y anulación de DTEs.', icon: 'dtes', badge: 'MH SV' },
    { ruta: '#/iva', cls: 'card-teal', cat: 'CONTROL FISCAL', t: 'IVA', s: 'Libros de compras y ventas a contribuyente.', icon: 'iva', badge: 'Próximamente' },
    { ruta: '#/configuracion', cls: 'card-navy', cat: 'SISTEMA & FIRMA', t: 'Configuración', s: 'Datos del emisor, credenciales MH y firma electrónica.', icon: 'config', badge: 'Ajustes' },
  ];
  app.innerHTML = appShell(`
    <div class="page-head dashboard-head">
      <div>
        <div class="crumb">Panel de Control</div>
        <h2>Módulos de Facturación DTE</h2>
      </div>
      <div class="actions">
        <span class="status-badge-mh">
          <span class="status-dot"></span> MH El Salvador Conectado
        </span>
      </div>
    </div>
    <div class="menu-grid">
      ${tarjetas.map((t) => `
        <a class="menu-card ${t.cls}" href="${t.ruta}">
          <div class="card-top-row">
            <span class="card-category">${t.cat}</span>
            <span class="card-badge">${t.badge}</span>
          </div>
          <div class="card-main">
            <div class="card-title">${t.t}</div>
            <div class="card-sub">${t.s}</div>
          </div>
          <div class="card-footer-row">
            <div class="icon">${ICONS[t.icon]}</div>
            <span class="card-action-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </span>
          </div>
        </a>`).join('')}
    </div>`);
}

// ---------- VISTA: En Construcción ----------
function renderEnConstruccion(app, titulo = 'Sección de IVA') {
  app.innerHTML = appShell(`
    <div class="page-head">
      <div>
        <div class="crumb"><a href="#/" style="color:var(--azul);text-decoration:none">Inicio</a> / ${esc(titulo)}</div>
        <h2>${esc(titulo)}</h2>
      </div>
    </div>
    <div class="card" style="text-align:center;padding:50px 20px">
      <div style="width:64px;height:64px;margin:0 auto 16px;border-radius:18px;background:linear-gradient(135deg, #0d9488, #2dd4bf);display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 10px 25px rgba(13,148,136,.25)">
        ${ICONS.iva}
      </div>
      <h3 style="justify-content:center;font-size:20px;margin-bottom:8px">Módulo en Construcción</h3>
      <p style="color:var(--gris);max-width:460px;margin:0 auto 24px;font-size:14px;line-height:1.5">
        Esta sección está en desarrollo. Próximamente podrás generar los Libros de IVA (Compras, Ventas a Contribuyentes y Consumidor Final) y reportes de control fiscal.
      </p>
      <div>
        <a href="#/" class="btn btn-primary" style="display:inline-block;text-decoration:none">Volver al inicio</a>
      </div>
    </div>`);
}

// ---------- Helpers de catálogos ----------
function selDeptos(sel, valor) {
  return `<select class="depto-select" data-target="${sel}">
    <option value="">-- Departamento --</option>
    ${state.cat.departamentos.map((d) => `<option value="${d.codigo}" ${d.codigo === valor ? 'selected' : ''}>${esc(d.nombre)}</option>`).join('')}
  </select>`;
}
function selMunicipios(depto, valor) {
  const lista = state.cat.municipios[depto] || [];
  return `<select name="municipio">
    <option value="">-- Municipio / Distrito --</option>
    ${lista.map((m) => `<option value="${m.codigo}" ${m.codigo === valor ? 'selected' : ''}>${esc(m.nombre)}</option>`).join('')}
  </select>`;
}
const ACTIVIDAD_ALIASES = {
  '73100': { cod: '73101', desc: 'Agencias de publicidad' },
  '74100': { cod: '74101', desc: 'Actividades de diseñadores gráficos' },
  '47110': { cod: '47111', desc: 'Comercio al por menor en supermercados y almacenes surtidos con predominio de alimentos' },
  '47190': { cod: '47191', desc: 'Comercio al por menor de diversos artículos en almacenes' },
  '70200': { cod: '70201', desc: 'Servicios de asesoría y consultoría en gestión empresarial' },
  '69200': { cod: '69201', desc: 'Actividades de contabilidad realizadas en despachos y oficinas contables' },
  '56100': { cod: '56101', desc: 'Restaurantes y servicio móvil de comidas' },
  '46100': { cod: '46101', desc: 'Actividades de transacciones comerciales de distribuidores de mercancías' },
  '45200': { cod: '45201', desc: 'Mantenimiento y reparación mecánica de vehículos automotores' },
  '62000': { cod: '62010', desc: 'Actividades de programación informática' },
  '96099': { cod: '82990', desc: 'Otras actividades de servicios de apoyo a las empresas n.c.p.' },
  '96090': { cod: '82990', desc: 'Otras actividades de servicios de apoyo a las empresas n.c.p.' },
  '96000': { cod: '82990', desc: 'Otras actividades de servicios de apoyo a las empresas n.c.p.' },
};

function selActividades() {
  const lista = state.cat?.actividades || [];
  return `<datalist id="dl-actividades">${lista.map((a) => `<option value="${esc(a.codigo)}">${esc(a.codigo)} — ${esc(a.descripcion)}</option>`).join('')}</datalist>`;
}

function nombreActividad(cod) {
  if (!cod) return '';
  let c = String(cod).trim();
  if (/^\d{4}$/.test(c)) c = c.padStart(5, '0');
  if (ACTIVIDAD_ALIASES[c]) return ACTIVIDAD_ALIASES[c].desc;
  const a = state.cat?.actividades?.find((x) => x.codigo === c);
  return a ? a.descripcion : '';
}

function resolverActividad(valor) {
  if (!valor) return { codigo: '', descripcion: '' };
  let v = String(valor).trim();
  const m = v.match(/^(\d{4,6})\s*[-—–:]\s*(.*)$/);
  if (m) {
    let code = m[1];
    if (code.length === 4) code = code.padStart(5, '0');
    if (ACTIVIDAD_ALIASES[code]) code = ACTIVIDAD_ALIASES[code].cod;
    const desc = m[2].trim() || nombreActividad(code);
    return { codigo: code, descripcion: desc };
  }
  if (/^\d{4,6}$/.test(v)) {
    let code = v;
    if (code.length === 4) code = code.padStart(5, '0');
    if (ACTIVIDAD_ALIASES[code]) code = ACTIVIDAD_ALIASES[code].cod;
    return { codigo: code, descripcion: nombreActividad(code) };
  }
  const term = v.toLowerCase();
  const match = state.cat?.actividades?.find((a) => a.descripcion.toLowerCase().includes(term) || a.codigo === term);
  if (match) {
    return { codigo: match.codigo, descripcion: match.descripcion };
  }
  return { codigo: v, descripcion: '' };
}

window.modalBuscarActividad = (callback) => {
  const list = state.cat?.actividades || [];
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-backdrop modal-actividades-backdrop" onclick="if(event.target===this)this.remove()">
      <div class="modal modal-lg" style="max-width:700px;width:95%;max-height:85vh;display:flex;flex-direction:column;padding:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3 style="margin:0;display:flex;align-items:center;gap:8px">
            <span style="font-size:1.2rem">🏛️</span> Actividades Económicas (CAT-019)
          </h3>
          <button class="btn-close-corner" type="button" onclick="this.closest('.modal-backdrop').remove()">✕ Cerrar</button>
        </div>
        <p class="text-gris small" style="margin-top:0;margin-bottom:14px">
          Busque en los 990 códigos oficiales del Ministerio de Hacienda por número o palabra clave.
        </p>
        <div style="margin-bottom:12px">
          <input id="txt-buscar-act" placeholder="🔍 Escriba código o texto (ej. 73101, publicidad, transporte, almacén, restaurante)..." style="width:100%;font-size:14px;padding:10px 14px;border-radius:12px">
        </div>
        <div id="lista-actividades-resultado" style="flex:1;overflow-y:auto;max-height:380px;border:1px solid var(--borde);border-radius:14px;padding:6px;background:var(--fondo-card)">
        </div>
        <div class="modal-actions" style="margin-top:14px;display:flex;justify-content:flex-end">
          <button class="btn btn-cancelar" type="button" onclick="this.closest('.modal-backdrop').remove()">Cerrar</button>
        </div>
      </div>
    </div>
  `);

  const m = document.body.lastElementChild;
  const txt = $('#txt-buscar-act', m);
  const box = $('#lista-actividades-resultado', m);

  const renderList = (q) => {
    const query = (q || '').trim().toLowerCase();
    const filtrados = query
      ? list.filter((a) => a.codigo.includes(query) || a.descripcion.toLowerCase().includes(query))
      : list.slice(0, 80);

    box.innerHTML = filtrados.length
      ? filtrados.map((a) => `
        <div class="item-actividad-row" style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-bottom:1px solid var(--borde);cursor:pointer;border-radius:8px;transition:all 0.15s;gap:12px" data-cod="${esc(a.codigo)}" data-desc="${esc(a.descripcion)}">
          <div style="flex:1">
            <span class="badge-cod" style="font-family:monospace;font-weight:700;background:rgba(13,71,201,0.1);color:var(--azul,#0d47c9);padding:2px 7px;border-radius:6px;margin-right:8px;font-size:12px">${esc(a.codigo)}</span>
            <span style="font-size:13px;font-weight:500">${esc(a.descripcion)}</span>
          </div>
          <button class="btn btn-verde btn-xs" type="button" style="white-space:nowrap;padding:4px 10px">Elegir</button>
        </div>
      `).join('')
      : '<div style="padding:24px;text-align:center;color:var(--texto-gris)">No se encontraron actividades para esa búsqueda.</div>';

    $$('.item-actividad-row', box).forEach((row) => {
      row.addEventListener('click', () => {
        const cod = row.dataset.cod;
        const desc = row.dataset.desc;
        if (typeof callback === 'function') callback(cod, desc);
        m.remove();
      });
      row.addEventListener('mouseenter', () => { row.style.background = 'rgba(5,150,105,0.08)'; });
      row.addEventListener('mouseleave', () => { row.style.background = 'transparent'; });
    });
  };

  txt.addEventListener('input', (e) => renderList(e.target.value));
  renderList('');
  setTimeout(() => txt?.focus(), 60);
};

// Reasigna municipios al cambiar departamento
function bindCascada(contenedor) {
  $$('.depto-select', contenedor).forEach((sel) => {
    sel.addEventListener('change', () => {
      const tgt = sel.dataset.target;
      const target = contenedor.querySelector(`[name="${tgt}"]`);
      if (target) target.outerHTML = selMunicipios(sel.value);
    });
  });
}

// ---------- VISTA: Formulario de emisión ----------
const TITULOS = { '01': 'Factura', '03': 'Crédito Fiscal', '05': 'Nota de Crédito' };

function renderFormulario(app) {
  const tipo = state.tipoDte;
  state.items = [{ descripcion: '', cantidad: 1, precioUni: '', montoDescu: 0, tipoVenta: 'gravada', uniMedida: 59 }];
  state.ultimoResultado = null;

  app.innerHTML = appShell(`
    <div class="page-head">
      <div><div class="crumb"><a href="#/" style="color:var(--azul);text-decoration:none">Inicio</a> / Emisión</div><h2>Nueva ${TITULOS[tipo]}</h2></div>
      <div class="actions"><a href="#/" class="btn-volver"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Volver al inicio</a></div>
    </div>

    <div id="form-area"></div>
  `);

  const area = $('#form-area');
  area.innerHTML = `
    <div class="card">
      <h3><span class="badge">1</span> Receptor</h3>
      <div class="flex" style="margin-bottom:14px">
        <div class="spacer"></div>
        <select id="receptor-buscar" class="btn-secundario" style="min-width:240px;padding:10px 14px;border-radius:10px;border:1px solid #dbeafe;background:#eff6ff;color:var(--azul);font-weight:700">
          <option value="">Seleccionar cliente guardado...</option>
        </select>
      </div>
      <div id="receptor-form"></div>
    </div>

    <div class="card">
      <h3><span class="badge">2</span> Detalle del documento</h3>
      <div class="grid-3 mb">
        <div class="form-field"><label>Condición de operación</label><select id="condicion"><option value="1">Contado</option><option value="2">A Crédito</option><option value="3">Anticipos</option></select></div>
        <div class="form-field"><label>Forma de pago</label><select id="forma-pago">${state.cat.formaPago.map((f) => `<option value="${f.codigo}">${esc(f.nombre)}</option>`).join('')}</select></div>
        <div class="grid-2" style="grid-column:1/-1">
          <div class="form-field"><label>Plazo (número, solo crédito)</label><input id="plazo" type="number" value="30"></div>
          <div class="form-field"><label>Unidad de plazo (CAT-018)</label><select id="plazo-unidad"><option value="01">Días</option><option value="02">Meses</option><option value="03">Años</option></select></div>
        </div>
      </div>
      <div class="table-responsive">
        <table class="items-table">
          <thead><tr>
            <th style="min-width:200px;width:34%">Descripción</th>
            <th style="min-width:105px;width:110px">Venta</th>
            <th style="min-width:85px;width:85px;text-align:center">Cant.</th>
            <th style="min-width:110px;width:115px;text-align:right">Precio ${tipo === '01' ? '(c/IVA)' : '(s/IVA)'}</th>
            <th style="min-width:100px;width:110px;text-align:right">Desc. $</th>
            <th style="min-width:110px;width:120px;text-align:right">Subtotal</th>
            <th style="width:44px;text-align:center"></th>
          </tr></thead>
          <tbody id="items-body"></tbody>
        </table>
      </div>
      <button class="btn btn-secundario btn-add-item" onclick="agregarItem()">+ Agregar línea</button>
    </div>

    ${tipo === '05' ? `
    <div class="card">
      <h3><span class="badge">3</span> Documento relacionado (DTE original)</h3>
      <div class="form-field"><label>Documento a afectar (solo PROCESADO)</label><select id="doc-relacionado"></select></div>
    </div>` : ''}

    <div class="card">
      <h3>Retenciones y percepciones</h3>
      <div class="grid-3">
        ${tipo === '03' ? '<div class="form-field"><label>IVA Percibido</label><input id="iva-perci" type="number" step="0.01" value="0"></div>' : ''}
        ${tipo !== '05' ? '<div class="form-field"><label>Retención IVA (1%)</label><input id="iva-rete" type="number" step="0.01" value="0"></div>' : ''}
        ${tipo === '01' || tipo === '03' ? '<div class="form-field"><label>Retención Renta</label><input id="rete-renta" type="number" step="0.01" value="0"></div>' : ''}
      </div>
    </div>

    <div class="card">
      <h3>Extensión (entrega / recepción)</h3>
      <div class="grid-2">
        <div class="form-field"><label>Nombre quién entrega</label><input id="ext-entrega-nom"></div>
        <div class="form-field"><label>Documento quién entrega</label><input id="ext-entrega-doc"></div>
        <div class="form-field"><label>Nombre quién recibe</label><input id="ext-recibe-nom"></div>
        <div class="form-field"><label>Documento quién recibe</label><input id="ext-recibe-doc"></div>
        <div class="form-field" style="grid-column:1/-1"><label>Observaciones</label><textarea id="ext-obs" rows="2"></textarea></div>
      </div>
    </div>

    <div class="card">
      <h3>Resumen</h3>
      <div class="resumen-box" id="resumen"></div>
      <div class="mt flex" style="gap:10px;flex-wrap:wrap">
        <button class="btn btn-verde" id="btn-emitir">🚀 Emitir DTE</button>
        <button class="btn btn-secundario" type="button" id="btn-vista-previa-emision">👁️ Vista Previa del Comprobante</button>
        <button class="btn btn-cancelar" onclick="location.hash='#/'">Cancelar</button>
      </div>
    </div>
  `;

  // Receptor (build fields + cargar clientes)
  renderReceptorForm(area);
  API.clientes('').then((r) => {
    const sel = $('#receptor-buscar');
    sel.innerHTML = '<option value="">Seleccionar cliente guardado...</option>' +
      r.clientes.map((c) => `<option value="${c.id}">${esc(c.nombre)}${c.nrc ? ' · NRC ' + esc(c.nrc) : ''}</option>`).join('');
  }).catch(() => {});

  $('#receptor-buscar').addEventListener('change', (e) => {
    const id = e.target.value;
    if (!id) { renderReceptorForm(area); return; }
    API.cliente(id).then((r) => {
      const c = r.cliente;
      fillReceptor(c);
    });
  });

  // Cargar docRelacionado para NC
  if (tipo === '05') {
    API.dtes({ estado: 'PROCESADO' }).then((r) => {
      const docs = r.dtes.filter((d) => d.tipo_dte === '01' || d.tipo_dte === '03');
      $('#doc-relacionado').innerHTML = '<option value="">-- Seleccione --</option>' +
        docs.map((d) => `<option value="${d.id}" data-num="${esc(d.codigo_generacion)}" data-fec="${d.fec_emi}" data-tipo="${d.tipo_dte}">${d.numero_control} · ${d.receptor_nombre} · ${fmtMoneda(d.total)}</option>`).join('');
    }).catch(() => {});
  }

  $('#condicion').addEventListener('change', () => recalcular());
  ['iva-perci', 'iva-rete', 'rete-renta'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', recalcular);
  });

  renderItems();
  recalcular();
  bindCascada(area);

  $('#btn-emitir').addEventListener('click', emitir);

  $('#btn-vista-previa-emision')?.addEventListener('click', async () => {
    const form = $('#receptor-form');
    const val = (n) => form.querySelector(`[name="${n}"]`)?.value?.trim() || '';
    const itemsValidos = state.items.filter((it) => it.descripcion).map((it, idx) => ({
      numItem: idx + 1,
      tipoItem: 1,
      codigo: `ITEM${idx + 1}`,
      descripcion: it.descripcion,
      cantidad: Number(it.cantidad || 1),
      uniMedida: Number(it.uniMedida || 59),
      precioUni: Number(it.precioUni || 0),
      montoDescu: Number(it.montoDescu || 0),
      ventaGravada: it.tipoVenta === 'gravada' ? Number(it.cantidad || 1) * Number(it.precioUni || 0) - Number(it.montoDescu || 0) : 0,
      ventaExenta: it.tipoVenta === 'exenta' ? Number(it.cantidad || 1) * Number(it.precioUni || 0) - Number(it.montoDescu || 0) : 0,
      ventaNoSuj: it.tipoVenta === 'nosuj' ? Number(it.cantidad || 1) * Number(it.precioUni || 0) - Number(it.montoDescu || 0) : 0,
    }));

    if (!itemsValidos.length) {
      return toast('Agregue al menos un ítem con descripción para previsualizar', 'warn');
    }

    let cfgEmisor = {};
    try {
      const cfg = await API.configuracion();
      cfgEmisor = cfg.emisor || {};
    } catch {}

    const totalGrav = itemsValidos.reduce((acc, it) => acc + (it.ventaGravada || 0), 0);
    const totalEx = itemsValidos.reduce((acc, it) => acc + (it.ventaExenta || 0), 0);
    const totalNoS = itemsValidos.reduce((acc, it) => acc + (it.ventaNoSuj || 0), 0);
    const subVentas = totalGrav + totalEx + totalNoS;
    const conIva = tipo === '01';
    const ivaVal = conIva ? ((totalGrav / 1.13) * 0.13) : (totalGrav * 0.13);
    const totPagar = subVentas + (conIva ? 0 : ivaVal);

    const dtePreview = {
      identificacion: {
        version: tipo === '01' ? 1 : 3,
        ambiente: '00',
        tipoDte: tipo,
        numeroControl: `DTE-${tipo}-M001P001-000000000000000`,
        codigoGeneracion: '00000000-0000-0000-0000-000000000000',
        fecEmi: new Date().toISOString().slice(0, 10),
        horEmi: new Date().toTimeString().slice(0, 8),
      },
      emisor: {
        nombre: cfgEmisor.nombre || 'EVER ODIR RAMOS PORTILLO',
        nit: cfgEmisor.nit || '12012608691018',
        nrc: cfgEmisor.nrc || '899798',
        descActividad: cfgEmisor.desc_actividad || 'Comercio y Publicidad',
        direccion: { complemento: cfgEmisor.complemento || '7 Avenida Norte, San Salvador' },
        telefono: cfgEmisor.telefono || '72108369',
        correo: cfgEmisor.correo || 'spacioprintrotulos@gmail.com',
        nombreComercial: cfgEmisor.nombre_comercial || 'Spacio Rotulos',
      },
      receptor: {
        nombre: val('nombre') || 'CLIENTE EJEMPLO',
        nit: val('num_documento') || '000000000',
        nrc: val('nrc') || null,
        descActividad: val('desc_actividad') || '-',
        direccion: { complemento: val('complemento') || 'San Salvador' },
        telefono: val('telefono') || '-',
        correo: val('correo') || '-',
        nombreComercial: val('nombre_comercial') || '-',
      },
      cuerpoDocumento: itemsValidos,
      resumen: {
        totalNoSuj: totalNoS,
        totalExenta: totalEx,
        totalGravada: totalGrav,
        subTotalVentas: subVentas,
        subTotal: subVentas,
        tributos: tipo === '03' || tipo === '05' ? [{ codigo: '20', valor: ivaVal }] : null,
        montoTotalOperacion: totPagar,
        totalPagar: totPagar,
        totalLetras: 'VISTA PREVIA — TOTAL ESTIMADO',
        condicionOperacion: Number($('#condicion')?.value || 1),
      }
    };

    if (typeof DTEVisual !== 'undefined') {
      DTEVisual.previsualizar(dtePreview, { sello: 'BORRADOR — VISTA PREVIA NO FISCAL' });
    } else {
      toast('Motor visual cargando...', 'info');
    }
  });
}

function renderReceptorForm(area) {
  $('#receptor-form', area).innerHTML = `
    <div class="grid-3">
      <div class="form-field"><label>Tipo de documento</label>
        <select name="tipo_documento">${state.cat.tipoDocumento.map((t) => `<option value="${t.codigo}" ${t.codigo === '13' ? 'selected' : ''}>${esc(t.nombre)}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>Número de documento</label><input name="num_documento"></div>
      <div class="form-field"><label>NRC</label><input name="nrc"></div>
      <div class="form-field" style="grid-column:1/-1"><label>Nombre / Razón social</label><input name="nombre"></div>
      <div class="form-field">
        <label>Código actividad (CAT-019)</label>
        <div style="display:flex;gap:6px">
          <input name="cod_actividad" list="dl-actividades" placeholder="Ej. 73101" style="flex:1">
          <button type="button" class="btn btn-secundario btn-xs" id="btn-buscar-act-receptor" title="Buscar en catálogo">🔍</button>
        </div>
        ${selActividades()}
      </div>
      <div class="form-field"><label>Descripción de actividad / Giro</label><input name="desc_actividad" placeholder="Giro o actividad"></div>
      <div class="form-field"><label>Nombre comercial</label><input name="nombre_comercial"></div>
      <div class="form-field"><label>Departamento</label>${selDeptos('municipio')}</div>
      <div class="form-field"><label>Municipio / Distrito</label>${selMunicipios('')}</div>
      <div class="form-field"><label>Complemento de dirección</label><input name="complemento"></div>
      <div class="form-field"><label>Teléfono</label><input name="telefono"></div>
      <div class="form-field"><label>Correo</label><input name="correo"></div>
    </div>`;

  const form = $('#receptor-form', area);
  const recCod = form.querySelector('[name="cod_actividad"]');
  const recDesc = form.querySelector('[name="desc_actividad"]');

  if (recCod && recDesc) {
    recCod.addEventListener('input', () => {
      const res = resolverActividad(recCod.value);
      if (res.codigo && res.codigo !== recCod.value && /^\d{5,6}$/.test(res.codigo)) {
        recCod.value = res.codigo;
      }
      if (res.descripcion) recDesc.value = res.descripcion;
    });
    recCod.addEventListener('change', () => {
      const res = resolverActividad(recCod.value);
      if (res.codigo) recCod.value = res.codigo;
      if (res.descripcion) recDesc.value = res.descripcion;
    });
  }

  form.querySelector('#btn-buscar-act-receptor')?.addEventListener('click', () => {
    window.modalBuscarActividad((cod, desc) => {
      if (recCod) recCod.value = cod;
      if (recDesc) recDesc.value = desc;
    });
  });
}

function fillReceptor(c) {
  const form = $('#receptor-form');
  if (!form) return;
  const set = (name, v) => { const el = form.querySelector(`[name="${name}"]`); if (el) el.value = v || ''; };
  set('tipo_documento', c.tipo_documento || '13');
  set('num_documento', c.num_documento);
  set('nrc', c.nrc);
  set('nombre', c.nombre);
  set('cod_actividad', c.cod_actividad);
  set('desc_actividad', c.desc_actividad);
  set('nombre_comercial', c.nombre_comercial);
  set('complemento', c.complemento);
  set('telefono', c.telefono);
  set('correo', c.correo);
  const depto = form.querySelector('.depto-select');
  if (depto) { depto.value = c.departamento || ''; depto.dispatchEvent(new Event('change')); const mun = form.querySelector('[name="municipio"]'); if (mun) mun.value = c.municipio || ''; }
}

function renderItems() {
  const body = $('#items-body');
  body.innerHTML = state.items.map((it, i) => `
    <tr>
      <td><input class="it-desc" data-i="${i}" value="${esc(it.descripcion)}" placeholder="Descripción del producto o servicio"></td>
      <td><select class="it-tipo" data-i="${i}">
        <option value="gravada" ${it.tipoVenta === 'gravada' ? 'selected' : ''}>Gravada</option>
        <option value="exenta" ${it.tipoVenta === 'exenta' ? 'selected' : ''}>Exenta</option>
        <option value="nosuj" ${it.tipoVenta === 'nosuj' ? 'selected' : ''}>No sujeta</option>
      </select></td>
      <td><input class="it-cant num" data-i="${i}" type="number" step="any" min="0" value="${it.cantidad}"></td>
      <td><input class="it-precio num" data-i="${i}" type="number" step="0.01" min="0" value="${it.precioUni}"></td>
      <td><input class="it-descu num" data-i="${i}" type="number" step="0.01" min="0" value="${it.montoDescu || 0}"></td>
      <td class="it-sub num" data-i="${i}">$0.00</td>
      <td style="text-align:center"><button class="row-remove" onclick="quitarItem(${i})" title="Eliminar fila">×</button></td>
    </tr>`).join('');

  $$('.items-table input, .items-table select', body).forEach((el) => {
    el.addEventListener('input', () => {
      const i = Number(el.dataset.i);
      const fila = state.items[i];
      if (el.classList.contains('it-desc')) fila.descripcion = el.value;
      if (el.classList.contains('it-cant')) fila.cantidad = numVal(el.value);
      if (el.classList.contains('it-precio')) fila.precioUni = numVal(el.value);
      if (el.classList.contains('it-descu')) fila.montoDescu = numVal(el.value);
      if (el.classList.contains('it-tipo')) fila.tipoVenta = el.value;
      recalcular();
    });
  });
}

window.agregarItem = () => {
  state.items.push({ descripcion: '', cantidad: 1, precioUni: '', montoDescu: 0, tipoVenta: 'gravada', uniMedida: 59 });
  renderItems();
};
window.quitarItem = (i) => {
  if (state.items.length === 1) { state.items = [{ descripcion: '', cantidad: 1, precioUni: '', montoDescu: 0, tipoVenta: 'gravada', uniMedida: 59 }]; }
  else state.items.splice(i, 1);
  renderItems();
};

function recalcular() {
  const tipo = state.tipoDte;
  const conIva = tipo === '01';
  const ivaTasa = 0.13;
  let sub = 0, iva = 0, exenta = 0, nosuj = 0;

  state.items.forEach((it, i) => {
    const cant = numVal(it.cantidad), precio = numVal(it.precioUni), descu = numVal(it.montoDescu);
    const base = r2(cant * precio - descu);
    const fila = $(`.it-sub[data-i="${i}"]`);
    let g = 0;
    if (it.tipoVenta === 'exenta') exenta += base;
    else if (it.tipoVenta === 'nosuj') nosuj += base;
    else g = base;
    sub += g;
    if (conIva) iva += r2((g / (1 + ivaTasa)) * ivaTasa);
    else iva += r2(g * ivaTasa);
    if (fila) fila.textContent = fmtMoneda(base);
  });

  sub = r2(sub); iva = r2(iva); exenta = r2(exenta); nosuj = r2(nosuj);

  const perci = numVal($('#iva-perci')?.value || 0);
  const reteIva = numVal($('#iva-rete')?.value || 0);
  const reteRenta = numVal($('#rete-renta')?.value || 0);
  const montoOperacion = r2(sub + (conIva ? 0 : iva) + exenta + nosuj);
  const total = r2(montoOperacion + perci - reteIva - reteRenta);

  $('#resumen').innerHTML = `
    <div class="resumen-row"><span>No sujetas</span><span>${fmtMoneda(nosuj)}</span></div>
    <div class="resumen-row"><span>Exentas</span><span>${fmtMoneda(exenta)}</span></div>
    <div class="resumen-row"><span>Gravadas</span><span>${fmtMoneda(sub)}</span></div>
    ${tipo !== '05' ? `<div class="resumen-row"><span>IVA ${conIva ? '(incluido)' : ''}</span><span>${fmtMoneda(iva)}</span></div>` : ''}
    ${tipo === '03' ? `<div class="resumen-row"><span>IVA percibido</span><span>${fmtMoneda(perci)}</span></div>` : ''}
    ${tipo !== '05' ? `<div class="resumen-row"><span>Retención IVA</span><span>-${fmtMoneda(reteIva)}</span></div>` : ''}
    ${tipo !== '05' ? `<div class="resumen-row"><span>Retención Renta</span><span>-${fmtMoneda(reteRenta)}</span></div>` : ''}
    <div class="resumen-row total"><span>Total a pagar</span><span>${fmtMoneda(total)}</span></div>
  `;
}

async function emitir() {
  const tipo = state.tipoDte;
  const form = $('#receptor-form');
  const val = (n) => form.querySelector(`[name="${n}"]`)?.value?.trim() || '';

  const items = state.items.filter((it) => it.descripcion).map((it) => ({
    descripcion: it.descripcion,
    cantidad: numVal(it.cantidad),
    precioUni: numVal(it.precioUni),
    montoDescu: numVal(it.montoDescu),
    tipoVenta: it.tipoVenta,
    uniMedida: it.uniMedida || 59,
  }));

  if (items.length === 0) return toast('Agregue al menos un ítem con descripción', 'error');

  const body = {
    tipoDte: tipo,
    clienteId: $('#receptor-buscar').value || null,
    receptor: {
      tipo_documento: val('tipo_documento'),
      num_documento: val('num_documento'),
      nrc: val('nrc'),
      nombre: val('nombre'),
      cod_actividad: val('cod_actividad'),
      desc_actividad: val('desc_actividad'),
      nombre_comercial: val('nombre_comercial'),
      departamento: form.querySelector('.depto-select')?.value || '',
      municipio: form.querySelector('[name="municipio"]')?.value || '',
      complemento: val('complemento'),
      telefono: val('telefono'),
      correo: val('correo'),
    },
    items,
    condicionOperacion: Number($('#condicion').value),
    ivaPerci1: numVal($('#iva-perci')?.value || 0),
    ivaRete1: numVal($('#iva-rete')?.value || 0),
    reteRenta: numVal($('#rete-renta')?.value || 0),
    extension: {
      nombEntrega: $('#ext-entrega-nom')?.value || null,
      docuEntrega: $('#ext-entrega-doc')?.value || null,
      nombRecibe: $('#ext-recibe-nom')?.value || null,
      docuRecibe: $('#ext-recibe-doc')?.value || null,
      observaciones: $('#ext-obs')?.value || null,
    },
  };

  if (Number(body.condicionOperacion) === 1) {
    body.pagos = [{ codigo: $('#forma-pago').value, montoPago: 0 }];
  } else {
    body.pagos = [{ codigo: $('#forma-pago').value, montoPago: 0, periodo: Number($('#plazo').value) || 30, plazo: $('#plazo-unidad').value || '01' }];
  }

  if (tipo === '05') {
    const opt = $('#doc-relacionado').selectedOptions[0];
    if (!opt) return toast('Seleccione el documento relacionado', 'error');
    body.docRelacionado = {
      tipoDocumento: opt.dataset.tipo,
      numeroDocumento: opt.dataset.num,
      fechaEmision: opt.dataset.fec,
      tipoGeneracion: 2,
    };
  }

  const btn = $('#btn-emitir');
  btn.disabled = true; btn.textContent = 'Procesando...';
  try {
    const r = await API.emitir(body);
    state.ultimoResultado = r;
    mostrarResultado(r);
  } catch (e) {
    toast(e.error || 'Error al emitir el DTE', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Emitir DTE';
  }
}

function mostrarResultado(r) {
  const ok = r.ok;
  state.ultimoResultado = r;
  const clientName = r.dte?.receptor?.nombre || 'CLIENTE';
  const tipoNom = DTEVisual ? DTEVisual.getNombreTipo(r.tipoDte || r.dte?.identificacion?.tipoDte) : 'DTE';
  const numCtrl = r.numeroControl || r.codigoGeneracion || 'DOC';
  const fileName = `${tipoNom.replace(/\s+/g, '_')}_${numCtrl}_${DTEVisual ? DTEVisual.sanitizarNombre(clientName) : 'CLIENTE'}`;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-backdrop" onclick="if(event.target===this)this.remove()">
      <div class="modal modal-resultado-dte" style="max-width:840px;width:94vw;padding:28px 30px">
        <div class="flex" style="justify-content:space-between;align-items:center;margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:10px">
            <h3 style="margin-bottom:0">${ok ? '✅ DTE Generado y Procesado' : '⚠️ DTE con Observaciones o Errores'}</h3>
            <span class="badge-estado ${esc(r.estado)}">${esc(r.estado)}</span>
          </div>
          <button class="btn-close-corner" type="button" onclick="this.closest('.modal-backdrop').remove()" title="Cerrar ventana">✕ Cerrar</button>
        </div>
        ${r.emailEnviado ? `<div class="alert alert-success mb" style="display:flex;align-items:center;gap:8px;font-size:13px"><span>✉️</span><span><b>Correo enviado automáticamente:</b> Comprobante DTE y archivo JSON entregados a <b>${esc(r.emailDestinatario || 'spacioprintrotulos@gmail.com')}</b></span></div>` : ''}
        ${r.estado === 'SIMULADO' ? '<div class="alert alert-warning mb">Credenciales MH no configuradas: documento generado en modo SIMULADO (no transmitido). Configure su certificado y credenciales en <a href="#/configuracion" style="color:var(--azul)">Configuración</a>.</div>' : ''}
        ${r.estado === 'RECHAZADO' || r.estado === 'ERROR' ? `<div class="alert alert-error mb">${esc(JSON.stringify(r.respuesta))}</div>` : ''}
        <div class="resumen-box mb">
          <div class="resumen-row"><span>Tipo de Documento</span><span><b>${esc(tipoNom)}</b></span></div>
          <div class="resumen-row"><span>Cliente / Receptor</span><span><b>${esc(clientName)}</b></span></div>
          <div class="resumen-row"><span>Número de control</span><span><b>${esc(r.numeroControl)}</b></span></div>
          <div class="resumen-row"><span>Código de generación</span><span style="font-size:12px"><b>${esc(r.codigoGeneracion)}</b></span></div>
          <div class="resumen-row"><span>Sello de recepción</span><span style="font-size:12px">${esc(r.selloRecibido || '—')}</span></div>
          <div class="resumen-row total"><span>Total a Pagar</span><span>${fmtMoneda(r.total)}</span></div>
        </div>
        <div class="dte-actions-container">
          <!-- Fila Principal: 3 columnas perfectamente distribuidas -->
          <div class="dte-actions-primary">
            <button class="btn btn-verde" onclick="verComprobanteUltimo()">
              <span class="btn-icon">📄</span>
              <span>Ver Comprobante / Imprimir</span>
            </button>
            <button class="btn btn-azul" onclick="enviarEmailUltimo()">
              <span class="btn-icon">✉️</span>
              <span>Enviar por Correo</span>
            </button>
            <button class="btn btn-whatsapp" onclick="enviarWhatsAppUltimo()">
              <span class="btn-icon">💬</span>
              <span>Enviar por WhatsApp</span>
            </button>
          </div>

          <!-- Fila Secundaria: 3 columnas perfectamente distribuidas de extremo a extremo -->
          <div class="dte-actions-secondary">
            <button class="btn btn-magenta" onclick="descargarPDFResultado('${fileName}')">
              <span class="btn-icon">⬇️</span>
              <span>Descargar PDF</span>
            </button>
            <button class="btn btn-json" onclick="descargarJSONResultado('${fileName}')">
              <span class="btn-icon">{ }</span>
              <span>Descargar JSON</span>
            </button>
            <button class="btn btn-otro" onclick="location.hash='#/'; this.closest('.modal-backdrop').remove()">
              <span class="btn-icon">➕</span>
              <span>Emitir otro DTE</span>
            </button>
          </div>
        </div>
      </div>
    </div>`);
}

window.verComprobanteUltimo = () => {
  const r = state.ultimoResultado;
  if (!r || !r.dte) return toast('No hay DTE disponible', 'error');
  if (typeof DTEVisual !== 'undefined') {
    DTEVisual.previsualizar(r.dte, { sello: r.selloRecibido });
  }
};

window.enviarEmailUltimo = () => {
  const r = state.ultimoResultado;
  if (!r || !r.dte) return toast('No hay DTE disponible', 'error');
  if (typeof DTEVisual !== 'undefined') {
    DTEVisual.enviarEmail(r.dte, { sello: r.selloRecibido });
  }
};

window.enviarWhatsAppUltimo = () => {
  const r = state.ultimoResultado;
  if (!r || !r.dte) return toast('No hay DTE disponible', 'error');
  if (typeof DTEVisual !== 'undefined') {
    DTEVisual.enviarWhatsApp(r.dte, { sello: r.selloRecibido });
  }
};

window.descargarPDFResultado = (fileName) => {
  const r = state.ultimoResultado;
  if (!r || !r.dte) return toast('No hay DTE disponible', 'error');
  if (typeof DTEVisual !== 'undefined') {
    DTEVisual.descargarDTE(r.dte, { sello: r.selloRecibido }, fileName);
  }
};

window.descargarJSONResultado = (fileName) => {
  const r = state.ultimoResultado;
  if (!r || !r.dte) return;
  if (typeof DTEVisual !== 'undefined') {
    DTEVisual.descargarJSON(r.dte, fileName);
  } else {
    const blob = new Blob([JSON.stringify(r.dte, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${fileName || 'DTE'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
};

window.descargarJSON = () => {
  const r = state.ultimoResultado;
  if (!r) return;
  const clientName = r.dte?.receptor?.nombre || 'CLIENTE';
  const tipoNom = DTEVisual ? DTEVisual.getNombreTipo(r.tipoDte || r.dte?.identificacion?.tipoDte) : 'DTE';
  const fileName = `${tipoNom.replace(/\s+/g, '_')}_${r.numeroControl || r.codigoGeneracion}_${DTEVisual ? DTEVisual.sanitizarNombre(clientName) : 'CLIENTE'}`;
  window.descargarJSONResultado(fileName);
};

// ---------- VISTA: Clientes ----------
let clientesCache = [];
function renderClientes(app) {
  app.innerHTML = appShell(`
    <div class="page-head">
      <div><div class="crumb"><a href="#/" style="color:var(--azul);text-decoration:none">Inicio</a> / Clientes</div><h2>Directorio de Clientes</h2></div>
      <div class="actions">
        <a href="#/" class="btn-volver"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Volver al inicio</a>
        <input id="buscar-cliente" placeholder="Buscar por nombre, NIT o NRC..." style="min-width:260px">
        <button class="btn btn-verde" onclick="modalCliente()">+ Nuevo cliente</button>
      </div>
    </div>
    <div class="card">
      <div class="table-responsive">
        <table class="data-table">
          <thead><tr><th>Nombre</th><th>NIT / DUI</th><th>NRC</th><th>Departamento</th><th>Teléfono</th><th style="text-align:right;min-width:140px">Acciones</th></tr></thead>
          <tbody id="clientes-body"><tr><td colspan="6" class="center text-gris">Cargando...</td></tr></tbody>
        </table>
      </div>
    </div>`);

  const cargar = (q) => {
    API.clientes(q).then((r) => {
      clientesCache = r.clientes;
      $('#clientes-body').innerHTML = r.clientes.length
        ? r.clientes.map((c) => `
          <tr>
            <td><b>${esc(c.nombre)}</b>${c.nombre_comercial ? `<br><span class="small text-gris">${esc(c.nombre_comercial)}</span>` : ''}</td>
            <td>${esc(c.num_documento || '—')}</td>
            <td>${esc(c.nrc || '—')}</td>
            <td>${esc(nombreDepto(c.departamento))}</td>
            <td>${esc(c.telefono || '—')}</td>
            <td class="cell-actions" style="text-align:right">
              <div class="btn-group-actions">
                <button class="btn btn-secundario btn-xs" onclick="modalCliente(${c.id})">✏️ Editar</button>
                <button class="btn btn-rojo btn-xs" onclick="borrarCliente(${c.id})">🗑️</button>
              </div>
            </td>
          </tr>`).join('')
        : '<tr><td colspan="6" class="center text-gris">Sin clientes registrados</td></tr>';
    }).catch((e) => toast(e.error, 'error'));
  };

  $('#buscar-cliente').addEventListener('input', (e) => {
    clearTimeout(cargar._t);
    cargar._t = setTimeout(() => cargar(e.target.value), 300);
  });

  cargar('');
}

function nombreDepto(cod) {
  const d = state.cat?.departamentos.find((x) => x.codigo === cod);
  return d ? d.nombre : (cod || '');
}

window.borrarCliente = async (id) => {
  if (!confirm('¿Eliminar este cliente?')) return;
  try { await API.eliminarCliente(id); toast('Cliente eliminado', 'success'); renderClientes($('#app')); }
  catch (e) { toast(e.error, 'error'); }
};

window.modalCliente = (id) => {
  const c = id ? clientesCache.find((x) => x.id === id) : {};
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-backdrop" onclick="if(event.target===this)this.remove()">
      <div class="modal modal-lg" style="max-width:760px">
        <div class="flex" style="justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3 style="margin:0">${id ? 'Editar cliente' : 'Nuevo cliente'}</h3>
          <button class="btn-close-corner" type="button" onclick="this.closest('.modal-backdrop').remove()">✕ Cerrar</button>
        </div>
        <div class="grid-3">
          <div class="form-field"><label>Tipo de documento</label><select id="c-tipo">${state.cat.tipoDocumento.map((t) => `<option value="${t.codigo}" ${t.codigo === (c.tipo_documento || '13') ? 'selected' : ''}>${esc(t.nombre)}</option>`).join('')}</select></div>
          <div class="form-field"><label>Número de documento</label><input id="c-num" value="${esc(c.num_documento || '')}"></div>
          <div class="form-field"><label>NRC</label><input id="c-nrc" value="${esc(c.nrc || '')}"></div>
          <div class="form-field" style="grid-column:1/-1"><label>Nombre / Razón social</label><input id="c-nombre" value="${esc(c.nombre || '')}"></div>
          <div class="form-field"><label>Nombre comercial</label><input id="c-ncomercial" value="${esc(c.nombre_comercial || '')}"></div>
          <div class="form-field">
            <label>Código actividad (CAT-019)</label>
            <div style="display:flex;gap:6px">
              <input id="c-codact" list="dl-actividades" value="${esc(c.cod_actividad || '')}" placeholder="Ej. 73101" style="flex:1">
              <button type="button" class="btn btn-secundario btn-xs" id="btn-buscar-act-cliente" title="Buscar en catálogo">🔍</button>
            </div>
            ${selActividades()}
          </div>
          <div class="form-field"><label>Giro / Actividad económica</label><input id="c-descact" value="${esc(c.desc_actividad || nombreActividad(c.cod_actividad) || '')}" placeholder="Descripción de actividad"></div>
          <div class="form-field"><label>Departamento</label><div id="c-depto">${selDeptos('c-mun', c.departamento)}</div></div>
          <div class="form-field"><label>Municipio</label><div id="c-mun">${selMunicipios(c.departamento, c.municipio)}</div></div>
          <div class="form-field"><label>Complemento</label><input id="c-comp" value="${esc(c.complemento || '')}"></div>
          <div class="form-field"><label>Teléfono</label><input id="c-tel" value="${esc(c.telefono || '')}"></div>
          <div class="form-field"><label>Correo</label><input id="c-correo" value="${esc(c.correo || '')}"></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-cancelar" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button>
          <button class="btn btn-verde" id="c-guardar">Guardar</button>
        </div>
      </div>
    </div>`);

  const modal = document.body.lastElementChild;
  const deptoSel = modal.querySelector('.depto-select');
  deptoSel.addEventListener('change', () => {
    $('#c-mun', modal).innerHTML = selMunicipios(deptoSel.value, '');
  });

  const codInput = $('#c-codact', modal);
  const descInput = $('#c-descact', modal);
  codInput.addEventListener('input', () => {
    const res = resolverActividad(codInput.value);
    if (res.codigo && res.codigo !== codInput.value && /^\d{5,6}$/.test(res.codigo)) {
      codInput.value = res.codigo;
    }
    if (res.descripcion) descInput.value = res.descripcion;
  });
  codInput.addEventListener('change', () => {
    const res = resolverActividad(codInput.value);
    if (res.codigo) codInput.value = res.codigo;
    if (res.descripcion) descInput.value = res.descripcion;
  });
  $('#btn-buscar-act-cliente', modal)?.addEventListener('click', () => {
    window.modalBuscarActividad((cod, desc) => {
      codInput.value = cod;
      descInput.value = desc;
    });
  });

  $('#c-guardar', modal).addEventListener('click', async () => {
    const actRes = resolverActividad($('#c-codact', modal).value.trim());
    const finalCod = actRes.codigo || $('#c-codact', modal).value.trim();
    const finalDesc = $('#c-descact', modal).value.trim() || actRes.descripcion || nombreActividad(finalCod);

    const datos = {
      tipo_documento: $('#c-tipo', modal).value,
      num_documento: $('#c-num', modal).value.trim(),
      nrc: $('#c-nrc', modal).value.trim(),
      nombre: $('#c-nombre', modal).value.trim(),
      nombre_comercial: $('#c-ncomercial', modal).value.trim(),
      cod_actividad: finalCod,
      desc_actividad: finalDesc,
      departamento: deptoSel.value,
      municipio: $('#c-mun', modal).querySelector('[name="municipio"]')?.value || '',
      complemento: $('#c-comp', modal).value.trim(),
      telefono: $('#c-tel', modal).value.trim(),
      correo: $('#c-correo', modal).value.trim(),
    };
    if (!datos.nombre) return toast('El nombre es requerido', 'error');
    try {
      if (id) await API.actualizarCliente(id, datos);
      else await API.crearCliente(datos);
      toast('Cliente guardado', 'success');
      modal.remove();
      renderClientes($('#app'));
    } catch (e) { toast(e.error, 'error'); }
  });
};

// ---------- VISTA: DTEs emitidos ----------
function renderDTEs(app, filtroTipo) {
  app.innerHTML = appShell(`
    <div class="page-head">
      <div><div class="crumb"><a href="#/" style="color:var(--azul);text-decoration:none">Inicio</a> / DTEs</div><h2>Documentos emitidos</h2></div>
      <div class="actions">
        <a href="#/" class="btn-volver"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Volver al inicio</a>
        <select id="f-tipo"><option value="">Todos los tipos</option>${state.cat.tipoDte.map((t) => `<option value="${t.codigo}" ${t.codigo === filtroTipo ? 'selected' : ''}>${esc(t.nombre)}</option>`).join('')}</select>
        <select id="f-estado"><option value="">Todos los estados</option><option>PROCESADO</option><option>SIMULADO</option><option>RECHAZADO</option><option>ANULADO</option></select>
        <button class="btn btn-secundario" onclick="cargarDTEs()">Filtrar</button>
      </div>
    </div>
    <div class="card">
      <div class="table-responsive">
        <table class="data-table">
          <thead><tr><th>#</th><th>Número de control</th><th>Tipo</th><th>Receptor</th><th>Fecha</th><th>Total</th><th>Estado</th><th style="text-align:right;min-width:215px">Acciones</th></tr></thead>
          <tbody id="dtes-body"><tr><td colspan="8" class="center text-gris">Cargando...</td></tr></tbody>
        </table>
      </div>
    </div>`);

  window.cargarDTEs = () => {
    API.dtes({ tipo: $('#f-tipo').value, estado: $('#f-estado').value }).then((r) => {
      $('#dtes-body').innerHTML = r.dtes.length
        ? r.dtes.map((d) => `
          <tr>
            <td>${d.id}</td>
            <td><b>${esc(d.numero_control)}</b><br><span class="small text-gris">${esc(d.codigo_generacion)}</span></td>
            <td>${esc(nombreTipo(d.tipo_dte))}</td>
            <td>${esc(d.receptor_nombre)}</td>
            <td>${esc(d.fec_emi)}</td>
            <td><b>${fmtMoneda(d.total)}</b></td>
            <td><span class="badge-estado ${esc(d.estado)}">${esc(d.estado)}</span></td>
            <td class="cell-actions" style="text-align:right">
              <div class="btn-group-actions">
                <button class="btn btn-verde btn-xs" onclick="verComprobanteDTE(${d.id})" title="Ver comprobante e imprimir">📄 Ver PDF</button>
                <button class="btn btn-secundario btn-xs" onclick="verDTE(${d.id})" title="Detalles y JSON">👁️ JSON</button>
                ${d.estado === 'PROCESADO' ? '<button class="btn btn-rojo btn-xs" onclick="modalAnular(' + d.id + ')" title="Anular DTE">✕ Anular</button>' : ''}
              </div>
            </td>
          </tr>`).join('')
        : '<tr><td colspan="8" class="center text-gris">Sin documentos</td></tr>';
    }).catch((e) => toast(e.error, 'error'));
  };

  cargarDTEs();
}

function nombreTipo(cod) {
  const t = state.cat.tipoDte.find((x) => x.codigo === cod);
  return t ? t.nombre : cod;
}

window.verComprobanteDTE = async (id) => {
  try {
    const { dte } = await API.dte(id);
    const dteObj = JSON.parse(dte.dte_json);
    dteObj.estado = dte.estado;
    if (typeof DTEVisual !== 'undefined') {
      DTEVisual.previsualizar(dteObj, { sello: dte.sello_recibido });
    }
  } catch (e) {
    toast(e.error || 'Error al cargar el comprobante', 'error');
  }
};

window.verDTE = async (id) => {
  try {
    const { dte } = await API.dte(id);
    const dteObj = JSON.parse(dte.dte_json);
    const clientName = dte.receptor_nombre || dteObj.receptor?.nombre || 'CLIENTE';
    const tipoNom = DTEVisual ? DTEVisual.getNombreTipo(dte.tipo_dte) : 'DTE';
    const fileName = `${tipoNom.replace(/\s+/g, '_')}_${dte.numero_control}_${DTEVisual ? DTEVisual.sanitizarNombre(clientName) : 'CLIENTE'}`;

    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-backdrop" onclick="if(event.target===this)this.remove()">
        <div class="modal" style="max-width:850px">
          <div class="flex" style="justify-content:space-between;align-items:center;margin-bottom:14px">
            <div style="display:flex;align-items:center;gap:10px">
              <h3 style="margin-bottom:0">DTE ${esc(dte.numero_control)}</h3>
              <span class="badge-estado ${esc(dte.estado)}">${esc(dte.estado)}</span>
            </div>
            <button class="btn-close-corner" type="button" onclick="this.closest('.modal-backdrop').remove()">✕ Cerrar</button>
          </div>
          <div class="resumen-box mb">
            <div class="resumen-row"><span>Tipo de Documento</span><span><b>${esc(tipoNom)}</b></span></div>
            <div class="resumen-row"><span>Receptor</span><span><b>${esc(dte.receptor_nombre)}</b></span></div>
            <div class="resumen-row"><span>Código generación</span><span style="font-size:12px">${esc(dte.codigo_generacion)}</span></div>
            <div class="resumen-row"><span>Sello recibido</span><span style="font-size:12px">${esc(dte.sello_recibido || '—')}</span></div>
            <div class="resumen-row"><span>Fecha emisión</span><span>${esc(dte.fec_emi)} ${esc(dte.hor_emi)}</span></div>
            <div class="resumen-row total"><span>Total</span><span>${fmtMoneda(dte.total)}</span></div>
          </div>
          ${dte.estado === 'RECHAZADO' ? `<div class="alert alert-error mb">${esc(dte.observaciones || 'Rechazado por el MH')}</div>` : ''}
          <h3 style="margin-bottom:8px">JSON del documento</h3>
          <pre class="json-view">${esc(JSON.stringify(dteObj, null, 2))}</pre>
          <div class="modal-actions" style="display:grid;grid-template-columns:repeat(4, 1fr);gap:10px;margin-top:20px;width:100%">
            <button class="btn btn-verde" onclick="this.closest('.modal-backdrop').remove(); verComprobanteDTE(${dte.id})">📄 Ver PDF</button>
            <button class="btn btn-azul" onclick="enviarEmailDTEId(${dte.id})">✉️ Email</button>
            <button class="btn btn-whatsapp" onclick="enviarWhatsAppDTEId(${dte.id})">💬 WhatsApp</button>
            <button class="btn btn-json" onclick="descargarDTEJSON(${dte.id})">⬇️ JSON</button>
          </div>
        </div>
      </div>`);
  } catch (e) { toast(e.error, 'error'); }
};

window.enviarEmailDTEId = async (id) => {
  try {
    const { dte } = await API.dte(id);
    const dteObj = JSON.parse(dte.dte_json);
    dteObj.estado = dte.estado;
    if (typeof DTEVisual !== 'undefined') {
      DTEVisual.enviarEmail(dteObj, { sello: dte.sello_recibido });
    }
  } catch (e) { toast(e.error || 'Error al preparar correo', 'error'); }
};

window.enviarWhatsAppDTEId = async (id) => {
  try {
    const { dte } = await API.dte(id);
    const dteObj = JSON.parse(dte.dte_json);
    dteObj.estado = dte.estado;
    if (typeof DTEVisual !== 'undefined') {
      DTEVisual.enviarWhatsApp(dteObj, { sello: dte.sello_recibido });
    }
  } catch (e) { toast(e.error || 'Error al preparar WhatsApp', 'error'); }
};

window.descargarDTEJSON = async (id) => {
  const { dte } = await API.dte(id);
  const dteObj = JSON.parse(dte.dte_json);
  const clientName = dte.receptor_nombre || dteObj.receptor?.nombre || 'CLIENTE';
  const tipoNom = DTEVisual ? DTEVisual.getNombreTipo(dte.tipo_dte) : 'DTE';
  const fileName = `${tipoNom.replace(/\s+/g, '_')}_${dte.numero_control}_${DTEVisual ? DTEVisual.sanitizarNombre(clientName) : 'CLIENTE'}`;
  const blob = new Blob([JSON.stringify(dteObj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${fileName}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
};

window.modalAnular = (id) => {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-backdrop" onclick="if(event.target===this)this.remove()">
      <div class="modal">
        <div class="flex" style="justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3 style="margin:0">Anular DTE #${id}</h3>
          <button class="btn-close-corner" type="button" onclick="this.closest('.modal-backdrop').remove()">✕ Cerrar</button>
        </div>
        <div class="alert alert-warning mb">Esta acción generará un evento de invalidación y lo enviará al Ministerio de Hacienda.</div>
        <div class="form-field"><label>Motivo de anulación</label><select id="an-motivo">${state.cat.tipoInvalidacion.map((t) => `<option value="${t.codigo}">${esc(t.nombre)}</option>`).join('')}</select></div>
        <div class="grid-3">
          <div class="form-field"><label>Responsable — nombre</label><input id="an-r-nom"></div>
          <div class="form-field"><label>Responsable — doc. tipo</label><select id="an-r-tipo">${state.cat.tipoDocumento.map((t) => `<option value="${t.codigo}">${esc(t.nombre)}</option>`).join('')}</select></div>
          <div class="form-field"><label>Responsable — doc. número</label><input id="an-r-num"></div>
          <div class="form-field"><label>Solicitante — nombre</label><input id="an-s-nom"></div>
          <div class="form-field"><label>Solicitante — doc. tipo</label><select id="an-s-tipo">${state.cat.tipoDocumento.map((t) => `<option value="${t.codigo}">${esc(t.nombre)}</option>`).join('')}</select></div>
          <div class="form-field"><label>Solicitante — doc. número</label><input id="an-s-num"></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-cancelar" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button>
          <button class="btn btn-rojo" onclick="anular(${id})">Confirmar anulación</button>
        </div>
      </div>
    </div>`);
};

window.anular = async (id) => {
  const body = {
    dteId: id,
    motivo: $('#an-motivo').value,
    responsable: { nombre: $('#an-r-nom').value, tipoDocumento: $('#an-r-tipo').value, numDocumento: $('#an-r-num').value },
    solicita: { nombre: $('#an-s-nom').value, tipoDocumento: $('#an-s-tipo').value, numDocumento: $('#an-s-num').value },
  };
  if (!body.responsable.nombre || !body.solicita.nombre) return toast('Nombre del responsable y solicitante son requeridos', 'error');
  try {
    const r = await API.anular(body);
    toast('DTE anulado por el MH', 'success');
    document.querySelector('.modal-backdrop')?.remove();
    cargarDTEs();
  } catch (e) { toast(e.error, 'error'); }
};

// ---------- VISTA: Cotizaciones ----------
let cotizacionesCache = [];
let cotClientesCache = [];
let nextCorrelativoCot = '0011';
let cotItems = [{ quantity: 1, description: '', price: 0 }];

function displayDateES(input) {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const parts = String(input || '').split('-');
  if (parts.length !== 3) return input || '';
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (Number.isNaN(date.getTime())) return input || '';
  return `${String(date.getDate()).padStart(2, '0')}  de ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function wrapTextLines(text, maxChars, maxLines = 7) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].slice(0, Math.max(0, maxChars - 3))}...`;
    return kept;
  }
  return lines.length ? lines : [''];
}

function svgTextElement(x, y, text, opts = {}) {
  const size = opts.size || 8;
  const weight = opts.weight || '400';
  const anchor = opts.anchor || 'start';
  const fill = opts.fill || '#111111';
  const transform = opts.transform ? ` transform="${opts.transform}"` : '';
  return `<text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}"${transform}>${esc(text)}</text>`;
}

function generateCotizacionSvg(quote) {
  const delivery = Number(quote.dias_entrega) === 1 ? '1 Dia' : `${quote.dias_entrega || 1} Dias`;
  const items = quote.items || [];
  const itemRows = items.slice(0, 10);
  const tableX = 50;
  const tableY = 255;
  const tableW = 495;
  const headerH = 31;
  const rowH = 25;
  const colQty = 52;
  const colDesc = 248;
  const colUnit = 90;
  const colTotal = 105;
  const xDesc = tableX + colQty;
  const xUnit = xDesc + colDesc;
  const xTotal = xUnit + colUnit;
  const tableBottom = tableY + headerH + (itemRows.length * rowH);
  const notesText = String(quote.notas || '').trim();
  const notesLines = notesText ? wrapTextLines(notesText.toUpperCase(), 95, 4) : [];
  const notesBlockH = notesLines.length ? 14 + notesLines.length * 10 + 6 : 0;
  const totalsY = Math.max(548, tableBottom + notesBlockH + 18);
  const notesY = totalsY - notesBlockH;

  let itemText = '';
  itemRows.forEach((item, index) => {
    const y = tableY + headerH + index * rowH;
    const fill = index % 2 === 0 ? '#ffffff' : '#f6f7f8';
    itemText += `<rect x="${tableX}" y="${y}" width="${tableW}" height="${rowH}" fill="${fill}"/>`;
    itemText += svgTextElement(tableX + 26, y + 16, item.quantity, { size: 8, anchor: 'middle', fill: '#242a31' });
    wrapTextLines(String(item.description || '').toUpperCase(), 45, 2).forEach((line, lineIndex) => {
      itemText += svgTextElement(xDesc + 12, y + 13 + lineIndex * 8.3, line, { size: 6.4, fill: '#242a31' });
    });
    itemText += svgTextElement(xUnit + 14, y + 16, '$', { size: 8, fill: '#242a31' });
    itemText += svgTextElement(xUnit + colUnit - 12, y + 16, Number(item.price || 0).toFixed(2), { size: 8, anchor: 'end', fill: '#242a31' });
    itemText += svgTextElement(xTotal + 14, y + 16, '$', { size: 8, fill: '#242a31' });
    itemText += svgTextElement(tableX + tableW - 12, y + 16, Number(item.quantity * item.price).toFixed(2), { size: 8, anchor: 'end', fill: '#242a31' });
  });

  const paymentTerms = String(quote.condiciones_pago || 'Contra entrega');
  const paymentLines = wrapTextLines(paymentTerms.toUpperCase(), 34, 2)
    .map((line, index) => svgTextElement(64, totalsY + 85 + (index * 10), line, { size: 8.5, weight: '700', fill: '#17202a' }))
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="595" height="842" viewBox="0 0 595 842" style="background:#fff;display:block;margin:0 auto">
  <rect width="595" height="842" fill="#f3f4f6"/>
  <rect x="35" y="34" width="525" height="774" fill="#ffffff"/>
  <rect x="35" y="775" width="525" height="33" fill="#2b3036"/>
  <image href="assets/image1.png" x="58" y="58" width="150" height="38" preserveAspectRatio="xMinYMid meet"/>
  <image href="assets/image2.png" x="172" y="386" width="250" height="62" opacity="0.09" preserveAspectRatio="xMidYMid meet"/>

  ${svgTextElement(545, 88, 'COTIZACION', { size: 31, weight: '700', anchor: 'end', fill: '#2b3036' })}
  ${svgTextElement(545, 108, `N# ${quote.correlative || quote.correlativo}`, { size: 9, weight: '700', anchor: 'end', fill: '#1f4e9a' })}

  <line x1="50" y1="132" x2="545" y2="132" stroke="#d8dde3" stroke-width="1"/>
  ${svgTextElement(50, 156, 'COTIZACION PARA', { size: 8, weight: '700', fill: '#69717b' })}
  ${svgTextElement(50, 176, String(quote.customer || quote.cliente_nombre || '').toUpperCase(), { size: 16, weight: '700', fill: '#17202a' })}
  ${svgTextElement(50, 196, `TEL: ${quote.phone || quote.telefono || ''}`, { size: 8.8, fill: '#3b4652' })}
  ${svgTextElement(50, 211, `San Salvador ${displayDateES(quote.date || quote.fecha)}`, { size: 8.8, fill: '#3b4652' })}

  ${svgTextElement(355, 156, 'DATOS DE CONTACTO', { size: 8, weight: '700', fill: '#69717b' })}
  ${svgTextElement(355, 176, 'Residencial La Cima Av 3-D', { size: 8.8, fill: '#3b4652' })}
  ${svgTextElement(355, 191, 'San Salvador', { size: 8.8, fill: '#3b4652' })}
  ${svgTextElement(355, 206, '7210-8369 / 2232-3353', { size: 8.8, weight: '700', fill: '#17202a' })}
  <image href="assets/image3.png" x="507" y="194" width="15" height="16" preserveAspectRatio="xMidYMid meet"/>

  ${svgTextElement(50, 242, 'DE ACUERDO A SU SOLICITUD TENEMOS EL AGRADO DE ENVIARLE LA COTIZACION QUE SE DESCRIBE A CONTINUACION', { size: 7, fill: '#3b4652' })}

  <rect x="${tableX}" y="${tableY}" width="${tableW}" height="${headerH}" fill="#2b3036"/>
  ${svgTextElement(tableX + 26, tableY + 20, 'CANT.', { size: 8, weight: '700', anchor: 'middle', fill: '#ffffff' })}
  ${svgTextElement(xDesc + 12, tableY + 20, 'DESCRIPCION', { size: 8, weight: '700', fill: '#ffffff' })}
  ${svgTextElement(xUnit + 45, tableY + 20, 'PRECIO', { size: 8, weight: '700', anchor: 'middle', fill: '#ffffff' })}
  ${svgTextElement(xTotal + 52, tableY + 20, 'TOTAL', { size: 8, weight: '700', anchor: 'middle', fill: '#ffffff' })}
  ${itemText}

  <rect x="${tableX}" y="${tableY}" width="${tableW}" height="${headerH + itemRows.length * rowH}" fill="none" stroke="#d8dde3" stroke-width="1"/>
  <line x1="${xDesc}" y1="${tableY}" x2="${xDesc}" y2="${tableBottom}" stroke="#e0e4e8" stroke-width="1"/>
  <line x1="${xUnit}" y1="${tableY}" x2="${xUnit}" y2="${tableBottom}" stroke="#e0e4e8" stroke-width="1"/>
  <line x1="${xTotal}" y1="${tableY}" x2="${xTotal}" y2="${tableBottom}" stroke="#e0e4e8" stroke-width="1"/>

  ${notesLines.length ? `
  <rect x="50" y="${notesY}" width="495" height="${notesBlockH}" fill="#f6f7f8" stroke="#d8dde3" stroke-width="1"/>
  ${svgTextElement(62, notesY + 9, 'NOTAS', { size: 7, weight: '700', fill: '#69717b' })}
  ${notesLines.map((line, index) => svgTextElement(62, notesY + 21 + index * 10, line, { size: 8, fill: '#3b4652' })).join('')}
  ` : ''}

  <rect x="350" y="${totalsY}" width="195" height="31" fill="#ffffff" stroke="#d8dde3" stroke-width="1"/>
  <rect x="350" y="${totalsY + 31}" width="195" height="31" fill="#ffffff" stroke="#d8dde3" stroke-width="1"/>
  <rect x="350" y="${totalsY + 62}" width="195" height="36" fill="#2b3036"/>
  ${svgTextElement(365, totalsY + 20, 'SUBTOTAL', { size: 8.5, fill: '#3b4652' })}
  ${svgTextElement(533, totalsY + 20, `$ ${Number(quote.subtotal || 0).toFixed(2)}`, { size: 8.5, anchor: 'end', fill: '#17202a' })}
  ${svgTextElement(365, totalsY + 51, 'IVA 13%', { size: 8.5, fill: '#3b4652' })}
  ${svgTextElement(533, totalsY + 51, `$ ${Number(quote.iva || 0).toFixed(2)}`, { size: 8.5, anchor: 'end', fill: '#17202a' })}
  ${svgTextElement(365, totalsY + 85, 'TOTAL', { size: 12, weight: '700', fill: '#ffffff' })}
  ${svgTextElement(533, totalsY + 85, `$ ${Number(quote.total || 0).toFixed(2)}`, { size: 12, weight: '700', anchor: 'end', fill: '#ffffff' })}

  ${svgTextElement(50, totalsY + 19, 'TIEMPO DE ENTREGA', { size: 8, weight: '700', fill: '#69717b' })}
  ${svgTextElement(64, totalsY + 39, delivery, { size: 12, weight: '700', fill: '#17202a' })}
  ${svgTextElement(50, totalsY + 72, 'CONDICIONES DE PAGO', { size: 8, weight: '700', fill: '#69717b' })}
  ${paymentLines}
  ${svgTextElement(50, totalsY + 125, 'COTIZACION VALIDA DURANTE 15 DIAS HABILES', { size: 8, weight: '700', fill: '#3b4652' })}
  ${svgTextElement(50, totalsY + 142, 'EN ESPERA DE SUS RESPETABLES ORDENES NOS SUSCRIBIMOS ATENTAMENTE', { size: 7.4, fill: '#69717b' })}

  <image href="assets/image4.png" x="396" y="${totalsY + 112}" width="94" height="46" preserveAspectRatio="xMidYMid meet"/>
  <line x1="365" y1="${totalsY + 172}" x2="530" y2="${totalsY + 172}" stroke="#2b3036" stroke-width="1"/>
  ${svgTextElement(448, totalsY + 188, 'Lic. Ever Odir Ramos', { size: 8.5, anchor: 'middle', fill: '#17202a' })}
  ${svgTextElement(448, totalsY + 201, 'REPRESENTANTE', { size: 6.5, weight: '700', anchor: 'middle', fill: '#69717b' })}

  ${svgTextElement(74, 798, '7210-8369 / 2232-3353', { size: 8, fill: '#ffffff' })}
  ${svgTextElement(250, 798, 'Residencial La Cima Av 3-D, San Salvador', { size: 8, fill: '#ffffff' })}
</svg>`;
}

function renderCotizaciones(app, activeTab = 'nueva') {
  app.innerHTML = appShell(`
    <div class="page-head">
      <div>
        <div class="crumb"><a href="#/" style="color:var(--azul);text-decoration:none">Inicio</a> / Cotizaciones</div>
        <h2>Módulo de Cotizaciones Spacio</h2>
      </div>
      <div class="actions">
        <a href="#/" class="btn-volver"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Volver al inicio</a>
      </div>
    </div>

    <div class="tabs-nav">
      <button class="tab-btn ${activeTab === 'nueva' ? 'active' : ''}" id="tab-nueva" onclick="switchCotTab('nueva')">📝 Nueva Cotización</button>
      <button class="tab-btn ${activeTab === 'historial' ? 'active' : ''}" id="tab-historial" onclick="switchCotTab('historial')">📋 Historial de Cotizaciones (<span id="cot-badge-count">...</span>)</button>
    </div>

    <div id="cot-view-container">
      <div class="center text-gris" style="padding:40px">Cargando cotizaciones...</div>
    </div>
  `);

  window.switchCotTab = (tab) => {
    $('#tab-nueva')?.classList.toggle('active', tab === 'nueva');
    $('#tab-historial')?.classList.toggle('active', tab === 'historial');
    if (tab === 'nueva') pintarNuevaCotizacion();
    else pintarHistorialCotizaciones();
  };

  API.cotizaciones().then((r) => {
    cotizacionesCache = r.cotizaciones || [];
    cotClientesCache = r.clientes || [];
    nextCorrelativoCot = r.nextCorrelativo || '0001';
    const badge = $('#cot-badge-count');
    if (badge) badge.textContent = cotizacionesCache.length;
    if (activeTab === 'nueva') pintarNuevaCotizacion();
    else pintarHistorialCotizaciones();
  }).catch((e) => toast(e.error || 'Error al cargar cotizaciones', 'error'));
}

function pintarNuevaCotizacion() {
  const container = $('#cot-view-container');
  if (!container) return;

  const today = new Date().toISOString().slice(0, 10);

  container.innerHTML = `
    <datalist id="dl-cot-clientes">
      ${cotClientesCache.map((c) => `<option value="${esc(c.nombre)}"></option>`).join('')}
    </datalist>

    <div class="card">
      <h3><span class="badge">1</span> Datos generales de la cotización</h3>
      <div class="grid-3">
        <div class="form-field">
          <label>N° Correlativo</label>
          <input id="cot-correlativo" value="${esc(nextCorrelativoCot)}" placeholder="Ej: 0011">
        </div>
        <div class="form-field">
          <label>Fecha de emisión</label>
          <input id="cot-fecha" type="date" value="${today}">
        </div>
        <div class="form-field">
          <label>Cliente / Razón Social</label>
          <input id="cot-cliente" list="dl-cot-clientes" placeholder="Escribe o selecciona cliente...">
        </div>
        <div class="form-field">
          <label>Teléfono de contacto</label>
          <input id="cot-telefono" placeholder="Ej: 7210-8369 o +503...">
        </div>
        <div class="form-field">
          <label>Tiempo de entrega (días)</label>
          <input id="cot-dias" type="number" min="1" value="1">
        </div>
        <div class="form-field">
          <label>Condiciones de pago</label>
          <input id="cot-condiciones" value="Contra entrega" placeholder="Ej: Contra entrega, 50% Anticipo...">
        </div>
        <div class="form-field" style="grid-column: 1 / -1">
          <label>Notas / Observaciones (opcional)</label>
          <textarea id="cot-notas" rows="2" placeholder="Ej: No incluye instalación, cotización válida por 15 días..."></textarea>
        </div>
      </div>
    </div>

    <div class="card">
      <h3><span class="badge">2</span> Productos y servicios a cotizar</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th style="width:95px;min-width:85px;text-align:center">Cantidad</th>
            <th>Descripción del producto / trabajo</th>
            <th style="width:140px;text-align:right">Precio unitario</th>
            <th style="width:130px;text-align:right">Total</th>
            <th style="width:44px;text-align:center"></th>
          </tr>
        </thead>
        <tbody id="cot-items-body"></tbody>
      </table>
      <div class="btn-add-item">
        <button class="btn btn-secundario btn-add-item" id="btn-cot-add-item">+ Agregar producto / línea</button>
      </div>
    </div>

    <div class="card flex" style="justify-content:space-between;align-items:center;padding:24px;flex-wrap:wrap;gap:18px">
      <div class="resumen-box" style="min-width:320px;flex:1">
        <div class="resumen-row"><span>Subtotal</span><span id="cot-res-subtotal">$0.00</span></div>
        <div class="resumen-row"><span>IVA (13%)</span><span id="cot-res-iva">$0.00</span></div>
        <div class="resumen-row total"><span>Total a cotizar</span><span id="cot-res-total">$0.00</span></div>
      </div>
      <div class="flex" style="gap:12px">
        <button class="btn btn-cancelar" onclick="limpiarFormCotizacion()">Limpiar</button>
        <button class="btn btn-verde" id="btn-cot-guardar" style="font-size:15px;padding:14px 28px;box-shadow:0 10px 25px rgba(22,163,74,.3)">
          💾 Guardar y Generar PDF / Imprimir
        </button>
      </div>
    </div>
  `;

  $('#cot-cliente')?.addEventListener('input', (e) => {
    const found = cotClientesCache.find((c) => c.nombre.toLowerCase() === e.target.value.trim().toLowerCase());
    if (found && found.telefono) {
      $('#cot-telefono').value = found.telefono;
    }
  });

  const renderItemsRows = () => {
    const tbody = $('#cot-items-body');
    if (!tbody) return;
    tbody.innerHTML = cotItems.map((it, idx) => `
      <tr>
        <td><input type="number" min="1" step="1" class="cot-item-qty num" data-idx="${idx}" value="${it.quantity || 1}"></td>
        <td><input type="text" class="cot-item-desc" data-idx="${idx}" value="${esc(it.description || '')}" placeholder="Descripción del producto o servicio..."></td>
        <td><input type="number" min="0" step="0.01" class="cot-item-price num" data-idx="${idx}" value="${it.price || ''}" placeholder="0.00"></td>
        <td style="text-align:right;font-weight:700" class="cot-item-total">${fmtMoneda((Number(it.quantity) || 0) * (Number(it.price) || 0))}</td>
        <td style="text-align:center">
          ${cotItems.length > 1 ? `<button class="row-remove" onclick="removeCotItem(${idx})" title="Eliminar fila">×</button>` : ''}
        </td>
      </tr>
    `).join('');

    $$('.cot-item-qty', tbody).forEach((input) => input.addEventListener('input', (e) => {
      cotItems[e.target.dataset.idx].quantity = Number(e.target.value) || 0;
      updateCotTotals();
    }));
    $$('.cot-item-desc', tbody).forEach((input) => input.addEventListener('input', (e) => {
      cotItems[e.target.dataset.idx].description = e.target.value;
    }));
    $$('.cot-item-price', tbody).forEach((input) => input.addEventListener('input', (e) => {
      cotItems[e.target.dataset.idx].price = Number(e.target.value) || 0;
      updateCotTotals();
    }));

    updateCotTotals();
  };

  window.removeCotItem = (idx) => {
    if (cotItems.length > 1) {
      cotItems.splice(idx, 1);
      renderItemsRows();
    }
  };

  $('#btn-cot-add-item')?.addEventListener('click', () => {
    cotItems.push({ quantity: 1, description: '', price: 0 });
    renderItemsRows();
  });

  const updateCotTotals = () => {
    const rows = $$('#cot-items-body tr');
    let subtotal = 0;
    cotItems.forEach((it, idx) => {
      const lineTotal = (Number(it.quantity) || 0) * (Number(it.price) || 0);
      subtotal += lineTotal;
      if (rows[idx]) {
        const totalEl = rows[idx].querySelector('.cot-item-total');
        if (totalEl) totalEl.textContent = fmtMoneda(lineTotal);
      }
    });
    const iva = subtotal * 0.13;
    const total = subtotal + iva;
    $('#cot-res-subtotal').textContent = fmtMoneda(subtotal);
    $('#cot-res-iva').textContent = fmtMoneda(iva);
    $('#cot-res-total').textContent = fmtMoneda(total);
  };

  renderItemsRows();

  $('#btn-cot-guardar')?.addEventListener('click', async () => {
    const cliente = $('#cot-cliente').value.trim();
    if (!cliente) return toast('Ingresa el nombre del cliente', 'error');

    const validItems = cotItems
      .map((it) => ({
        quantity: Number(it.quantity || 0),
        description: String(it.description || '').trim(),
        price: Number(it.price || 0),
      }))
      .filter((it) => it.quantity > 0 && it.description);

    if (!validItems.length) return toast('Agrega al menos un producto con descripción y precio', 'error');

    const payload = {
      correlativo: $('#cot-correlativo').value.trim(),
      fecha: $('#cot-fecha').value,
      cliente_nombre: cliente,
      telefono: $('#cot-telefono').value.trim(),
      dias_entrega: Number($('#cot-dias').value) || 1,
      condiciones_pago: $('#cot-condiciones').value.trim(),
      notas: $('#cot-notas').value.trim(),
      items: validItems,
    };

    const btn = $('#btn-cot-guardar');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
      const r = await API.crearCotizacion(payload);
      toast(`Cotización N# ${r.cotizacion.correlativo} guardada con éxito`, 'success');
      modalVerCotizacion(r.cotizacion);
      cotItems = [{ quantity: 1, description: '', price: 0 }];
      const stateResp = await API.cotizaciones();
      cotizacionesCache = stateResp.cotizaciones || [];
      nextCorrelativoCot = stateResp.nextCorrelativo || '0001';
      const badge = $('#cot-badge-count');
      if (badge) badge.textContent = cotizacionesCache.length;
      pintarNuevaCotizacion();
    } catch (e) {
      toast(e.error || 'Error al guardar cotización', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '💾 Guardar y Generar PDF / Imprimir';
    }
  });

  window.limpiarFormCotizacion = () => {
    cotItems = [{ quantity: 1, description: '', price: 0 }];
    pintarNuevaCotizacion();
  };
}

function pintarHistorialCotizaciones() {
  const container = $('#cot-view-container');
  if (!container) return;

  container.innerHTML = `
    <div class="card">
      <div class="flex" style="justify-content:space-between;align-items:center;margin-bottom:18px">
        <input id="buscar-cot" placeholder="Buscar por cliente, N° correlativo, teléfono o producto..." style="min-width:320px;padding:10px 14px;border:1.5px solid var(--input-border);border-radius:12px;background:var(--input-bg);color:var(--texto)">
        <button class="btn btn-verde" onclick="switchCotTab('nueva')">+ Nueva cotización</button>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>N° Corr.</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Subtotal</th>
              <th>IVA (13%)</th>
              <th>Total</th>
              <th style="text-align:right;min-width:160px">Acciones</th>
            </tr>
          </thead>
          <tbody id="cot-historial-body"></tbody>
        </table>
      </div>
    </div>
  `;

  const renderRows = (query = '') => {
    const q = query.trim().toLowerCase();
    const filtered = cotizacionesCache.filter((c) => {
      if (!q) return true;
      const itemsStr = (c.items || []).map((it) => it.description).join(' ');
      const str = `${c.correlativo} ${c.cliente_nombre} ${c.telefono || ''} ${itemsStr}`.toLowerCase();
      return str.includes(q);
    });

    const tbody = $('#cot-historial-body');
    if (!tbody) return;

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="center text-gris" style="padding:30px">No se encontraron cotizaciones</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map((c) => `
      <tr>
        <td><b>${esc(c.correlativo)}</b></td>
        <td>${esc(c.fecha)}</td>
        <td><b>${esc(c.cliente_nombre)}</b></td>
        <td>${esc(c.telefono || '—')}</td>
        <td>${fmtMoneda(c.subtotal)}</td>
        <td>${fmtMoneda(c.iva)}</td>
        <td><b style="color:var(--azul)">${fmtMoneda(c.total)}</b></td>
        <td class="cell-actions" style="text-align:right">
          <div class="btn-group-actions">
            <button class="btn btn-secundario btn-xs" onclick="abrirCotizacionId(${c.id})">👁️ Ver</button>
            <button class="btn btn-rojo btn-xs" onclick="eliminarCotizacionId(${c.id})" title="Eliminar cotización">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  };

  $('#buscar-cot')?.addEventListener('input', (e) => renderRows(e.target.value));
  renderRows();
}

window.abrirCotizacionId = (id) => {
  const found = cotizacionesCache.find((c) => c.id == id);
  if (found) modalVerCotizacion(found);
  else toast('Cotización no encontrada', 'error');
};

window.eliminarCotizacionId = async (id) => {
  if (!confirm('¿Seguro que deseas eliminar esta cotización?')) return;
  try {
    await API.eliminarCotizacion(id);
    toast('Cotización eliminada', 'success');
    cotizacionesCache = cotizacionesCache.filter((c) => c.id != id);
    const badge = $('#cot-badge-count');
    if (badge) badge.textContent = cotizacionesCache.length;
    pintarHistorialCotizaciones();
  } catch (e) {
    toast(e.error || 'Error al eliminar cotización', 'error');
  }
};

window.modalVerCotizacion = (quote) => {
  const svgMarkup = generateCotizacionSvg(quote);
  const clientClean = (quote.cliente_nombre || quote.customer || 'Cliente').replace(/\s+/g, '_');
  const fileName = `Cotizacion_${clientClean}_${quote.correlativo || quote.correlative}`;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-backdrop" onclick="if(event.target===this)this.remove()">
      <div class="modal" style="max-width:880px">
        <div class="flex" style="justify-content:space-between;align-items:center;margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:10px">
            <h3 style="margin:0">Cotización N# ${esc(quote.correlativo || quote.correlative)} — ${esc(quote.cliente_nombre || quote.customer)}</h3>
            <div class="badge-estado PROCESADO">Generada</div>
          </div>
          <button class="btn-close-corner" type="button" onclick="this.closest('.modal-backdrop').remove()">✕ Cerrar</button>
        </div>

        <div class="cotizacion-svg-container" id="cotizacion-print-area">
          ${svgMarkup}
        </div>

        <div class="modal-actions" style="margin-top:20px;display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;width:100%">
          <button class="btn btn-secundario" onclick="convertirCotADTE(${quote.id || 0})">🔄 Emitir Factura / CCF</button>
          <button class="btn btn-secundario" onclick="descargarCotSvg('${fileName}')">⬇️ Descargar SVG</button>
          <button class="btn btn-verde" onclick="imprimirCotSvg('${fileName}')">🖨️ Imprimir / Guardar PDF</button>
        </div>
      </div>
    </div>
  `);

  window.descargarCotSvg = (name) => {
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  window.imprimirCotSvg = (title) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: portrait; margin: 0; }
          body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: #fff; }
          svg { width: 100vw; height: 100vh; max-width: 100%; max-height: 100%; }
        </style>
      </head>
      <body>
        ${svgMarkup}
        <script>
          window.onload = () => {
            setTimeout(() => { window.print(); window.close(); }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  window.convertirCotADTE = (id) => {
    const found = cotizacionesCache.find((c) => c.id == id) || quote;
    document.querySelector('.modal-backdrop')?.remove();
    state.items = (found.items || []).map((it) => ({
      cantidad: it.quantity || 1,
      descripcion: it.description || '',
      precioUni: it.price || 0,
      montoDescu: 0,
      tipoVenta: 'gravada',
      uniMedida: 59,
    }));
    location.hash = '#/factura';
    toast('Ítems cargados en nueva Factura', 'info');
  };
};

// ---------- VISTA: Configuración ----------
function renderConfiguracion(app) {
  app.innerHTML = appShell(`
    <div class="page-head">
      <div><div class="crumb"><a href="#/" style="color:var(--azul);text-decoration:none">Inicio</a> / Configuración</div><h2>Configuración del sistema</h2></div>
      <div class="actions">
        <a href="#/" class="btn-volver"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Volver al inicio</a>
      </div>
    </div>
    <div id="cfg-body"><div class="center text-gris">Cargando...</div></div>`);

  API.configuracion().then((r) => {
    pintarConfig(r);
  }).catch((e) => toast(e.error, 'error'));
}

function pintarConfig(r) {
  const { emisor, mh, correlativos, ambiente_activo, apariencia, email, whatsapp } = r;
  const emisorOk = emisor?.nit && emisor?.nombre;
  const firmaOk = mh.firma_activa;
  const emailOk = email?.resend_api_key_configurada;
  const waOk = !!whatsapp?.gateway_url;
  let currentLogo = apariencia?.logo_b64 || localStorage.getItem('fac2026_logo_empresa') || '';
  let currentColor = apariencia?.color_primario || localStorage.getItem('fac2026_color_primario') || '#1b365d';

  if (currentLogo) localStorage.setItem('fac2026_logo_empresa', currentLogo);
  if (currentColor) localStorage.setItem('fac2026_color_primario', currentColor);

  $('#cfg-body').innerHTML = `
    <div class="card card-banner flex" style="justify-content:space-between;align-items:center;margin-bottom:18px;padding:16px 22px;border-radius:16px;flex-wrap:wrap;gap:12px">
      <div>
        <strong style="font-size:15px">Panel de Configuración Global</strong>
        <div class="text-gris" style="font-size:12.5px">Puedes guardar todos los datos juntos con un solo clic o guardar cada sección por separado.</div>
      </div>
      <div class="flex" style="gap:10px;flex-wrap:wrap">
        <a href="#/" class="btn-volver"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Volver al inicio</a>
        <button class="btn btn-verde" id="btn-guardar-todo-top" style="display:inline-flex;align-items:center;gap:8px">💾 Guardar todo</button>
      </div>
    </div>

    <div class="config-status">
      <div class="config-item"><div class="cfg-label">Emisor</div><div class="cfg-value ${emisorOk ? 'cfg-ok' : 'cfg-warn'}">${emisorOk ? 'Configurado' : 'Pendiente'}</div></div>
      <div class="config-item"><div class="cfg-label">Firma electrónica</div><div class="cfg-value ${firmaOk ? 'cfg-ok' : 'cfg-warn'}">${firmaOk ? 'Cargada' : 'No cargada'}</div></div>
      <div class="config-item"><div class="cfg-label">Correo Automático</div><div class="cfg-value ${emailOk ? 'cfg-ok' : 'cfg-warn'}">${emailOk ? 'Activo (Resend)' : 'Sin clave'}</div></div>
      <div class="config-item"><div class="cfg-label">WhatsApp Gateway</div><div class="cfg-value ${waOk ? 'cfg-ok' : 'cfg-warn'}">${waOk ? 'Configurado' : 'Pendiente'}</div></div>
      <div class="config-item"><div class="cfg-label">Ambiente MH</div><div class="cfg-value">${ambiente_activo === '01' ? 'Producción' : 'Pruebas'}</div></div>
    </div>

    <div class="card">
      <div class="flex" style="justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px">
        <div>
          <h3 style="margin-bottom:2px">🎨 Apariencia Gráfica y Personalización de Comprobantes DTE</h3>
          <div class="text-gris" style="font-size:12.5px">Configura el logo de tu empresa y el color corporativo que aparecerá en el PDF y en la versión impresa de tus Facturas, Créditos Fiscales y Notas de Crédito.</div>
        </div>
        <button class="btn btn-secundario" id="btn-previsualizar-ejemplo" style="font-size:12.5px;display:inline-flex;align-items:center;gap:6px">👁️ Ver Ejemplo en Vivo</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:18px;margin-top:14px">
        <!-- Subir Logo -->
        <div style="background:var(--resumen-bg);border:1px solid var(--borde);border-radius:14px;padding:16px">
          <label style="font-weight:700;font-size:13px;display:block;margin-bottom:8px">Logo de la Empresa (PNG, JPG, SVG)</label>
          <div id="logo-preview-box" style="height:90px;background:#ffffff;border:1.5px dashed var(--borde);border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;overflow:hidden;padding:10px">
            ${currentLogo ? `<img src="${currentLogo}" id="img-logo-preview" style="max-height:70px;max-width:100%;object-fit:contain">` : `<span id="txt-no-logo" class="text-gris" style="font-size:12px">Sin logo configurado (se mostrará el nombre comercial)</span>`}
          </div>
          <div class="flex" style="gap:8px;flex-wrap:wrap">
            <label class="btn btn-secundario" style="cursor:pointer;font-size:12px;display:inline-flex;align-items:center;gap:6px">
              📁 Seleccionar imagen
              <input type="file" id="input-subir-logo" accept="image/*" style="display:none">
            </label>
            <button class="btn btn-rojo" id="btn-quitar-logo" style="font-size:12px;padding:6px 12px;display:${currentLogo ? 'inline-block' : 'none'}">Quitar logo</button>
          </div>
        </div>

        <!-- Color Primario / Acento -->
        <div style="background:var(--resumen-bg);border:1px solid var(--borde);border-radius:14px;padding:16px">
          <label style="font-weight:700;font-size:13px;display:block;margin-bottom:8px">Color Primario / Corporativo del Comprobante</label>
          <div class="flex" style="align-items:center;gap:12px;margin-bottom:14px">
            <input type="color" id="cfg-color-picker" value="${currentColor}" style="width:46px;height:38px;border:none;border-radius:8px;cursor:pointer;background:none">
            <input type="text" id="cfg-color-hex" value="${currentColor}" style="width:110px;font-family:monospace;font-weight:700;padding:6px 10px" placeholder="#1b365d">
          </div>
          <div class="text-gris" style="font-size:11.5px;margin-bottom:8px">Paleta rápida recomendada:</div>
          <div class="flex" style="gap:10px" id="palette-presets">
            <button type="button" class="btn-color-dot" data-color="#1b365d" style="background:#1b365d;width:28px;height:28px;border-radius:50%;border:2.5px solid #fff;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.25)" title="Azul Hacienda Oficial"></button>
            <button type="button" class="btn-color-dot" data-color="#0d47c9" style="background:#0d47c9;width:28px;height:28px;border-radius:50%;border:2.5px solid #fff;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.25)" title="Azul Real"></button>
            <button type="button" class="btn-color-dot" data-color="#0f2b5c" style="background:#0f2b5c;width:28px;height:28px;border-radius:50%;border:2.5px solid #fff;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.25)" title="Azul Marino"></button>
            <button type="button" class="btn-color-dot" data-color="#0f766e" style="background:#0f766e;width:28px;height:28px;border-radius:50%;border:2.5px solid #fff;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.25)" title="Verde Esmeralda"></button>
            <button type="button" class="btn-color-dot" data-color="#18181b" style="background:#18181b;width:28px;height:28px;border-radius:50%;border:2.5px solid #fff;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.25)" title="Grafito Oscuro"></button>
            <button type="button" class="btn-color-dot" data-color="#701a75" style="background:#701a75;width:28px;height:28px;border-radius:50%;border:2.5px solid #fff;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.25)" title="Vino Tinto"></button>
          </div>
        </div>
      </div>
      <div class="mt flex" style="gap:10px">
        <button class="btn btn-verde" id="btn-guardar-apariencia">Guardar apariencia del comprobante</button>
      </div>
    </div>

    <div class="card">
      <h3>Datos del emisor (contribuyente)</h3>
      <div class="grid-3">
        <div class="form-field"><label>NIT</label><input id="e-nit" value="${esc(emisor?.nit || '')}"></div>
        <div class="form-field"><label>NRC</label><input id="e-nrc" value="${esc(emisor?.nrc || '')}"></div>
        <div class="form-field"><label>Tipo establecimiento</label><select id="e-tipoest">${state.cat.tipoEstablecimiento.map((t) => `<option value="${t.codigo}" ${t.codigo === (emisor?.tipo_establecimiento || '01') ? 'selected' : ''}>${esc(t.nombre)}</option>`).join('')}</select></div>
        <div class="form-field" style="grid-column:1/-1"><label>Nombre / Razón social</label><input id="e-nombre" value="${esc(emisor?.nombre || '')}"></div>
        <div class="form-field"><label>Nombre comercial</label><input id="e-ncomercial" value="${esc(emisor?.nombre_comercial || '')}"></div>
        <div class="form-field">
          <label>Código actividad (CAT-019)</label>
          <div style="display:flex;gap:6px">
            <input id="e-codact" list="dl-actividades" value="${esc(emisor?.cod_actividad || '')}" placeholder="Ej. 73101" style="flex:1">
            <button type="button" class="btn btn-secundario btn-xs" id="btn-buscar-act-emisor" title="Buscar en catálogo">🔍</button>
          </div>
          ${selActividades()}
        </div>
        <div class="form-field"><label>Departamento</label><div id="e-depto">${selDeptos('e-mun', emisor?.departamento)}</div></div>
        <div class="form-field"><label>Municipio</label><div id="e-mun">${selMunicipios(emisor?.departamento, emisor?.municipio)}</div></div>
        <div class="form-field"><label>Complemento dirección</label><input id="e-comp" value="${esc(emisor?.complemento || '')}"></div>
        <div class="form-field"><label>Teléfono</label><input id="e-tel" value="${esc(emisor?.telefono || '')}"></div>
        <div class="form-field"><label>Correo</label><input id="e-correo" value="${esc(emisor?.correo || '')}"></div>
        <div class="form-field"><label>Código establecimiento MH</label><input id="e-estmh" value="${esc(emisor?.cod_estable_mh || 'M001')}"></div>
        <div class="form-field"><label>Código punto de venta MH</label><input id="e-pvmh" value="${esc(emisor?.cod_punto_venta_mh || 'P001')}"></div>
      </div>
      <div class="mt"><button class="btn btn-verde" id="btn-guardar-emisor">Guardar emisor</button></div>
    </div>

    <div class="card">
      <h3>Credenciales de aplicación API del Ministerio de Hacienda</h3>
      <div class="alert alert-warn mb">Estas credenciales son distintas a las usadas para iniciar sesión en el portal de factura.gob.sv. El MH entrega la contraseña de aplicación/API y esta vence periódicamente.</div>
      <div class="grid-3">
        <div class="form-field"><label>Ambiente</label><select id="mh-ambiente"><option value="00" ${mh.ambiente === '00' ? 'selected' : ''}>Pruebas (apitest)</option><option value="01" ${mh.ambiente === '01' ? 'selected' : ''}>Producción</option></select></div>
        <div class="form-field"><label>Usuario de aplicación/API</label><input id="mh-user" value="${esc(mh.api_user || '')}"></div>
        <div class="form-field"><label>Contraseña de aplicación/API</label><input id="mh-pwd" type="password" placeholder="${mh.api_pwd_configurada ? '•••••••• (guardada)' : 'Entregada por el equipo de Facturación Electrónica'}"></div>
      </div>
      <div class="mt"><button class="btn btn-secundario" id="btn-probar-mh">Probar conexión</button> <button class="btn btn-verde" id="btn-guardar-mh">Guardar y activar ambiente</button></div>
    </div>

    <div class="card">
      <h3>Certificado de firma electrónica (.crt PKCS#12)</h3>
      ${firmaOk
        ? `<div class="alert alert-success mb">Certificado activo: <b>${esc(mh.cert_subject || '')}</b> · vence ${esc(mh.cert_vence || '')}</div>
           <button class="btn btn-rojo" id="btn-quitar-firma">Quitar certificado</button>`
        : `<div class="form-field"><label>Archivo .crt (PKCS#12)</label><input id="f-archivo" type="file" accept=".crt,.p12,.pfx"></div>
           <div class="form-field"><label>Contraseña del certificado</label><input id="f-pwd" type="password"></div>
           <button class="btn btn-verde" id="btn-subir-firma">Cargar certificado</button>`}
    </div>

    <div class="card">
      <div class="flex" style="justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px">
        <div>
          <h3 style="margin-bottom:2px">📧 Envío Automático de Correo Electrónico (Resend)</h3>
          <div class="text-gris" style="font-size:12.5px">El sistema envía el comprobante oficial con logo, resumen, PDF y JSON firmado automáticamente en segundo plano al emitir cada DTE.</div>
        </div>
        <button class="btn btn-secundario" id="btn-probar-email" style="font-size:12.5px;display:inline-flex;align-items:center;gap:6px">🧪 Enviar Correo de Prueba</button>
      </div>

      <div class="grid-2">
        <div class="form-field">
          <label>Resend API Key</label>
          <input id="cfg-resend-key" type="password" value="${esc(email?.resend_api_key || '')}" placeholder="re_...">
        </div>
        <div class="form-field">
          <label>Remitente Oficial</label>
          <input id="cfg-email-remitente" value="${esc(email?.email_remitente || 'Spacio Rótulos <onboarding@resend.dev>')}">
        </div>
        <div class="form-field">
          <label>Correo de Pruebas / Notificaciones</label>
          <input id="cfg-email-notif" value="${esc(email?.email_notificaciones || 'spacioprintrotulos@gmail.com')}">
        </div>
        <div class="form-field" style="display:flex;align-items:center;gap:10px;padding-top:22px">
          <label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-weight:700;font-size:13.5px">
            <input type="checkbox" id="cfg-auto-email" ${email?.auto_enviar_email !== false ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer">
            Envío Automático en Segundo Plano al Emitir DTE
          </label>
        </div>
      </div>
      <div class="mt"><button class="btn btn-verde" id="btn-guardar-email">Guardar configuración de correo</button></div>
    </div>

    <div class="card">
      <div class="flex" style="justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px">
        <div>
          <h3 style="margin-bottom:2px">💬 Gateway de WhatsApp (Railway / Conexión QR)</h3>
          <div class="text-gris" style="font-size:12.5px">Conecta tu número (+503 7255 4916) escaneando un código QR una sola vez para enviar mensajes, PDFs y JSONs automáticos.</div>
        </div>
        <div class="flex" style="gap:8px">
          <button class="btn btn-whatsapp" id="btn-escanear-qr-wa" style="font-size:12.5px;display:inline-flex;align-items:center;gap:6px">📱 Escanear QR / Estado</button>
          <button class="btn btn-secundario" id="btn-probar-wa" style="font-size:12.5px;display:inline-flex;align-items:center;gap:6px">🧪 Probar Envío</button>
        </div>
      </div>

      <div class="grid-2">
        <div class="form-field">
          <label>URL del Gateway en Railway / Servidor</label>
          <input id="cfg-wa-url" value="${esc(whatsapp?.gateway_url || '')}" placeholder="https://tu-servicio.up.railway.app o http://localhost:3000">
        </div>
        <div class="form-field">
          <label>Teléfono de Pruebas / Notificaciones</label>
          <input id="cfg-wa-phone" value="${esc(whatsapp?.phone || '50372554916')}">
        </div>
        <div class="form-field">
          <label>API Secret (Opcional)</label>
          <input id="cfg-wa-secret" type="password" value="${esc(whatsapp?.api_key || 'spacio_sec_2026')}">
        </div>
        <div class="form-field" style="display:flex;align-items:center;gap:10px;padding-top:22px">
          <label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-weight:700;font-size:13.5px">
            <input type="checkbox" id="cfg-auto-wa" ${whatsapp?.auto_enviar ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer">
            Envío Automático por WhatsApp al Emitir DTE
          </label>
        </div>
      </div>
      <div class="mt"><button class="btn btn-verde" id="btn-guardar-wa">Guardar configuración de WhatsApp</button></div>
    </div>

    <div class="card">
      <h3>Correlativos (número de control siguiente)</h3>
      <div class="grid-3">
        ${correlativos.map((c) => `<div class="form-field"><label>${esc(nombreTipo(c.tipo_dte))}</label><input type="number" id="corr-${c.tipo_dte}" value="${c.ultimo}"></div>`).join('')}
      </div>
      <div class="mt"><button class="btn btn-secundario" id="btn-guardar-corr">Guardar correlativos</button></div>
    </div>

    <div class="card card-banner flex" style="justify-content:space-between;align-items:center;margin-top:20px;padding:20px 24px;border-radius:18px;flex-wrap:wrap;gap:14px">
      <div>
        <strong style="font-size:16px;display:block">¿Terminaste de configurar?</strong>
        <span class="text-gris" style="font-size:13px">Guarda apariencia, emisor, credenciales MH de este ambiente y correlativos simultáneamente.</span>
      </div>
      <div class="flex" style="gap:12px;flex-wrap:wrap">
        <a href="#/" class="btn-volver"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Volver al inicio</a>
        <button class="btn btn-verde" id="btn-guardar-todo" style="display:inline-flex;align-items:center;gap:8px;font-size:14px;padding:12px 24px">💾 Guardar toda la configuración</button>
      </div>
    </div>
  `;

  // Apariencia Handlers
  const inputLogo = $('#input-subir-logo');
  const btnQuitarLogo = $('#btn-quitar-logo');
  const logoBox = $('#logo-preview-box');
  const colorPicker = $('#cfg-color-picker');
  const colorHex = $('#cfg-color-hex');

  if (inputLogo) {
    inputLogo.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) return toast('El logo debe ser menor a 2MB', 'error');
      const reader = new FileReader();
      reader.onload = (ev) => {
        currentLogo = ev.target.result;
        localStorage.setItem('fac2026_logo_empresa', currentLogo);
        logoBox.innerHTML = `<img src="${currentLogo}" id="img-logo-preview" style="max-height:70px;max-width:100%;object-fit:contain">`;
        btnQuitarLogo.style.display = 'inline-block';
        toast('Logo cargado correctamente', 'success');
      };
      reader.readAsDataURL(file);
    });
  }

  if (btnQuitarLogo) {
    btnQuitarLogo.addEventListener('click', () => {
      currentLogo = '';
      localStorage.removeItem('fac2026_logo_empresa');
      logoBox.innerHTML = `<span id="txt-no-logo" class="text-gris" style="font-size:12px">Sin logo configurado (se mostrará el nombre comercial)</span>`;
      btnQuitarLogo.style.display = 'none';
      if (inputLogo) inputLogo.value = '';
      toast('Logo removido', 'info');
    });
  }

  if (colorPicker && colorHex) {
    colorPicker.addEventListener('input', (e) => {
      currentColor = e.target.value;
      colorHex.value = currentColor;
      localStorage.setItem('fac2026_color_primario', currentColor);
    });
    colorHex.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        currentColor = val;
        colorPicker.value = currentColor;
        localStorage.setItem('fac2026_color_primario', currentColor);
      }
    });
  }

  document.querySelectorAll('.btn-color-dot').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentColor = btn.dataset.color;
      colorPicker.value = currentColor;
      colorHex.value = currentColor;
      localStorage.setItem('fac2026_color_primario', currentColor);
      toast(`Color actualizado a ${currentColor}`, 'info');
    });
  });

  $('#btn-guardar-apariencia')?.addEventListener('click', async () => {
    try {
      await API.guardarConfig({
        apariencia: {
          logo_b64: currentLogo,
          color_primario: currentColor,
        }
      });
      localStorage.setItem('fac2026_logo_empresa', currentLogo);
      localStorage.setItem('fac2026_color_primario', currentColor);
      toast('Apariencia del comprobante guardada', 'success');
    } catch (e) {
      toast(e.error || 'Error al guardar la apariencia', 'error');
    }
  });

  $('#btn-previsualizar-ejemplo')?.addEventListener('click', () => {
    const dteEjemplo = {
      identificacion: {
        version: 3,
        ambiente: '00',
        tipoDte: '03',
        numeroControl: 'DTE-03-M001P001-000000000000001',
        codigoGeneracion: '7EF3EE72-700E-4C61-9893-D9B8BE035157',
        fecEmi: new Date().toISOString().slice(0, 10),
        horEmi: '10:14:46',
      },
      emisor: {
        nombre: $('#e-nombre')?.value?.trim() || emisor?.nombre || 'EVER ODIR RAMOS PORTILLO',
        nit: $('#e-nit')?.value?.trim() || emisor?.nit || '12012608691018',
        nrc: $('#e-nrc')?.value?.trim() || emisor?.nrc || '899798',
        descActividad: $('#e-codact')?.value ? nombreActividad($('#e-codact').value) : (emisor?.desc_actividad || 'Publicidad y Servicios Comerciales'),
        direccion: { complemento: $('#e-comp')?.value?.trim() || emisor?.complemento || '7 Avenida Norte, Colonia Layco, 1447, San Salvador' },
        telefono: $('#e-tel')?.value?.trim() || emisor?.telefono || '72108369',
        correo: $('#e-correo')?.value?.trim() || emisor?.correo || 'spacioprintrotulos@gmail.com',
        nombreComercial: $('#e-ncomercial')?.value?.trim() || emisor?.nombre_comercial || 'Spacio Rotulos',
      },
      receptor: {
        nombre: 'TRANS - AUTO S.A. DE C.V.',
        nit: '06140204921049',
        nrc: '462055',
        descActividad: 'Agencias de tramitaciones aduanales',
        nombreComercial: 'TRANS - AUTO S.A. DE C.V.',
        direccion: { complemento: 'Km.20 Autopista San Salvador - Nejapa Angelito Sur, Nejapa' },
        telefono: '25345777',
        correo: 'facturas.transauto@gmail.com',
      },
      cuerpoDocumento: [
        {
          numItem: 1,
          tipoItem: 2,
          codigo: 'SRV01',
          descripcion: 'Rotulación de microbús 4 caras full color en vinil automotriz de alta durabilidad',
          cantidad: 1,
          uniMedida: 59,
          precioUni: 240.00,
          montoDescu: 0,
          ventaGravada: 240.00,
          ventaExenta: 0,
          ventaNoSuj: 0,
        }
      ],
      resumen: {
        totalNoSuj: 0,
        totalExenta: 0,
        totalGravada: 240.00,
        subTotalVentas: 240.00,
        subTotal: 240.00,
        tributos: [{ codigo: '20', valor: 31.20 }],
        ivaRete1: 2.40,
        ivaPerci1: 0,
        reteRenta: 0,
        montoTotalOperacion: 271.20,
        totalPagar: 268.80,
        totalLetras: 'DOSCIENTOS SESENTA Y OCHO 80/100 DÓLARES',
        condicionOperacion: 1,
        observaciones: 'Servicio instalado y entregado a entera satisfacción del cliente',
      }
    };

    if (typeof DTEVisual !== 'undefined') {
      DTEVisual.previsualizar(dteEjemplo, {
        sello: '20266F5C2D02BC0E4B20B541DFC2A7E05D94JAXE',
        logo: currentLogo,
        colorPrimario: currentColor
      });
    }
  });

  // Cascada departamento→municipio emisor
  const eDepto = $('#e-depto').querySelector('.depto-select');
  eDepto.addEventListener('change', () => { $('#e-mun').innerHTML = selMunicipios(eDepto.value, ''); });

  $('#btn-buscar-act-emisor', app)?.addEventListener('click', () => {
    window.modalBuscarActividad((cod, desc) => {
      const eCod = $('#e-codact');
      if (eCod) eCod.value = cod;
    });
  });

  // Guardar emisor
  $('#btn-guardar-emisor').addEventListener('click', async () => {
    const body = { emisor: {
      ambiente: $('#mh-ambiente').value,
      nit: $('#e-nit').value.trim(), nrc: $('#e-nrc').value.trim(),
      nombre: $('#e-nombre').value.trim(), nombre_comercial: $('#e-ncomercial').value.trim(),
      cod_actividad: $('#e-codact').value.trim(), desc_actividad: nombreActividad($('#e-codact').value.trim()),
      tipo_establecimiento: $('#e-tipoest').value,
      departamento: eDepto.value, municipio: $('#e-mun').querySelector('[name="municipio"]')?.value || '',
      complemento: $('#e-comp').value.trim(), telefono: $('#e-tel').value.trim(), correo: $('#e-correo').value.trim(),
      cod_estable_mh: $('#e-estmh').value.trim() || 'M001', cod_punto_venta_mh: $('#e-pvmh').value.trim() || 'P001',
    }};
    try { await API.guardarConfig(body); toast('Emisor guardado', 'success'); }
    catch (e) { toast(e.error, 'error'); }
  });

  // Cargar el perfil separado del ambiente seleccionado sin guardar cambios.
  $('#mh-ambiente').addEventListener('change', async (event) => {
    try {
      const perfil = await API.configuracion(event.target.value);
      pintarConfig(perfil);
    } catch (e) { toast(e.error, 'error'); }
  });

  const leerMH = () => ({
    ambiente: $('#mh-ambiente').value,
    api_user: $('#mh-user').value.trim(),
    api_pwd: $('#mh-pwd').value,
  });

  // Probar MH sin persistir el formulario ni exponer el token.
  $('#btn-probar-mh').addEventListener('click', async () => {
    try {
      const r = await API.probarMH(leerMH());
      toast(r.mensaje, 'success');
    } catch (e) { toast(e.error, 'error'); }
  });

  // Guardar MH y activar ese perfil.
  $('#btn-guardar-mh').addEventListener('click', async () => {
    const { ambiente, api_user, api_pwd: pwd } = leerMH();
    const body = { mh: { ambiente, api_user } };
    if (pwd) body.mh.api_pwd = pwd;
    try { await API.guardarConfig(body); toast('Perfil MH guardado y activado', 'success'); renderConfiguracion($('#app')); }
    catch (e) { toast(e.error, 'error'); }
  });

  // Configuración de Correo
  $('#btn-probar-email')?.addEventListener('click', async () => {
    const btn = $('#btn-probar-email');
    const dest = $('#cfg-email-notif')?.value?.trim() || 'spacioprintrotulos@gmail.com';
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    try {
      // DTE de prueba básico para verificar conexión con Resend
      const dtePrueba = {
        identificacion: {
          tipoDte: '01',
          numeroControl: 'DTE-01-PRUEBA-00001',
          codigoGeneracion: 'A8C503F7-DAC7-4B08-A0DB-59082205E642',
          fecEmi: new Date().toISOString().slice(0, 10),
          ambiente: $('#mh-ambiente')?.value || '00',
        },
        receptor: {
          nombre: 'SPACIO RÓTULOS (PRUEBA DE SISTEMA)',
          nit: '12012608691018',
          correo: dest,
        },
        resumen: {
          totalPagar: 79.10,
          montoTotalOperacion: 79.10,
        }
      };

      const resp = await API.enviarEmailDTE({
        dteObj: dtePrueba,
        destinatario: dest,
        asunto: 'Prueba de Envío de Correo — Spacio Rótulos',
      });
      toast(`✅ Correo de prueba enviado exitosamente a ${dest}`, 'success');
    } catch (e) {
      toast(e.error || 'Error al enviar correo de prueba', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '🧪 Enviar Correo de Prueba';
    }
  });

  $('#btn-guardar-email')?.addEventListener('click', async () => {
    const body = {
      email: {
        resend_api_key: $('#cfg-resend-key')?.value?.trim() || '',
        email_remitente: $('#cfg-email-remitente')?.value?.trim() || 'Spacio Rótulos <onboarding@resend.dev>',
        email_notificaciones: $('#cfg-email-notif')?.value?.trim() || 'spacioprintrotulos@gmail.com',
        auto_enviar_email: $('#cfg-auto-email')?.checked,
      }
    };
    try {
      await API.guardarConfig(body);
      toast('Configuración de correo guardada', 'success');
      renderConfiguracion($('#app'));
    } catch (e) {
      toast(e.error || 'Error al guardar la configuración de correo', 'error');
    }
  });

  // Configuración de WhatsApp Gateway
  $('#btn-escanear-qr-wa')?.addEventListener('click', async () => {
    const modalId = 'modal-qr-wa-' + Date.now();
    const modalHtml = `
      <div class="modal-backdrop" id="${modalId}" onclick="if(event.target===this)this.remove()">
        <div class="modal" style="max-width:520px;text-align:center;padding:24px">
          <div class="flex" style="justify-content:space-between;align-items:center;margin-bottom:14px">
            <h3 style="margin:0">📱 Conexión WhatsApp Gateway</h3>
            <button class="btn-close-corner" type="button" onclick="document.getElementById('${modalId}').remove()">✕ Cerrar</button>
          </div>
          <div id="${modalId}-content">
            <div class="center text-gris" style="padding:20px">Consultando estado del Gateway...</div>
          </div>
          <div class="modal-actions" style="justify-content:center;margin-top:18px">
            <button class="btn btn-secundario" id="${modalId}-btn-refresh">🔄 Actualizar Estado / QR</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const checkStatus = async () => {
      const contentEl = document.getElementById(`${modalId}-content`);
      if (!contentEl) return;
      try {
        const r = await API.whatsappStatus();
        if (!r.configurado) {
          contentEl.innerHTML = `
            <div class="alert alert-warn" style="font-size:13px;text-align:left;line-height:1.5">
              ⚠️ <b>Gateway no configurado:</b><br>
              Ingresa la URL de tu servicio de Railway en el campo <i>"URL del Gateway en Railway"</i> (ej. <code>https://tu-app.up.railway.app</code>) y presiona <b>Guardar</b>.
            </div>
          `;
          return;
        }

        if (r.connected) {
          contentEl.innerHTML = `
            <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:14px;padding:20px;margin-bottom:10px">
              <div style="font-size:36px;margin-bottom:8px">🟢</div>
              <h4 style="color:#15803d;margin:0 0 6px 0">¡WhatsApp Conectado y Listo!</h4>
              <p style="color:#166534;font-size:13px;margin:0">
                Sesión vinculada como: <b>${esc(r.user?.name || r.user?.phone || 'Spacio Rótulos')}</b><br>
                El sistema enviará los comprobantes automáticamente.
              </p>
            </div>
          `;
        } else if (r.qrDataUrl) {
          contentEl.innerHTML = `
            <p style="font-size:13.5px;color:var(--texto);margin-bottom:12px">
              Abre WhatsApp en tu teléfono (<b>+503 7255 4916</b>) → <b>Dispositivos vinculados</b> → <b>Vincular un dispositivo</b> y escanea este código:
            </p>
            <div style="background:#fff;padding:14px;border-radius:16px;display:inline-block;box-shadow:0 6px 20px rgba(0,0,0,0.12)">
              <img src="${r.qrDataUrl}" alt="QR WhatsApp" style="width:230px;height:230px;display:block">
            </div>
            <div class="text-gris small" style="margin-top:10px">Este código se actualiza automáticamente cada 20 segundos.</div>
          `;
        } else {
          contentEl.innerHTML = `
            <div class="alert alert-warn" style="font-size:13px;text-align:left">
              El Gateway está iniciando o generando un nuevo código QR. Por favor presiona <b>Actualizar</b> en unos segundos.
            </div>
          `;
        }
      } catch (err) {
        contentEl.innerHTML = `
          <div class="alert alert-error" style="font-size:13px;text-align:left">
            ❌ <b>Error al conectar con el Gateway:</b><br>${esc(err.error || err.message || 'Verifique que la URL de Railway sea correcta y el servicio esté encendido.')}
          </div>
        `;
      }
    };

    checkStatus();
    document.getElementById(`${modalId}-btn-refresh`)?.addEventListener('click', checkStatus);
  });

  $('#btn-probar-wa')?.addEventListener('click', async () => {
    const btn = $('#btn-probar-wa');
    const phone = $('#cfg-wa-phone')?.value?.trim() || '50372554916';
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    try {
      const dtePrueba = {
        identificacion: {
          tipoDte: '01',
          numeroControl: 'DTE-01-PRUEBA-00001',
          codigoGeneracion: 'A8C503F7-DAC7-4B08-A0DB-59082205E642',
          fecEmi: new Date().toISOString().slice(0, 10),
          ambiente: $('#mh-ambiente')?.value || '00',
        },
        receptor: {
          nombre: 'SPACIO RÓTULOS (PRUEBA WHATSAPP)',
        },
        resumen: {
          totalPagar: 79.10,
        }
      };

      const resp = await API.enviarWhatsAppGateway({
        dteObj: dtePrueba,
        phone,
      });
      toast(`✅ WhatsApp de prueba enviado exitosamente a +${phone}`, 'success');
    } catch (e) {
      toast(e.error || 'Error al enviar WhatsApp de prueba. Verifique que el Gateway esté conectado.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '🧪 Probar Envío';
    }
  });

  $('#btn-guardar-wa')?.addEventListener('click', async () => {
    const body = {
      whatsapp: {
        gateway_url: $('#cfg-wa-url')?.value?.trim() || '',
        phone: $('#cfg-wa-phone')?.value?.trim() || '50372554916',
        api_key: $('#cfg-wa-secret')?.value?.trim() || 'spacio_sec_2026',
        auto_enviar: $('#cfg-auto-wa')?.checked,
      }
    };
    try {
      await API.guardarConfig(body);
      toast('Configuración de WhatsApp guardada', 'success');
      renderConfiguracion($('#app'));
    } catch (e) {
      toast(e.error || 'Error al guardar configuración de WhatsApp', 'error');
    }
  });

  // Correlativos
  $('#btn-guardar-corr').addEventListener('click', async () => {
    const corr = {};
    correlativos.forEach((c) => { corr[c.tipo_dte] = Number($(`#corr-${c.tipo_dte}`).value) || 0; });
    try { await API.guardarConfig({ correlativos: corr }); toast('Correlativos guardados', 'success'); }
    catch (e) { toast(e.error, 'error'); }
  });

  // Guardado General (Apariencia + Emisor + Email + WhatsApp + MH + Correlativos en una sola operación)
  const guardarTodoConfig = async () => {
    const ambiente = $('#mh-ambiente').value;
    const body = {
      apariencia: {
        logo_b64: currentLogo,
        color_primario: currentColor,
      },
      email: {
        resend_api_key: $('#cfg-resend-key')?.value?.trim() || '',
        email_remitente: $('#cfg-email-remitente')?.value?.trim() || 'Spacio Rótulos <onboarding@resend.dev>',
        email_notificaciones: $('#cfg-email-notif')?.value?.trim() || 'spacioprintrotulos@gmail.com',
        auto_enviar_email: $('#cfg-auto-email')?.checked,
      },
      whatsapp: {
        gateway_url: $('#cfg-wa-url')?.value?.trim() || '',
        phone: $('#cfg-wa-phone')?.value?.trim() || '50372554916',
        api_key: $('#cfg-wa-secret')?.value?.trim() || 'spacio_sec_2026',
        auto_enviar: $('#cfg-auto-wa')?.checked,
      },
      emisor: {
        ambiente,
        nit: $('#e-nit').value.trim(), nrc: $('#e-nrc').value.trim(),
        nombre: $('#e-nombre').value.trim(), nombre_comercial: $('#e-ncomercial').value.trim(),
        cod_actividad: $('#e-codact').value.trim(), desc_actividad: nombreActividad($('#e-codact').value.trim()),
        tipo_establecimiento: $('#e-tipoest').value,
        departamento: eDepto.value, municipio: $('#e-mun').querySelector('[name="municipio"]')?.value || '',
        complemento: $('#e-comp').value.trim(), telefono: $('#e-tel').value.trim(), correo: $('#e-correo').value.trim(),
        cod_estable_mh: $('#e-estmh').value.trim() || 'M001', cod_punto_venta_mh: $('#e-pvmh').value.trim() || 'P001',
      },
      mh: {
        ambiente,
        api_user: $('#mh-user').value.trim(),
      },
      correlativos: {},
    };
    const pwd = $('#mh-pwd').value;
    if (pwd) body.mh.api_pwd = pwd;

    correlativos.forEach((c) => {
      const el = $(`#corr-${c.tipo_dte}`);
      if (el) body.correlativos[c.tipo_dte] = Number(el.value) || 0;
    });

    try {
      await API.guardarConfig(body);
      localStorage.setItem('fac2026_logo_empresa', currentLogo);
      localStorage.setItem('fac2026_color_primario', currentColor);
      toast('Toda la configuración ha sido guardada con éxito', 'success');
      renderConfiguracion($('#app'));
    } catch (e) {
      toast(e.error || 'Error al guardar la configuración', 'error');
    }
  };

  $('#btn-guardar-todo-top')?.addEventListener('click', guardarTodoConfig);
  $('#btn-guardar-todo')?.addEventListener('click', guardarTodoConfig);

  // Firma
  const subir = $('#btn-subir-firma');
  if (subir) subir.addEventListener('click', async () => {
    const file = $('#f-archivo').files[0];
    const pwd = $('#f-pwd').value;
    if (!file) return toast('Seleccione el archivo .crt', 'error');
    if (!pwd) return toast('Ingrese la contraseña del certificado', 'error');
    const b64 = await file.arrayBuffer().then((b) => {
      let bin = '';
      new Uint8Array(b).forEach((x) => { bin += String.fromCharCode(x); });
      return btoa(bin);
    });
    try {
      const r = await API.subirFirma(b64, pwd, $('#mh-ambiente').value);
      toast(`Certificado cargado (${r.cert_subject || ''})`, 'success');
      renderConfiguracion($('#app'));
    } catch (e) { toast(e.error, 'error'); }
  });

  const quitar = $('#btn-quitar-firma');
  if (quitar) quitar.addEventListener('click', async () => {
    if (!confirm('¿Quitar el certificado de firma? Los DTEs dejarán de transmitirse.')) return;
    try { await API.eliminarFirma($('#mh-ambiente').value); toast('Certificado eliminado', 'success'); renderConfiguracion($('#app')); }
    catch (e) { toast(e.error, 'error'); }
  });
}

// ---------- Arranque ----------
(async function boot() {
  try {
    const res = await fetch('data/catalogos.json');
    state.cat = await res.json();
  } catch { state.cat = { departamentos: [], municipios: {}, actividades: [], tipoDocumento: [], formaPago: [], tipoDte: [], tipoInvalidacion: [], tipoEstablecimiento: [] }; }
  try {
    const s = await API.session();
    if (s.ok) state.usuario = s.usuario;
  } catch { /* no sesión */ }
  route();
})();
