import { useState } from 'react';
import { CalendarClock, CheckCircle2, Clock, ShieldAlert, Trash2, Undo2 } from 'lucide-react';
import { kpiNegocioPorId, servicioPorId } from '../../data/catalogos.js';
import { HOY, esPendiente, useDatos } from '../../context/DatosContext.jsx';
import { useSesion } from '../../context/SesionContext.jsx';
import { formatoFecha, plural } from '../../lib/formato.js';
import { Alerta, Chip, InsigniaAgente, Progreso } from '../../components/ui.jsx';

// Canal del especialista que revisa cada servicio (Pauta social y Redes caen en Meta).
const canalEspecialista = { SEO: 'SEO', SEM: 'SEM', Pauta: 'Meta', Redes: 'Meta' };

export function TabPlan({ cliente, ruta, listo, lectura }) {
  const { aprobaciones } = useDatos();
  const planes = aprobaciones.filter((a) => a.cliente === cliente.id && a.tipo === 'plan-mensual');
  const pendiente = planes.find(esPendiente);
  const aprobado = planes.find((p) => p.estado === 'Aprobado');

  if (!listo) {
    const faltan = ruta.filter((a) => a.estado !== 'Aprobado').map((a) => a.nombre);
    return (
      <Alerta tipo="info">
        El plan mensual se habilita cuando toda la planeación esté aprobada. Falta: {faltan.join(', ')}.
      </Alerta>
    );
  }
  if (pendiente) return <PlanPorAprobar plan={pendiente} cliente={cliente} lectura={lectura} />;
  if (aprobado) return <PlanAprobado plan={aprobado} />;
  return <PlanAnterior cliente={cliente} />;
}

/** US-8: la ejecutiva puede quitar o posponer tareas y aprobar el resto. */
function PlanPorAprobar({ plan, cliente, lectura }) {
  const { actualizarAprobacion, agregarEscalado } = useDatos();
  const { persona } = useSesion();
  const [decision, setDecision] = useState({}); // id de tarea -> 'Quitada' | 'Pospuesta'
  const tareas = plan.contenido.tareas;
  const incluidas = tareas.filter((t) => !decision[t.id]);
  const conRevision = incluidas.filter((t) => t.revisionEspecialista && canalEspecialista[t.canal]);

  const alternar = (id, valor) => setDecision((d) => ({ ...d, [id]: d[id] === valor ? undefined : valor }));

  const aprobar = () => {
    const finales = tareas.map((t) => ({
      ...t,
      estado: decision[t.id] ?? (conRevision.includes(t) ? 'Escalado' : 'Trabajando'),
    }));
    const quitadas = finales.filter((t) => t.estado === 'Quitada').length;
    const pospuestas = finales.filter((t) => t.estado === 'Pospuesta').length;
    actualizarAprobacion(plan.id, {
      estado: 'Aprobado',
      aprobadoEl: HOY,
      contenido: { ...plan.contenido, tareas: finales },
      historial: [
        ...plan.historial,
        {
          fecha: HOY,
          autor: persona.id,
          texto: `Plan aprobado con ${plural(incluidas.length, 'tarea')}${quitadas ? `, ${quitadas} quitadas` : ''}${pospuestas ? `, ${pospuestas} pospuestas` : ''}.`,
        },
      ],
    });
    // US-12: las tareas de revisión obligatoria se escalan solas al aprobar el plan.
    for (const t of conRevision) {
      agregarEscalado({
        id: `esc-${plan.id}-${t.id}`,
        cliente: cliente.id,
        ejecutiva: cliente.ejecutiva,
        canal: canalEspecialista[t.canal],
        agente: t.canal,
        origen: 'Automático',
        tipoTarea: t.titulo,
        motivo: 'Tarea del plan mensual marcada como de revisión obligatoria de un especialista.',
        propuesta: t.titulo,
        comentario: null,
        creado: HOY,
        especialista: null,
        tomadoEl: null,
        estado: 'Esperando especialista',
        respuesta: null,
      });
    }
  };

  return (
    <>
      <div className="propuesta-agente" style={{ marginBottom: 16 }}>
        <div className="fila" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <div className="fila">
            <h2>{plan.titulo}</h2>
            <Chip variante="agente" icono={Clock}>
              Esperando tu aprobación
            </Chip>
          </div>
          <div className="fila">
            <InsigniaAgente agente="los agentes" />
            <Chip variante={{ Alta: 'verde', Media: 'amarillo', Baja: 'rojo' }[plan.confianza]}>Confianza {plan.confianza.toLowerCase()}</Chip>
          </div>
        </div>
        <h4 style={{ marginBottom: 4 }}>Por qué lo proponemos</h4>
        <p className="texto-sm" style={{ color: 'var(--azul-800)' }}>
          {plan.porQue}
        </p>
      </div>

      <ListaTareas
        tareas={tareas}
        estadoDe={(t) => decision[t.id]}
        acciones={(t) =>
          lectura ? null : decision[t.id] ? (
            <button className="boton boton--fantasma" onClick={() => alternar(t.id, decision[t.id])}>
              <Undo2 size={14} /> Deshacer
            </button>
          ) : (
            <>
              <button className="boton boton--fantasma" onClick={() => alternar(t.id, 'Pospuesta')}>
                <CalendarClock size={14} /> Posponer
              </button>
              <button className="boton boton--fantasma" style={{ color: 'var(--salud-rojo)' }} onClick={() => alternar(t.id, 'Quitada')}>
                <Trash2 size={14} /> Quitar
              </button>
            </>
          )
        }
      />

      <div className="fila" style={{ justifyContent: 'flex-end', marginTop: 16, gap: 14 }}>
        {conRevision.length > 0 && (
          <span className="texto-sm" style={{ color: 'var(--azul-800)' }}>
            <ShieldAlert size={14} style={{ verticalAlign: -2 }} /> {plural(conRevision.length, 'tarea')} se escalará a un especialista al aprobar
          </span>
        )}
        <button className="boton boton--primario" disabled={incluidas.length === 0 || lectura} onClick={aprobar}>
          <CheckCircle2 size={16} /> Aprobar plan ({plural(incluidas.length, 'tarea')})
        </button>
      </div>
    </>
  );
}

function PlanAprobado({ plan }) {
  const activas = plan.contenido.tareas.filter((t) => t.estado !== 'Quitada' && t.estado !== 'Pospuesta');
  const completadas = activas.filter((t) => t.estado === 'Completada').length;
  const pct = activas.length ? Math.round((completadas / activas.length) * 100) : 0;
  return (
    <>
      <div className="tarjeta" style={{ marginBottom: 16 }}>
        <div className="fila" style={{ justifyContent: 'space-between' }}>
          <div className="fila">
            <h2>{plan.titulo}</h2>
            <Chip variante="verde" icono={CheckCircle2}>
              Aprobado el {formatoFecha(plan.aprobadoEl)}
            </Chip>
          </div>
          <strong className="texto-sm">
            {completadas} de {activas.length} tareas completadas
          </strong>
        </div>
        <div style={{ marginTop: 12 }}>
          <Progreso valor={pct} />
        </div>
      </div>
      <ListaTareas tareas={plan.contenido.tareas} estadoDe={(t) => t.estado} />
    </>
  );
}

/** Clientes listos sin plan nuevo en la bandeja: se muestra el cierre del mes anterior. */
function PlanAnterior({ cliente }) {
  const total = cliente.servicios.length * 3;
  const completadas = total - 1;
  return (
    <div className="tarjeta">
      <div className="fila" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <h2>Plan mensual · Septiembre 2026</h2>
        <Chip variante="suave">Cerrado</Chip>
      </div>
      <p className="texto-sm" style={{ marginBottom: 10 }}>
        {completadas} de {total} tareas completadas · 1 pasó al plan de octubre.
      </p>
      <Progreso valor={Math.round((completadas / total) * 100)} />
      <div style={{ marginTop: 14 }}>
        <Alerta tipo="info">Los agentes están preparando el plan de octubre. Aparecerá en tu bandeja de aprobaciones.</Alerta>
      </div>
    </div>
  );
}

const varianteEstado = { Trabajando: 'verde', Completada: 'verde', Escalado: 'rojo', Quitada: 'suave', Pospuesta: 'amarillo' };

function ListaTareas({ tareas, estadoDe, acciones }) {
  const canales = [...new Set(tareas.map((t) => t.canal))];
  return canales.map((canal) => (
    <section key={canal} className="tarjeta" style={{ padding: 0, marginBottom: 12 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--azul-200)' }}>
        <h3>{servicioPorId[canal]?.agente ?? canal}</h3>
      </div>
      {tareas
        .filter((t) => t.canal === canal)
        .map((t) => {
          const estado = estadoDe(t);
          const fuera = estado === 'Quitada' || estado === 'Pospuesta';
          return (
            <div key={t.id} className={`tarea-plan${fuera ? ' tarea-plan--fuera' : ''}`}>
              <div style={{ minWidth: 0 }}>
                <div className="tarea-plan__titulo">{t.titulo}</div>
                <div className="fila fila--envolver texto-xs" style={{ gap: 6, marginTop: 4, color: 'var(--azul-800)' }}>
                  <span>Fecha objetivo: {formatoFecha(t.fechaObjetivo)}</span>
                  <span>·</span>
                  <span>Aporta a: {kpiNegocioPorId[t.kpi]?.nombre ?? t.kpi}</span>
                  {t.revisionEspecialista && (
                    <Chip variante="rojo" icono={ShieldAlert}>
                      Revisión obligatoria de especialista
                    </Chip>
                  )}
                </div>
              </div>
              <div className="tarea-plan__acciones">
                {estado && <Chip variante={varianteEstado[estado]}>{estado}</Chip>}
                {acciones?.(t)}
              </div>
            </div>
          );
        })}
    </section>
  ));
}
