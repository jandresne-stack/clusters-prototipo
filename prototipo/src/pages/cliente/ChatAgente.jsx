import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Loader, Trash2 } from 'lucide-react';
import { useDatos } from '../../context/DatosContext.jsx';
import { useSesion } from '../../context/SesionContext.jsx';
import { abrirSesion, equipoReal, limpiarChat, urlEntregable } from '../../lib/motor.js';
import { Conversacion } from '../../components/Conversacion.jsx';
import { FormaAgente } from '../../components/FormaAgente.jsx';
import { estadoParaCMO, fichaParaAgente } from '../../lib/fichaAgente.js';
import { Alerta, Avatar, Chip, EstadoVacio } from '../../components/ui.jsx';
import { Markdown } from '../../components/Markdown.jsx';
import { ChipEstado } from '../aprobaciones/comun.jsx';
import '../../styles/cliente.css';
import '../../styles/agentes-reales.css';

// Primeros pedidos sugeridos por canal (la ejecutiva puede escribir lo que quiera).
const sugerencias = {
  CMO: ['Dame un diagnóstico del cliente y las 3 prioridades de este mes.', 'Propón el plan mensual para todo el equipo.', '¿Qué le falta a la planeación para pasar a ejecución?'],
  SEO: ['Haz el diagnóstico SEO inicial del sitio y dime por dónde empezar.', 'Elabora el KW Research y envíalo a aprobación.', 'Elabora el Checklist SEO y envíalo a aprobación.'],
  SEM: ['Revisa el sitio como destino de pauta y elabora el Checklist Web para Ads.', 'Propón la estructura de campañas de Google Ads para este cliente.', 'Elabora el Budget Google Ads y envíalo a aprobación.'],
  Pauta: ['Propón la estrategia de Meta Ads para este cliente.', 'Elabora el Budget Meta Ads y envíalo a aprobación.', '¿Qué necesitas revisar del Pixel y la CAPI?'],
  Redes: ['Elabora el Checklist de Redes y envíalo a aprobación.', 'Propón los pilares de contenido del cliente.', 'Arma la parrilla de contenidos del mes.'],
  Email: ['Propón una secuencia de bienvenida para leads nuevos.', '¿Qué automatizaciones de email le recomiendas a este cliente?'],
  Estrategia: ['Elabora el Benchmarking de competidores y envíalo a aprobación.', 'Elabora el Buyer Persona y envíalo a aprobación.', 'Elabora la Estrategia y envíala a aprobación.'],
};

export function ChatAgente() {
  const { id, canal } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const datos = useDatos();
  const { rol } = useSesion();
  const cliente = datos.clientes.find((c) => c.id === id);
  const lectura = rol !== 'ejecutiva';

  const [equipo, setEquipo] = useState(null);
  const [sesion, setSesion] = useState(null);
  const [error, setError] = useState('');
  // Viene desde Planeación con "Generar con agente": el pedido se envía una sola vez
  const [pedido, setPedido] = useState(() => params.get('pedir'));

  const miembro = equipo?.[canal];
  const agentId = params.get('agente') ?? miembro?.principal.id;

  // El CMO recibe además la foto del cliente en Clusters (planeación, bandeja, plan, oportunidades)
  const datosRef = useRef(datos);
  datosRef.current = datos;

  const cargar = useCallback(async () => {
    if (!cliente || !agentId) return;
    const ficha = fichaParaAgente(cliente);
    if (canal === 'CMO') ficha.brief += `\n${estadoParaCMO(cliente, datosRef.current)}`;
    try {
      setSesion(await abrirSesion({ clienteId: cliente.id, canal, agentId, ficha }));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [cliente, canal, agentId]);

  useEffect(() => {
    equipoReal()
      .then(setEquipo)
      .catch(() => setError('No hay conexión con el motor de agentes. Arranca el panel: npm --prefix panel run dev (en agency-agents).'));
  }, []);

  useEffect(() => {
    setSesion(null);
    cargar();
  }, [cargar]);

  // Si el agente sigue con un pedido anterior (o con un encargo del CMO), se refresca solo
  useEffect(() => {
    if (!sesion?.trabajando) return;
    const t = setInterval(() => {
      cargar();
      datos.recargarAprobacionesReales();
    }, 4000);
    return () => clearInterval(t);
  }, [sesion?.trabajando, cargar, datos]);

  useEffect(() => {
    if (!params.get('pedir')) return;
    const p = new URLSearchParams(params);
    p.delete('pedir');
    setParams(p, { replace: true });
  }, [params, setParams]);

  if (!cliente) {
    return (
      <div className="tarjeta">
        <EstadoVacio titulo="Cliente no encontrado">
          <Link to="/cartera" className="boton boton--secundario">
            <ArrowLeft size={16} /> Volver a la Cartera
          </Link>
        </EstadoVacio>
      </div>
    );
  }

  const agente = sesion?.agent;
  const propuestas = datos.aprobaciones.filter((a) => a.origen === 'agente-real' && a.proyectoId === sesion?.project.id);
  const elegir = (idAgente) => {
    setPedido(null); // el pedido de Planeación era para el agente principal
    const p = new URLSearchParams(params);
    p.set('agente', idAgente);
    setParams(p);
  };

  return (
    <>
      <Link to={`/clientes/${cliente.id}?tab=equipo`} className="texto-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
        <ArrowLeft size={14} /> {cliente.nombre} · Equipo de agentes
      </Link>

      <header className="chat-agente__cabecera">
        <div className="fila" style={{ gap: 14 }}>
          <FormaAgente semilla={agentId ?? canal} canal={canal} tamano={52} estado={sesion?.trabajando ? 'trabajando' : 'reposo'} titulo={agente?.name} />
          <div style={{ minWidth: 0 }}>
            <h1>{miembro?.nombre ?? `Agente ${canal}`}</h1>
            <div className="texto-sm atenuado">
              {cliente.nombre} · Agente real: <strong style={{ color: 'var(--azul-900)' }}>{agente?.name ?? '…'}</strong>
              {sesion && ` · ${sesion.project.modelo}`}
            </div>
          </div>
        </div>
        <div className="fila">
          <Avatar nombre={cliente.nombre} color={cliente.color} />
        </div>
      </header>

      {miembro && (
        <div className="chat-agente__equipo">
          <span className="texto-xs atenuado">Especialistas de este canal (cada uno con su propio chat para {cliente.nombre}):</span>
          <div className="fila fila--envolver" style={{ gap: 6 }}>
            {[miembro.principal, ...miembro.especialistas].map((a, i) => (
              <button key={a.id} className={`pastilla-agente${a.id === agentId ? ' activa' : ''}`} onClick={() => elegir(a.id)} title={a.description}>
                <FormaAgente semilla={a.id} canal={canal} tamano={20} /> {a.name}
                {i === 0 && <span className="pastilla-agente__principal">principal</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 12 }}>
          <Alerta tipo="error">{error}</Alerta>
        </div>
      )}
      {sesion && !sesion.configurado && (
        <div style={{ marginBottom: 12 }}>
          <Alerta tipo="aviso">Falta la clave de OpenRouter en agency-agents/panel/.env.local: el agente no podrá responder.</Alerta>
        </div>
      )}

      <div className="chat-agente">
        <Conversacion
          key={sesion?.project.id ?? 'cargando'}
          proyectoId={sesion?.project.id}
          nombreAgente={agente?.name}
          semilla={agentId}
          canal={canal}
          mensajes={sesion?.messages}
          lectura={lectura}
          trabajandoFondo={Boolean(sesion?.trabajando)}
          sugerencias={sugerencias[canal] ?? []}
          pedidoInicial={
            pedido === 'planeacion'
              ? 'Revisa el estado de la planeación de este cliente en Clusters y dime qué falta para pasar a ejecución, en orden y con quién lo hace. Si conviene, propón encargos a los agentes (sin delegarlos hasta que yo confirme).'
              : pedido === 'plan'
              ? 'Propón el plan mensual del próximo mes para todo el equipo de este cliente y envíalo con proponer_plan_mensual. Antes, revisa los documentos base, los KPIs y el estado actual en Clusters; si la planeación no está lista, dímelo y propón cómo cerrarla.'
              : pedido &&
                `Elabora el artefacto "${pedido}" de la ruta de planeación de AMD para este cliente y envíalo a la bandeja con proponer_aprobacion. Revisa antes lo que necesites (sitio, competidores) y, si te falta información crítica, dímelo en vez de inventar.`
          }
          vacio={{
            titulo: `${agente?.name ?? 'El agente'} ya conoce a ${cliente.nombre}`,
            texto:
              canal === 'CMO'
                ? 'Lee la ficha, los documentos base, los KPIs y el estado de la planeación. Arma el plan mensual del equipo y, si lo confirmas, le encarga trabajo a cada agente.'
                : 'Recibe la ficha del cliente (kick-off, briefs, accesos, KPIs) y trabaja solo en este cliente. Lo que deba aprobarse llegará a tu bandeja.',
          }}
          alEvento={(e) => e.type === 'tool_end' && e.aprobacion && datos.recargarAprobacionesReales()}
          alTerminar={async () => {
            await cargar();
            datos.recargarAprobacionesReales();
          }}
        />

        <aside className="pila" style={{ gap: 16 }}>
          <section className="tarjeta">
            <h3 style={{ marginBottom: 10 }}>Propuestas a tu bandeja</h3>
            {propuestas.length ? (
              <ul className="lista-propuestas">
                {propuestas.map((a) => (
                  <li key={a.id}>
                    <Link to={`/aprobaciones/${a.id}`}>{a.titulo}</Link>
                    <ChipEstado estado={a.estado} />
                    {datos.motor.trabajando.includes(a.id) && (
                      <span className="texto-xs atenuado">
                        <Loader size={11} className="girando" /> rehaciendo con tus cambios…
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="texto-sm atenuado">Cuando el agente termine un artefacto o una tarea, aparecerá aquí y en Aprobaciones.</p>
            )}
          </section>

          {sesion?.deliverables.length > 0 && (
            <section className="tarjeta">
              <h3 style={{ marginBottom: 10 }}>Archivos del agente</h3>
              <ul className="lista-propuestas">
                {sesion.deliverables.map((d) => (
                  <li key={d.name}>
                    <a href={urlEntregable(sesion.project.id, d.name)} target="_blank" rel="noreferrer">
                      <FileText size={13} style={{ verticalAlign: -2 }} /> {d.name}
                    </a>
                    <a href={urlEntregable(sesion.project.id, d.name, true)} title="Descargar">
                      <Download size={14} />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="tarjeta">
            <details>
              <summary className="texto-sm" style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--azul-900)' }}>
                Qué sabe el agente de este cliente
              </summary>
              <div className="texto-xs" style={{ marginTop: 10, maxHeight: 320, overflow: 'auto' }}>
                <Markdown>{fichaParaAgente(cliente).brief}</Markdown>
              </div>
              <p className="texto-xs atenuado" style={{ marginTop: 8 }}>
                Se actualiza solo desde la ficha de Clusters cada vez que abres este chat.
              </p>
              <p className="texto-xs" style={{ marginTop: 6 }}>
                Además lee los <Link to={`/clientes/${cliente.id}?tab=base`}>documentos base del cliente</Link> (negocio, competencia, audiencia, voz de marca y estrategia).
              </p>
            </details>
          </section>

          {sesion && !lectura && sesion.messages.length > 0 && (
            <button
              className="boton boton--fantasma"
              style={{ alignSelf: 'flex-start', color: 'var(--salud-rojo)' }}
              onClick={async () => {
                if (!confirm('¿Borrar la conversación con este agente? Las propuestas enviadas a la bandeja se conservan.')) return;
                await limpiarChat(sesion.project.id);
                cargar();
              }}
            >
              <Trash2 size={14} /> Borrar conversación
            </button>
          )}
          <button className="boton boton--fantasma" style={{ alignSelf: 'flex-start' }} onClick={() => navigate('/aprobaciones')}>
            Ir a Aprobaciones
          </button>
        </aside>
      </div>
    </>
  );
}
