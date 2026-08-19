// ============================================================
// SISTEMA FAC2026 — Representación Gráfica Oficial DTE (MH El Salvador)
// Generador visual, impresión de alta calidad y exportación a PDF/JSON
// Conforme a los lineamientos oficiales del Ministerio de Hacienda v2
// ============================================================

(function(root) {
  // ---------- Helpers de formato ----------
  const fmtMoney = (n) => `$ ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  const cleanStr = (s) => {
    if (s === null || s === undefined) return '';
    const str = String(s).trim();
    if (str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') return '';
    return str;
  };
  
  const safeStr = (s, def = '—') => cleanStr(s) || def;

  function sanitizarNombreArchivo(str) {
    return String(str || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar tildes
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 50);
  }

  function getNombreTipoDTE(tipo) {
    switch (tipo) {
      case '01': return 'FACTURA';
      case '03': return 'COMPROBANTE DE CRÉDITO FISCAL';
      case '05': return 'NOTA DE CRÉDITO';
      case '04': return 'NOTA DE REMISIÓN';
      case '06': return 'NOTA DE DÉBITO';
      case '07': return 'COMPROBANTE DE RETENCIÓN';
      case '14': return 'SUJETO EXCLUIDO';
      default: return `DTE TIPO ${tipo}`;
    }
  }

  function getVersionDTE(tipo, dte) {
    if (dte?.identificacion?.version) return `Ver. ${dte.identificacion.version}`;
    switch (tipo) {
      case '01': return 'Ver. 1';
      case '03': return 'Ver. 3';
      case '05': return 'Ver. 3';
      default: return 'Ver. 1';
    }
  }

  function formatNIT(nit) {
    const d = String(nit || '').replace(/\D/g, '');
    if (d.length === 14) return `${d.slice(0,4)}-${d.slice(4,10)}-${d.slice(10,13)}-${d.slice(13)}`;
    if (d.length === 9) return `${d.slice(0,8)}-${d.slice(8)}`;
    return nit || '—';
  }

  function formatNRC(nrc) {
    const d = String(nrc || '').replace(/\D/g, '');
    if (d.length >= 6) return `${d.slice(0, -1)}-${d.slice(-1)}`;
    return nrc || '—';
  }

  function getUnidadMedidaDesc(cod) {
    const n = Number(cod);
    if (n === 59) return 'Unidad';
    if (n === 99) return 'Servicio';
    if (n === 58) return 'Metro';
    if (n === 23) return 'Litro';
    if (n === 22) return 'Galón';
    if (n === 40) return 'Kilogramo';
    if (n === 41) return 'Libra';
    return `Unidad (${cod})`;
  }

  // Genera el HTML estructurado del comprobante DTE
  function renderDteHtml(dte, opciones = {}) {
    const ident = dte.identificacion || {};
    const emisor = dte.emisor || {};
    const receptor = dte.receptor || {};
    const resumen = dte.resumen || {};
    const items = dte.cuerpoDocumento || [];
    const docRel = dte.documentoRelacionado || [];
    const tipo = ident.tipoDte || '01';

    const ambiente = ident.ambiente || '00';
    const codGen = ident.codigoGeneracion || '';
    const fecEmi = ident.fecEmi || '';
    const sello = opciones.sello || dte.selloRecibido || ident.selloRecibido || '2026' + codGen.replace(/-/g, '').slice(0, 36).toUpperCase();

    // URL oficial de consulta QR según el manual técnico sección 5
    const urlQR = `https://admin.factura.gob.sv/consultaPublica?ambiente=${ambiente}&codGen=${codGen}&fechaEmi=${fecEmi}`;
    const qrSvg = typeof root.generarQrSvg === 'function' ? root.generarQrSvg(urlQR, 95) : '';

    const logoEmpresa = opciones.logo || localStorage.getItem('fac2026_logo_empresa') || '';
    const colorPrimario = opciones.colorPrimario || localStorage.getItem('fac2026_color_primario') || '#1b365d';
    const logoBadge = cleanStr(emisor.nombreComercial) || cleanStr(emisor.nombre) || 'SPACIO ROTULOS';

    // Dirección formateada
    const dirEmisor = emisor.direccion
      ? `${emisor.direccion.complemento || ''}, San Salvador, El Salvador`
      : 'San Salvador, El Salvador';
    const dirReceptor = receptor.direccion
      ? `${receptor.direccion.complemento || ''}`
      : 'El Salvador';

    // Construcción de filas de ítems
    let filasItems = '';
    items.forEach((it, idx) => {
      const cant = Number(it.cantidad || 1).toFixed(2);
      const uni = getUnidadMedidaDesc(it.uniMedida);
      const cod = safeStr(it.codigo, '-');
      const desc = safeStr(it.descripcion);
      const precio = Number(it.precioUni || 0).toFixed(2);
      const descu = Number(it.montoDescu || 0).toFixed(2);
      const noSuj = Number(it.ventaNoSuj || 0).toFixed(2);
      const exenta = Number(it.ventaExenta || 0).toFixed(2);
      const gravada = Number(it.ventaGravada || 0).toFixed(2);

      filasItems += `
        <tr>
          <td class="col-num">${idx + 1}</td>
          <td class="col-cant">${cant}</td>
          <td class="col-uni">${uni}</td>
          <td class="col-cod">${cod}</td>
          <td class="col-desc">${desc}</td>
          <td class="col-precio">${precio}</td>
          <td class="col-descu">${descu}</td>
          <td class="col-nosuj">${noSuj}</td>
          <td class="col-exenta">${exenta}</td>
          <td class="col-gravada">${gravada}</td>
        </tr>`;
    });

    // Filas de Documentos Relacionados
    let filasDocRel = '';
    if (Array.isArray(docRel) && docRel.length > 0) {
      docRel.forEach((dr) => {
        const nomDoc = dr.tipoDocumento === '03' ? 'Comprobante de Crédito Fiscal' : dr.tipoDocumento === '01' ? 'Factura Electrónica' : `DTE ${dr.tipoDocumento}`;
        filasDocRel += `
          <tr>
            <td>${nomDoc}</td>
            <td><b>${safeStr(dr.numeroDocumento)}</b></td>
            <td>${safeStr(dr.fechaEmision)}</td>
          </tr>`;
      });
    } else {
      filasDocRel = `
        <tr>
          <td>-</td>
          <td>-</td>
          <td>-</td>
        </tr>`;
    }

    const condicion = resumen.condicionOperacion === 2 ? 'Crédito' : 'Contado';
    const totalPagar = resumen.totalPagar !== undefined ? resumen.totalPagar : (resumen.montoTotalOperacion || 0);

    return `
    <div class="dte-document" id="dte-printable-area" style="--dte-primary: ${colorPrimario}">
      <style>
        .dte-document {
          --dte-primary: ${colorPrimario};
          width: 740px !important;
          max-width: 740px !important;
          min-height: 980px;
          background: #ffffff !important;
          color: #111827 !important;
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: 9.2px !important;
          line-height: 1.3 !important;
          padding: 16px 18px !important;
          box-shadow: none !important;
          border: 1.5px solid #0f172a !important;
          box-sizing: border-box !important;
          margin: 0 auto !important;
          display: flex;
          flex-direction: column;
        }
        .dte-document * { box-sizing: border-box !important; }
        .dte-header { border-bottom: 1.5px solid #0f172a; padding-bottom: 6px; margin-bottom: 8px; }
        .dte-header-top { display: grid; grid-template-columns: 150px 1fr 65px; align-items: center; gap: 8px; margin-bottom: 6px; }
        .dte-logo-area { display: flex; align-items: center; justify-content: flex-start; overflow: hidden; }
        .dte-logo-img { max-height: 48px; max-width: 145px; object-fit: contain; }
        .dte-logo-badge { font-size: 13px; font-weight: 900; color: ${colorPrimario}; letter-spacing: -0.3px; text-transform: uppercase; word-break: break-word; line-height: 1.2; }
        .dte-title-area { text-align: center; }
        .dte-main-title { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; color: #374151; margin: 0; }
        .dte-doc-type { font-size: 14px; font-weight: 900; color: ${colorPrimario}; margin-top: 2px; letter-spacing: 0.4px; }
        .dte-version-badge { text-align: right; font-size: 10.5px; font-weight: 700; color: #4b5563; }
        .dte-meta-grid { display: grid; grid-template-columns: 1.35fr 105px 1.15fr; align-items: center; gap: 8px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 8px; }
        .dte-meta-col-left, .dte-meta-col-right { display: flex; flex-direction: column; gap: 2.5px; font-size: 8.8px; }
        .dte-meta-row { display: flex; gap: 4px; line-height: 1.2; }
        .dte-meta-row .lbl { color: #4b5563; font-weight: 600; white-space: nowrap; }
        .dte-meta-row .val { color: #111827; word-break: break-all; }
        .dte-meta-row .val.bold { font-weight: 700; }
        .dte-qr-box { display: flex; justify-content: center; align-items: center; }
        .dte-qr-box svg { width: 92px !important; height: 92px !important; border: 1px solid #cbd5e1; background: #ffffff; padding: 2px; }
        .dte-parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 6px; }
        .dte-party-box { border: 1.5px solid #0f172a; border-radius: 5px; overflow: hidden; }
        .dte-party-header { background: ${colorPrimario}; color: #ffffff; font-weight: 800; text-align: center; font-size: 9.5px; padding: 2.5px 4px; letter-spacing: 0.8px; }
        .dte-party-body { padding: 5px 7px; display: flex; flex-direction: column; gap: 2px; font-size: 8.6px; }
        .party-row { display: flex; gap: 4px; line-height: 1.2; }
        .party-row-half { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
        .p-lbl { color: #4b5563; font-weight: 700; white-space: nowrap; }
        .p-val { color: #111827; word-break: break-word; }
        .p-val.bold { font-weight: 800; }
        .dte-section-box { border: 1px solid #0f172a; border-radius: 5px; overflow: hidden; margin-bottom: 6px; }
        .dte-mini-header { background: #f1f5f9; font-weight: 700; font-size: 8.2px; text-align: center; padding: 2px 4px; border-bottom: 1px solid #cbd5e1; color: #334155; letter-spacing: 0.4px; }
        .dte-mini-body { padding: 3.5px 6px; font-size: 8.5px; }
        .dte-mini-body.flex-row { display: flex; justify-content: space-around; gap: 10px; }
        .dte-table-mini { width: 100%; border-collapse: collapse; font-size: 8.2px; table-layout: fixed; }
        .dte-table-mini th { background: #f8fafc; padding: 2.5px 4px; border: 1px solid #cbd5e1; font-weight: 700; text-align: center; color: #374151; }
        .dte-table-mini td { padding: 2.5px 4px; border: 1px solid #e2e8f0; text-align: center; word-break: break-word; }
        .dte-items-table { width: 100%; border-collapse: collapse; font-size: 8.3px; margin-bottom: 6px; border: 1.5px solid #0f172a; table-layout: fixed; }
        .dte-items-table th { background: #f1f5f9; color: #0f172a; font-weight: 800; padding: 4px 2px; border: 1px solid #0f172a; text-align: center; font-size: 7.8px; line-height: 1.15; word-break: break-word; }
        .dte-items-table td { padding: 3px 2px; border: 1px solid #cbd5e1; line-height: 1.2; }
        .dte-items-table td.col-desc { word-break: break-word; }
        .dte-items-table .col-num { width: 22px; text-align: center; font-weight: 700; }
        .dte-items-table .col-cant { width: 34px; text-align: center; }
        .dte-items-table .col-uni { width: 44px; text-align: center; }
        .dte-items-table .col-cod { width: 42px; text-align: center; }
        .dte-items-table .col-desc { text-align: left; }
        .dte-items-table .col-precio { width: 50px; text-align: right; }
        .dte-items-table .col-descu { width: 44px; text-align: right; }
        .dte-items-table .col-nosuj { width: 50px; text-align: right; }
        .dte-items-table .col-exenta { width: 50px; text-align: right; }
        .dte-items-table .col-gravada { width: 54px; text-align: right; }
        .dte-bottom-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 8px; margin-top: auto; padding-top: 4px; }
        .dte-bottom-left { display: flex; flex-direction: column; gap: 6px; }
        .dte-legal-box { border: 1px solid #0f172a; border-radius: 5px; padding: 5px 7px; display: flex; flex-direction: column; gap: 3px; font-size: 8.4px; }
        .legal-row { display: flex; gap: 4px; }
        .legal-row .lbl { font-weight: 700; color: #4b5563; white-space: nowrap; }
        .legal-row .val { color: #111827; }
        .legal-row .val.bold { font-weight: 800; }
        .dte-signatures-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .sig-box { border: 1px dashed #64748b; border-radius: 4px; padding: 12px 4px 4px 4px; font-size: 7.6px; text-align: center; display: flex; flex-direction: column; justify-content: flex-end; height: 42px; }
        .sig-title { font-weight: 700; color: #334155; }
        .sig-doc { color: #64748b; margin-top: 1px; }
        .dte-bottom-right { display: flex; flex-direction: column; }
        .dte-summary-table { width: 100%; border-collapse: collapse; font-size: 8.5px; border: 1.5px solid #0f172a; }
        .dte-summary-table td { padding: 2px 4px; border-bottom: 1px solid #e2e8f0; line-height: 1.2; }
        .dte-summary-table .col-lbl { text-align: right; color: #334155; font-weight: 600; width: 62%; }
        .dte-summary-table .col-val { text-align: right; color: #0f172a; font-weight: 600; width: 38%; }
        .dte-summary-table .col-val.bold { font-weight: 800; }
        .dte-summary-table .row-total td { background: #f8fafc; border-top: 1.5px solid #0f172a; border-bottom: none; padding: 4px; }
        .dte-summary-table .grand-total { color: var(--dte-primary); font-size: 11px; font-weight: 900; }
        .dte-footer { margin-top: 6px; border-top: 1px solid #cbd5e1; padding-top: 4px; display: flex; justify-content: space-between; font-size: 7.8px; color: #64748b; }
      </style>
      <!-- Encabezado Principal -->
      <div class="dte-header">
        <div class="dte-header-top">
          <div class="dte-logo-area">
            ${logoEmpresa ? `<img src="${logoEmpresa}" class="dte-logo-img" alt="Logo de la Empresa">` : `<div class="dte-logo-badge">${logoBadge}</div>`}
          </div>
          <div class="dte-title-area">
            <h1 class="dte-main-title">DOCUMENTO TRIBUTARIO ELECTRÓNICO</h1>
            <h2 class="dte-doc-type">${getNombreTipoDTE(tipo)}</h2>
          </div>
          <div class="dte-version-badge">${getVersionDTE(tipo, dte)}</div>
        </div>

        <div class="dte-meta-grid">
          <div class="dte-meta-col-left">
            <div class="dte-meta-row"><span class="lbl">Código de Generación:</span> <span class="val bold" style="font-size:8.2px;letter-spacing:-0.2px">${safeStr(ident.codigoGeneracion)}</span></div>
            <div class="dte-meta-row"><span class="lbl">Número de Control:</span> <span class="val bold" style="font-size:8.2px">${safeStr(ident.numeroControl)}</span></div>
            <div class="dte-meta-row"><span class="lbl">Sello de Recepción:</span> <span class="val" style="font-size:8px">${safeStr(sello)}</span></div>
          </div>
          <div class="dte-qr-box">
            ${qrSvg}
          </div>
          <div class="dte-meta-col-right">
            <div class="dte-meta-row"><span class="lbl">Modelo de Facturación:</span> <span class="val">Previo</span></div>
            <div class="dte-meta-row"><span class="lbl">Tipo de Transmisión:</span> <span class="val">Normal</span></div>
            <div class="dte-meta-row"><span class="lbl">Fecha y Hora:</span> <span class="val bold">${safeStr(ident.fecEmi)} ${safeStr(ident.horEmi)}</span></div>
          </div>
        </div>
      </div>

      <!-- Cajas Emisor y Receptor -->
      <div class="dte-parties-grid">
        <div class="dte-party-box emisor">
          <div class="dte-party-header">EMISOR</div>
          <div class="dte-party-body">
            <div class="party-row"><span class="p-lbl">Nombre o razón social:</span> <span class="p-val bold">${safeStr(emisor.nombre)}</span></div>
            <div class="party-row-half">
              <div><span class="p-lbl">NIT:</span> <span class="p-val">${formatNIT(emisor.nit)}</span></div>
              <div><span class="p-lbl">NRC:</span> <span class="p-val">${formatNRC(emisor.nrc)}</span></div>
            </div>
            <div class="party-row"><span class="p-lbl">Actividad económica:</span> <span class="p-val">${safeStr(emisor.descActividad || 'Comercio / Servicios')}</span></div>
            <div class="party-row"><span class="p-lbl">Dirección:</span> <span class="p-val">${dirEmisor}</span></div>
            <div class="party-row-half">
              <div><span class="p-lbl">Número de teléfono:</span> <span class="p-val">${safeStr(emisor.telefono, '-')}</span></div>
              <div><span class="p-lbl">Tipo establecimiento:</span> <span class="p-val">Casa Matriz</span></div>
            </div>
            <div class="party-row"><span class="p-lbl">Correo electrónico:</span> <span class="p-val">${safeStr(emisor.correo, '-')}</span></div>
            <div class="party-row"><span class="p-lbl">Nombre Comercial:</span> <span class="p-val">${safeStr(emisor.nombreComercial, '-')}</span></div>
          </div>
        </div>

        <div class="dte-party-box receptor">
          <div class="dte-party-header">RECEPTOR</div>
          <div class="dte-party-body">
            <div class="party-row"><span class="p-lbl">Nombre o razón social:</span> <span class="p-val bold">${safeStr(receptor.nombre)}</span></div>
            <div class="party-row-half">
              <div><span class="p-lbl">NIT / DUI:</span> <span class="p-val">${formatNIT(receptor.nit || receptor.numDocumento)}</span></div>
              <div><span class="p-lbl">NRC:</span> <span class="p-val">${formatNRC(receptor.nrc)}</span></div>
            </div>
            <div class="party-row"><span class="p-lbl">Actividad económica:</span> <span class="p-val">${safeStr(receptor.descActividad, '-')}</span></div>
            <div class="party-row"><span class="p-lbl">Dirección:</span> <span class="p-val">${dirReceptor}</span></div>
            <div class="party-row-half">
              <div><span class="p-lbl">Número de teléfono:</span> <span class="p-val">${safeStr(receptor.telefono, '-')}</span></div>
              <div><span class="p-lbl">Nombre Comercial:</span> <span class="p-val">${safeStr(receptor.nombreComercial, '-')}</span></div>
            </div>
            <div class="party-row"><span class="p-lbl">Correo electrónico:</span> <span class="p-val">${safeStr(receptor.correo, '-')}</span></div>
          </div>
        </div>
      </div>

      <!-- Venta por cuenta de terceros -->
      <div class="dte-section-box">
        <div class="dte-mini-header">VENTA A CUENTA DE TERCEROS</div>
        <div class="dte-mini-body flex-row">
          <div><span class="p-lbl">NIT:</span> <span class="p-val">-</span></div>
          <div><span class="p-lbl">Nombre, denominación o razón social:</span> <span class="p-val">-</span></div>
        </div>
      </div>

      <!-- Documentos Relacionados (Crítico para Notas de Crédito) -->
      ${tipo === '05' || (Array.isArray(docRel) && docRel.length > 0) ? `
      <div class="dte-section-box">
        <div class="dte-mini-header">DOCUMENTOS RELACIONADOS</div>
        <table class="dte-table-mini">
          <thead>
            <tr>
              <th>Tipo de Documento</th>
              <th>N° de Documento</th>
              <th>Fecha de Documento</th>
            </tr>
          </thead>
          <tbody>
            ${filasDocRel}
          </tbody>
        </table>
      </div>` : ''}

      <!-- Otros Documentos Asociados -->
      <div class="dte-section-box">
        <div class="dte-mini-header">OTROS DOCUMENTOS ASOCIADOS</div>
        <table class="dte-table-mini">
          <thead>
            <tr>
              <th>Identificación del documento</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>-</td>
              <td>-</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tabla del Cuerpo del Documento (Ítems) -->
      <table class="dte-items-table">
        <thead>
          <tr>
            <th class="col-num">N°</th>
            <th class="col-cant">Cantidad</th>
            <th class="col-uni">Unidad</th>
            <th class="col-cod">Código</th>
            <th class="col-desc">Descripción</th>
            <th class="col-precio">Precio Unitario</th>
            <th class="col-descu">Descuento por ítem</th>
            <th class="col-nosuj">Ventas No Sujetas</th>
            <th class="col-exenta">Ventas Exentas</th>
            <th class="col-gravada">Ventas Gravadas</th>
          </tr>
        </thead>
        <tbody>
          ${filasItems}
        </tbody>
      </table>

      <!-- Resumen y Liquidación de Impuestos -->
      <div class="dte-bottom-grid">
        <div class="dte-bottom-left">
          <div class="dte-legal-box">
            <div class="legal-row"><span class="lbl">Valor en Letras:</span> <span class="val bold">${safeStr(resumen.totalLetras)}</span></div>
            <div class="legal-row"><span class="lbl">Condición de la Operación:</span> <span class="val bold">${condicion.toUpperCase()}</span></div>
            <div class="legal-row"><span class="lbl">Observaciones:</span> <span class="val">${safeStr(resumen.observaciones || dte.extension?.observaciones, '-')}</span></div>
          </div>

          <div class="dte-signatures-grid">
            <div class="sig-box">
              <div class="sig-title">Responsable por parte del emisor: -</div>
              <div class="sig-doc">N° de Documento: -</div>
            </div>
            <div class="sig-box">
              <div class="sig-title">Responsable por parte del Receptor: -</div>
              <div class="sig-doc">N° de Documento: -</div>
            </div>
          </div>
        </div>

        <div class="dte-bottom-right">
          <table class="dte-summary-table">
            <tr>
              <td class="col-lbl">Suma de Ventas No Sujetas:</td>
              <td class="col-val">${fmtMoney(resumen.totalNoSuj || 0)}</td>
            </tr>
            <tr>
              <td class="col-lbl">Suma de Ventas Exentas:</td>
              <td class="col-val">${fmtMoney(resumen.totalExenta || 0)}</td>
            </tr>
            <tr>
              <td class="col-lbl">Suma de Ventas Gravadas:</td>
              <td class="col-val bold">${fmtMoney(resumen.totalGravada || 0)}</td>
            </tr>
            <tr>
              <td class="col-lbl">Suma Total de Operaciones:</td>
              <td class="col-val bold">${fmtMoney(resumen.subTotalVentas || resumen.totalGravada || 0)}</td>
            </tr>
            <tr>
              <td class="col-lbl">Monto global Desc. No Sujetas:</td>
              <td class="col-val">$ 0.00</td>
            </tr>
            <tr>
              <td class="col-lbl">Monto global Desc. Exentas:</td>
              <td class="col-val">$ 0.00</td>
            </tr>
            <tr>
              <td class="col-lbl">Monto global Desc. Gravadas:</td>
              <td class="col-val">$ 0.00</td>
            </tr>
            ${tipo === '03' || tipo === '05' ? `
            <tr>
              <td class="col-lbl">Impuesto al Valor Agregado 13%:</td>
              <td class="col-val bold">${fmtMoney(resumen.tributos?.[0]?.valor || (Number(resumen.totalGravada || 0) * 0.13))}</td>
            </tr>` : ''}
            <tr>
              <td class="col-lbl">Sub-Total:</td>
              <td class="col-val bold">${fmtMoney(resumen.subTotal || resumen.totalGravada || 0)}</td>
            </tr>
            ${Number(resumen.ivaPerci1 || 0) > 0 ? `
            <tr>
              <td class="col-lbl">IVA Percibido:</td>
              <td class="col-val">${fmtMoney(resumen.ivaPerci1)}</td>
            </tr>` : ''}
            ${Number(resumen.ivaRete1 || 0) > 0 ? `
            <tr>
              <td class="col-lbl">IVA Retenido:</td>
              <td class="col-val">-${fmtMoney(resumen.ivaRete1)}</td>
            </tr>` : ''}
            ${Number(resumen.reteRenta || 0) > 0 ? `
            <tr>
              <td class="col-lbl">Retención de Renta:</td>
              <td class="col-val">-${fmtMoney(resumen.reteRenta)}</td>
            </tr>` : ''}
            <tr class="row-total">
              <td class="col-lbl">${tipo === '05' ? 'Monto Total de la Operación:' : 'Total a Pagar:'}</td>
              <td class="col-val grand-total">${fmtMoney(totalPagar)}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Pie de página -->
      <div class="dte-footer">
        <div>Documento Tributario Electrónico emitido de acuerdo a la normativa legal del Ministerio de Hacienda de El Salvador.</div>
        <div class="bold">Página 1 de 1</div>
      </div>
    </div>`;
  }

  // Cache global de DTEs para modales
  root.__dte_modal_cache = root.__dte_modal_cache || {};

  // Abre la ventana de previsualización e impresión
  function previsualizarDTE(dte, opciones = {}) {
    const clienteLimpio = sanitizarNombreArchivo(dte.receptor?.nombre || 'CLIENTE');
    const tipoDte = dte.identificacion?.tipoDte || '01';
    const correlativo = dte.identificacion?.numeroControl || dte.identificacion?.codigoGeneracion || 'DTE';
    const fileName = `${getNombreTipoDTE(tipoDte).replace(/\s+/g, '_')}_${correlativo}_${clienteLimpio}`;

    const htmlContent = renderDteHtml(dte, opciones);

    // Crear modal interactivo
    const modalId = 'modal-dte-viewer-' + Date.now();
    root.__dte_modal_cache[modalId] = dte;

    const modalHtml = `
      <div class="modal-backdrop dte-viewer-backdrop" id="${modalId}" onclick="if(event.target===this)this.remove()">
        <div class="modal dte-viewer-modal">
          <div class="dte-viewer-toolbar">
            <div class="dte-viewer-title">
              <b>${getNombreTipoDTE(tipoDte)}:</b> ${dte.identificacion?.numeroControl || ''}
              <span class="badge-estado ${dte.estado || 'PROCESADO'}">${dte.estado || 'PROCESADO'}</span>
            </div>
            <div class="dte-viewer-actions">
              <button class="btn btn-verde" onclick="DTEVisual.imprimir('${modalId}')">🖨️ Imprimir / Guardar PDF</button>
              <button class="btn btn-secundario" onclick="DTEVisual.descargarPDF('${modalId}', '${fileName}')">⬇️ Descargar PDF</button>
              <button class="btn btn-azul" onclick="DTEVisual.enviarEmailModal('${modalId}')">✉️ Email</button>
              <button class="btn btn-whatsapp" onclick="DTEVisual.enviarWhatsAppModal('${modalId}')">💬 WhatsApp</button>
              <button class="btn btn-ghost" onclick="DTEVisual.descargarJSON('${modalId}', '${fileName}')">{ } JSON</button>
              <button class="btn btn-ghost" onclick="document.getElementById('${modalId}').remove()">✕ Cerrar</button>
            </div>
          </div>
          <div class="dte-viewer-content" id="${modalId}-container">
            ${htmlContent}
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  // Imprime directamente el DTE usando un iframe oculto (sin bloqueos de ventanas emergentes)
  function imprimirDTEById(modalId) {
    const container = document.getElementById(`${modalId}-container`) || document.getElementById(modalId);
    if (!container) return window.print();

    const docEl = container.querySelector('.dte-document') || container;

    let iframe = document.getElementById('dte-print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'dte-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const cssContent = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML)
      .join('\n');

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Comprobante DTE</title>
        ${cssContent}
        <style>
          @page { size: letter portrait; margin: 6mm; }
          body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; }
          .dte-document { box-shadow: none !important; border: 1.5px solid #000 !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; }
        </style>
      </head>
      <body>
        ${docEl.outerHTML}
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 350);
  }

  // Descarga directa a PDF usando el objeto DTE o el contenedor del modal
  function descargarDTEPDFDirecto(target, fileName) {
    let dteObj = null;
    let modalId = null;

    if (typeof target === 'string') {
      modalId = target;
      if (root.__dte_modal_cache && root.__dte_modal_cache[target]) {
        dteObj = root.__dte_modal_cache[target];
      }
    }

    const cleanFileName = fileName || 'Comprobante_DTE';

    if (dteObj) {
      return descargarDTECompleto(dteObj, {}, cleanFileName);
    }

    if (modalId) {
      imprimirDTEById(modalId);
    }
  }

  // Descarga directa de PDF a partir del objeto DTE (sin abrir modal)
  function descargarDTECompleto(dte, opciones = {}, fileName = '') {
    const clienteLimpio = sanitizarNombreArchivo(dte.receptor?.nombre || 'CLIENTE');
    const tipoDte = dte.identificacion?.tipoDte || '01';
    const correlativo = dte.identificacion?.numeroControl || dte.identificacion?.codigoGeneracion || 'DTE';
    const finalFileName = fileName || `${getNombreTipoDTE(tipoDte).replace(/\s+/g, '_')}_${correlativo}_${clienteLimpio}`;

    if (typeof root.html2pdf === 'function') {
      if (typeof root.toast === 'function') root.toast('Generando PDF...', 'info');

      const htmlContent = renderDteHtml(dte, opciones);

      const opt = {
        margin: [6, 6, 6, 6],
        filename: `${finalFileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
      };

      root.html2pdf().set(opt).from(htmlContent).save()
        .then(() => {
          if (typeof root.toast === 'function') root.toast('PDF descargado con éxito', 'success');
        })
        .catch((err) => {
          console.warn('Error en html2pdf:', err);
          previsualizarDTE(dte, opciones);
        });
    } else {
      previsualizarDTE(dte, opciones);
    }
  }

  // Genera el Base64 puro del PDF del DTE en memoria para adjuntarlo
  async function generarPDFBase64(dte, opciones = {}) {
    if (typeof root.html2pdf !== 'function') return null;

    const htmlContent = renderDteHtml(dte, opciones);

    const opt = {
      margin: [6, 6, 6, 6],
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollY: 0,
        scrollX: 0
      },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    try {
      const pdfObj = await root.html2pdf().set(opt).from(htmlContent).toPdf().get('pdf');
      const pdfDataUri = pdfObj.output('datauristring');
      const cleanB64 = pdfDataUri && pdfDataUri.includes(',') ? pdfDataUri.split(',')[1].trim() : (pdfDataUri || '').trim();
      return cleanB64;
    } catch (err) {
      console.warn('Error al generar PDF en base64:', err);
      return null;
    }
  }

  function descargarDTEJSONDirecto(target, fileName) {
    let dteObj = target;
    if (typeof target === 'string' && root.__dte_modal_cache && root.__dte_modal_cache[target]) {
      dteObj = root.__dte_modal_cache[target];
    }
    const cleanFileName = fileName || 'Comprobante_DTE';
    const jsonStr = typeof dteObj === 'string' ? dteObj : JSON.stringify(dteObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${cleanFileName}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    if (typeof root.toast === 'function') root.toast('JSON descargado con éxito', 'success');
  }

  // ---------- ENVÍO POR CORREO ELECTRÓNICO (EMAIL) ----------
  function enviarEmailDTE(dte, opciones = {}) {
    const ident = dte.identificacion || {};
    const receptor = dte.receptor || {};
    const resumen = dte.resumen || {};
    const tipo = ident.tipoDte || '01';
    const tipoNom = getNombreTipoDTE(tipo);
    const numControl = ident.numeroControl || 'DTE';
    const codGen = ident.codigoGeneracion || '';
    const fechaEmi = ident.fecEmi || new Date().toISOString().slice(0, 10);
    const fechaEmiFmt = (function(f){
      if(!f) return '';
      const p = String(f).split('-');
      return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : f;
    })(fechaEmi);
    const totalPagar = Number(resumen.totalPagar !== undefined ? resumen.totalPagar : (resumen.montoTotalOperacion || 0)).toFixed(2);
    const receptorNombre = receptor.nombre || 'CLIENTE';
    const receptorDoc = receptor.nrc || receptor.nit || receptor.numDocumento || '';
    const receptorSaludo = receptorDoc ? `${receptorDoc} ${receptorNombre}` : receptorNombre;
    const correoDestino = opciones.destinatario || 'spacioprintrotulos@gmail.com';
    const asuntoDef = `Factura Electrónica DTE ${tipoNom} Spacio Rotulos`;

    const clienteLimpio = sanitizarNombreArchivo(receptorNombre);
    const baseFileName = `${tipoNom.replace(/\s+/g, '_')}_${numControl}_${clienteLimpio}`;

    const modalId = 'modal-email-dte-' + Date.now();
    const modalHtml = `
      <div class="modal-backdrop" id="${modalId}" onclick="if(event.target===this)this.remove()">
        <div class="modal" style="max-width:680px;padding:24px">
          <div class="flex" style="justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3 style="margin:0;display:flex;align-items:center;gap:8px">✉️ Enviar Comprobante por Correo</h3>
            <button class="btn btn-ghost" style="padding:4px 8px" onclick="document.getElementById('${modalId}').remove()">✕</button>
          </div>

          <div class="form-field">
            <label>Para (Destinatario):</label>
            <div class="flex" style="gap:8px">
              <input id="${modalId}-destinatario" value="${esc(correoDestino)}" style="flex:1;font-weight:700">
              ${receptor.correo && receptor.correo !== '-' && receptor.correo !== correoDestino ? `
                <button class="btn btn-secundario btn-xs" type="button" onclick="document.getElementById('${modalId}-destinatario').value='${esc(receptor.correo)}'">Usar cliente (${esc(receptor.correo)})</button>
              ` : ''}
            </div>
            <span class="small text-gris" style="margin-top:4px;display:block">Por defecto se envía al correo de pruebas: <b>spacioprintrotulos@gmail.com</b></span>
          </div>

          <div class="form-field">
            <label>Asunto:</label>
            <input id="${modalId}-asunto" value="${esc(asuntoDef)}">
          </div>

          <div class="form-field">
            <label>Archivos Adjuntos Oficiales:</label>
            <div class="flex" style="gap:10px;margin-top:4px">
              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:6px 12px;font-size:12px;display:flex;align-items:center;gap:6px;color:#1e40af">
                📄 <b>${esc(baseFileName)}.pdf</b>
              </div>
              <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:6px 12px;font-size:12px;display:flex;align-items:center;gap:6px;color:#334155">
                { } <b>${esc(baseFileName)}.json</b>
              </div>
            </div>
          </div>

          <!-- Vista Previa del Correo Estilizado -->
          <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;padding:18px;margin-bottom:16px">
            <div style="text-align:center;font-size:11.5px;color:#64748b;margin-bottom:8px">Vista previa del correo:</div>
            <div style="text-align:center;margin-bottom:10px">
              <img src="/img/logo_spacio.png" alt="Spacio Rotulos" style="max-height:42px;object-fit:contain">
            </div>
            <div style="text-align:center;margin-bottom:12px">
              <span style="display:inline-block;width:48px;height:48px;line-height:48px;border-radius:50%;background:#eff6ff;border:2px solid #0d47c9;font-size:24px">📄</span>
            </div>
            <div style="font-size:13px;line-height:1.45;color:#1e293b;margin-bottom:12px">
              <p style="margin:0 0 6px 0"><b>Estimado(a) ${esc(receptorSaludo)},</b></p>
              <p style="margin:0 0 10px 0">Spacio Rotulos. -1201-260869-101-8- ha emitido un Documento Tributario Electrónico -DTE- con la siguiente información:</p>
            </div>
            <div style="background:#fffdfa;border:2px solid #f59e0b;border-radius:10px;padding:10px 14px;font-size:12.5px;margin-bottom:10px">
              <div><b>Código de Generación:</b> <span style="font-family:monospace">${esc(codGen)}</span></div>
              <div><b>Fecha de emisión:</b> ${esc(fechaEmiFmt)}</div>
              <div><b>Tipo de Comprobante:</b> <b style="color:#0d47c9">${esc(tipoNom)}</b></div>
              <div><b>Monto Total:</b> <b style="color:#16a34a">USD $${totalPagar}</b></div>
            </div>
            <div style="font-size:12px;color:#475569;margin-bottom:10px">
              Adjunto podrá descargar un archivo PDF y JSON el cual está firmado electrónicamente y autorizado por el Ministerio de Hacienda (MH).
            </div>
            <hr style="border:none;border-top:1px solid #0d47c9;margin:10px 0">
            <div style="text-align:center;font-size:11px;color:#94a3b8">© 2026 Spacio Rotulos. - Todos los derechos reservados -</div>
          </div>

          <div class="modal-actions" style="justify-content:space-between">
            <div class="flex" style="gap:8px">
              <button class="btn btn-azul" id="${modalId}-btn-enviar">✉️ Enviar Correo</button>
              <button class="btn btn-secundario" id="${modalId}-btn-mailto">📨 Abrir en App de Correo</button>
            </div>
            <button class="btn btn-ghost" onclick="document.getElementById('${modalId}').remove()">Cerrar</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById(modalId);
    const btnEnviar = document.getElementById(`${modalId}-btn-enviar`);
    const btnMailto = document.getElementById(`${modalId}-btn-mailto`);

    btnEnviar.addEventListener('click', async () => {
      const dest = document.getElementById(`${modalId}-destinatario`).value.trim();
      const asu = document.getElementById(`${modalId}-asunto`).value.trim();
      if (!dest) return root.toast ? root.toast('Ingrese un correo de destino', 'error') : alert('Ingrese un correo');

      btnEnviar.disabled = true;
      btnEnviar.textContent = 'Generando PDF y enviando...';

      try {
        const pdfBase64 = await generarPDFBase64(dte, opciones);
        const apiClient = window.API || root.API || (typeof API !== 'undefined' ? API : null);
        let resp;
        if (apiClient && typeof apiClient.enviarEmailDTE === 'function') {
          resp = await apiClient.enviarEmailDTE({
            dteObj: dte,
            destinatario: dest,
            asunto: asu,
            pdfBase64: pdfBase64,
          });
        } else {
          const fetchResp = await fetch('/api/dtes/enviar-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
              dteObj: dte,
              destinatario: dest,
              asunto: asu,
              pdfBase64: pdfBase64,
            })
          });
          resp = await fetchResp.json();
          if (!fetchResp.ok || !resp.ok) {
            throw new Error(resp.error || `Error HTTP ${fetchResp.status}`);
          }
        }

        const msgSuccess = resp.mensaje || `Correo enviado con éxito a ${dest}`;
        if (root.toast) root.toast(msgSuccess, 'success');
        else if (window.toast) window.toast(msgSuccess, 'success');
        else alert(msgSuccess);
        modalEl.remove();
      } catch (err) {
        const errorMsg = err?.error || err?.message || (typeof err === 'string' ? err : 'Error al enviar correo');
        if (root.toast) root.toast(errorMsg, 'error');
        else if (window.toast) window.toast(errorMsg, 'error');
        else alert(errorMsg);
      } finally {
        btnEnviar.disabled = false;
        btnEnviar.textContent = '✉️ Enviar Correo';
      }
    });

    btnMailto.addEventListener('click', () => {
      const dest = document.getElementById(`${modalId}-destinatario`).value.trim();
      const asu = document.getElementById(`${modalId}-asunto`).value.trim();
      const bodyMailto = `Estimado(a) ${receptorSaludo},\n\nSpacio Rotulos. -1201-260869-101-8- ha emitido su Documento Tributario Electrónico (DTE).\n\nCódigo de Generación: ${codGen}\nFecha de emisión: ${fechaEmiFmt}\nTipo de Comprobante: ${tipoNom}\nMonto Total: USD $${totalPagar}\n\nAdjuntamos su comprobante oficial en PDF y JSON autorizado por el Ministerio de Hacienda (MH).\n\n© 2026 Spacio Rotulos.`;
      const mailtoUrl = `mailto:${encodeURIComponent(dest)}?subject=${encodeURIComponent(asu)}&body=${encodeURIComponent(bodyMailto)}`;
      window.open(mailtoUrl, '_blank');
      descargarDTECompleto(dte, opciones, baseFileName);
      descargarDTEJSONDirecto(dte, baseFileName);
      if (root.toast) root.toast('Descargando archivos PDF y JSON para adjuntar al correo', 'info');
    });
  }

  // ---------- ENVÍO POR WHATSAPP (GATEWAY DIRECTO O WEB) ----------
  function enviarWhatsAppDTE(dte, opciones = {}) {
    const ident = dte.identificacion || {};
    const receptor = dte.receptor || {};
    const resumen = dte.resumen || {};
    const tipo = ident.tipoDte || '01';
    const tipoNom = getNombreTipoDTE(tipo);
    const numControl = ident.numeroControl || 'DTE';
    const codGen = ident.codigoGeneracion || '';
    const fechaEmi = ident.fecEmi || new Date().toISOString().slice(0, 10);
    const totalPagar = Number(resumen.totalPagar !== undefined ? resumen.totalPagar : (resumen.montoTotalOperacion || 0)).toFixed(2);
    const receptorNombre = receptor.nombre || 'CLIENTE';
    const receptorTel = receptor.telefono || receptor.celular || '50372554916';
    const ambiente = ident.ambiente || '00';

    const clienteLimpio = sanitizarNombreArchivo(receptorNombre);
    const baseFileName = `${tipoNom.replace(/\s+/g, '_')}_${numControl}_${clienteLimpio}`;
    const urlConsulta = `https://admin.factura.gob.sv/consultaPublica?ambiente=${ambiente}&codGen=${codGen}&fechaEmi=${fechaEmi}`;

    const mensajeWA = 
`📄 *DOCUMENTO TRIBUTARIO ELECTRÓNICO (DTE)*
*Emisor:* Spacio Rotulos (NIT: 1201-260869-101-8)

Estimado(a) *${receptorNombre}*:
Se ha generado su Documento Tributario Electrónico con la siguiente información:

🔹 *Tipo de Comprobante:* ${tipoNom}
🔹 *N° de Control:* ${numControl}
🔹 *Código de Generación:* ${codGen}
🔹 *Fecha de Emisión:* ${fechaEmi}
🔹 *Monto Total:* USD $${totalPagar}

✅ *Documento autorizado por el Ministerio de Hacienda (MH).*
🔍 *Consulta Pública Oficial:*
${urlConsulta}

📎 _Adjuntamos a continuación su Comprobante Oficial en formato PDF y archivo JSON firmado._

© 2026 Spacio Rotulos. - Todos los derechos reservados -`;

    const modalId = 'modal-wa-send-' + Date.now();
    const modalHtml = `
      <div class="modal-backdrop" id="${modalId}" onclick="if(event.target===this)this.remove()">
        <div class="modal" style="max-width:580px;padding:24px">
          <div class="flex" style="justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3 style="margin:0;display:flex;align-items:center;gap:8px">💬 Enviar Comprobante por WhatsApp</h3>
            <button class="btn btn-ghost" style="padding:4px 8px" onclick="document.getElementById('${modalId}').remove()">✕</button>
          </div>

          <div class="form-field">
            <label>Número de WhatsApp (Destinatario):</label>
            <div class="flex" style="gap:8px">
              <input id="${modalId}-phone" value="${esc(receptorTel)}" style="flex:1;font-weight:700" placeholder="Ej: 50372554916 o 72554916">
              ${receptorTel !== '50372554916' ? `<button class="btn btn-secundario btn-xs" type="button" onclick="document.getElementById('${modalId}-phone').value='50372554916'">Usar mi teléfono (+503 7255 4916)</button>` : ''}
            </div>
            <span class="small text-gris" style="margin-top:4px;display:block">Puedes ingresar números de 8 dígitos de El Salvador o con código internacional (ej. 50372554916).</span>
          </div>

          <div class="form-field">
            <label>Mensaje:</label>
            <textarea id="${modalId}-msg" rows="7" style="font-family:monospace;font-size:12px;line-height:1.4">${esc(mensajeWA)}</textarea>
          </div>

          <div class="form-field">
            <label>Archivos que se enviarán adjuntos:</label>
            <div class="flex" style="gap:10px;margin-top:4px">
              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:6px 12px;font-size:12px;display:flex;align-items:center;gap:6px;color:#1e40af">
                📄 <b>${esc(baseFileName)}.pdf</b>
              </div>
              <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:6px 12px;font-size:12px;display:flex;align-items:center;gap:6px;color:#334155">
                { } <b>${esc(baseFileName)}.json</b>
              </div>
            </div>
          </div>

          <div class="modal-actions" style="justify-content:space-between;margin-top:20px;flex-wrap:wrap;gap:8px">
            <div class="flex" style="gap:8px;flex-wrap:wrap">
              <button class="btn btn-whatsapp" id="${modalId}-btn-gateway" style="display:inline-flex;align-items:center;gap:6px">
                💬 Enviar Automático (Gateway)
              </button>
              <button class="btn btn-secundario" id="${modalId}-btn-web" style="display:inline-flex;align-items:center;gap:6px">
                📱 Abrir en WhatsApp Web
              </button>
            </div>
            <button class="btn btn-ghost" onclick="document.getElementById('${modalId}').remove()">Cerrar</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById(modalId);
    const btnGateway = document.getElementById(`${modalId}-btn-gateway`);
    const btnWeb = document.getElementById(`${modalId}-btn-web`);

    // Envío desatendido directo mediante el Gateway en Railway
    btnGateway.addEventListener('click', async () => {
      const phoneInput = document.getElementById(`${modalId}-phone`).value.trim();
      const msgInput = document.getElementById(`${modalId}-msg`).value.trim();
      if (!phoneInput) {
        return root.toast ? root.toast('Ingrese un número de teléfono válido', 'error') : alert('Ingrese un número');
      }

      btnGateway.disabled = true;
      btnGateway.textContent = 'Generando PDF y enviando...';

      try {
        const pdfBase64 = await generarPDFBase64(dte, opciones);
        const apiClient = window.API || root.API || (typeof API !== 'undefined' ? API : null);
        let resp;
        if (apiClient && typeof apiClient.enviarWhatsAppGateway === 'function') {
          resp = await apiClient.enviarWhatsAppGateway({
            dteObj: dte,
            phone: phoneInput,
            customMessage: msgInput,
            pdfBase64: pdfBase64,
          });
        } else {
          const fetchResp = await fetch('/api/whatsapp/enviar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
              dteObj: dte,
              phone: phoneInput,
              customMessage: msgInput,
              pdfBase64: pdfBase64,
            })
          });
          resp = await fetchResp.json();
          if (!fetchResp.ok || !resp.ok) {
            throw new Error(resp.error || `Error HTTP ${fetchResp.status}`);
          }
        }

        const msgSuccess = resp.message || `✅ Mensaje de WhatsApp enviado con éxito al +${resp.phone || phoneInput}`;
        if (root.toast) root.toast(msgSuccess, 'success');
        else if (window.toast) window.toast(msgSuccess, 'success');
        else alert(msgSuccess);
        modalEl.remove();
      } catch (err) {
        const errorMsg = err?.error || err?.message || (typeof err === 'string' ? err : 'Error al enviar por Gateway');
        if (root.toast) root.toast(errorMsg, 'error');
        else if (window.toast) window.toast(errorMsg, 'error');
        else alert(errorMsg);
      } finally {
        btnGateway.disabled = false;
        btnGateway.textContent = '💬 Enviar Automático (Gateway)';
      }
    });

    // Fallback: abrir en WhatsApp Web descargando los archivos
    btnWeb.addEventListener('click', () => {
      const phoneInput = document.getElementById(`${modalId}-phone`).value.trim();
      const msgInput = document.getElementById(`${modalId}-msg`).value.trim();
      let cleanPhone = phoneInput.replace(/\D/g, '');
      if (cleanPhone.length === 8) cleanPhone = '503' + cleanPhone;

      const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msgInput)}`;
      window.open(waUrl, '_blank');
      descargarDTECompleto(dte, opciones, baseFileName);
      descargarDTEJSONDirecto(dte, baseFileName);
      if (root.toast) root.toast('Descargando archivos PDF y JSON para adjuntar en WhatsApp Web', 'info');
      modalEl.remove();
    });
  }

  function enviarEmailPorModalId(modalId) {
    const dte = root.__dte_modal_cache && root.__dte_modal_cache[modalId];
    if (dte) enviarEmailDTE(dte);
  }

  function enviarWhatsAppPorModalId(modalId) {
    const dte = root.__dte_modal_cache && root.__dte_modal_cache[modalId];
    if (dte) enviarWhatsAppDTE(dte);
  }

  root.DTEVisual = {
    renderHtml: renderDteHtml,
    generarHTML: renderDteHtml,
    previsualizar: previsualizarDTE,
    imprimir: imprimirDTEById,
    descargarPDF: descargarDTEPDFDirecto,
    descargarDTE: descargarDTECompleto,
    descargarJSON: descargarDTEJSONDirecto,
    enviarEmail: enviarEmailDTE,
    enviarWhatsApp: enviarWhatsAppDTE,
    enviarEmailModal: enviarEmailPorModalId,
    enviarWhatsAppModal: enviarWhatsAppPorModalId,
    sanitizarNombre: sanitizarNombreArchivo,
    getNombreTipo: getNombreTipoDTE,
  };
})(typeof window !== 'undefined' ? window : globalThis);
