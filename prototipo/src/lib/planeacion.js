import { planeacionOverrides } from '../data/ficha.js';
import { esPendiente } from '../context/DatosContext.jsx';

/**
 * Ruta de planeación estratégica de AMD (US-3).
 * `requiere`: servicios de los que depende que el artefacto aparezca (vacío = siempre).
 * `depende`: artefactos que deben estar aprobados antes. Las dependencias de servicios no
 * contratados se ignoran (ej. Buyer Persona no espera al Checklist de Redes si no hay Redes).
 * `etapa`: columna en la que se dibuja.
 */
export const artefactos = [
  { id: 'kickoff', nombre: 'Kick-off', canal: 'Transversal', autor: 'Ejecutiva', etapa: 0, requiere: [], depende: [] },
  { id: 'brief', nombre: 'Brief(s) por línea de negocio', canal: 'Transversal', autor: 'Ejecutiva', etapa: 1, requiere: [], depende: ['kickoff'] },
  { id: 'benchmarking', nombre: 'Benchmarking', canal: 'Transversal', autor: 'Equipo de agentes', etapa: 2, requiere: [], depende: ['brief'] },
  { id: 'kw-research', nombre: 'KW Research', canal: 'SEO', autor: 'Agente SEO', etapa: 2, requiere: ['SEO', 'SEM'], depende: ['brief'] },
  { id: 'checklist-seo', nombre: 'Checklist SEO', canal: 'SEO', autor: 'Agente SEO', etapa: 2, requiere: ['SEO'], depende: ['brief'] },
  { id: 'checklist-web-ads', nombre: 'Checklist Web para Ads', canal: 'SEM', autor: 'Agente SEM', etapa: 2, requiere: ['SEM'], depende: ['brief'] },
  { id: 'checklist-redes', nombre: 'Checklist de Redes', canal: 'Redes', autor: 'Agente Redes sociales', etapa: 2, requiere: ['Redes'], depende: ['brief'] },
  {
    id: 'buyer-persona',
    nombre: 'Buyer Persona',
    canal: 'Transversal',
    autor: 'Equipo de agentes',
    etapa: 3,
    requiere: [],
    depende: ['brief', 'benchmarking', 'kw-research', 'checklist-seo', 'checklist-web-ads', 'checklist-redes'],
  },
  { id: 'estrategia', nombre: 'Estrategia', canal: 'Transversal', autor: 'Equipo de agentes', etapa: 4, requiere: [], depende: ['buyer-persona'] },
  { id: 'ogsm-seo', nombre: 'Matriz OGSM · SEO', canal: 'SEO', autor: 'Agente SEO', etapa: 5, requiere: ['SEO'], depende: ['estrategia'] },
  { id: 'ogsm-sem', nombre: 'Matriz OGSM · SEM', canal: 'SEM', autor: 'Agente SEM', etapa: 5, requiere: ['SEM'], depende: ['estrategia'] },
  { id: 'ogsm-meta', nombre: 'Matriz OGSM · Meta', canal: 'Meta', autor: 'Agente Pauta social', etapa: 5, requiere: ['Pauta'], depende: ['estrategia'] },
  { id: 'ogsm-redes', nombre: 'Matriz OGSM · Redes', canal: 'Redes', autor: 'Agente Redes sociales', etapa: 5, requiere: ['Redes'], depende: ['estrategia'] },
  { id: 'budget-google', nombre: 'Budget Google Ads', canal: 'SEM', autor: 'Agente SEM', etapa: 5, requiere: ['SEM'], depende: ['estrategia'] },
  { id: 'budget-meta', nombre: 'Budget Meta Ads', canal: 'Meta', autor: 'Agente Pauta social', etapa: 5, requiere: ['Pauta'], depende: ['estrategia'] },
  {
    id: 'guideline-ads',
    nombre: 'Guideline Ads mensual',
    canal: 'SEM',
    autor: 'Agente SEM',
    etapa: 6,
    requiere: ['SEM', 'Pauta'],
    depende: ['ogsm-sem', 'ogsm-meta', 'budget-google', 'budget-meta'],
  },
];

export const etapas = ['Kick-off', 'Brief', 'Diagnóstico', 'Buyer Persona', 'Estrategia', 'OGSM y Budgets', 'Guideline Ads'];

// Cómo se llama cada artefacto en `contenido.artefacto` de las aprobaciones.
const nombreEnBandeja = {
  'KW Research': 'kw-research',
  'Guideline Ads mensual': 'guideline-ads',
  'Checklist Web para Ads': 'checklist-web-ads',
  'Budget Meta Ads': 'budget-meta',
  'Checklist SEO': 'checklist-seo',
  Benchmarking: 'benchmarking',
  'Buyer Persona': 'buyer-persona',
};

const aplica = (art, servicios) => art.requiere.length === 0 || art.requiere.some((s) => servicios.includes(s));

/**
 * Estado de cada artefacto aplicable para un cliente:
 * { ...artefacto, estado, faltan: [nombres], aprobacionId }
 * estado ∈ 'No iniciado' | 'En curso por agente' | 'Esperando aprobación' | 'Aprobado' | 'Bloqueado'
 */
export function rutaPlaneacion(cliente, aprobaciones) {
  const aplicables = artefactos.filter((a) => aplica(a, cliente.servicios));
  const ids = new Set(aplicables.map((a) => a.id));
  const overrides = planeacionOverrides[cliente.id] ?? {};
  const nuevos = new Set(cliente.serviciosNuevos ?? []);

  const pendientes = {};
  for (const a of aprobaciones) {
    if (a.cliente === cliente.id && a.tipo === 'artefacto' && esPendiente(a)) {
      const id = nombreEnBandeja[a.contenido?.artefacto];
      if (id) pendientes[id] = a.id;
    }
  }

  const base = {};
  for (const art of aplicables) {
    let estado;
    if (cliente.onboarding) {
      estado = art.id === 'kickoff' ? 'En curso por agente' : 'No iniciado';
    } else if (cliente.diagnosticoInicial) {
      // Alta recién terminada (US-2): Kick-off y Brief vienen del asistente; arranca el diagnóstico.
      estado = art.etapa <= 1 ? 'Aprobado' : art.etapa === 2 ? 'En curso por agente' : 'No iniciado';
    } else if (pendientes[art.id]) {
      estado = 'Esperando aprobación';
    } else if (overrides[art.id]) {
      estado = overrides[art.id];
    } else if (art.requiere.length && art.requiere.every((s) => nuevos.has(s) || !cliente.servicios.includes(s))) {
      // Servicio recién activado desde una oportunidad aceptada (US-11): su planeación arranca de cero.
      estado = 'No iniciado';
    } else {
      estado = 'Aprobado';
    }
    base[art.id] = estado;
  }

  return aplicables.map((art) => {
    const faltan = art.depende.filter((d) => ids.has(d) && base[d] !== 'Aprobado');
    const estado = base[art.id] === 'No iniciado' && faltan.length ? 'Bloqueado' : base[art.id];
    return {
      ...art,
      autor: cliente.onboarding && art.id === 'kickoff' ? 'Ejecutiva' : art.autor,
      estado: cliente.onboarding && art.id === 'kickoff' ? 'En curso' : estado,
      faltan: faltan.map((d) => artefactos.find((a) => a.id === d).nombre),
      aprobacionId: pendientes[art.id] ?? null,
    };
  });
}

export function listoParaEjecucion(ruta) {
  return ruta.every((a) => a.estado === 'Aprobado');
}
