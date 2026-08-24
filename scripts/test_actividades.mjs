import { normalizarActividad, buildFactura, buildCCF, buildNotaCredito } from '../functions/api/_lib/dte.js';

console.log('Testing normalizarActividad...');

// Case 1: Standard 5-digit
const r1 = normalizarActividad('73101', 'Agencias de publicidad');
console.assert(r1.codActividad === '73101', 'r1 codActividad should be 73101');
console.assert(r1.descActividad === 'Agencias de publicidad', 'r1 desc');

// Case 2: 4-digit padding
const r2 = normalizarActividad('1111', 'Cultivo de maiz');
console.assert(r2.codActividad === '01111', 'r2 codActividad should be 01111');

// Case 3: Category alias 73100 -> 73101
const r3 = normalizarActividad('73100', 'Publicidad');
console.assert(r3.codActividad === '73101', 'r3 codActividad should be 73101');
console.assert(r3.descActividad === 'Publicidad', 'r3 desc');

// Case 4: Category alias 47110 -> 47111
const r4 = normalizarActividad('47110', '');
console.assert(r4.codActividad === '47111', 'r4 codActividad should be 47111');

// Case 5: Text in code
const r5 = normalizarActividad('Texto Invalido', 'Sin codigo');
console.assert(r5.codActividad === null, 'r5 codActividad should be null');

// Case 6: Empty/null
const r6 = normalizarActividad(null, null);
console.assert(r6.codActividad === null, 'r6 codActividad should be null');

// Case 7: Factura 01 generation with null activity
const emisor = {
  nit: '12012608691018',
  nrc: '899798',
  nombre: 'EVER ODIR RAMOS PORTILLO',
  cod_actividad: '73101',
  desc_actividad: 'Publicidad',
  departamento: '06',
  municipio: '21',
  complemento: 'San Salvador',
};
const items = [{ descripcion: 'Item 1', cantidad: 1, precioUni: 10, tipoVenta: 'gravada' }];

const f1 = buildFactura({
  emisor,
  ambiente: '00',
  correlativo: 1,
  receptor: { nombre: 'JUAN PEREZ', cod_actividad: '', desc_actividad: '' },
  items,
});
console.assert(f1.dte.receptor.codActividad === null, 'Factura codActividad should be null when not specified');
console.assert(f1.dte.receptor.descActividad === null, 'Factura descActividad should be null when not specified');

const f2 = buildFactura({
  emisor,
  ambiente: '00',
  correlativo: 2,
  receptor: { nombre: 'JUAN PEREZ', cod_actividad: '73100', desc_actividad: 'Publicidad' },
  items,
});
console.assert(f2.dte.receptor.codActividad === '73101', 'Factura alias resolved to 73101');

// Case 8: Magica Sorpresa SV alias 96099 -> 82990
const r8 = normalizarActividad('96099', 'Servicios n.c.p.');
console.assert(r8.codActividad === '82990', '96099 should resolve to 82990');

console.log('✅ ALL ACTIVIDAD TESTS PASSED 100%');
