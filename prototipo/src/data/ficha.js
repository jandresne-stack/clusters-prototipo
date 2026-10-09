// Datos de la ficha de cliente (planeación, accesos y agentes). Lo que no está aquí se deriva
// en lib/planeacion.js, lib/agentes.js y lib/kpisCanal.js a partir de clientes.js y del almacén.

// Estado de artefactos que difiere de "Aprobado" en clientes activos. Los artefactos con un ítem
// pendiente en la bandeja salen solos como "Esperando aprobación" (no hace falta listarlos aquí).
export const planeacionOverrides = {
  // Veterinaria Patitas: replanteando la estrategia tras sumar Redes. Buyer Persona queda bloqueado.
  patitas: {
    benchmarking: 'En curso por agente',
    'checklist-redes': 'En curso por agente',
    'buyer-persona': 'No iniciado',
    estrategia: 'No iniciado',
    'ogsm-seo': 'No iniciado',
    'ogsm-redes': 'No iniciado',
  },
  // Prada: la Matriz OGSM de SEO se está actualizando para el último trimestre.
  prada: { 'ogsm-seo': 'En curso por agente' },
  // Muebles Roble: aceptó Pauta social en septiembre y su planeación de Meta va empezando.
  roble: { 'ogsm-meta': 'En curso por agente', 'guideline-ads': 'No iniciado' },
  // Constructora Altos del Río: se revisa la landing antes de seguir invirtiendo.
  'altos-del-rio': { 'guideline-ads': 'En curso por agente' },
};

// Accesos que faltan en clientes ya activos (los de onboarding están en clientes.js).
export const accesosFaltantes = {
  biovida: ['Search Console'],
};

// Estado de agentes que no se deriva solo (pausas pedidas por el cliente, bloqueos puntuales).
export const agentesOverrides = {
  powerfit: { Pauta: { estado: 'En pausa', motivo: 'El cliente pidió pausar la pauta hasta noviembre (temporada baja)' } },
  horizonte: { SEM: { estado: 'Bloqueado', motivo: 'GHL desconectado: no puede activar workflows de seguimiento de leads' } },
};

// Última acción conocida por agente cuando no hay ítems recientes en la bandeja.
export const ultimaAccionPorCanal = {
  SEO: 'Actualizó el reporte de posiciones de keywords',
  SEM: 'Ajustó pujas y negativas en las campañas activas',
  Redes: 'Publicó el contenido programado de la semana',
  Pauta: 'Rotó los creativos con menor CTR',
  Email: 'Envió el boletín mensual',
};
