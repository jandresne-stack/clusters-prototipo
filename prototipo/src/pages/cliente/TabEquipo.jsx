import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Bot, ChevronRight, Sparkles } from 'lucide-react';
import { servicios } from '../../data/catalogos.js';
import { resumenAgente } from '../../lib/agentes.js';
import { formatoFecha } from '../../lib/formato.js';
import { Chip, InsigniaGhl } from '../../components/ui.jsx';

const claseEstado = {
  Trabajando: 'trabajando',
  'Esperando aprobación': 'esperando',
  Bloqueado: 'bloqueado',
  'En pausa': 'pausa',
  'Diagnóstico inicial en curso': 'trabajando',
};

// Solo SEO y SEM tienen vista de detalle completa (spec US-7).
const conDetalle = ['SEO', 'SEM'];

export function TabEquipo({ cliente, datos, lectura }) {
  const [params, setParams] = useSearchParams();
  const agentes = servicios.map((s) => resumenAgente(cliente, s.id, datos));
  const detalle = agentes.find((a) => a.canal === params.get('agente') && a.contratado && conDetalle.includes(a.canal));

  const abrir = (canal) => {
    const p = new URLSearchParams(params);
    if (canal) p.set('agente', canal);
    else p.delete('agente');
    setParams(p);
  };

  if (detalle) return <DetalleAgente agente={detalle} volver={() => abrir(null)} />;

  return (
    <div className="rejilla rejilla-3">
      {agentes.map((a) => (a.contratado ? <TarjetaAgente key={a.canal} agente={a} abrir={abrir} /> : <AgenteNoContratado key={a.canal} agente={a} cliente={cliente} lectura={lectura} />))}
    </div>
  );
}

function CabeceraAgente({ agente }) {
  return (
    <div className="tarjeta-agente__cabecera">
      <span className="icono-agente">
        <Bot size={20} />
      </span>
      <div style={{ minWidth: 0 }}>
        <h3>{agente.nombre}</h3>
        {agente.contratado && <span className={`estado-agente estado-agente--${claseEstado[agente.estado]}`}>{agente.estado}</span>}
      </div>
    </div>
  );
}

function TarjetaAgente({ agente: a, abrir }) {
  return (
    <div className="tarjeta-agente">
      <CabeceraAgente agente={a} />
      <div className="fila fila--envolver" style={{ gap: 6 }}>
        {a.ejecutaEnGhl && <InsigniaGhl>Ejecuta en GHL</InsigniaGhl>}
        {a.workflowsActivos != null && (
          <Chip variante="suave">
            {a.workflowsActivos} {a.workflowsActivos === 1 ? 'workflow activo' : 'workflows activos'} en GHL
          </Chip>
        )}
      </div>
      {a.motivo && (
        <div className={`alerta${a.estado === 'Bloqueado' ? ' alerta--error' : ' alerta--info'}`} style={{ padding: '8px 10px' }}>
          {a.motivo}
        </div>
      )}
      <div className="tarjeta-agente__cifras">
        <div className="cifra">
          <strong>{a.enCurso}</strong>
          <span>tareas en curso</span>
        </div>
        <div className="cifra">
          <strong>{a.pendientes}</strong>
          <span>esperan tu aprobación</span>
        </div>
      </div>
      {a.ultima && (
        <div className="texto-xs" style={{ color: 'var(--azul-800)' }}>
          <strong>Última acción · {formatoFecha(a.ultima.fecha)}:</strong> {a.ultima.texto}
        </div>
      )}
      {conDetalle.includes(a.canal) && (
        <button className="boton boton--secundario" style={{ alignSelf: 'flex-start' }} onClick={() => abrir(a.canal)}>
          Ver tareas <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

function AgenteNoContratado({ agente: a, cliente, lectura }) {
  return (
    <div className="tarjeta-agente tarjeta-agente--inactiva">
      <CabeceraAgente agente={a} />
      <Chip variante="suave">No contratado</Chip>
      <p className="texto-sm" style={{ color: 'var(--azul-800)' }}>
        Este agente puede sumarse al equipo de {cliente.nombre}.
      </p>
      {!lectura && (
        <Link to={`/oportunidades?cliente=${cliente.id}&nueva=1&servicio=${a.canal}`} className="boton boton--secundario" style={{ alignSelf: 'flex-start' }}>
          <Sparkles size={16} /> Ver oportunidad
        </Link>
      )}
    </div>
  );
}

const claseTarea = {
  Completada: 'verde',
  'Esperando aprobación': 'agente',
  Escalado: 'rojo',
};

function DetalleAgente({ agente: a, volver }) {
  return (
    <>
      <button className="boton boton--fantasma" onClick={volver} style={{ marginBottom: 12 }}>
        <ArrowLeft size={16} /> Volver al equipo
      </button>
      <div className="tarjeta" style={{ marginBottom: 16 }}>
        <CabeceraAgente agente={a} />
        {a.motivo && (
          <div className="alerta alerta--error" style={{ marginTop: 12 }}>
            {a.motivo}
          </div>
        )}
      </div>
      <div className="tarjeta" style={{ padding: 0 }}>
        <table className="tabla">
          <thead>
            <tr>
              <th>Tarea</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {a.tareas.map((t, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 700, color: 'var(--azul-900)' }}>{t.titulo}</td>
                <td>{t.tipo}</td>
                <td>{formatoFecha(t.fecha)}</td>
                <td>
                  <Chip variante={claseTarea[t.estado]}>{t.estado}</Chip>
                </td>
                <td>
                  {t.aprobacionId && (
                    <Link to={`/aprobaciones/${t.aprobacionId}`} className="boton boton--fantasma">
                      Revisar
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
