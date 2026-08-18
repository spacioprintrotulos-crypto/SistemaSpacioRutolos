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
  return `
  <div class="app-shell">
    <header class="app-top">
      <div class="app-brand">
        <span class="app-logo-badge" style="display:flex;align-items:center;justify-content:center;width:42px;height:42px;background:rgba(255,255,255,.18);border-radius:12px;border:1px solid rgba(255,255,255,.35)">${ICONS.factura}</span>
        <strong>SISTEMA FAC2026</strong>
      </div>
      <div class="app-userbox">
        <span>${esc(state.usuario?.nombre || state.usuario?.usuario || 'Usuario')}</span>
        <button type="button" class="btn-theme-toggle" onclick="toggleTheme()" title="${isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}" aria-label="Cambiar tema">
          ${getThemeIcon()}
        </button>
        <a href="#" onclick="logout(event)">Salir</a>
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

// ---------- VISTA: Login ----------
function renderLogin(app) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  app.innerHTML = `
  <div class="login-page">
    <div class="login-left">
      <div class="login-left-content">
        <div class="login-brand-mark">
          <div class="login-logo-badge">${ICONS.factura}</div>
          <div class="login-brand-name">SISTEMA FAC2026</div>
        </div>
        <h1>Facturación Electrónica DTE</h1>
        <p>Emite Facturas, Comprobantes de Crédito Fiscal y Notas de Crédito conectado al Ministerio de Hacienda de El Salvador.</p>
      </div>
    </div>
    <div class="login-right">
      <button type="button" class="btn-theme-toggle login-theme-btn" onclick="toggleTheme()" title="${isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}" aria-label="Cambiar tema">
        ${getThemeIcon()}
      </button>
      <div class="login-card-wrapper">
        <div class="login-card">
          <h2>Iniciar sesión</h2>
          <p class="login-sub">Ingresa tus credenciales para continuar</p>
          <div id="login-alert"></div>
          <div class="form-field">
            <label>Usuario</label>
            <input id="login-user" type="text" autocomplete="username" placeholder="Tu usuario">
          </div>
          <div class="form-field">
            <label>Contraseña</label>
            <input id="login-pass" type="password" autocomplete="current-password" placeholder="Tu contraseña">
          </div>
          <button class="btn btn-primary" id="login-btn">Entrar</button>
        </div>
        <div class="login-credits">by Jovas-Motion Designer &amp; Desarrollo.</div>
      </div>
    </div>
  </div>`;

  const entrar = async () => {
    const user = $('#login-user').value.trim();
    const pass = $('#login-pass').value;
    if (!user || !pass) { $('#login-alert').innerHTML = '<div class="alert alert-error">Usuario y contraseña son requeridos</div>'; return; }
    const btn = $('#login-btn');
    btn.disabled = true; btn.textContent = 'Entrando...';
    try {
      const r = await API.login(user, pass);
      state.usuario = r.usuario;
      location.hash = '#/';
    } catch (e) {
      $('#login-alert').innerHTML = `<div class="alert alert-error">${esc(e.error || 'No se pudo iniciar sesión')}</div>`;
    } finally {
      btn.disabled = false; btn.textContent = 'Entrar';
    }
  };
  $('#login-btn').addEventListener('click', entrar);
  $('#login-pass').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') entrar(); });
}

// ---------- VISTA: Menú ----------
function renderMenu(app) {
  const tarjetas = [
    { ruta: '#/factura', cls: 'green', t: 'Factura', s: 'Documento tributario. Precios incluyen IVA.', icon: 'factura' },
    { ruta: '#/credito', cls: 'purple', t: 'Crédito Fiscal', s: 'CCF para contribuyentes. Con retenciones.', icon: 'credito' },
    { ruta: '#/nota', cls: 'blue', t: 'Nota de Crédito', s: 'Anula o modifica una Factura o CCF emitida.', icon: 'nota' },
    { ruta: '#/cotizaciones', cls: 'amber', t: 'Cotizaciones', s: 'Crea cotizaciones, calcula IVA 13% y genera PDF.', icon: 'cotizacion' },
    { ruta: '#/clientes', cls: 'orange', t: 'Clientes', s: 'Directorio de receptores de tus DTEs.', icon: 'clientes' },
    { ruta: '#/dtes', cls: 'slate', t: 'DTEs Emitidos', s: 'Historial, consulta y anulación de documentos.', icon: 'dtes' },
    { ruta: '#/iva', cls: 'teal', t: 'IVA', s: 'En Construcción', icon: 'iva' },
    { ruta: '#/configuracion', cls: 'pink', t: 'Configuración', s: 'Datos del emisor, credenciales MH y firma.', icon: 'config' },
  ];
  app.innerHTML = appShell(`
    <div class="page-head">
      <div><div class="crumb">Inicio</div><h2>Panel principal</h2></div>
    </div>
    <div class="menu-grid">
      ${tarjetas.map((t) => `
        <a class="menu-card ${t.cls}" href="${t.ruta}">
          <div class="icon">${ICONS[t.icon]}</div>
          <div>
            <div class="card-title">${t.t}</div>
            <div class="card-sub">${t.s}</div>
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
function selActividades(valor) {
  const dl = `<datalist id="dl-actividades">${state.cat.actividades.slice(0, 300).map((a) => `<option value="${esc(a.codigo)}">${esc(a.descripcion)}</option>`).join('')}</datalist>`;
  return dl;
}
function nombreActividad(cod) {
  const a = state.cat.actividades.find((x) => x.codigo === cod);
  return a ? a.descripcion : '';
}

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
      <table class="items-table">
        <thead><tr>
          <th style="width:34%">Descripción</th>
          <th>Venta</th>
          <th style="width:70px">Cant.</th>
          <th style="width:110px">Precio ${tipo === '01' ? '(c/IVA)' : '(s/IVA)'}</th>
          <th style="width:110px">Desc. $</th>
          <th style="width:120px">Subtotal</th>
          <th></th>
        </tr></thead>
        <tbody id="items-body"></tbody>
      </table>
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
      <div class="mt">
        <button class="btn btn-verde" id="btn-emitir">Emitir DTE</button>
        <button class="btn btn-secundario" onclick="location.hash='#/'">Cancelar</button>
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
      <div class="form-field"><label>Código de actividad (CAT-019)</label><input name="cod_actividad" list="dl-actividades">${selActividades()}</div>
      <div class="form-field"><label>Descripción de actividad</label><input name="desc_actividad"></div>
      <div class="form-field"><label>Nombre comercial</label><input name="nombre_comercial"></div>
      <div class="form-field"><label>Departamento</label>${selDeptos('municipio')}</div>
      <div class="form-field"><label>Municipio / Distrito</label>${selMunicipios('')}</div>
      <div class="form-field"><label>Complemento de dirección</label><input name="complemento"></div>
      <div class="form-field"><label>Teléfono</label><input name="telefono"></div>
      <div class="form-field"><label>Correo</label><input name="correo" type="email"></div>
    </div>`;
}

function fillReceptor(c) {
  const form = $('#receptor-form');
  const set = (name, v) => { const el = form.querySelector(`[name="${name}"]`); if (el) el.value = v || ''; };
  set('tipo_documento', c.tipo_documento || '13');
  set('num_documento', c.num_documento);
  set('nrc', c.nrc);
  set('nombre', c.nombre);
  set('cod_actividad', c.cod_actividad);
  set('desc_actividad', c.desc_actividad);
  set('nombre_comercial', c.nombre_comercial);
  set('telefono', c.telefono);
  set('correo', c.correo);
  set('complemento', c.complemento);
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
      <td><input class="it-cant" data-i="${i}" type="number" step="any" min="0" value="${it.cantidad}"></td>
      <td><input class="it-precio" data-i="${i}" type="number" step="0.01" min="0" value="${it.precioUni}"></td>
      <td><input class="it-descu" data-i="${i}" type="number" step="0.01" min="0" value="${it.montoDescu || 0}"></td>
      <td class="it-sub num" data-i="${i}">$0.00</td>
      <td><button class="row-remove" onclick="quitarItem(${i})">×</button></td>
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
    <div class="resumen-row total"><span>Total a pagar</span><span>${fmtMoneda(total)}</span></div>`;
}

// ---------- Emitir ----------
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
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-backdrop" onclick="if(event.target===this)this.remove()">
      <div class="modal">
        <h3>${ok ? 'DTE generado' : 'DTE con errores'}</h3>
        ${r.estado === 'SIMULADO' ? '<div class="alert alert-warning mb">Credenciales MH no configuradas: documento generado en modo SIMULADO (no transmitido). Configure su certificado y credenciales en <a href="#/configuracion" style="color:var(--azul)">Configuración</a>.</div>' : ''}
        ${r.estado === 'RECHAZADO' || r.estado === 'ERROR' ? `<div class="alert alert-error mb">${esc(JSON.stringify(r.respuesta))}</div>` : ''}
        <div class="resumen-box mb">
          <div class="resumen-row"><span>Estado</span><span class="badge-estado ${esc(r.estado)}">${esc(r.estado)}</span></div>
          <div class="resumen-row"><span>Número de control</span><span><b>${esc(r.numeroControl)}</b></span></div>
          <div class="resumen-row"><span>Código de generación</span><span style="font-size:12px"><b>${esc(r.codigoGeneracion)}</b></span></div>
          <div class="resumen-row"><span>Sello de recepción</span><span style="font-size:12px">${esc(r.selloRecibido || '—')}</span></div>
          <div class="resumen-row total"><span>Total</span><span>${fmtMoneda(r.total)}</span></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secundario" onclick="descargarJSON()">Descargar JSON</button>
          <button class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">Cerrar</button>
          <button class="btn btn-verde" onclick="location.hash='#/'; this.closest('.modal-backdrop').remove()">Emitir otra</button>
        </div>
      </div>
    </div>`);
}

window.descargarJSON = () => {
  const r = state.ultimoResultado;
  if (!r) return;
  const blob = new Blob([JSON.stringify(r.dte, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `DTE-${r.tipoDte || ''}-${r.numeroControl || r.codigoGeneracion}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
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
      <table class="data-table">
        <thead><tr><th>Nombre</th><th>NIT / DUI</th><th>NRC</th><th>Departamento</th><th>Teléfono</th><th></th></tr></thead>
        <tbody id="clientes-body"><tr><td colspan="6" class="center text-gris">Cargando...</td></tr></tbody>
      </table>
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
            <td class="flex" style="justify-content:flex-end">
              <button class="btn btn-secundario" onclick="modalCliente(${c.id})">Editar</button>
              <button class="btn btn-rojo" onclick="borrarCliente(${c.id})">Eliminar</button>
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
      <div class="modal">
        <h3>${id ? 'Editar cliente' : 'Nuevo cliente'}</h3>
        <div class="grid-3">
          <div class="form-field"><label>Tipo de documento</label><select id="c-tipo">${state.cat.tipoDocumento.map((t) => `<option value="${t.codigo}" ${t.codigo === (c.tipo_documento || '13') ? 'selected' : ''}>${esc(t.nombre)}</option>`).join('')}</select></div>
          <div class="form-field"><label>Número de documento</label><input id="c-num" value="${esc(c.num_documento || '')}"></div>
          <div class="form-field"><label>NRC</label><input id="c-nrc" value="${esc(c.nrc || '')}"></div>
          <div class="form-field" style="grid-column:1/-1"><label>Nombre / Razón social</label><input id="c-nombre" value="${esc(c.nombre || '')}"></div>
          <div class="form-field"><label>Nombre comercial</label><input id="c-ncomercial" value="${esc(c.nombre_comercial || '')}"></div>
          <div class="form-field"><label>Código actividad</label><input id="c-codact" list="dl-actividades" value="${esc(c.cod_actividad || '')}">${selActividades()}</div>
          <div class="form-field"><label>Departamento</label><div id="c-depto">${selDeptos('c-mun', c.departamento)}</div></div>
          <div class="form-field"><label>Municipio</label><div id="c-mun">${selMunicipios(c.departamento, c.municipio)}</div></div>
          <div class="form-field"><label>Complemento</label><input id="c-comp" value="${esc(c.complemento || '')}"></div>
          <div class="form-field"><label>Teléfono</label><input id="c-tel" value="${esc(c.telefono || '')}"></div>
          <div class="form-field"><label>Correo</label><input id="c-correo" value="${esc(c.correo || '')}"></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button>
          <button class="btn btn-verde" id="c-guardar">Guardar</button>
        </div>
      </div>
    </div>`);

  const modal = document.body.lastElementChild;
  const deptoSel = modal.querySelector('.depto-select');
  deptoSel.addEventListener('change', () => {
    $('#c-mun').innerHTML = selMunicipios(deptoSel.value, '');
  });

  $('#c-guardar', modal).addEventListener('click', async () => {
    const datos = {
      tipo_documento: $('#c-tipo', modal).value,
      num_documento: $('#c-num', modal).value.trim(),
      nrc: $('#c-nrc', modal).value.trim(),
      nombre: $('#c-nombre', modal).value.trim(),
      nombre_comercial: $('#c-ncomercial', modal).value.trim(),
      cod_actividad: $('#c-codact', modal).value.trim(),
      desc_actividad: nombreActividad($('#c-codact', modal).value.trim()),
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
      <table class="data-table">
        <thead><tr><th>#</th><th>Número de control</th><th>Tipo</th><th>Receptor</th><th>Fecha</th><th>Total</th><th>Estado</th><th></th></tr></thead>
        <tbody id="dtes-body"><tr><td colspan="8" class="center text-gris">Cargando...</td></tr></tbody>
      </table>
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
            <td class="flex" style="justify-content:flex-end">
              <button class="btn btn-secundario" onclick="verDTE(${d.id})">Ver</button>
              ${d.estado === 'PROCESADO' ? '<button class="btn btn-rojo" onclick="modalAnular(' + d.id + ')">Anular</button>' : ''}
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

window.verDTE = async (id) => {
  try {
    const { dte } = await API.dte(id);
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-backdrop" onclick="if(event.target===this)this.remove()">
        <div class="modal">
          <h3>DTE ${esc(dte.numero_control)} <span class="badge-estado ${esc(dte.estado)}">${esc(dte.estado)}</span></h3>
          <div class="resumen-box mb">
            <div class="resumen-row"><span>Receptor</span><span>${esc(dte.receptor_nombre)}</span></div>
            <div class="resumen-row"><span>Código generación</span><span style="font-size:12px">${esc(dte.codigo_generacion)}</span></div>
            <div class="resumen-row"><span>Sello recibido</span><span style="font-size:12px">${esc(dte.sello_recibido || '—')}</span></div>
            <div class="resumen-row"><span>Fecha emisión</span><span>${esc(dte.fec_emi)} ${esc(dte.hor_emi)}</span></div>
            <div class="resumen-row total"><span>Total</span><span>${fmtMoneda(dte.total)}</span></div>
          </div>
          ${dte.estado === 'RECHAZADO' ? `<div class="alert alert-error mb">${esc(dte.observaciones || 'Rechazado por el MH')}</div>` : ''}
          <h3 style="margin-bottom:8px">JSON del documento</h3>
          <pre class="json-view">${esc(JSON.stringify(JSON.parse(dte.dte_json), null, 2))}</pre>
          <div class="modal-actions">
            <button class="btn btn-secundario" onclick="descargarDTEJSON(${dte.id})">Descargar JSON</button>
            <button class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">Cerrar</button>
          </div>
        </div>
      </div>`);
  } catch (e) { toast(e.error, 'error'); }
};

window.descargarDTEJSON = async (id) => {
  const { dte } = await API.dte(id);
  const blob = new Blob([dte.dte_json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${dte.numero_control}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
};

window.modalAnular = (id) => {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-backdrop" onclick="if(event.target===this)this.remove()">
      <div class="modal">
        <h3>Anular DTE #${id}</h3>
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
          <button class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button>
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
            <th style="width:90px">Cantidad</th>
            <th>Descripción del producto / trabajo</th>
            <th style="width:140px">Precio unitario</th>
            <th style="width:130px;text-align:right">Total</th>
            <th style="width:40px"></th>
          </tr>
        </thead>
        <tbody id="cot-items-body"></tbody>
      </table>
      <div class="btn-add-item">
        <button class="btn btn-secundario" id="btn-cot-add-item">+ Agregar producto / línea</button>
      </div>
    </div>

    <div class="card flex" style="justify-content:space-between;align-items:center;padding:24px;flex-wrap:wrap;gap:18px">
      <div class="resumen-box" style="min-width:320px;flex:1">
        <div class="resumen-row"><span>Subtotal</span><span id="cot-res-subtotal">$0.00</span></div>
        <div class="resumen-row"><span>IVA (13%)</span><span id="cot-res-iva">$0.00</span></div>
        <div class="resumen-row total"><span>Total a cotizar</span><span id="cot-res-total">$0.00</span></div>
      </div>
      <div class="flex" style="gap:12px">
        <button class="btn btn-ghost" onclick="limpiarFormCotizacion()">Limpiar</button>
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
        <td><input type="number" min="1" step="1" class="cot-item-qty" data-idx="${idx}" value="${it.quantity || 1}"></td>
        <td><input type="text" class="cot-item-desc" data-idx="${idx}" value="${esc(it.description || '')}" placeholder="Descripción del producto o servicio..."></td>
        <td><input type="number" min="0" step="0.01" class="cot-item-price num" data-idx="${idx}" value="${it.price || ''}" placeholder="0.00"></td>
        <td style="text-align:right;font-weight:700" class="cot-item-total">${fmtMoneda((Number(it.quantity) || 0) * (Number(it.price) || 0))}</td>
        <td style="text-align:center">
          ${cotItems.length > 1 ? `<button class="row-remove" onclick="removeCotItem(${idx})">×</button>` : ''}
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
            <th style="text-align:right">Acciones</th>
          </tr>
        </thead>
        <tbody id="cot-historial-body"></tbody>
      </table>
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
        <td class="flex" style="justify-content:flex-end;gap:8px">
          <button class="btn btn-secundario" onclick="abrirCotizacionId(${c.id})">👁️ Ver / Imprimir</button>
          <button class="btn btn-rojo" onclick="eliminarCotizacionId(${c.id})">🗑️</button>
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
          <h3>Cotización N# ${esc(quote.correlativo || quote.correlative)} — ${esc(quote.cliente_nombre || quote.customer)}</h3>
          <div class="badge-estado PROCESADO">Generada</div>
        </div>

        <div class="cotizacion-svg-container" id="cotizacion-print-area">
          ${svgMarkup}
        </div>

        <div class="modal-actions" style="margin-top:20px;justify-content:space-between">
          <div>
            <button class="btn btn-secundario" onclick="convertirCotADTE(${quote.id || 0})">🔄 Emitir Factura / CCF</button>
          </div>
          <div class="flex" style="gap:10px">
            <button class="btn btn-ghost" onclick="descargarCotSvg('${fileName}')">⬇️ Descargar SVG</button>
            <button class="btn btn-verde" onclick="imprimirCotSvg('${fileName}')">🖨️ Imprimir / Guardar PDF</button>
            <button class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">Cerrar</button>
          </div>
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
  const { emisor, mh, correlativos, ambiente_activo } = r;
  const emisorOk = emisor?.nit && emisor?.nombre;
  const firmaOk = mh.firma_activa;

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
      <div class="config-item"><div class="cfg-label">Ambiente MH activo</div><div class="cfg-value">${ambiente_activo === '01' ? 'Producción' : 'Pruebas'}</div></div>
      <div class="config-item"><div class="cfg-label">Certificado vence</div><div class="cfg-value">${esc(mh.cert_vence || '—')}</div></div>
    </div>

    <div class="card">
      <h3>Datos del emisor (contribuyente)</h3>
      <div class="grid-3">
        <div class="form-field"><label>NIT</label><input id="e-nit" value="${esc(emisor?.nit || '')}"></div>
        <div class="form-field"><label>NRC</label><input id="e-nrc" value="${esc(emisor?.nrc || '')}"></div>
        <div class="form-field"><label>Tipo establecimiento</label><select id="e-tipoest">${state.cat.tipoEstablecimiento.map((t) => `<option value="${t.codigo}" ${t.codigo === (emisor?.tipo_establecimiento || '01') ? 'selected' : ''}>${esc(t.nombre)}</option>`).join('')}</select></div>
        <div class="form-field" style="grid-column:1/-1"><label>Nombre / Razón social</label><input id="e-nombre" value="${esc(emisor?.nombre || '')}"></div>
        <div class="form-field"><label>Nombre comercial</label><input id="e-ncomercial" value="${esc(emisor?.nombre_comercial || '')}"></div>
        <div class="form-field"><label>Código actividad (CAT-019)</label><input id="e-codact" list="dl-actividades" value="${esc(emisor?.cod_actividad || '')}">${selActividades()}</div>
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
      <h3>Correlativos (número de control siguiente)</h3>
      <div class="grid-3">
        ${correlativos.map((c) => `<div class="form-field"><label>${esc(nombreTipo(c.tipo_dte))}</label><input type="number" id="corr-${c.tipo_dte}" value="${c.ultimo}"></div>`).join('')}
      </div>
      <div class="mt"><button class="btn btn-secundario" id="btn-guardar-corr">Guardar correlativos</button></div>
    </div>

    <div class="card card-banner flex" style="justify-content:space-between;align-items:center;margin-top:20px;padding:20px 24px;border-radius:18px;flex-wrap:wrap;gap:14px">
      <div>
        <strong style="font-size:16px;display:block">¿Terminaste de configurar?</strong>
        <span class="text-gris" style="font-size:13px">Guarda emisor, credenciales MH de este ambiente y correlativos simultáneamente.</span>
      </div>
      <div class="flex" style="gap:12px;flex-wrap:wrap">
        <a href="#/" class="btn-volver"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Volver al inicio</a>
        <button class="btn btn-verde" id="btn-guardar-todo" style="display:inline-flex;align-items:center;gap:8px;font-size:14px;padding:12px 24px">💾 Guardar toda la configuración</button>
      </div>
    </div>
  `;

  // Cascada departamento→municipio emisor
  const eDepto = $('#e-depto').querySelector('.depto-select');
  eDepto.addEventListener('change', () => { $('#e-mun').innerHTML = selMunicipios(eDepto.value, ''); });

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

  // Correlativos
  $('#btn-guardar-corr').addEventListener('click', async () => {
    const corr = {};
    correlativos.forEach((c) => { corr[c.tipo_dte] = Number($(`#corr-${c.tipo_dte}`).value) || 0; });
    try { await API.guardarConfig({ correlativos: corr }); toast('Correlativos guardados', 'success'); }
    catch (e) { toast(e.error, 'error'); }
  });

  // Guardado General (Emisor + MH + Correlativos en una sola operación)
  const guardarTodoConfig = async () => {
    const ambiente = $('#mh-ambiente').value;
    const body = {
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
