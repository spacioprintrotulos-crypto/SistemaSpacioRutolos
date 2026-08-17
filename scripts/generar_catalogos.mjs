// Genera public/data/catalogos.json a partir de los CSV/JSON oficiales descargados.
// Uso: node scripts/generar_catalogos.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const DEPARTAMENTOS = [
  { codigo: '00', nombre: 'Otro (Para extranjeros)' },
  { codigo: '01', nombre: 'Ahuachapán' },
  { codigo: '02', nombre: 'Santa Ana' },
  { codigo: '03', nombre: 'Sonsonate' },
  { codigo: '04', nombre: 'Chalatenango' },
  { codigo: '05', nombre: 'La Libertad' },
  { codigo: '06', nombre: 'San Salvador' },
  { codigo: '07', nombre: 'Cuscatlán' },
  { codigo: '08', nombre: 'La Paz' },
  { codigo: '09', nombre: 'Cabañas' },
  { codigo: '10', nombre: 'San Vicente' },
  { codigo: '11', nombre: 'Usulután' },
  { codigo: '12', nombre: 'San Miguel' },
  { codigo: '13', nombre: 'Morazán' },
  { codigo: '14', nombre: 'La Unión' },
];

// CAT-013 oficial MH: códigos de distrito (2 dígitos) válidos por departamento.
// Fuente cruzada: validaciones del API MH (api-facturacion-sv) + continuidad de códigos del catálogo anterior.
const MUNICIPIOS = {
  '00': [{ codigo: '00', nombre: 'OTRO (PARA EXTRANJEROS)' }],
  '01': [
    { codigo: '13', nombre: 'AHUACHAPAN NORTE' },
    { codigo: '14', nombre: 'AHUACHAPAN CENTRO' },
    { codigo: '15', nombre: 'AHUACHAPAN SUR' },
  ],
  '02': [
    { codigo: '14', nombre: 'SANTA ANA NORTE' },
    { codigo: '15', nombre: 'SANTA ANA CENTRO' },
    { codigo: '16', nombre: 'SANTA ANA SUR' },
    { codigo: '17', nombre: 'SANTA ANA OESTE' },
  ],
  '03': [
    { codigo: '17', nombre: 'SONSONATE NORTE' },
    { codigo: '18', nombre: 'SONSONATE CENTRO' },
    { codigo: '19', nombre: 'SONSONATE SUR' },
    { codigo: '20', nombre: 'SONSONATE OESTE' },
  ],
  '04': [
    { codigo: '34', nombre: 'CHALATENANGO NORTE' },
    { codigo: '35', nombre: 'CHALATENANGO CENTRO' },
    { codigo: '36', nombre: 'CHALATENANGO SUR' },
  ],
  '05': [
    { codigo: '23', nombre: 'LA LIBERTAD NORTE' },
    { codigo: '24', nombre: 'LA LIBERTAD CENTRO' },
    { codigo: '25', nombre: 'LA LIBERTAD SUR' },
    { codigo: '26', nombre: 'LA LIBERTAD OESTE' },
    { codigo: '27', nombre: 'LA LIBERTAD ESTE' },
    { codigo: '28', nombre: 'LA LIBERTAD COSTA' },
  ],
  '06': [
    { codigo: '20', nombre: 'SAN SALVADOR NORTE' },
    { codigo: '21', nombre: 'SAN SALVADOR CENTRO' },
    { codigo: '22', nombre: 'SAN SALVADOR SUR' },
    { codigo: '23', nombre: 'SAN SALVADOR OESTE' },
    { codigo: '24', nombre: 'SAN SALVADOR ESTE' },
  ],
  '07': [
    { codigo: '17', nombre: 'CUSCATLAN NORTE' },
    { codigo: '18', nombre: 'CUSCATLAN SUR' },
  ],
  '08': [
    { codigo: '23', nombre: 'LA PAZ NORTE' },
    { codigo: '24', nombre: 'LA PAZ CENTRO' },
    { codigo: '25', nombre: 'LA PAZ ESTE' },
  ],
  '09': [
    { codigo: '10', nombre: 'CABANAS ESTE' },
    { codigo: '11', nombre: 'CABANAS OESTE' },
  ],
  '10': [
    { codigo: '14', nombre: 'SAN VICENTE NORTE' },
    { codigo: '15', nombre: 'SAN VICENTE SUR' },
  ],
  '11': [
    { codigo: '24', nombre: 'USULUTAN NORTE' },
    { codigo: '25', nombre: 'USULUTAN ESTE' },
    { codigo: '26', nombre: 'USULUTAN OESTE' },
  ],
  '12': [
    { codigo: '21', nombre: 'SAN MIGUEL NORTE' },
    { codigo: '22', nombre: 'SAN MIGUEL CENTRO' },
    { codigo: '23', nombre: 'SAN MIGUEL OESTE' },
  ],
  '13': [
    { codigo: '27', nombre: 'MORAZAN NORTE' },
    { codigo: '28', nombre: 'MORAZAN SUR' },
  ],
  '14': [
    { codigo: '19', nombre: 'LA UNION NORTE' },
    { codigo: '20', nombre: 'LA UNION SUR' },
  ],
};

const UNIDAD_MEDIDA = [
  { codigo: '01', nombre: 'Metro' }, { codigo: '20', nombre: 'Barril' },
  { codigo: '22', nombre: 'Galón' }, { codigo: '23', nombre: 'Litro' },
  { codigo: '24', nombre: 'Botella' }, { codigo: '26', nombre: 'Mililitro' },
  { codigo: '29', nombre: 'Tonelada métrica' }, { codigo: '30', nombre: 'Tonelada' },
  { codigo: '31', nombre: 'Quintal métrico' }, { codigo: '32', nombre: 'Quintal' },
  { codigo: '33', nombre: 'Arroba' }, { codigo: '34', nombre: 'Kilogramo' },
  { codigo: '36', nombre: 'Libra' }, { codigo: '38', nombre: 'Onza' },
  { codigo: '39', nombre: 'Gramo' }, { codigo: '55', nombre: 'Kilómetro' },
  { codigo: '56', nombre: 'Alquiler de habitaciones' }, { codigo: '57', nombre: 'Paquete' },
  { codigo: '58', nombre: 'Caja' }, { codigo: '59', nombre: 'Unidad' },
  { codigo: '99', nombre: 'Servicio' },
];

const TIPO_DOCUMENTO = [
  { codigo: '13', nombre: 'DUI' },
  { codigo: '36', nombre: 'NIT' },
  { codigo: '03', nombre: 'Pasaporte' },
  { codigo: '02', nombre: 'Carnet de Residente' },
  { codigo: '37', nombre: 'Otro' },
];

const CONDICION_OPERACION = [
  { codigo: '1', nombre: 'Contado' },
  { codigo: '2', nombre: 'A Crédito' },
  { codigo: '3', nombre: 'Anticipos' },
];

const FORMA_PAGO = [
  { codigo: '01', nombre: 'Efectivo (Billetes y Monedas)' },
  { codigo: '02', nombre: 'Tarjeta de Crédito' },
  { codigo: '03', nombre: 'Tarjeta de Débito' },
  { codigo: '04', nombre: 'Cheque' },
  { codigo: '05', nombre: 'Transferencia Bancaria' },
  { codigo: '06', nombre: 'Dinero Electrónico' },
  { codigo: '08', nombre: 'Otros' },
  { codigo: '11', nombre: 'Pago Móvil' },
  { codigo: '12', nombre: 'Billetera Electrónica' },
];

const TIPO_ESTABLECIMIENTO = [
  { codigo: '01', nombre: 'Casa Matriz' },
  { codigo: '02', nombre: 'Sucursal' },
  { codigo: '04', nombre: 'Bodega' },
  { codigo: '07', nombre: 'Expendio (Punto de Venta)' },
  { codigo: '20', nombre: 'Otro tipo de establecimiento' },
];

const TRIBUTOS = [
  { codigo: '20', nombre: 'IVA 13%' },
  { codigo: 'C3', nombre: 'IVA Percibido' },
  { codigo: 'C5', nombre: 'Retención IVA 1% Bienes' },
  { codigo: 'C6', nombre: 'Retención IVA 1% Servicios' },
];

const TIPO_DTE = [
  { codigo: '01', nombre: 'Factura' },
  { codigo: '03', nombre: 'Comprobante de Crédito Fiscal' },
  { codigo: '05', nombre: 'Nota de Crédito' },
];

const TIPO_INVALIDACION = [
  { codigo: '1', nombre: 'Error en los datos del documento' },
  { codigo: '2', nombre: 'Error en el monto' },
  { codigo: '3', nombre: 'Documento emitido por duplicado' },
  { codigo: '4', nombre: 'Documento emitido con datos del receptor incorrectos' },
  { codigo: '5', nombre: 'Venta no realizada' },
];

// --- Actividades económicas CAT-019 (desde CSV oficial) ---
const csv = readFileSync(new URL('./data/l10n_sv.actividad_economica.csv', import.meta.url), 'utf8');
const lineas = csv.split(/\r?\n/).slice(1).filter(Boolean);
const ACTIVIDADES = lineas.map((l) => {
  const partes = l.split(',');
  return { codigo: partes[1], descripcion: partes.slice(2).join(',').trim() };
}).filter((a) => a.codigo && a.descripcion);

const catalogos = {
  departamentos: DEPARTAMENTOS,
  municipios: MUNICIPIOS,
  actividades: ACTIVIDADES,
  unidadMedida: UNIDAD_MEDIDA,
  tipoDocumento: TIPO_DOCUMENTO,
  condicionOperacion: CONDICION_OPERACION,
  formaPago: FORMA_PAGO,
  tipoEstablecimiento: TIPO_ESTABLECIMIENTO,
  tributos: TRIBUTOS,
  tipoDte: TIPO_DTE,
  tipoInvalidacion: TIPO_INVALIDACION,
};

writeFileSync(new URL('../public/data/catalogos.json', import.meta.url), JSON.stringify(catalogos, null, 1), 'utf8');
console.log(`catalogos.json generado: ${ACTIVIDADES.length} actividades, ${DEPARTAMENTOS.length} departamentos, ${Object.values(MUNICIPIOS).flat().length} municipios`);
