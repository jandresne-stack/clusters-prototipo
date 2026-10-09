// Catálogos fijos de la plataforma: servicios, agentes, KPIs y meses del historial.

export const servicios = [
  { id: 'SEO', nombre: 'SEO', agente: 'Agente SEO' },
  { id: 'SEM', nombre: 'SEM', agente: 'Agente SEM' },
  { id: 'Redes', nombre: 'Redes sociales', agente: 'Agente Redes sociales', ejecutaEnGhl: true },
  { id: 'Pauta', nombre: 'Pauta social', agente: 'Agente Pauta social' },
  { id: 'Email', nombre: 'Email marketing', agente: 'Agente Email marketing', ejecutaEnGhl: true },
];

export const servicioPorId = Object.fromEntries(servicios.map((s) => [s.id, s]));

// KPIs de negocio (US-6). `mayorEsMejor` define en qué dirección se mide la brecha contra la meta.
export const kpisNegocio = [
  { id: 'leads', nombre: 'Leads / mes', unidad: '', mayorEsMejor: true, fuente: 'GHL' },
  { id: 'cpl', nombre: 'CPL / CPA', unidad: 'COP', mayorEsMejor: false, fuente: 'Google Ads / Meta' },
  { id: 'conversion', nombre: 'Conversión a cotización', unidad: '%', mayorEsMejor: true, fuente: 'GHL' },
  { id: 'respuesta', nombre: 'Tiempo de respuesta al lead', unidad: 'min', mayorEsMejor: false, fuente: 'GHL' },
];

export const kpiNegocioPorId = Object.fromEntries(kpisNegocio.map((k) => [k.id, k]));

// Historial de 6 meses que usan todas las series de ejemplo (el último es el mes actual).
export const meses = ['Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep'];
export const mesActual = 'Septiembre 2026';

export const estadosGhl = {
  conectado: 'Conectado',
  pendiente: 'Pendiente',
  desconectado: 'Desconectado',
};
