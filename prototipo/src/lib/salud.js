import { kpisNegocio } from '../data/catalogos.js';
import { accesosFaltantes } from '../data/ficha.js';

/**
 * Brecha de un KPI contra su meta, en fracción (0.12 = 12 % peor que la meta).
 * Es negativa o cero cuando el KPI cumple o supera la meta.
 */
export function brecha(def, { meta, serie }) {
  const actual = serie[serie.length - 1];
  return def.mayorEsMejor ? (meta - actual) / meta : (actual - meta) / meta;
}

/** ¿Hay datos disponibles para este KPI? Los KPIs con fuente GHL requieren la subcuenta conectada. */
export function kpiDisponible(def, cliente) {
  const valor = cliente.kpis?.[def.id];
  if (!valor) return false;
  return def.fuente !== 'GHL' || cliente.ghl === 'conectado';
}

/**
 * Semáforo de salud (spec US-1):
 *  - rojo: al menos un KPI de negocio más de un 20 % por debajo de su meta
 *  - amarillo: el peor está entre un 1 % y un 20 % por debajo
 *  - verde: el resto
 * Devuelve null si el cliente sigue en onboarding (se muestra el progreso en su lugar).
 */
export function saludCliente(cliente) {
  if (cliente.onboarding) return null;
  const brechas = kpisNegocio
    .filter((def) => kpiDisponible(def, cliente))
    .map((def) => brecha(def, cliente.kpis[def.id]));
  const peor = Math.max(0, ...brechas);
  if (peor > 0.2) return 'rojo';
  if (peor >= 0.01) return 'amarillo';
  return 'verde';
}

export const etiquetaSalud = { verde: 'En meta', amarillo: 'En riesgo', rojo: 'Crítico' };

/** Alertas activas de un cliente, con el texto exacto del spec. */
export function alertasCliente(cliente) {
  const alertas = [];
  if (cliente.ghl === 'desconectado') {
    alertas.push({ tipo: 'error', texto: 'GHL desconectado: sin datos de leads ni automatizaciones' });
  }
  if (cliente.revisionLeadsAtrasadaDias) {
    alertas.push({
      tipo: 'aviso',
      texto: `Revisión semanal de leads sin completar hace ${cliente.revisionLeadsAtrasadaDias} días`,
    });
  }
  for (const acceso of accesosPendientes(cliente)) {
    alertas.push({ tipo: 'aviso', texto: `Falta acceso a ${acceso}` });
  }
  return alertas;
}

/** Accesos que faltan: los del onboarding (clientes.js) más los de clientes activos (ficha.js). */
export function accesosPendientes(cliente) {
  return [...(cliente.accesosPendientes ?? []), ...(accesosFaltantes[cliente.id] ?? [])];
}
