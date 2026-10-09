import { servicios } from '../data/catalogos.js';
import { agentesOverrides, ultimaAccionPorCanal } from '../data/ficha.js';
import { esPendiente } from '../context/DatosContext.jsx';
import { accesosPendientes } from './salud.js';

// Acceso sin el cual cada agente no puede trabajar.
const accesoClave = { SEO: 'Search Console', SEM: 'Google Ads', Pauta: 'Meta Business', Redes: 'Meta Business' };

// Tareas de ejecución genéricas por canal (la metodología de ejecución aún no está definida: spec, fuera de alcance).
const plantillas = {
  SEO: (c) => [
    { tipo: 'Optimización on-page', titulo: 'On-page de /servicios: title, H1 y enlazado interno', estado: 'Completada', fecha: '2026-09-12' },
    { tipo: 'Optimización on-page', titulo: 'On-page de la página de inicio', estado: 'En curso', fecha: '2026-10-08' },
    { tipo: 'Artículo de blog', titulo: `Artículo de blog: guía de ${c.rubro.toLowerCase()} en ${c.ciudad}`, estado: 'En curso', fecha: '2026-10-15' },
    { tipo: 'Datos estructurados', titulo: 'Schema LocalBusiness y FAQ para GEO/AEO', estado: 'Completada', fecha: '2026-09-20' },
    { tipo: 'Backlinks y directorios', titulo: 'Alta en 5 directorios locales y 2 backlinks sectoriales', estado: 'En curso', fecha: '2026-10-20' },
  ],
  SEM: () => [
    { tipo: 'Creación de campañas', titulo: 'Campaña de búsqueda para el servicio prioritario', estado: 'Completada', fecha: '2026-09-05' },
    { tipo: 'Optimización de campañas', titulo: 'Optimización semanal de pujas y presupuesto', estado: 'En curso', fecha: '2026-10-07' },
    { tipo: 'Ajuste de keywords', titulo: 'Revisión de términos de búsqueda y negativas', estado: 'En curso', fecha: '2026-10-04' },
  ],
  Pauta: () => [{ tipo: 'Optimización', titulo: 'Rotación de creativos', estado: 'En curso', fecha: '2026-10-10' }],
  Redes: () => [{ tipo: 'Contenido', titulo: 'Parrilla de contenidos del mes', estado: 'En curso', fecha: '2026-10-31' }],
  Email: () => [{ tipo: 'Campaña', titulo: 'Boletín mensual', estado: 'En curso', fecha: '2026-10-15' }],
};

/** Tareas del agente: genéricas + las del plan mensual aprobado + las que esperan aprobación. */
export function tareasAgente(cliente, canal, aprobaciones) {
  if (cliente.onboarding) return [];
  if (cliente.diagnosticoInicial) {
    return [{ tipo: 'Diagnóstico', titulo: 'Diagnóstico inicial del canal', estado: 'En curso', fecha: cliente.altaEl }];
  }
  const delCliente = aprobaciones.filter((a) => a.cliente === cliente.id);

  const delPlan = delCliente
    .filter((a) => a.tipo === 'plan-mensual' && a.estado === 'Aprobado')
    .flatMap((a) => a.contenido.tareas)
    .filter((t) => t.canal === canal && (!t.estado || t.estado === 'Trabajando' || t.estado === 'Escalado'))
    .map((t) => ({ tipo: 'Plan mensual', titulo: t.titulo, estado: t.estado ?? 'Trabajando', fecha: t.fechaObjetivo }));

  const enBandeja = delCliente
    .filter((a) => a.agente === canal && a.tipo !== 'plan-mensual' && esPendiente(a))
    .map((a) => ({ tipo: 'Propuesta', titulo: a.titulo, estado: 'Esperando aprobación', fecha: a.creado, aprobacionId: a.id }));

  return [...enBandeja, ...delPlan, ...plantillas[canal](cliente)];
}

/** Tarjeta de un agente (US-7). */
export function resumenAgente(cliente, canal, { aprobaciones, automatizaciones }) {
  const servicio = servicios.find((s) => s.id === canal);
  const base = { canal, nombre: servicio.agente, ejecutaEnGhl: !!servicio.ejecutaEnGhl };
  if (!cliente.servicios.includes(canal)) return { ...base, contratado: false };

  const tareas = tareasAgente(cliente, canal, aprobaciones);
  const pendientes = tareas.filter((t) => t.estado === 'Esperando aprobación');
  const enCurso = tareas.filter((t) => t.estado === 'En curso' || t.estado === 'Trabajando');
  const workflowsActivos =
    canal === 'SEM'
      ? automatizaciones.filter((a) => a.cliente === cliente.id && a.agente === 'SEM' && a.tipo === 'workflow' && a.estado === 'Activa').length
      : null;

  const faltaAcceso = accesosPendientes(cliente).find((a) => a === accesoClave[canal]);
  let estado = 'Trabajando';
  let motivo = null;
  const override = agentesOverrides[cliente.id]?.[canal];
  if (override) {
    ({ estado, motivo } = override);
  } else if (faltaAcceso) {
    estado = 'Bloqueado';
    motivo = `Falta acceso a ${faltaAcceso}`;
  } else if (cliente.onboarding) {
    estado = 'En pausa';
    motivo = 'Empieza cuando se complete el alta del cliente';
  } else if (cliente.diagnosticoInicial) {
    estado = 'Diagnóstico inicial en curso';
  } else if (servicio.ejecutaEnGhl && cliente.ghl !== 'conectado') {
    estado = 'Bloqueado';
    motivo = 'GHL desconectado: no puede ejecutar en la subcuenta del cliente';
  } else if (pendientes.length) {
    estado = 'Esperando aprobación';
  }

  const ultima = pendientes[0]
    ? { texto: `Propuso: ${pendientes[0].titulo}`, fecha: pendientes[0].fecha }
    : cliente.onboarding
      ? null
      : cliente.diagnosticoInicial
        ? { texto: 'Empezó el diagnóstico inicial del cliente', fecha: cliente.altaEl }
      : { texto: ultimaAccionPorCanal[canal], fecha: '2026-09-30' };

  return {
    ...base,
    contratado: true,
    estado,
    motivo,
    enCurso: enCurso.length,
    pendientes: pendientes.length,
    workflowsActivos,
    ultima,
    tareas,
  };
}
