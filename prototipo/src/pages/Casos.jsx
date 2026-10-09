import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerUpLeft, ExternalLink, Hand } from 'lucide-react';
import { useSesion } from '../context/SesionContext.jsx';
import { HOY, diasDesde, useDatos } from '../context/DatosContext.jsx';
import { kpisNegocio, servicioPorId } from '../data/catalogos.js';
import { ejecutivaPorId, especialistaPorId } from '../data/equipo.js';
import { kpiDisponible, saludCliente } from '../lib/salud.js';
import { formatoKpi, plural } from '../lib/formato.js';
import { Alerta, Avatar, Chip, Encabezado, EstadoVacio, InsigniaAgente, Progreso, Semaforo } from '../components/ui.jsx';
import { Pestanas, fechaCorta } from '../components/secundarios.jsx';
import '../styles/vistas-secundarias.css';

/*
 * US-14: cola de casos escalados del especialista (rol Especialista, ruta /casos).
 * El especialista ve los casos de su canal, los toma, responde y los devuelve a la ejecutiva.
 * Al devolverlos, el ítem vuelve a la bandeja de aprobaciones (US-12, último criterio).
 */

/** Un caso está atrasado si lleva más de 3 días sin que nadie lo tome. */
export function casoAtrasado(e) {
  return e.estado === 'Esperando especialista' && !e.especialista && diasDesde(e.creado) > 3;
}

export function ChipEstadoCaso({ caso }) {
  if (caso.estado === 'Resuelto') return <Chip variante="verde">Resuelto</Chip>;
  if (caso.estado === 'En revisión') return <Chip>En revisión</Chip>;
  return <Chip variante="amarillo">Esperando especialista</Chip>;
}

export function Casos() {
  const { persona } = useSesion();
  const { escalados, clientes } = useDatos();
  const [pestana, setPestana] = useState('sin-tomar');
  const [seleccion, setSeleccion] = useState(null);

  const delCanal = escalados.filter((e) => e.canal === persona.canal);
  const grupos = {
    'sin-tomar': delCanal.filter((e) => e.estado === 'Esperando especialista' && !e.especialista),
    mios: delCanal.filter((e) => e.estado === 'En revisión' && e.especialista === persona.id),
    resueltos: delCanal.filter((e) => e.estado === 'Resuelto' && e.especialista === persona.id),
  };
  // Más antiguos primero: son los que más esperan.
  const lista = [...grupos[pestana]].sort((a, b) => a.creado.localeCompare(b.creado));
  const caso = delCanal.find((e) => e.id === seleccion) ?? null;
  const atrasados = grupos['sin-tomar'].filter(casoAtrasado).length;

  return (
    <>
      <Encabezado
        titulo="Casos escalados"
        descripcion={`Canal ${persona.canal === 'Meta' ? 'Meta (pauta social)' : persona.canal} · ${plural(grupos['sin-tomar'].length, 'caso sin tomar', 'casos sin tomar')} · ${plural(grupos.mios.length, 'caso en revisión', 'casos en revisión')}`}
      />

      {atrasados > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Alerta tipo="error">
            {atrasados === 1 ? 'Hay 1 caso' : `Hay ${atrasados} casos`} con más de 3 días sin tomar.
          </Alerta>
        </div>
      )}

      <Pestanas
        valor={pestana}
        onCambiar={(p) => {
          setPestana(p);
          setSeleccion(null);
        }}
        opciones={[
          { id: 'sin-tomar', texto: 'Sin tomar', n: grupos['sin-tomar'].length },
          { id: 'mios', texto: 'Mis casos en revisión', n: grupos.mios.length },
          { id: 'resueltos', texto: 'Resueltos', n: grupos.resueltos.length },
        ]}
      />

      <div className="vs-dividido">
        <div className="tarjeta tabla-envoltorio" style={{ padding: 0 }}>
          {lista.length === 0 ? (
            <EstadoVacio titulo={pestana === 'sin-tomar' ? 'No hay casos esperando en tu canal' : 'No hay casos en esta lista'} />
          ) : (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Ejecutiva</th>
                  <th>Motivo</th>
                  <th>Tipo de tarea</th>
                  <th>{pestana === 'resueltos' ? 'Resuelto' : 'Espera'}</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((e) => {
                  const cliente = clientes.find((c) => c.id === e.cliente);
                  const ejecutiva = ejecutivaPorId[e.ejecutiva];
                  return (
                    <tr
                      key={e.id}
                      className={`vs-caso-fila${seleccion === e.id ? ' seleccionado' : ''}`}
                      onClick={() => setSeleccion(e.id)}
                    >
                      <td>
                        <div className="fila">
                          <Avatar nombre={cliente.nombre} color={cliente.color} tamano={30} />
                          <strong style={{ color: 'var(--azul-900)' }}>{cliente.nombre}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="fila" style={{ gap: 8 }}>
                          <Avatar nombre={ejecutiva.nombre} texto={ejecutiva.iniciales} color={ejecutiva.color} redondo tamano={26} />
                          <span className="texto-sm">{ejecutiva.nombre}</span>
                        </div>
                      </td>
                      <td>
                        <div className="vs-motivo">{e.motivo}</div>
                      </td>
                      <td className="texto-sm">{e.tipoTarea}</td>
                      <td>
                        {pestana === 'resueltos' ? (
                          <span className="texto-sm">{fechaCorta(e.resueltoEl)}</span>
                        ) : (
                          <div className="pila" style={{ gap: 4 }}>
                            <span className="texto-sm" style={{ fontWeight: 700 }}>
                              {plural(diasDesde(e.creado), 'día')}
                            </span>
                            {casoAtrasado(e) && <Chip variante="atrasado">Atrasado</Chip>}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="vs-detalle">
          {caso ? (
            <DetalleCaso key={caso.id} caso={caso} modo="especialista" />
          ) : (
            <div className="tarjeta">
              <EstadoVacio titulo="Selecciona un caso">
                <p className="atenuado texto-sm">Verás la propuesta del agente, el comentario de la ejecutiva y la ficha del cliente.</p>
              </EstadoVacio>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Detalle de un caso escalado. modo 'especialista' permite tomar, responder y devolver;
 * modo 'ejecutiva' es de consulta (US-12: estado, especialista asignado y días transcurridos).
 */
export function DetalleCaso({ caso, modo }) {
  const { persona } = useSesion();
  const navigate = useNavigate();
  const { clientes, aprobaciones, actualizarEscalado, actualizarAprobacion, agregarAprobacion } = useDatos();
  const [respuesta, setRespuesta] = useState('');
  const cliente = clientes.find((c) => c.id === caso.cliente);
  const ejecutiva = ejecutivaPorId[caso.ejecutiva];
  const especialista = caso.especialista ? especialistaPorId[caso.especialista] : null;
  const esMio = modo === 'especialista' && caso.especialista === persona.id;
  const agente = servicioPorId[caso.agente]?.agente ?? 'Agente';

  function tomar() {
    actualizarEscalado(caso.id, { especialista: persona.id, tomadoEl: HOY, estado: 'En revisión' });
  }

  function devolver() {
    const texto = respuesta.trim();
    actualizarEscalado(caso.id, { estado: 'Resuelto', respuesta: texto, resueltoEl: HOY });
    const entrada = { fecha: HOY, autor: persona.id, texto: `Respuesta del especialista: ${texto}` };
    const respuestaEspecialista = { especialista: persona.id, fecha: HOY, texto };
    // El ítem de origen se enlaza por caso.aprobacion o, si no viene, por aprobacion.escalado.
    const original = aprobaciones.find((a) => (caso.aprobacion ? a.id === caso.aprobacion : a.escalado === caso.id));

    if (original) {
      // El ítem escalado vuelve a la bandeja con la respuesta para la aprobación final.
      actualizarAprobacion(original.id, (a) => ({
        estado: 'Esperando aprobación',
        respuestaEspecialista,
        historial: [...(a.historial ?? []), entrada],
      }));
    } else {
      agregarAprobacion({
        id: `apr-${caso.id}`,
        cliente: caso.cliente,
        agente: caso.agente,
        tipo: 'tarea',
        titulo: `Respuesta del especialista: ${caso.tipoTarea}`,
        creado: HOY,
        confianza: 'Alta',
        porQue: `Esta propuesta pasó por revisión de un especialista ${caso.canal}. Lee su respuesta en el historial antes de aprobarla.`,
        ghl: null,
        contenido: {
          canal: caso.agente,
          descripcion: caso.propuesta,
          pasos: [],
          kpi: null,
          fechaObjetivo: null,
          revisionEspecialista: true,
        },
        escalado: caso.id,
        respuestaEspecialista,
        historial: [{ fecha: caso.creado, autor: caso.ejecutiva, texto: `Escalado a especialista: ${caso.motivo}` }, entrada],
      });
    }
  }

  return (
    <>
      <div className="tarjeta pila" style={{ gap: 14 }}>
        <div className="fila" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="texto-xs atenuado" style={{ fontWeight: 700 }}>
              {cliente.nombre} · {caso.canal === 'Meta' ? 'Meta' : caso.canal}
            </div>
            <h3 style={{ marginTop: 4 }}>{caso.tipoTarea}</h3>
          </div>
          <ChipEstadoCaso caso={caso} />
        </div>

        <dl className="vs-ficha">
          <div>
            <dt>Especialista</dt>
            <dd>{especialista ? especialista.nombre : 'Sin asignar'}</dd>
          </div>
          <div>
            <dt>{caso.estado === 'Resuelto' ? 'Resuelto' : 'Días transcurridos'}</dt>
            <dd>
              {caso.estado === 'Resuelto' ? fechaCorta(caso.resueltoEl) : plural(diasDesde(caso.creado), 'día')}
              {casoAtrasado(caso) && (
                <span style={{ marginLeft: 8 }}>
                  <Chip variante="atrasado">Atrasado</Chip>
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt>Escalado por</dt>
            <dd>
              {ejecutiva.nombre}
              {caso.origen === 'Automático' && <span className="atenuado"> · automático (revisión obligatoria)</span>}
            </dd>
          </div>
          <div>
            <dt>Escalado el</dt>
            <dd>{fechaCorta(caso.creado)}</dd>
          </div>
        </dl>

        <div>
          <span className="vs-etiqueta">Motivo</span>
          <p className="texto-sm">{caso.motivo}</p>
        </div>

        <div className="propuesta-agente pila" style={{ gap: 8 }}>
          <InsigniaAgente agente={agente} />
          <p className="texto-sm">{caso.propuesta}</p>
        </div>

        {caso.comentario && (
          <div className="vs-comentario">
            <span className="vs-etiqueta">Comentario de {ejecutiva.nombre.split(' ')[0]}</span>
            {caso.comentario}
          </div>
        )}

        {caso.respuesta && (
          <div className="vs-respuesta">
            <span className="vs-etiqueta">Respuesta de {especialista?.nombre ?? 'el especialista'}</span>
            {caso.respuesta}
          </div>
        )}

        {modo === 'ejecutiva' && caso.estado === 'Resuelto' && !caso.aprobadoPorEjecutivaEl && (
          <Alerta tipo="info">
            El especialista devolvió el caso. Está en tu bandeja para la aprobación final.{' '}
            <button className="boton boton--fantasma" style={{ padding: 0 }} onClick={() => navigate('/aprobaciones')}>
              Ir a Aprobaciones
            </button>
          </Alerta>
        )}

        {modo === 'especialista' && caso.estado === 'Esperando especialista' && !caso.especialista && (
          <button className="boton boton--primario" onClick={tomar}>
            <Hand size={16} /> Tomar caso
          </button>
        )}

        {esMio && caso.estado === 'En revisión' && (
          <div className="pila" style={{ gap: 10 }}>
            <label className="vs-campo">
              <span className="vs-campo__etiqueta">Tu resolución o corrección</span>
              <textarea
                className="vs-control"
                rows={4}
                placeholder="Explica qué se debe hacer y por qué, en lenguaje que la ejecutiva pueda llevar al cliente."
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
              />
            </label>
            <button className="boton boton--cta" disabled={!respuesta.trim()} onClick={devolver}>
              <CornerUpLeft size={16} /> Devolver a ejecutiva
            </button>
          </div>
        )}
      </div>

      {modo === 'especialista' && <FichaLectura cliente={cliente} />}
    </>
  );
}

/** Acceso de solo lectura a la ficha del cliente (US-14). */
function FichaLectura({ cliente }) {
  const navigate = useNavigate();
  const salud = saludCliente(cliente);

  return (
    <div className="tarjeta pila" style={{ gap: 14 }}>
      <div className="fila" style={{ justifyContent: 'space-between' }}>
        <div className="fila">
          <Avatar nombre={cliente.nombre} color={cliente.color} />
          <div>
            <h4>{cliente.nombre}</h4>
            <div className="texto-xs atenuado">
              {cliente.rubro} · {cliente.ciudad}
            </div>
          </div>
        </div>
        <Chip variante="suave">Solo lectura</Chip>
      </div>

      <dl className="vs-ficha">
        <div>
          <dt>Modelo</dt>
          <dd>
            B2B {cliente.modelo.b2b} % · B2C {cliente.modelo.b2c} %
          </dd>
        </div>
        <div>
          <dt>Salud</dt>
          <dd>{salud ? <Semaforo salud={salud} /> : `Onboarding ${cliente.onboarding.pct} %`}</dd>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <dt>Servicios contratados</dt>
          <dd className="fila fila--envolver" style={{ gap: 6, marginTop: 4 }}>
            {cliente.servicios.map((s) => (
              <Chip key={s} variante="suave">
                {servicioPorId[s].nombre}
              </Chip>
            ))}
          </dd>
        </div>
      </dl>

      {cliente.ghl !== 'conectado' && (
        <Alerta tipo={cliente.ghl === 'desconectado' ? 'error' : 'aviso'}>
          Subcuenta GHL {cliente.ghl === 'desconectado' ? 'desconectada' : 'pendiente'}: los KPIs de leads no están disponibles.
        </Alerta>
      )}

      {cliente.kpis && (
        <div>
          <span className="vs-etiqueta">KPIs de negocio (actual / meta)</span>
          <table className="vs-kpis">
            <tbody>
              {kpisNegocio.map((def) => {
                const k = cliente.kpis[def.id];
                if (!k) return null;
                const disponible = kpiDisponible(def, cliente);
                return (
                  <tr key={def.id}>
                    <td>{def.nombre}</td>
                    <td>{disponible ? formatoKpi(k.serie[k.serie.length - 1], def.unidad) : <span className="atenuado">Sin datos</span>}</td>
                    <td className="atenuado" style={{ fontWeight: 600 }}>
                      {formatoKpi(k.meta, def.unidad)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {cliente.onboarding && <Progreso valor={cliente.onboarding.pct} />}

      <button className="boton boton--secundario" onClick={() => navigate(`/clientes/${cliente.id}?lectura=1`)}>
        <ExternalLink size={16} /> Abrir ficha completa (brief, estrategia, KPIs)
      </button>
    </div>
  );
}
