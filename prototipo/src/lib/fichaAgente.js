import { camposBrief, camposKickoff } from '../pages/Alta.jsx';
import { kpisNegocio, servicioPorId } from '../data/catalogos.js';
import { accesosPendientes } from './salud.js';
import { listoParaEjecucion, rutaPlaneacion } from './planeacion.js';
import { HOY, esPendiente } from '../context/DatosContext.jsx';

/**
 * Convierte la ficha de un cliente de Clusters en el contexto que recibe cada agente real:
 * datos generales, kick-off, briefs por línea de negocio, accesos, objetivos y KPIs.
 * Solo usa lo que existe en Clusters; no inventa URL ni datos que no estén.
 */
export function fichaParaAgente(cliente) {
  const b = cliente.borrador;
  const lineas = [];

  lineas.push('## Datos generales');
  lineas.push(`- Rubro: ${cliente.rubro}`);
  lineas.push(`- Ciudad: ${cliente.ciudad}`);
  lineas.push(`- Modelo: B2B ${cliente.modelo?.b2b ?? '?'} % / B2C ${cliente.modelo?.b2c ?? '?'} %`);
  lineas.push(`- Servicios contratados en Clusters: ${cliente.servicios.map((s) => servicioPorId[s]?.nombre ?? s).join(', ') || 'ninguno'}`);
  lineas.push(`- Subcuenta Go High Level: ${cliente.ghl}`);
  const pendientes = accesosPendientes(cliente);
  lineas.push(`- Accesos pendientes: ${pendientes.length ? pendientes.join(', ') : 'ninguno'}`);
  if (cliente.onboarding) lineas.push(`- Onboarding en curso: ${cliente.onboarding.pct} % (paso: ${cliente.onboarding.pasoNombre})`);
  if (cliente.diagnosticoInicial) lineas.push('- Estado: alta recién terminada, diagnóstico inicial en curso');

  if (b?.kickoff) {
    const respondidas = camposKickoff.filter(([k]) => b.kickoff[k]?.trim?.());
    if (respondidas.length) {
      lineas.push('\n## Kick-off');
      for (const [k, nombre] of respondidas) lineas.push(`- **${nombre}:** ${b.kickoff[k]}`);
    }
  }

  for (const brief of b?.briefs ?? []) {
    const campos = camposBrief.filter(([k]) => brief[k]?.trim?.());
    if (!campos.length && !brief.linea) continue;
    lineas.push(`\n## Brief · ${brief.linea || 'Línea de negocio'}`);
    if (brief.b2b != null) lineas.push(`- B2B ${brief.b2b} % / B2C ${100 - brief.b2b} %`);
    for (const [k, nombre] of campos) lineas.push(`- **${nombre}:** ${brief[k]}`);
  }

  if (b?.archivos?.length) lineas.push(`\n## Archivos de marca adjuntos en Clusters\n${b.archivos.map((a) => `- ${a}`).join('\n')}`);

  if (cliente.kpis) {
    lineas.push('\n## KPIs de negocio (últimos 6 meses → meta)');
    for (const k of kpisNegocio) {
      const v = cliente.kpis[k.id];
      if (!v) continue;
      lineas.push(`- ${k.nombre}: ${v.serie.filter((x) => x != null).join(' → ')} · meta ${v.meta} ${k.unidad} (fuente: ${k.fuente})`);
    }
  }

  const obj = b?.objetivos ?? {};
  const objetivos = [
    obj.leads && `Leads/mes: ${obj.leads}`,
    obj.cpl && `CPL objetivo: ${obj.cpl}`,
    obj.conversion && `Conversión a cotización: ${obj.conversion} %`,
    obj.respuesta && `Tiempo de respuesta: ${obj.respuesta} min`,
    obj.presupuesto && `Presupuesto: ${obj.presupuesto}`,
    b?.kickoff?.objetivos,
  ].filter(Boolean);

  return {
    cliente: cliente.nombre,
    url: b?.url ?? '',
    pais: [cliente.ciudad, obj.zonas || b?.kickoff?.zonas].filter(Boolean).join(' · '),
    sector: cliente.rubro,
    competidores: b?.kickoff?.competidores ?? '',
    objetivos: objetivos.join(' · '),
    brief: lineas.join('\n'),
  };
}

/**
 * Foto del estado del cliente en Clusters para el CMO: planeación, bandeja, plan del mes,
 * oportunidades y escalados. Se suma a la ficha cada vez que se abre su chat.
 */
export function estadoParaCMO(cliente, datos) {
  const ruta = rutaPlaneacion(cliente, datos.aprobaciones);
  const delCliente = datos.aprobaciones.filter((a) => a.cliente === cliente.id);
  const pendientes = delCliente.filter(esPendiente);
  const planes = delCliente.filter((a) => a.tipo === 'plan-mensual');
  const aprobado = planes.find((p) => p.estado === 'Aprobado');
  const oportunidades = datos.oportunidades.filter((o) => o.cliente === cliente.id && ['Detectada', 'Propuesta al cliente'].includes(o.estado));
  const escalados = datos.escalados.filter((e) => e.cliente === cliente.id && e.estado !== 'Resuelto');

  const l = [`\n## Estado actual en Clusters (fecha de hoy en Clusters: ${HOY})`];
  l.push(`- Planeación: ${listoParaEjecucion(ruta) ? 'completa, lista para ejecución' : 'en curso'}`);
  for (const a of ruta) l.push(`  - ${a.nombre} (${a.canal}): ${a.estado}${a.faltan?.length ? ` · requiere ${a.faltan.join(', ')}` : ''}`);
  l.push(`- Pendientes de aprobación en la bandeja: ${pendientes.length}`);
  for (const a of pendientes.slice(0, 10)) l.push(`  - [${a.agente}] ${a.titulo}`);
  if (aprobado) {
    l.push(`- Último plan aprobado: ${aprobado.contenido.mes}`);
    for (const t of aprobado.contenido.tareas) l.push(`  - [${t.canal}] ${t.titulo} · ${t.estado ?? 'Trabajando'}`);
  }
  if (planes.some(esPendiente)) l.push('- Hay un plan mensual esperando aprobación de la ejecutiva.');
  if (oportunidades.length) {
    l.push(`- Oportunidades de venta cruzada abiertas: ${oportunidades.length}`);
    for (const o of oportunidades) l.push(`  - ${o.servicio}: ${o.estado}`);
  }
  if (escalados.length) l.push(`- Casos escalados a especialistas abiertos: ${escalados.length}`);
  return l.join('\n');
}
