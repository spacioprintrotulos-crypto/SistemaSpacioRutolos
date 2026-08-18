// ============================================================
// SISTEMA FAC2026 — Representación Gráfica Oficial DTE (MH El Salvador)
// Generador visual, impresión de alta calidad y exportación a PDF/JSON
// Conforme a los lineamientos oficiales del Ministerio de Hacienda v2
// ============================================================

(function(root) {
  // ---------- Helpers de formato ----------
  const fmtMoney = (n) => `$ ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const cleanStr = (s) => String(s || '').trim();
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
    const qrSvg = typeof root.generarQrSvg === 'function' ? root.generarQrSvg(urlQR, 115) : '';

    const logoEmpresa = opciones.logo || localStorage.getItem('fac2026_logo_empresa') || '';
    const colorPrimario = opciones.colorPrimario || localStorage.getItem('fac2026_color_primario') || '#1b365d';

    // Dirección formateada
    const dirEmisor = emisor.direccion
      ? `${emisor.direccion.complemento || ''}, San Salvador, El Salvador`
      : 'El Salvador';
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
      <!-- Encabezado Principal -->
      <div class="dte-header">
        <div class="dte-header-top">
          <div class="dte-logo-area">
            ${logoEmpresa ? `<img src="${logoEmpresa}" class="dte-logo-img" alt="Logo de la Empresa">` : `<div class="dte-logo-badge">${safeStr(emisor.nombreComercial || emisor.nombre, 'FAC2026')}</div>`}
          </div>
          <div class="dte-title-area">
            <h1 class="dte-main-title">DOCUMENTO TRIBUTARIO ELECTRÓNICO</h1>
            <h2 class="dte-doc-type">${getNombreTipoDTE(tipo)}</h2>
          </div>
          <div class="dte-version-badge">${getVersionDTE(tipo, dte)}</div>
        </div>

        <div class="dte-meta-grid">
          <div class="dte-meta-col-left">
            <div class="dte-meta-row"><span class="lbl">Código de Generación:</span> <span class="val bold">${safeStr(ident.codigoGeneracion)}</span></div>
            <div class="dte-meta-row"><span class="lbl">Número de Control:</span> <span class="val bold">${safeStr(ident.numeroControl)}</span></div>
            <div class="dte-meta-row"><span class="lbl">Sello de Recepción:</span> <span class="val">${safeStr(sello)}</span></div>
          </div>
          <div class="dte-qr-box">
            ${qrSvg}
          </div>
          <div class="dte-meta-col-right">
            <div class="dte-meta-row"><span class="lbl">Modelo de Facturación:</span> <span class="val">Previo</span></div>
            <div class="dte-meta-row"><span class="lbl">Tipo de Transmisión:</span> <span class="val">Normal</span></div>
            <div class="dte-meta-row"><span class="lbl">Fecha y Hora de Generación:</span> <span class="val bold">${safeStr(ident.fecEmi)} ${safeStr(ident.horEmi)}</span></div>
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
              <div><span class="p-lbl">Número de teléfono:</span> <span class="p-val">${safeStr(emisor.telefono)}</span></div>
              <div><span class="p-lbl">Tipo establecimiento:</span> <span class="p-val">Casa Matriz</span></div>
            </div>
            <div class="party-row"><span class="p-lbl">Correo electrónico:</span> <span class="p-val">${safeStr(emisor.correo)}</span></div>
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
              <td>Suma de Ventas:</td>
              <td class="num">${Number(resumen.totalNoSuj || 0).toFixed(2)}</td>
              <td class="num">${Number(resumen.totalExenta || 0).toFixed(2)}</td>
              <td class="num bold">${Number(resumen.totalGravada || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3">Suma Total de Operaciones:</td>
              <td class="num bold">${Number(resumen.subTotalVentas || resumen.totalGravada || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3">Monto global Desc., Rebajas y otros a ventas no sujetas:</td>
              <td class="num">0.00</td>
            </tr>
            <tr>
              <td colspan="3">Monto global Desc., Rebajas y otros a ventas Exentas:</td>
              <td class="num">0.00</td>
            </tr>
            <tr>
              <td colspan="3">Monto global Desc., Rebajas y otros a ventas gravadas:</td>
              <td class="num">0.00</td>
            </tr>
            ${tipo === '03' || tipo === '05' ? `
            <tr>
              <td colspan="3">Impuesto al Valor Agregado 13%:</td>
              <td class="num bold">${Number(resumen.tributos?.[0]?.valor || (Number(resumen.totalGravada || 0) * 0.13)).toFixed(2)}</td>
            </tr>` : ''}
            <tr>
              <td colspan="3">Sub-Total:</td>
              <td class="num bold">${Number(resumen.subTotal || resumen.totalGravada || 0).toFixed(2)}</td>
            </tr>
            ${Number(resumen.ivaPerci1 || 0) > 0 ? `
            <tr>
              <td colspan="3">IVA Percibido:</td>
              <td class="num">${Number(resumen.ivaPerci1).toFixed(2)}</td>
            </tr>` : ''}
            ${Number(resumen.ivaRete1 || 0) > 0 ? `
            <tr>
              <td colspan="3">IVA Retenido:</td>
              <td class="num">${Number(resumen.ivaRete1).toFixed(2)}</td>
            </tr>` : ''}
            ${Number(resumen.reteRenta || 0) > 0 ? `
            <tr>
              <td colspan="3">Retención de Renta:</td>
              <td class="num">${Number(resumen.reteRenta).toFixed(2)}</td>
            </tr>` : ''}
            <tr class="row-total">
              <td colspan="3">${tipo === '05' ? 'Monto Total de la Operación:' : 'Total a Pagar:'}</td>
              <td class="num grand-total">${fmtMoney(totalPagar)}</td>
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

  // Abre la ventana de previsualización e impresión
  function previsualizarDTE(dte, opciones = {}) {
    const clienteLimpio = sanitizarNombreArchivo(dte.receptor?.nombre || 'CLIENTE');
    const tipoDte = dte.identificacion?.tipoDte || '01';
    const correlativo = dte.identificacion?.numeroControl || dte.identificacion?.codigoGeneracion || 'DTE';
    const fileName = `${getNombreTipoDTE(tipoDte).replace(/\s+/g, '_')}_${correlativo}_${clienteLimpio}`;

    const htmlContent = renderDteHtml(dte, opciones);

    // Crear modal interactivo
    const modalId = 'modal-dte-viewer-' + Date.now();
    const modalHtml = `
      <div class="modal-backdrop dte-viewer-backdrop" id="${modalId}" onclick="if(event.target===this)this.remove()">
        <div class="modal dte-viewer-modal">
          <div class="dte-viewer-toolbar">
            <div class="dte-viewer-title">
              <b>${getNombreTipoDTE(tipoDte)}:</b> ${dte.identificacion?.numeroControl || ''}
              <span class="badge-estado ${dte.estado || 'PROCESADO'}">${dte.estado || 'PROCESADO'}</span>
            </div>
            <div class="dte-viewer-actions">
              <button class="btn btn-verde" onclick="imprimirDTEById('${modalId}')">🖨️ Imprimir / Guardar PDF</button>
              <button class="btn btn-secundario" onclick="descargarDTEPDFDirecto('${modalId}', '${fileName}')">⬇️ Descargar PDF</button>
              <button class="btn btn-ghost" onclick="descargarDTEJSONDirecto(${JSON.stringify(JSON.stringify(dte)).replace(/"/g, '&quot;')}, '${fileName}')">{ } JSON</button>
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

  // Imprime directamente el DTE en formato carta
  function imprimirDTEById(modalId) {
    const container = document.getElementById(`${modalId}-container`);
    if (!container) return window.print();

    const printWin = window.open('', '_blank', 'width=900,height=800');
    if (!printWin) {
      toast('Permita ventanas emergentes para imprimir', 'error');
      return;
    }

    const cssContent = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML)
      .join('\n');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Impresión DTE</title>
        ${cssContent}
        <style>
          body { background: #fff !important; margin: 0; padding: 10mm; }
          .dte-document { box-shadow: none !important; border: 1px solid #000 !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; }
          @page { size: letter; margin: 8mm; }
        </style>
      </head>
      <body>
        ${container.innerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  }

  // Descarga directa a PDF usando html2pdf o render de impresión
  function descargarDTEPDFDirecto(modalId, fileName) {
    const el = document.querySelector(`#${modalId}-container .dte-document`);
    if (!el) return;

    if (typeof root.html2pdf === 'function') {
      const opt = {
        margin: [5, 5, 5, 5],
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
      };
      root.html2pdf().set(opt).from(el).save();
    } else {
      // Fallback nativo: abre ventana de impresión
      imprimirDTEById(modalId);
    }
  }

  function descargarDTEJSONDirecto(dteObj, fileName) {
    const blob = new Blob([typeof dteObj === 'string' ? dteObj : JSON.stringify(dteObj, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${fileName}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  root.DTEVisual = {
    renderHtml: renderDteHtml,
    generarHTML: renderDteHtml,
    previsualizar: previsualizarDTE,
    imprimir: imprimirDTEById,
    descargarPDF: descargarDTEPDFDirecto,
    descargarJSON: descargarDTEJSONDirecto,
    sanitizarNombre: sanitizarNombreArchivo,
    getNombreTipo: getNombreTipoDTE,
  };
})(typeof window !== 'undefined' ? window : globalThis);
