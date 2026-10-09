import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ExternalLink, LifeBuoy, MessageSquareMore, ShieldAlert, UserCheck } from 'lucide-react';
import { useSesion } from '../../context/SesionContext.jsx';
import { HOY, esPendiente, useDatos } from '../../context/DatosContext.jsx';
import { clientes as clientesEstaticos } from '../../data/clientes.js';
import { kpiNegocioPorId, servicioPorId } from '../../data/catalogos.js';
import { Alerta, Avatar, Chip, Encabezado, EstadoVacio, InsigniaAgente, InsigniaGhl } from '../../components/ui.jsx';
import { plural } from '../../lib/formato.js';
import {
  ChipConfianza,
  ChipEstado,
  canalEspecialistaPorAgente,
  canalesEspecialista,
  diasEsperando,
  esAtrasada,
  formatoCelda,
  formatoFecha,
  nombreAgente,
  nombreAutor,
  nombreTipo,
  nombreTipoGhl,
} from './comun.jsx';
import { automatizacionDesde, cambiosAlAprobar } from './Bandeja.jsx';
import '../../styles/aprobaciones.css';

export function Detalle() {
  const { id } = useParams();
  const { persona } = useSesion();
  const datos = useDatos();
  const { aprobaciones, actualizarAprobacion, agregarAutomatizacion, agregarEscalado, escalados } = datos;
  const listaClientes = datos.clientes ?? clientesEstaticos;
  const navigate = useNavigate();
  const [panel, setPanel] = useState(null); // null | 'cambios' | 'escalar'

  const item = aprobaciones.find((a) => a.id === id);
  const cliente = item && listaClientes.find((c) => c.id === item.cliente);

  if (!item || !cliente) {
    return (
      <div className="tarjeta">
        <EstadoVacio titulo="Ítem no encontrado">
          <Link to="/aprobaciones" className="boton boton--secundario">
            <ArrowLeft size={16} /> Volver a la bandeja
          </Link>
        </EstadoVacio>
      </div>
    );
  }

  const pendiente = esPendiente(item);
  const esPlan = item.tipo === 'plan-mensual';
  // US-10: un ítem aprobado por la ejecutiva que requiere visto bueno del cliente puede marcarse como tal.
  const aprobadoPorEjecutiva = item.estado === 'Aprobado' || item.estado === 'Activo en GHL';
  const esperaVistoBueno = aprobadoPorEjecutiva && item.requiereVistoBuenoCliente && !item.aprobadoPorCliente;
  const ghlDesconectado = Boolean(item.ghl) && cliente.ghl !== 'conectado';
  const escalado = item.escalado && escalados.find((e) => e.id === item.escalado);

  function aprobar() {
    actualizarAprobacion(item.id, (actual) => cambiosAlAprobar(actual, persona.id));
    if (item.ghl) agregarAutomatizacion(automatizacionDesde(item));
    setPanel(null);
  }

  function marcarAprobadoPorCliente(canal, fecha) {
    actualizarAprobacion(item.id, (actual) => ({
      aprobadoPorCliente: { canal, fecha, registradoPor: persona.id },
      historial: [...actual.historial, { fecha: HOY, autor: persona.id, texto: `Aprobado por el cliente por ${canal} el ${formatoFecha(fecha)}.` }],
    }));
    setPanel(null);
  }

  function pedirCambios(comentario) {
    actualizarAprobacion(item.id, (actual) => ({
      estado: 'En curso por agente',
      historial: [...actual.historial, { fecha: HOY, autor: persona.id, texto: `Pedir cambios: ${comentario}` }],
    }));
    setPanel(null);
  }

  function escalar(canal, motivo) {
    const idEscalado = `esc-${item.id}`;
    agregarEscalado({
      id: idEscalado,
      aprobacion: item.id,
      cliente: item.cliente,
      ejecutiva: persona.id,
      canal,
      agente: item.agente,
      origen: 'Ejecutiva',
      tipoTarea: item.contenido.artefacto ?? nombreTipo[item.tipo],
      motivo,
      propuesta: item.titulo,
      comentario: motivo,
      creado: HOY,
      especialista: null,
      tomadoEl: null,
      estado: 'Esperando especialista',
      respuesta: null,
    });
    actualizarAprobacion(item.id, (actual) => ({
      estado: 'Escalado',
      escalado: idEscalado,
      historial: [...actual.historial, { fecha: HOY, autor: persona.id, texto: `Escalado a ${canalesEspecialista.find((c) => c.id === canal).nombre}: ${motivo}` }],
    }));
    setPanel(null);
  }

  return (
    <>
      <Link to="/aprobaciones" className="texto-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
        <ArrowLeft size={14} /> Aprobaciones
      </Link>

      <Encabezado titulo={item.titulo} descripcion={`${nombreTipo[item.tipo]} · ${cliente.nombre}`}>
        <InsigniaAgente agente={nombreAgente(item.agente)} />
        {item.ghl && <InsigniaGhl>{item.estado === 'Activo en GHL' ? 'Activo en GHL' : 'Se ejecutará en GHL'}</InsigniaGhl>}
        <ChipEstado estado={item.estado} />
      </Encabezado>

      <div className="detalle">
        <div className="pila" style={{ gap: 16 }}>
          {!pendiente && (
            <Alerta tipo={item.estado === 'Escalado' ? 'aviso' : 'info'}>
              {item.estado === 'Aprobado' && 'Aprobado. El agente ya puede ejecutarlo.'}
              {item.estado === 'Activo en GHL' && 'Aprobado y activo en la subcuenta GHL del cliente (simulado).'}
              {item.estado === 'En curso por agente' && 'Pediste cambios. El agente está ajustando la propuesta y volverá a enviarla a la bandeja.'}
              {item.estado === 'Escalado' && (
                <>
                  Esperando especialista · {escalado?.especialista ? escalado.especialista : 'Sin asignar'} ·{' '}
                  {plural(escalado ? diasEsperando(escalado) : 0, 'día transcurrido', 'días transcurridos')}
                </>
              )}
            </Alerta>
          )}

          {ghlDesconectado && pendiente && (
            <Alerta tipo="error">Conecta la subcuenta GHL para activar. Mientras tanto esta propuesta no se puede aprobar.</Alerta>
          )}

          {/* Spec US-4: "Por qué lo propongo", máximo 5 frases en lenguaje simple */}
          <section className="propuesta-agente">
            <div className="fila" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
              <InsigniaAgente agente={nombreAgente(item.agente)} />
              <ChipConfianza confianza={item.confianza} />
            </div>
            <h4 style={{ marginBottom: 6 }}>Por qué lo propongo</h4>
            <p className="por-que">{item.porQue}</p>
            {item.confianza === 'Baja' && (
              <div style={{ marginTop: 12 }}>
                <Alerta tipo="aviso">
                  <ShieldAlert size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
                  El agente recomienda revisión de un especialista.
                </Alerta>
              </div>
            )}
          </section>

          <Contenido item={item} />

          {item.ghl && <VistaPreviaGhl ghl={item.ghl} />}

          <section className="tarjeta">
            <h3 style={{ marginBottom: 12 }}>Historial</h3>
            <ul className="historial">
              {[...item.historial].reverse().map((h, i) => (
                <li key={i} className={h.autor === 'agente' ? 'agente' : ''}>
                  <div>
                    <div>{h.texto}</div>
                    <div className="historial__meta">
                      {nombreAutor(h.autor, item.agente)} · {formatoFecha(h.fecha)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="detalle__lateral">
          <section className="tarjeta">
            <Link to={`/clientes/${cliente.id}`} className="fila" style={{ marginBottom: 14 }}>
              <Avatar nombre={cliente.nombre} color={cliente.color} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--azul-900)' }}>{cliente.nombre}</div>
                <div className="texto-xs atenuado">
                  {cliente.rubro} · {cliente.ciudad}
                </div>
              </div>
            </Link>
            <dl className="ficha">
              <dt>Tipo</dt>
              <dd>{nombreTipo[item.tipo]}</dd>
              <dt>Agente</dt>
              <dd>{nombreAgente(item.agente)}</dd>
              <dt>Enviado</dt>
              <dd>
                {formatoFecha(item.creado)}
                {pendiente && (
                  <span className={`texto-xs ${esAtrasada(item) ? 'antiguedad--atrasada' : 'atenuado'}`} style={{ marginLeft: 6 }}>
                    {esAtrasada(item) ? `· Atrasado (${plural(diasEsperando(item), 'día')})` : `· hace ${plural(diasEsperando(item), 'día')}`}
                  </span>
                )}
              </dd>
              {item.contenido.kpi && (
                <>
                  <dt>Aporta a</dt>
                  <dd>{kpiNegocioPorId[item.contenido.kpi]?.nombre ?? item.contenido.kpi}</dd>
                </>
              )}
              {item.contenido.fechaObjetivo && (
                <>
                  <dt>Fecha objetivo</dt>
                  <dd>{formatoFecha(item.contenido.fechaObjetivo)}</dd>
                </>
              )}
              {item.ghl && (
                <>
                  <dt>Subcuenta GHL</dt>
                  <dd className={cliente.ghl === 'conectado' ? '' : 'antiguedad--atrasada'}>{cliente.ghl === 'conectado' ? 'Conectada' : 'Desconectada'}</dd>
                </>
              )}
            </dl>
            {item.requiereVistoBuenoCliente && (
              <div className="chip-envolver" style={{ marginTop: 12 }}>
                {item.aprobadoPorCliente ? (
                  <Chip variante="verde" icono={UserCheck}>
                    Aprobado por el cliente · {item.aprobadoPorCliente.canal} · {formatoFecha(item.aprobadoPorCliente.fecha)}
                  </Chip>
                ) : (
                  <Chip variante="suave">Requiere visto bueno del cliente</Chip>
                )}
              </div>
            )}
          </section>

          {esperaVistoBueno && (
            <section className="tarjeta">
              <h4 style={{ marginBottom: 6 }}>Visto bueno del cliente</h4>
              <p className="texto-sm atenuado" style={{ marginBottom: 12 }}>
                Ya lo aprobaste tú. Registra aquí cuando el cliente dé su visto bueno (por WhatsApp, reunión o correo).
              </p>
              {panel === 'cliente' ? (
                <FormularioVistoBueno onCancelar={() => setPanel(null)} onEnviar={marcarAprobadoPorCliente} />
              ) : (
                <button className="boton boton--primario" style={{ width: '100%' }} onClick={() => setPanel('cliente')}>
                  <UserCheck size={16} /> Marcar como aprobado por el cliente
                </button>
              )}
            </section>
          )}

          {pendiente && (
            <section className="tarjeta">
              <h4 style={{ marginBottom: 12 }}>Tu decisión</h4>
              {esPlan ? (
                <div className="acciones">
                  <p className="texto-sm atenuado" style={{ marginBottom: 4 }}>
                    El plan mensual se revisa en la ficha del cliente: ahí puedes quitar o posponer tareas antes de aprobarlo.
                  </p>
                  <button className="boton boton--primario" onClick={() => navigate(`/clientes/${cliente.id}?tab=plan`)}>
                    <ExternalLink size={14} /> Revisar plan en la ficha
                  </button>
                </div>
              ) : (
                <div className="acciones">
                  <button
                    className="boton boton--primario"
                    disabled={ghlDesconectado}
                    title={ghlDesconectado ? 'Conecta la subcuenta GHL para activar' : undefined}
                    onClick={aprobar}
                  >
                    <Check size={16} /> Aprobar
                  </button>
                  <button className={`boton ${panel === 'cambios' ? 'boton--primario' : 'boton--secundario'}`} onClick={() => setPanel(panel === 'cambios' ? null : 'cambios')}>
                    <MessageSquareMore size={16} /> Pedir cambios
                  </button>
                  <button className={`boton ${panel === 'escalar' ? 'boton--primario' : 'boton--peligro'}`} onClick={() => setPanel(panel === 'escalar' ? null : 'escalar')}>
                    <LifeBuoy size={16} /> Escalar a especialista
                  </button>
                </div>
              )}

              {panel === 'cambios' && <FormularioCambios onCancelar={() => setPanel(null)} onEnviar={pedirCambios} />}
              {panel === 'escalar' && (
                <FormularioEscalar canalInicial={canalEspecialistaPorAgente[item.agente] ?? 'SEO'} onCancelar={() => setPanel(null)} onEnviar={escalar} />
              )}
            </section>
          )}
        </aside>
      </div>
    </>
  );
}

// ---------- Contenido por tipo (estructura de la metodología AMD) ----------

function Contenido({ item }) {
  const c = item.contenido;

  if (item.tipo === 'artefacto') {
    return (
      <section className="tarjeta" style={{ padding: 0 }}>
        <div style={{ padding: '18px 20px 12px' }}>
          <div className="fila" style={{ justifyContent: 'space-between' }}>
            <h3>{c.artefacto}</h3>
            <Chip variante="suave">Canal: {c.canal}</Chip>
          </div>
          {c.resumen && <p className="texto-sm atenuado" style={{ marginTop: 6 }}>{c.resumen}</p>}
        </div>
        <div className="tabla-envoltorio">
          <table className="tabla tabla--artefacto">
            <thead>
              <tr>
                {c.columnas.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.filas.map((fila, i) => (
                <tr key={i}>
                  {fila.map((celda, j) => (
                    <td key={j} style={{ whiteSpace: typeof celda === 'number' ? 'nowrap' : undefined }}>
                      {formatoCelda(celda, c.columnas[j])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  if (item.tipo === 'plan-mensual') {
    return (
      <section className="tarjeta">
        <div className="fila" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <h3>Plan mensual · {c.mes}</h3>
          <span className="texto-sm atenuado">{plural(c.tareas.length, 'tarea')}</span>
        </div>
        <ul className="lista-tareas">
          {c.tareas.map((t) => (
            <li key={t.id}>
              <Chip variante="suave">{servicioPorId[t.canal]?.nombre ?? t.canal}</Chip>
              <div>
                <div className="lista-tareas__titulo">{t.titulo}</div>
                <div className="texto-xs atenuado">
                  Fecha objetivo: {formatoFecha(t.fechaObjetivo)} · Aporta a: {kpiNegocioPorId[t.kpi]?.nombre ?? t.kpi}
                </div>
              </div>
              {t.revisionEspecialista ? <Chip variante="rojo">Revisión obligatoria de especialista</Chip> : <span />}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (item.tipo === 'propuesta-servicio') {
    return (
      <section className="tarjeta">
        <div className="fila" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <h3>Servicio sugerido: {servicioPorId[c.servicio]?.nombre ?? c.servicio}</h3>
          <Link to={`/oportunidades`} className="texto-sm">
            Ver en Oportunidades
          </Link>
        </div>
        <p className="texto-sm" style={{ color: 'var(--azul-800)' }}>{c.detalle}</p>
      </section>
    );
  }

  // tarea
  return (
    <section className="tarjeta">
      <div className="fila" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <h3>Qué va a hacer el agente</h3>
        <div className="fila" style={{ gap: 6 }}>
          <Chip variante="suave">Canal: {servicioPorId[c.canal]?.nombre ?? c.canal}</Chip>
          {c.revisionEspecialista && <Chip variante="rojo">Revisión obligatoria de especialista</Chip>}
        </div>
      </div>
      <p className="texto-sm" style={{ color: 'var(--azul-800)' }}>{c.descripcion}</p>
      {c.url && (
        <p className="texto-sm" style={{ marginTop: 6 }}>
          URL: <span className="variable-ghl">{c.url}</span>
        </p>
      )}
      {c.pasos?.length > 0 && (
        <ol className="pasos">
          {c.pasos.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
      )}
    </section>
  );
}

// ---------- Vista previa de lo que se enviará o publicará en GHL (US-16) ----------

/** Resalta variables de GHL como {{contact.first_name}}. */
function TextoGhl({ texto }) {
  const partes = texto.split(/(\{\{[^}]+\}\})/g);
  return partes.map((p, i) => (p.startsWith('{{') ? <span key={i} className="variable-ghl">{p}</span> : p));
}

function VistaPreviaGhl({ ghl }) {
  const { preview } = ghl;
  return (
    <section className="ghl-previa">
      <div className="ghl-previa__cabecera">
        <InsigniaGhl>{nombreTipoGhl[ghl.tipo]}</InsigniaGhl>
        <span style={{ marginLeft: 'auto', textTransform: 'none', letterSpacing: 0, fontWeight: 600, color: 'var(--azul-200)' }}>{ghl.audiencia}</span>
      </div>
      <div className="ghl-previa__cuerpo">
        {ghl.tipo === 'email' && (
          <div className="email-previa">
            <div className="email-previa__asunto">
              <span className="texto-xs atenuado" style={{ marginRight: 8, fontWeight: 600 }}>
                Asunto
              </span>
              <TextoGhl texto={preview.asunto} />
            </div>
            <div className="email-previa__cuerpo">
              <TextoGhl texto={preview.cuerpo} />
            </div>
          </div>
        )}

        {ghl.tipo === 'workflow' && (
          <ol className="workflow">
            {preview.pasos.map((p, i) => (
              <li key={i}>
                <div className="workflow__espera">{p.espera}</div>
                <div className="workflow__mensaje">
                  <div className="texto-xs" style={{ fontWeight: 700, color: 'var(--azul-600)', marginBottom: 4 }}>
                    {p.canal}
                  </div>
                  <TextoGhl texto={p.mensaje} />
                </div>
              </li>
            ))}
          </ol>
        )}

        {ghl.tipo === 'post' && (
          <div className="post-previa">
            <div className="post-previa__imagen">{preview.imagen}</div>
            <div>
              <div className="fila" style={{ gap: 6 }}>
                <Chip>{preview.red}</Chip>
                <span className="texto-sm atenuado">Programado: {formatoFecha(preview.fecha)}</span>
              </div>
              <p className="post-previa__copy">{preview.copy}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------- Formularios de las acciones ----------

function FormularioCambios({ onCancelar, onEnviar }) {
  const [comentario, setComentario] = useState('');
  const valido = comentario.trim().length >= 1; // spec: al menos 1 carácter
  return (
    <form
      className="formulario"
      onSubmit={(e) => {
        e.preventDefault();
        if (valido) onEnviar(comentario.trim());
      }}
    >
      <label>
        Qué debe cambiar el agente
        <textarea autoFocus value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Ej.: no excluyas Rionegro, el cliente tiene entregas allá." />
      </label>
      <div className="formulario__botones">
        <button type="submit" className="boton boton--primario" disabled={!valido}>
          Enviar al agente
        </button>
        <button type="button" className="boton boton--fantasma" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export const canalesVistoBueno = ['WhatsApp', 'Reunión', 'Correo'];

function FormularioVistoBueno({ onCancelar, onEnviar }) {
  const [canal, setCanal] = useState(canalesVistoBueno[0]);
  const [fecha, setFecha] = useState(HOY);
  return (
    <form
      className="formulario"
      onSubmit={(e) => {
        e.preventDefault();
        if (fecha) onEnviar(canal, fecha);
      }}
    >
      <label>
        Canal
        <select autoFocus value={canal} onChange={(e) => setCanal(e.target.value)}>
          {canalesVistoBueno.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label>
        Fecha
        <input type="date" value={fecha} max={HOY} onChange={(e) => setFecha(e.target.value)} />
      </label>
      <div className="formulario__botones">
        <button type="submit" className="boton boton--primario" disabled={!fecha}>
          Guardar
        </button>
        <button type="button" className="boton boton--fantasma" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function FormularioEscalar({ canalInicial, onCancelar, onEnviar }) {
  const [canal, setCanal] = useState(canalInicial);
  const [motivo, setMotivo] = useState('');
  const valido = motivo.trim().length >= 1;
  return (
    <form
      className="formulario"
      onSubmit={(e) => {
        e.preventDefault();
        if (valido) onEnviar(canal, motivo.trim());
      }}
    >
      <label>
        Especialista
        <select value={canal} onChange={(e) => setCanal(e.target.value)}>
          {canalesEspecialista.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>
      <label>
        Motivo
        <textarea autoFocus value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Qué necesitas que revise el especialista." />
      </label>
      <div className="formulario__botones">
        <button type="submit" className="boton boton--primario" disabled={!valido}>
          Escalar
        </button>
        <button type="button" className="boton boton--fantasma" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
