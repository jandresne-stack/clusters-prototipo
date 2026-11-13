import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarRange, ChevronRight, MessageSquare, Sparkles } from 'lucide-react';
import { servicios } from '../../data/catalogos.js';
import { resumenAgente } from '../../lib/agentes.js';
import { formatoFecha } from '../../lib/formato.js';
import { Chip, InsigniaGhl } from '../../components/ui.jsx';
import { FormaAgente } from '../../components/FormaAgente.jsx';
import { useEquipo } from '../../lib/equipo.js';

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

  if (detalle) return <DetalleAgente agente={detalle} volver={() => abrir(null)} cliente={cliente} />;

  return (
    <>
      <TarjetaCMO cliente={cliente} lectura={lectura} />
      <div className="rejilla rejilla-3">
      {agentes.map((a) => (a.contratado ? <TarjetaAgente key={a.canal} agente={a} abrir={abrir} cliente={cliente} /> : <AgenteNoContratado key={a.canal} agente={a} cliente={cliente} lectura={lectura} />))}
      </div>
    </>
  );
}

/** El CMO del cliente coordina al equipo: diagnóstico, plan mensual y encargos a cada agente. */
function TarjetaCMO({ cliente, lectura }) {
  return (
    <div className="tarjeta tarjeta-cmo">
      <FormaAgente semilla="amd--cmo" canal="CMO" tamano={52} titulo="CMO del cliente" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3>CMO del cliente</h3>
        <p className="texto-sm" style={{ color: 'var(--azul-800)', marginTop: 2 }}>
          Coordina al equipo de {cliente.nombre}: lee los documentos base, los KPIs y la planeación, arma el plan mensual y le encarga trabajo a cada agente cuando
          lo confirmas.
        </p>
      </div>
      <div className="fila fila--envolver" style={{ gap: 8 }}>
        <Link to={`/clientes/${cliente.id}/agentes/CMO`} className="boton boton--primario">
          <MessageSquare size={16} /> Hablar con el CMO
        </Link>
        {!lectura && !cliente.onboarding && (
          <Link to={`/clientes/${cliente.id}/agentes/CMO?pedir=plan`} className="boton boton--secundario">
            <CalendarRange size={16} /> Pedir plan del mes
          </Link>
        )}
      </div>
    </div>
  );
}

// Así se mueve la forma según lo que está haciendo el agente
const estadoForma = { Trabajando: 'pensando', 'Diagnóstico inicial en curso': 'pensando' };

function CabeceraAgente({ agente }) {
  const equipo = useEquipo();
  return (
    <div className="tarjeta-agente__cabecera">
      <FormaAgente
        semilla={equipo?.[agente.canal]?.principal.id ?? agente.canal}
        canal={agente.canal}
        tamano={40}
        estado={agente.contratado ? estadoForma[agente.estado] ?? 'reposo' : 'reposo'}
        titulo={agente.nombre}
      />
      <div style={{ minWidth: 0 }}>
        <h3>{agente.nombre}</h3>
        {agente.contratado && <span className={`estado-agente estado-agente--${claseEstado[agente.estado]}`}>{agente.estado}</span>}
      </div>
    </div>
  );
}

function TarjetaAgente({ agente: a, abrir, cliente }) {
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
      <div className="fila fila--envolver" style={{ gap: 8 }}>
        <Link to={`/clientes/${cliente.id}/agentes/${a.canal}`} className="boton boton--primario">
          <MessageSquare size={16} /> Abrir chat
        </Link>
        {conDetalle.includes(a.canal) && (
          <button className="boton boton--secundario" onClick={() => abrir(a.canal)}>
            Ver tareas <ChevronRight size={16} />
          </button>
        )}
      </div>
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

function DetalleAgente({ agente: a, volver, cliente }) {
  return (
    <>
      <button className="boton boton--fantasma" onClick={volver} style={{ marginBottom: 12 }}>
        <ArrowLeft size={16} /> Volver al equipo
      </button>
      <div className="tarjeta" style={{ marginBottom: 16 }}>
        <div className="fila" style={{ justifyContent: 'space-between' }}>
          <CabeceraAgente agente={a} />
          <Link to={`/clientes/${cliente.id}/agentes/${a.canal}`} className="boton boton--primario">
            <MessageSquare size={16} /> Abrir chat
          </Link>
        </div>
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
