// ============================================================
// Cliente de la API (fetch + manejo de errores + sesión)
// ============================================================
const API = {
  async req(path, opts = {}) {
    const conf = { ...opts, credentials: 'same-origin', headers: {} };
    if (opts.body && typeof opts.body !== 'string') {
      conf.headers['Content-Type'] = 'application/json';
      conf.body = JSON.stringify(opts.body);
    }
    let resp;
    try {
      resp = await fetch(path, conf);
    } catch (e) {
      throw { ok: false, error: 'No se pudo conectar con el servidor', fatal: true };
    }
    let data = null;
    try { data = await resp.json(); } catch { /* vacío */ }
    if (resp.status === 401 && !path.includes('/auth/login')) {
      location.hash = '#/login';
      throw { ok: false, error: 'Sesión expirada', redirect: true };
    }
    if (!resp.ok) throw { ok: false, error: (data && (data.error || data.msg)) || `Error HTTP ${resp.status}` };
    return data;
  },

  get(path, params) {
    const q = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString() : '';
    return this.req(path + q);
  },
  post(path, body) { return this.req(path, { method: 'POST', body }); },
  put(path, body) { return this.req(path, { method: 'PUT', body }); },
  del(path) { return this.req(path, { method: 'DELETE' }); },

  // ---- Auth ----
  login(usuario, clave) { return this.post('/api/auth/login', { usuario, clave }); },
  logout() { return this.post('/api/auth/logout'); },
  session() { return this.get('/api/auth/session'); },

  // ---- Clientes ----
  clientes(q) { return this.get('/api/clientes', { q }); },
  cliente(id) { return this.get(`/api/clientes/${id}`); },
  crearCliente(c) { return this.post('/api/clientes', c); },
  actualizarCliente(id, c) { return this.put(`/api/clientes/${id}`, c); },
  eliminarCliente(id) { return this.del(`/api/clientes/${id}`); },

  // ---- DTEs ----
  dtes(filtros) { return this.get('/api/dtes', filtros); },
  dte(id) { return this.get(`/api/dtes/${id}`); },
  emitir(body) { return this.post('/api/dtes/emitir', body); },
  anular(body) { return this.post('/api/dtes/anular', body); },
  enviarEmailDTE(body) { return this.post('/api/dtes/enviar-email', body); },

  // ---- Configuración ----
  configuracion(ambiente) { return this.get('/api/configuracion', { ambiente }); },
  guardarConfig(body) { return this.put('/api/configuracion', body); },
  probarMH(body) { return this.post('/api/configuracion/probar-mh', body); },
  subirFirma(archivoB64, password, ambiente) { return this.post('/api/configuracion/firma', { archivoB64, password, ambiente }); },
  eliminarFirma(ambiente) { return this.del(`/api/configuracion/firma?ambiente=${encodeURIComponent(ambiente)}`); },

  // ---- Cotizaciones ----
  cotizaciones(q) { return this.get('/api/cotizaciones', q ? { q } : undefined); },
  cotizacion(id) { return this.get(`/api/cotizaciones/${id}`); },
  crearCotizacion(c) { return this.post('/api/cotizaciones', c); },
  eliminarCotizacion(id) { return this.del(`/api/cotizaciones/${id}`); },
};
