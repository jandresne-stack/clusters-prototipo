import { accesosPendientes, saludCliente } from './salud.js';

/**
 * KPIs por canal contratado (US-6). Las series de ejemplo se generan de forma determinística
 * a partir del id del cliente (misma semilla = mismos números en cada recarga), y su tendencia
 * sigue la salud del cliente: mejora si está en verde, empeora si está en rojo.
 */
export const kpisPorCanal = {
  SEO: {
    titulo: 'SEO',
    kpis: [
      { id: 'visibilidad', nombre: 'Visibilidad de keywords', unidad: '%', fuente: 'SE Ranking', base: [8, 35], mayorEsMejor: true },
      { id: 'top10', nombre: 'Keywords en top 10', unidad: '', fuente: 'SE Ranking', base: [10, 80], mayorEsMejor: true, entero: true },
      { id: 'trafico', nombre: 'Tráfico orgánico', unidad: '', fuente: 'Search Console', base: [1200, 9000], mayorEsMejor: true, entero: true },
      { id: 'salud-sitio', nombre: 'Salud del sitio', unidad: '%', fuente: 'SE Ranking', base: [68, 94], mayorEsMejor: true, entero: true },
      { id: 'autoridad', nombre: 'Autoridad de dominio', unidad: '', fuente: 'SE Ranking', base: [12, 40], mayorEsMejor: true, entero: true },
      { id: 'pagespeed', nombre: 'PageSpeed (móvil)', unidad: '', fuente: 'PageSpeed Insights', base: [38, 88], mayorEsMejor: true, entero: true },
    ],
  },
  SEM: {
    titulo: 'SEM · Google Ads',
    kpis: [
      { id: 'inversion', nombre: 'Inversión', unidad: 'COP', fuente: 'Google Ads', base: [1500000, 6000000], mayorEsMejor: null, redondeo: 10000 },
      { id: 'cpc', nombre: 'CPC', unidad: 'COP', fuente: 'Google Ads', base: [900, 3500], mayorEsMejor: false, redondeo: 10 },
      { id: 'ctr', nombre: 'CTR', unidad: '%', fuente: 'Google Ads', base: [3, 9], mayorEsMejor: true },
      { id: 'clics', nombre: 'Clics', unidad: '', fuente: 'Google Ads', base: [900, 4500], mayorEsMejor: true, entero: true },
      { id: 'conversiones', nombre: 'Conversiones', unidad: '', fuente: 'Google Ads', base: [40, 260], mayorEsMejor: true, entero: true },
      { id: 'costo-conversion', nombre: 'Costo por conversión', unidad: 'COP', fuente: 'Google Ads', base: [18000, 120000], mayorEsMejor: false, redondeo: 100 },
      { id: 'leads-semana', nombre: 'Leads por semana', unidad: '', fuente: 'Google Ads', base: [8, 60], mayorEsMejor: true, entero: true },
    ],
  },
  Pauta: {
    titulo: 'Meta · Pauta social',
    kpis: [
      { id: 'cpm', nombre: 'CPM', unidad: 'COP', fuente: 'Meta Ads', base: [8000, 18000], mayorEsMejor: false, redondeo: 100 },
      { id: 'alcance', nombre: 'Alcance', unidad: '', fuente: 'Meta Ads', base: [20000, 120000], mayorEsMejor: true, entero: true },
      { id: 'frecuencia', nombre: 'Frecuencia', unidad: '', fuente: 'Meta Ads', base: [1.4, 3], mayorEsMejor: null },
      { id: 'ctr-meta', nombre: 'CTR', unidad: '%', fuente: 'Meta Ads', base: [0.8, 2.2], mayorEsMejor: true },
      { id: 'cpl-meta', nombre: 'CPL', unidad: 'COP', fuente: 'Meta Ads', base: [6000, 90000], mayorEsMejor: false, redondeo: 100 },
    ],
  },
  Redes: {
    titulo: 'Redes sociales',
    kpis: [
      { id: 'comunidad', nombre: 'Crecimiento de comunidad', unidad: '', fuente: 'Meta Business Suite', base: [1500, 25000], mayorEsMejor: true, entero: true },
      { id: 'engagement', nombre: 'Engagement', unidad: '%', fuente: 'Meta Business Suite', base: [1.5, 6], mayorEsMejor: true },
      { id: 'interacciones', nombre: 'Interacciones', unidad: '', fuente: 'Meta Business Suite', base: [800, 9000], mayorEsMejor: true, entero: true },
    ],
  },
};

// Generador pseudoaleatorio reproducible (mulberry32) sembrado con un texto.
function aleatorio(semilla) {
  let h = 1779033703;
  for (const ch of semilla) h = Math.imul(h ^ ch.charCodeAt(0), 3432918353);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const tendenciaPorSalud = { verde: 0.035, amarillo: -0.005, rojo: -0.04 };

function serie(def, cliente) {
  const r = aleatorio(`${cliente.id}:${def.id}`);
  const [min, max] = def.base;
  let valor = min + (max - min) * (0.25 + r() * 0.5);
  // Paso mensual en la dirección "buena" del KPI; los KPIs neutros (inversión, frecuencia) solo oscilan.
  const paso = def.mayorEsMejor == null ? 0.01 : (tendenciaPorSalud[saludCliente(cliente)] ?? 0) * (def.mayorEsMejor ? 1 : -1);
  const valores = [];
  for (let i = 0; i < 6; i++) {
    valores.push(valor);
    valor *= 1 + paso + (r() - 0.5) * 0.06;
  }
  return valores.map((v) => {
    if (def.redondeo) return Math.round(v / def.redondeo) * def.redondeo;
    if (def.entero) return Math.round(v);
    return Math.round(v * 10) / 10;
  });
}

/** Bloques de KPIs de los canales contratados: [{ canal, titulo, kpis: [{ ...def, serie | sinDatos }] }] */
export function bloquesKpiCanal(cliente) {
  const faltan = accesosPendientes(cliente);
  return Object.entries(kpisPorCanal)
    .filter(([canal]) => cliente.servicios.includes(canal))
    .map(([canal, { titulo, kpis }]) => ({
      canal,
      titulo,
      kpis: kpis.map((def) =>
        faltan.includes(def.fuente) || cliente.onboarding || !cliente.kpis
          ? {
              ...def,
              sinDatos: faltan.includes(def.fuente)
                ? `Sin datos: falta acceso a ${def.fuente}`
                : cliente.onboarding
                  ? 'Sin datos: onboarding en curso'
                  : 'Sin datos: diagnóstico inicial en curso',
            }
          : { ...def, serie: serie(def, cliente) },
      ),
    }));
}
