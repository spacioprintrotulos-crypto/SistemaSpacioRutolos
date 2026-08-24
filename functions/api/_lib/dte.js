// ============================================================
// Construcción de DTEs según esquemas oficiales del MH:
//   01 - Factura                (DTE-FE-v1)
//   03 - Comprobante Crédito Fiscal (DTE-CCFE-v3)
//   05 - Nota de Crédito        (DTE-NCE-v3)
// ============================================================
import { uuidUpper } from './crypto.js';

const VERSIONES = { '01': 1, '03': 3, '05': 3 };
const IVA = 0.13;

// ---------- Helpers ----------
export const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const digits = (v) => String(v ?? '').replace(/\D/g, '');

function fechaHoraSV() {
  const ahora = new Date();
  const partes = new Intl.DateTimeFormat('es-SV', {
    timeZone: 'America/El_Salvador',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(ahora);
  const get = (t) => partes.find((p) => p.type === t).value;
  const hh = get('hour') === '24' ? '00' : get('hour');
  return { fecEmi: `${get('year')}-${get('month')}-${get('day')}`, horEmi: `${hh}:${get('minute')}:${get('second')}` };
}

function cod4(v, def) {
  const s = String(v || def).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return (s + '0000').slice(0, 4);
}

function buildIdentificacion(tipoDte, ambiente, emisor, correlativo) {
  const { fecEmi, horEmi } = fechaHoraSV();
  const numeroControl = `DTE-${tipoDte}-${cod4(emisor.cod_estable_mh, 'M001')}${cod4(emisor.cod_punto_venta_mh, 'P001')}-${String(correlativo).padStart(15, '0')}`;
  return {
    version: VERSIONES[tipoDte],
    ambiente,
    tipoDte,
    numeroControl,
    codigoGeneracion: uuidUpper(),
    tipoModelo: 1,
    tipoOperacion: 1,
    tipoContingencia: null,
    motivoContin: null,
    fecEmi,
    horEmi,
    tipoMoneda: 'USD',
  };
}

// Catálogo y alias comunes para resolver códigos genéricos a subcódigos oficiales CAT-019
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
};

export function normalizarActividad(rawCod, rawDesc) {
  let cod = rawCod ? String(rawCod).trim() : '';
  let desc = rawDesc ? String(rawDesc).trim() : '';

  if (/\d/.test(cod)) {
    const numSolo = cod.replace(/\D/g, '');
    if (numSolo.length === 4) {
      cod = numSolo.padStart(5, '0');
    } else if (numSolo.length >= 5) {
      cod = numSolo.slice(0, 6);
    }
  }

  if (ACTIVIDAD_ALIASES[cod]) {
    const alias = ACTIVIDAD_ALIASES[cod];
    cod = alias.cod;
    if (!desc || desc === '-') desc = alias.desc;
  }

  const esValido = /^\d{5,6}$/.test(cod);
  return {
    codActividad: esValido ? cod : null,
    descActividad: esValido ? (desc || 'Actividad económica') : null,
  };
}

function buildEmisor(e, conCodEstable = true) {
  const act = normalizarActividad(e.cod_actividad, e.desc_actividad);
  const emisor = {
    nit: digits(e.nit),
    nrc: digits(e.nrc),
    nombre: e.nombre,
    codActividad: act.codActividad || e.cod_actividad,
    descActividad: act.descActividad || e.desc_actividad,
    nombreComercial: e.nombre_comercial,
    tipoEstablecimiento: e.tipo_establecimiento || '01',
    direccion: {
      departamento: e.departamento,
      municipio: e.municipio,
      complemento: e.complemento,
    },
    telefono: e.telefono,
    correo: e.correo,
  };
  // FE y CCF admiten los códigos de establecimiento/punto de venta; NC no (additionalProperties=false).
  if (conCodEstable) {
    emisor.codEstableMH = e.cod_estable_mh || null;
    emisor.codEstable = e.cod_estable || null;
    emisor.codPuntoVentaMH = e.cod_punto_venta_mh || null;
    emisor.codPuntoVenta = e.cod_punto_venta || null;
  }
  return emisor;
}

function buildDireccion(c) {
  if (!c.departamento || !c.municipio) return null;
  return { departamento: c.departamento, municipio: c.municipio, complemento: c.complemento || 'SV' };
}

// ---------- Cálculo de ítems ----------
// precioConIva = true (Factura: precios incluyen IVA) / false (CCF y NC: precios sin IVA)
function calcularItems(items, { precioConIva, conNumeroDocumento, codigoGeneracionRel }) {
  let totalNoSuj = 0, totalExenta = 0, totalGravada = 0, totalIvaItems = 0;

  const cuerpo = items.map((it, i) => {
    const cantidad = Number(it.cantidad);
    const precioUni = Number(it.precioUni);
    const montoDescu = r2(it.montoDescu || 0);
    const base = r2(cantidad * precioUni - montoDescu);
    const tipoVenta = it.tipoVenta || 'gravada'; // gravada | exenta | nosuj

    let ventaNoSuj = 0, ventaExenta = 0, ventaGravada = 0;
    if (tipoVenta === 'nosuj') ventaNoSuj = base;
    else if (tipoVenta === 'exenta') ventaExenta = base;
    else ventaGravada = base;

    totalNoSuj = r2(totalNoSuj + ventaNoSuj);
    totalExenta = r2(totalExenta + ventaExenta);
    totalGravada = r2(totalGravada + ventaGravada);

    let ivaItem = 0;
    if (precioConIva && ventaGravada > 0) {
      // Factura: el precio incluye IVA, se desagrega
      ivaItem = r2((ventaGravada / (1 + IVA)) * IVA);
      totalIvaItems = r2(totalIvaItems + ivaItem);
    }

    const item = {
      numItem: i + 1,
      tipoItem: Number(it.tipoItem || 1), // 1 Bien, 2 Servicio
      numeroDocumento: conNumeroDocumento ? (codigoGeneracionRel || null) : null,
      codigo: it.codigo || `ITEM${i + 1}`,
      codTributo: null,
      descripcion: String(it.descripcion || '').slice(0, 1000),
      cantidad,
      uniMedida: Number(it.uniMedida || 59), // 59 Unidad, 99 Servicio
      precioUni,
      montoDescu,
      ventaNoSuj,
      ventaExenta,
      ventaGravada,
      // Factura (precio c/IVA): el 13% va en ivaItem, no en tributos.
      // CCF/NC (precio s/IVA): el 13% se declara como tributo "20" por ítem.
      tributos: ventaGravada > 0 && !precioConIva ? ['20'] : null,
    };
    if (conNumeroDocumento) {
      // NC: no lleva psv, noGravado, ivaItem (montoDescu sí lo exige el MH)
      item.numeroDocumento = codigoGeneracionRel || null;
    } else {
      item.psv = 0;
      item.noGravado = 0;
      if (precioConIva) item.ivaItem = ivaItem;
    }
    // limpiar undefined
    Object.keys(item).forEach((k) => item[k] === undefined && delete item[k]);
    return item;
  });

  return { cuerpo, totalNoSuj, totalExenta, totalGravada, totalIvaItems };
}

function buildExtension(ext, conPlacaVehiculo = true) {
  const e = ext || {};
  const extObj = {
    nombEntrega: e.nombEntrega || null,
    docuEntrega: e.docuEntrega || null,
    nombRecibe: e.nombRecibe || null,
    docuRecibe: e.docuRecibe || null,
    observaciones: e.observaciones || null,
  };
  // placaVehiculo es requerido en CCF y opcional en FE, pero NO existe en NC (additionalProperties=false).
  if (conPlacaVehiculo) extObj.placaVehiculo = e.placaVehiculo || null;
  return extObj;
}

function buildPagos(pagos, condicionOperacion, totalPagar) {
  if (pagos && pagos.length) {
    return pagos.map((p) => ({
      codigo: p.codigo,
      montoPago: r2(p.montoPago) || totalPagar,
      referencia: p.referencia || null,
      periodo: condicionOperacion === 2 ? (p.periodo != null ? Number(p.periodo) : null) : null,
      plazo: condicionOperacion === 2 ? (p.plazo != null ? String(p.plazo) : null) : null,
    }));
  }
  if (condicionOperacion === 1) {
    return [{ codigo: '01', montoPago: totalPagar, referencia: null, periodo: null, plazo: null }];
  }
  return null;
}

// ---------- FACTURA (01) ----------
export function buildFactura({ emisor, ambiente, correlativo, receptor, items, condicionOperacion = 1, pagos, ivaRete1 = 0, reteRenta = 0, extension, apendice }) {
  const identificacion = buildIdentificacion('01', ambiente, emisor, correlativo);
  const { cuerpo, totalNoSuj, totalExenta, totalGravada, totalIvaItems } = calcularItems(items, { precioConIva: true });

  const subTotalVentas = r2(totalNoSuj + totalExenta + totalGravada);
  const subTotal = subTotalVentas; // descuentos ya aplicados por ítem
  const montoTotalOperacion = subTotal;
  const totalPagar = r2(montoTotalOperacion - ivaRete1 - reteRenta);

  const resumen = {
    totalNoSuj, totalExenta, totalGravada, subTotalVentas,
    descuNoSuj: 0, descuExenta: 0, descuGravada: 0, porcentajeDescuento: 0, totalDescu: 0,
    tributos: null,
    subTotal,
    ivaRete1: r2(ivaRete1),
    reteRenta: r2(reteRenta),
    montoTotalOperacion,
    totalNoGravado: 0,
    totalPagar,
    totalLetras: numeroALetras(totalPagar),
    totalIva: totalIvaItems,
    saldoFavor: 0,
    condicionOperacion,
    pagos: buildPagos(pagos, condicionOperacion, totalPagar),
    numPagoElectronico: null,
  };

  const act = normalizarActividad(receptor.cod_actividad, receptor.desc_actividad);

  const dte = {
    identificacion,
    documentoRelacionado: null,
    emisor: buildEmisor(emisor),
    receptor: {
      tipoDocumento: receptor.tipo_documento || null,
      numDocumento: digits(receptor.num_documento) || null,
      nrc: null,
      nombre: receptor.nombre,
      codActividad: act.codActividad,
      descActividad: act.descActividad,
      direccion: buildDireccion(receptor),
      telefono: receptor.telefono || null,
      correo: receptor.correo || null,
    },
    otrosDocumentos: null,
    ventaTercero: null,
    cuerpoDocumento: cuerpo,
    resumen,
    extension: buildExtension(extension),
    apendice: apendice || null,
  };
  return { dte, total: totalPagar };
}

// ---------- CRÉDITO FISCAL (03) ----------
export function buildCCF({ emisor, ambiente, correlativo, receptor, items, condicionOperacion = 1, pagos, ivaPerci1 = 0, ivaRete1 = 0, reteRenta = 0, extension, apendice }) {
  const identificacion = buildIdentificacion('03', ambiente, emisor, correlativo);
  const { cuerpo, totalNoSuj, totalExenta, totalGravada } = calcularItems(items, { precioConIva: false });

  const subTotalVentas = r2(totalNoSuj + totalExenta + totalGravada);
  const subTotal = subTotalVentas;
  const valorIva = r2(totalGravada * IVA);
  const tributos = totalGravada > 0
    ? [{ codigo: '20', descripcion: 'Impuesto al Valor Agregado 13%', valor: valorIva }]
    : null;
  const montoTotalOperacion = r2(subTotal + valorIva);
  const totalPagar = r2(montoTotalOperacion + ivaPerci1 - ivaRete1 - reteRenta);

  const resumen = {
    totalNoSuj, totalExenta, totalGravada, subTotalVentas,
    descuNoSuj: 0, descuExenta: 0, descuGravada: 0, porcentajeDescuento: 0, totalDescu: 0,
    tributos,
    subTotal,
    ivaPerci1: r2(ivaPerci1),
    ivaRete1: r2(ivaRete1),
    reteRenta: r2(reteRenta),
    montoTotalOperacion,
    totalNoGravado: 0,
    totalPagar,
    totalLetras: numeroALetras(totalPagar),
    saldoFavor: 0,
    condicionOperacion,
    pagos: buildPagos(pagos, condicionOperacion, totalPagar),
    numPagoElectronico: null,
  };

  const act = normalizarActividad(receptor.cod_actividad, receptor.desc_actividad);

  const dte = {
    identificacion,
    documentoRelacionado: null,
    emisor: buildEmisor(emisor),
    receptor: {
      nit: digits(receptor.num_documento),
      nrc: digits(receptor.nrc) || null,
      nombre: receptor.nombre,
      codActividad: act.codActividad || '73101',
      descActividad: act.descActividad || 'Publicidad y Servicios Comerciales',
      nombreComercial: receptor.nombre_comercial || receptor.nombre,
      direccion: buildDireccion(receptor) || { departamento: '06', municipio: '21', complemento: 'SV' },
      telefono: receptor.telefono || null,
      correo: receptor.correo,
    },
    otrosDocumentos: null,
    ventaTercero: null,
    cuerpoDocumento: cuerpo,
    resumen,
    extension: buildExtension(extension),
    apendice: apendice || null,
  };
  return { dte, total: totalPagar };
}

// ---------- NOTA DE CRÉDITO (05) ----------
export function buildNotaCredito({ emisor, ambiente, correlativo, receptor, items, docRelacionado, ivaPerci1 = 0, ivaRete1 = 0, reteRenta = 0, extension, apendice }) {
  const identificacion = buildIdentificacion('05', ambiente, emisor, correlativo);

  const documentoRelacionado = [{
    tipoDocumento: docRelacionado.tipoDocumento,      // tipo DTE del documento original
    tipoGeneracion: docRelacionado.tipoGeneracion || 2, // 2 = electrónico
    numeroDocumento: docRelacionado.numeroDocumento,    // codigoGeneracion del original
    fechaEmision: docRelacionado.fechaEmision,
  }];

  const { cuerpo, totalNoSuj, totalExenta, totalGravada } = calcularItems(items, {
    precioConIva: false,
    conNumeroDocumento: true,
    codigoGeneracionRel: docRelacionado.numeroDocumento,
  });

  const subTotalVentas = r2(totalNoSuj + totalExenta + totalGravada);
  const subTotal = subTotalVentas;
  const valorIva = r2(totalGravada * IVA);
  const tributos = totalGravada > 0
    ? [{ codigo: '20', descripcion: 'Impuesto al Valor Agregado 13%', valor: valorIva }]
    : null;
  const montoTotalOperacion = r2(subTotal + valorIva + ivaPerci1 - ivaRete1 - reteRenta);

  const resumen = {
    totalNoSuj, totalExenta, totalGravada, subTotalVentas,
    descuNoSuj: 0, descuExenta: 0, descuGravada: 0, totalDescu: 0,
    tributos,
    subTotal,
    ivaPerci1: r2(ivaPerci1),
    ivaRete1: r2(ivaRete1),
    reteRenta: r2(reteRenta),
    montoTotalOperacion,
    totalLetras: numeroALetras(montoTotalOperacion),
    condicionOperacion: 1,
  };

  const act = normalizarActividad(receptor.cod_actividad, receptor.desc_actividad);

  const dte = {
    identificacion,
    documentoRelacionado,
    emisor: buildEmisor(emisor, false),
    receptor: {
      nit: digits(receptor.num_documento),
      nrc: digits(receptor.nrc) || null,
      nombre: receptor.nombre,
      codActividad: act.codActividad,
      descActividad: act.descActividad,
      nombreComercial: receptor.nombre_comercial || receptor.nombre,
      direccion: buildDireccion(receptor) || { departamento: '06', municipio: '21', complemento: 'SV' },
      telefono: receptor.telefono || null,
      correo: receptor.correo,
    },
    ventaTercero: null,
    cuerpoDocumento: cuerpo,
    resumen,
    extension: buildExtension(extension, false),
    apendice: apendice || null,
  };
  return { dte, total: montoTotalOperacion };
}

export const BUILDERS = { '01': buildFactura, '03': buildCCF, '05': buildNotaCredito };

// ---------- Evento de Invalidación (anulación) v2 ----------
export function buildEventoInvalidacion({ ambiente, emisor, dte, motivo, tipoAnulacion, responsable, solicita }) {
  const { fecEmi: fecAnula, horEmi: horAnula } = fechaHoraSV();
  return {
    identificacion: {
      version: 2,
      ambiente,
      codigoGeneracion: uuidUpper(),
      fecAnula,
      horAnula,
    },
    emisor: {
      nit: emisor.nit,
      nombre: emisor.nombre,
      tipoEstablecimiento: emisor.tipo_establecimiento || '01',
      nomEstablecimiento: emisor.nombre_comercial || emisor.nombre,
      codEstableMH: emisor.cod_estable_mh || null,
      codEstable: emisor.cod_estable || null,
      codPuntoVentaMH: emisor.cod_punto_venta_mh || null,
      codPuntoVenta: emisor.cod_punto_venta || null,
      telefono: emisor.telefono,
      correo: emisor.correo,
    },
    documento: {
      tipoDte: dte.tipo_dte,
      codigoGeneracion: dte.codigo_generacion,
      selloRecibido: dte.sello_recibido,
      numeroControl: dte.numero_control,
      fecEmi: dte.fec_emi,
      montoIva: null,
      codigoGeneracionR: null,
      tipoDocumento: dte.receptor_tipo_documento || null,
      numDocumento: dte.receptor_num_documento || null,
      nombre: dte.receptor_nombre,
      telefono: dte.receptor_telefono || null,
      correo: dte.receptor_correo || null,
    },
    motivo: {
      tipoAnulacion: Number(tipoAnulacion) || 2,
      motivoAnulacion: motivo,
      nombreResponsable: responsable.nombre,
      tipDocResponsable: responsable.tipoDocumento,
      numDocResponsable: responsable.numDocumento,
      nombreSolicita: solicita.nombre,
      tipDocSolicita: solicita.tipoDocumento,
      numDocSolicita: solicita.numDocumento,
    },
  };
}

// ---------- Número a letras (USD) ----------
const UNIDADES = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
const DIEZ_A_19 = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
const DECENAS = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

function tresDigitos(n) {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';
  const c = Math.floor(n / 100), resto = n % 100;
  let s = c > 0 ? CENTENAS[c] + (resto ? ' ' : '') : '';
  if (resto > 0) {
    if (resto < 10) s += UNIDADES[resto];
    else if (resto < 20) s += DIEZ_A_19[resto - 10];
    else {
      const d = Math.floor(resto / 10), u = resto % 10;
      if (d === 2) s += u ? `VEINTI${UNIDADES[u]}` : 'VEINTE';
      else s += DECENAS[d] + (u ? ` Y ${UNIDADES[u]}` : '');
    }
  }
  return s;
}

export function numeroALetras(monto) {
  const entero = Math.floor(monto);
  const centavos = Math.round((monto - entero) * 100);
  const miles = Math.floor(entero / 1000);
  const resto = entero % 1000;
  let palabras = '';
  if (entero === 0) palabras = 'CERO';
  else {
    if (miles > 0) palabras += (miles === 1 ? 'MIL' : `${tresDigitos(miles)} MIL`) + (resto ? ' ' : '');
    if (resto > 0) palabras += tresDigitos(resto);
  }
  return `${palabras} ${String(centavos).padStart(2, '0')}/100 DÓLARES`;
}
