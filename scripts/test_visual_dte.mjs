// Test script for DTE visual rendering and QR generation
import fs from 'node:fs';
import vm from 'node:vm';

// Load QRCode and DTEVisual into a sandbox
const qrcodeSrc = fs.readFileSync('public/js/qrcode.js', 'utf8');
const dteVisualSrc = fs.readFileSync('public/js/dte-visual.js', 'utf8');

const sandbox = {
  window: {},
  document: {
    createElement: () => ({ style: {}, appendChild: () => {}, querySelector: () => null }),
    body: { appendChild: () => {} },
    head: { appendChild: () => {} },
  },
  localStorage: {
    getItem: () => null,
    setItem: () => null,
  },
  esc: (s) => String(s || ''),
};

vm.createContext(sandbox);
vm.runInContext(qrcodeSrc, sandbox);
vm.runInContext(dteVisualSrc, sandbox);

const QRCode = sandbox.window.QRCode;
const DTEVisual = sandbox.window.DTEVisual;

console.log('Testing QRCode generation...');
const qrSvg = QRCode.generateSVG('https://admin.factura.gob.sv/consultaPublica?ambiente=00&codGen=CD1D2658-4932-455B-98AE-89E0E85F5BB4&fechaEmi=2026-08-18', 120);
if (!qrSvg.includes('<svg') || !qrSvg.includes('viewBox')) {
  throw new Error('QRCode failed to generate valid SVG');
}
console.log('QRCode SVG generated successfully! Length:', qrSvg.length);

console.log('Testing Factura 01 rendering...');
const factura01 = {
  identificacion: {
    version: 1,
    ambiente: '00',
    tipoDte: '01',
    numeroControl: 'DTE-01-M001P001-000000000000011',
    codigoGeneracion: '4ACDB1E4-2C62-4C10-85A5-78E5677CECD6',
    fecEmi: '2026-08-18',
    horEmi: '16:33:04',
  },
  emisor: {
    nit: '12012608691018',
    nrc: '899798',
    nombre: 'EVER ODIR RAMOS PORTILLO',
    nombreComercial: 'SPACIO ROTULOS',
    codActividad: '73100',
    descActividad: 'Publicidad',
    direccion: { departamento: '06', municipio: '21', complemento: '7 Avenida Norte, Colonia Layco 1447, San Salvador' },
    telefono: '72108369',
    correo: 'spacioprintrotulos@gmail.com',
  },
  receptor: {
    tipoDocumento: '36',
    numDocumento: '13193006931016',
    nombre: 'ASOCIACION DE DESARROLLO ECONOMICO LOCAL DE MORAZAN',
    direccion: { departamento: '13', municipio: '01', complemento: 'Barrio El Centro, San Francisco Gotera, Morazán' },
    telefono: '26541234',
    correo: 'adelmorazan@gmail.com',
  },
  cuerpoDocumento: [
    {
      numItem: 1,
      tipoItem: 1,
      codigo: 'SRV01',
      descripcion: 'Banners publicitarios full color con estructura metálica y ojales reforzados',
      cantidad: 2,
      uniMedida: 59,
      precioUni: 55.00,
      montoDescu: 0,
      ventaGravada: 110.00,
      ventaExenta: 0,
      ventaNoSuj: 0,
      ivaItem: 12.65,
    }
  ],
  resumen: {
    totalNoSuj: 0,
    totalExenta: 0,
    totalGravada: 110.00,
    subTotalVentas: 110.00,
    subTotal: 110.00,
    totalIva: 12.65,
    montoTotalOperacion: 110.00,
    totalPagar: 110.00,
    totalLetras: 'CIENTO DIEZ 00/100 DÓLARES',
    condicionOperacion: 1,
  }
};

const html01 = DTEVisual.generarHTML(factura01, { sello: '2026BFEAF8232F4241EF9FDF156C6D7A6CF8TYZK' });
if (!html01.includes('FACTURA') || !html01.includes('DTE-01-M001P001-000000000000011') || !html01.includes('ASOCIACION DE DESARROLLO ECONOMICO')) {
  console.log('Snippet of html01:', html01.slice(0, 500));
  throw new Error('Factura 01 HTML rendering failed critical assertions');
}
console.log('Factura 01 HTML verified! Length:', html01.length);

console.log('Testing CCF 03 rendering...');
const ccf03 = {
  identificacion: {
    version: 3,
    ambiente: '00',
    tipoDte: '03',
    numeroControl: 'DTE-03-M001P001-000000000000011',
    codigoGeneracion: 'C203E7BD-8A2D-4E1C-A1A9-27A3A69C95CA',
    fecEmi: '2026-08-18',
    horEmi: '16:33:05',
  },
  emisor: factura01.emisor,
  receptor: {
    nit: '06140204921049',
    nrc: '462055',
    nombre: 'TRANS - AUTO S.A. DE C.V.',
    descActividad: 'Agencias de tramitaciones aduanales',
    direccion: { departamento: '06', municipio: '21', complemento: 'Km.20 Nejapa, San Salvador' },
    telefono: '25345777',
    correo: 'facturas.transauto@gmail.com',
  },
  cuerpoDocumento: [
    {
      numItem: 1,
      tipoItem: 2,
      codigo: 'SRV01',
      descripcion: 'Rotulación de microbús 4 caras full color en vinil automotriz',
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
    tributos: [{ codigo: '20', descripcion: 'Impuesto al Valor Agregado 13%', valor: 31.20 }],
    ivaRete1: 2.40,
    montoTotalOperacion: 271.20,
    totalPagar: 268.80,
    totalLetras: 'DOSCIENTOS SESENTA Y OCHO 80/100 DÓLARES',
    condicionOperacion: 1,
  }
};

const html03 = DTEVisual.generarHTML(ccf03, { sello: '2026D992C93362DC471A86FD4A74377388D5CN1K' });
if (!html03.includes('COMPROBANTE DE CRÉDITO FISCAL') || !html03.includes('TRANS - AUTO S.A. DE C.V.') || !html03.includes('268.80')) {
  throw new Error('CCF 03 HTML rendering failed critical assertions');
}
console.log('CCF 03 HTML verified! Length:', html03.length);

console.log('Testing Nota de Credito 05 rendering...');
const nc05 = {
  identificacion: {
    version: 3,
    ambiente: '00',
    tipoDte: '05',
    numeroControl: 'DTE-05-M001P001-000000000000021',
    codigoGeneracion: '333FD27E-5AE1-4EB7-8547-7977464EC7B7',
    fecEmi: '2026-08-18',
    horEmi: '16:33:06',
  },
  emisor: factura01.emisor,
  receptor: {
    nit: '06140606951050',
    nrc: '862584',
    nombre: 'FONDO DE ACTIVIDADES ESPECIALES DE MEDIOS DE COMUNICACION',
    descActividad: 'Servicios de Publicidad',
    direccion: { departamento: '06', municipio: '21', complemento: 'San Salvador' },
  },
  documentoRelacionado: [
    {
      tipoDocumento: '03',
      tipoGeneracion: 2,
      numeroDocumento: 'C203E7BD-8A2D-4E1C-A1A9-27A3A69C95CA',
      fechaEmision: '2026-08-18'
    }
  ],
  cuerpoDocumento: [
    {
      numItem: 1,
      tipoItem: 1,
      codigo: 'DESC01',
      descripcion: 'Descuento comercial sobre servicio de rotulación publicitaria',
      cantidad: 1,
      uniMedida: 59,
      precioUni: 22.08,
      montoDescu: 0,
      ventaGravada: 22.08,
      ventaExenta: 0,
      ventaNoSuj: 0,
    }
  ],
  resumen: {
    totalNoSuj: 0,
    totalExenta: 0,
    totalGravada: 22.08,
    subTotalVentas: 22.08,
    subTotal: 22.08,
    tributos: [{ codigo: '20', valor: 2.87 }],
    ivaRete1: 0.23,
    reteRenta: 0,
    montoTotalOperacion: 24.95,
    totalPagar: 24.72,
    totalLetras: 'VEINTICUATRO 72/100 DÓLARES',
    condicionOperacion: 1,
  }
};

const html05 = DTEVisual.generarHTML(nc05, { sello: '20265469DF7D0C7246778C5898B7F8185789TEUA' });
if (!html05.includes('NOTA DE CRÉDITO') || !html05.includes('DOCUMENTOS RELACIONADOS') || !html05.includes('FONDO DE ACTIVIDADES')) {
  console.log('Snippet of html05:', html05.slice(0, 500));
  throw new Error('NC 05 HTML rendering failed critical assertions');
}
console.log('NC 05 HTML verified! Length:', html05.length);

console.log('\n======================================================');
console.log('✅ ALL DTE VISUAL RENDERING AND QR TESTS PASSED 100%');
console.log('======================================================');
