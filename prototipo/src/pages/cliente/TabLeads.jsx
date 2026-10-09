import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Save } from 'lucide-react';
import { servicioPorId } from '../../data/catalogos.js';
import { HOY, diasDesde, useDatos } from '../../context/DatosContext.jsx';
import { useSesion } from '../../context/SesionContext.jsx';
import { formatoFecha, plural } from '../../lib/formato.js';
import { Alerta, Chip, EstadoVacio } from '../../components/ui.jsx';

const calificaciones = ['Bueno', 'Regular', 'Malo'];
const varianteCalificacion = { Bueno: 'verde', Regular: 'amarillo', Malo: 'rojo' };
const motivosSugeridos = ['Fuera de zona', 'B2C cuando buscamos B2B', 'Solo preguntó precios', 'Ticket muy bajo', 'Datos de contacto falsos'];

/** US-10: revisión semanal de la calidad de los leads que llegan a la subcuenta GHL. */
export function TabLeads({ cliente, lectura }) {
  const { lotesLeads } = useDatos();
  const lotes = lotesLeads.filter((l) => l.cliente === cliente.id).sort((a, b) => a.semana.localeCompare(b.semana));
  const pendientes = lotes.filter((l) => l.estado === 'Pendiente');
  const completadas = lotes.filter((l) => l.estado === 'Completada').reverse();
  const [creadas, setCreadas] = useState([]);

  return (
    <>
      {creadas.map((p) => (
        <div key={p.id} style={{ marginBottom: 12 }}>
          <Alerta tipo="info">
            Calificación guardada. El {servicioPorId[p.agente].agente} preparó una propuesta de optimización con este feedback.{' '}
            <Link to={`/aprobaciones/${p.id}`}>Revisar la propuesta</Link>
          </Alerta>
        </div>
      ))}
      {pendientes.length === 0 && creadas.length === 0 && (
        <div className="tarjeta" style={{ marginBottom: 16 }}>
          <EstadoVacio titulo="No hay revisiones de leads pendientes">
            <p className="atenuado">La próxima revisión aparece el lunes con los leads de esta semana.</p>
          </EstadoVacio>
        </div>
      )}
      {pendientes.map((lote) => (
        <RevisionSemanal key={lote.id} lote={lote} cliente={cliente} lectura={lectura} alCrear={(p) => setCreadas((c) => [...c, p])} />
      ))}

      {completadas.length > 0 && (
        <>
          <div className="seccion-titulo">
            <h2>Revisiones anteriores</h2>
          </div>
          <div className="pila">
            {completadas.map((l) => {
              const conteo = Object.fromEntries(calificaciones.map((c) => [c, l.leads.filter((x) => x.calificacion === c).length]));
              return (
                <div key={l.id} className="tarjeta fila" style={{ justifyContent: 'space-between', padding: '12px 16px' }}>
                  <strong className="texto-sm">Semana del {formatoFecha(l.semana)}</strong>
                  <div className="fila" style={{ gap: 6 }}>
                    {calificaciones.map((c) => (
                      <Chip key={c} variante={varianteCalificacion[c]}>
                        {conteo[c]} {c.toLowerCase()}
                      </Chip>
                    ))}
                    <span className="texto-xs atenuado">Calificada el {formatoFecha(l.calificadoEl)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

function RevisionSemanal({ lote, cliente, lectura, alCrear }) {
  const { actualizarLote, agregarAprobacion, actualizarCliente, lotesLeads } = useDatos();
  const { persona } = useSesion();
  const [leads, setLeads] = useState(lote.leads ?? []);
  const [seleccion, setSeleccion] = useState(new Set());
  const atrasada = diasDesde(lote.semana) > 7 + 6; // semana cerrada hace más de 7 días

  if (!lote.leads) {
    return (
      <section className="tarjeta" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 10 }}>Revisión semanal de leads · semana del {formatoFecha(lote.semana)}</h3>
        <Alerta tipo="error">No se pueden traer leads: GHL desconectado</Alerta>
      </section>
    );
  }

  const calificar = (ids, calificacion) => setLeads((ls) => ls.map((l) => (ids.has(l.id) ? { ...l, calificacion } : l)));
  const motivo = (id, texto) => setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, motivo: texto } : l)));
  const sinCalificar = leads.filter((l) => !l.calificacion).length;
  const todos = seleccion.size === leads.length;

  const guardar = () => {
    actualizarLote(lote.id, { estado: 'Completada', calificadoEl: HOY, leads });
    // Si ya no queda ninguna revisión atrasada, se apaga la alerta de la Cartera.
    const quedanAtrasadas = lotesLeads.some(
      (l) => l.cliente === cliente.id && l.id !== lote.id && l.estado === 'Pendiente' && diasDesde(l.semana) > 13,
    );
    if (!quedanAtrasadas) actualizarCliente(cliente.id, { revisionLeadsAtrasadaDias: null });
    const propuesta = propuestaOptimizacion(lote, leads, cliente, persona);
    agregarAprobacion(propuesta);
    alCrear(propuesta);
  };

  return (
    <section className="tarjeta" style={{ padding: 0, marginBottom: 16 }}>
      <div className="fila" style={{ justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--azul-200)' }}>
        <div>
          <div className="fila">
            <h3>Revisión semanal de leads · semana del {formatoFecha(lote.semana)}</h3>
            {atrasada && <Chip variante="atrasado">Atrasado</Chip>}
          </div>
          <p className="texto-xs atenuado" style={{ marginTop: 4 }}>
            {plural(leads.length, 'lead')} traídos de la subcuenta GHL · Fuente: GHL
          </p>
        </div>
        {!lectura && (
          <div className="fila" style={{ gap: 6 }}>
            <span className="texto-xs atenuado">{seleccion.size ? `${seleccion.size} seleccionados:` : 'Calificar en lote:'}</span>
            {calificaciones.map((c) => (
              <button
                key={c}
                className="boton boton--secundario"
                style={{ padding: '6px 12px' }}
                disabled={!seleccion.size}
                onClick={() => calificar(seleccion, c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      <table className="tabla">
        <thead>
          <tr>
            {!lectura && (
              <th style={{ width: 36 }}>
                <input
                  type="checkbox"
                  aria-label="Seleccionar todos"
                  checked={todos}
                  onChange={() => setSeleccion(todos ? new Set() : new Set(leads.map((l) => l.id)))}
                />
              </th>
            )}
            <th>Lead</th>
            <th>Origen</th>
            <th>Etapa en GHL</th>
            <th>1.ª respuesta</th>
            <th>Calificación</th>
            <th>Motivo</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id}>
              {!lectura && (
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Seleccionar ${l.nombre}`}
                    checked={seleccion.has(l.id)}
                    onChange={() =>
                      setSeleccion((s) => {
                        const n = new Set(s);
                        n.has(l.id) ? n.delete(l.id) : n.add(l.id);
                        return n;
                      })
                    }
                  />
                </td>
              )}
              <td>
                <div style={{ fontWeight: 700, color: 'var(--azul-900)' }}>{l.nombre}</div>
                <div className="texto-xs atenuado">{formatoFecha(l.fecha)}</div>
              </td>
              <td className="texto-xs">{l.origen}</td>
              <td>
                <Chip variante="suave">{l.etapaGhl}</Chip>
              </td>
              <td className="texto-xs">{l.primeraRespuestaMin} min</td>
              <td>
                <div className="fila" style={{ gap: 4 }} role="radiogroup" aria-label={`Calificación de ${l.nombre}`}>
                  {calificaciones.map((c) => (
                    <button
                      key={c}
                      role="radio"
                      aria-checked={l.calificacion === c}
                      disabled={lectura}
                      className={`chip ${l.calificacion === c ? `chip--${varianteCalificacion[c]}` : 'chip--suave'}`}
                      style={{ cursor: lectura ? 'default' : 'pointer', border: l.calificacion === c ? '1px solid currentColor' : undefined }}
                      onClick={() => calificar(new Set([l.id]), c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </td>
              <td>
                {l.calificacion && l.calificacion !== 'Bueno' && (
                  <input
                    className="campo-texto"
                    list="motivos-leads"
                    placeholder="Motivo (opcional)"
                    value={l.motivo ?? ''}
                    disabled={lectura}
                    onChange={(e) => motivo(l.id, e.target.value)}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <datalist id="motivos-leads">
        {motivosSugeridos.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      {!lectura && (
        <div className="fila" style={{ justifyContent: 'flex-end', padding: '12px 16px', borderTop: '1px solid var(--azul-200)', gap: 12 }}>
          {sinCalificar > 0 && <span className="texto-sm atenuado">Faltan {plural(sinCalificar, 'lead')} por calificar</span>}
          <button className="boton boton--primario" disabled={sinCalificar > 0} onClick={guardar}>
            <Save size={16} /> Guardar calificación
          </button>
        </div>
      )}
    </section>
  );
}

/** El agente de pauta convierte la calificación en una propuesta de optimización para la bandeja. */
function propuestaOptimizacion(lote, leads, cliente, persona) {
  const malos = leads.filter((l) => l.calificacion === 'Malo');
  const regulares = leads.filter((l) => l.calificacion === 'Regular');
  const deMeta = malos.filter((l) => l.origen.startsWith('Meta')).length;
  const deGoogle = malos.filter((l) => l.origen.startsWith('Google')).length;
  const agente =
    cliente.servicios.includes('Pauta') && (deMeta > deGoogle || !cliente.servicios.includes('SEM')) ? 'Pauta' : 'SEM';
  const motivos = [...new Set([...malos, ...regulares].map((l) => l.motivo).filter(Boolean))];
  const buenos = leads.length - malos.length - regulares.length;

  const porQue = malos.length
    ? `Marcaste ${plural(malos.length, 'lead')} como malos y ${regulares.length} como regulares. ${
        motivos.length ? `Los motivos más repetidos: ${motivos.slice(0, 2).join(' y ').toLowerCase()}.` : ''
      } Propongo ajustar la segmentación y los anuncios que los traen para invertir en los que sí compran.`
    : `${plural(buenos, 'lead')} de ${leads.length} fueron buenos esta semana. Propongo subir el presupuesto de los anuncios que los trajeron y mantener la segmentación.`;

  const fecha = new Date(HOY);
  fecha.setUTCDate(fecha.getUTCDate() + 7);

  return {
    id: `apr-feedback-${lote.id}`,
    cliente: cliente.id,
    agente,
    tipo: 'tarea',
    titulo: `Optimización por feedback de leads: semana del ${formatoFecha(lote.semana)}`,
    creado: HOY,
    confianza: 'Media',
    porQue,
    ghl: null,
    origen: 'feedback-leads',
    contenido: {
      canal: agente,
      descripcion: `Ajustes a partir de la calificación de ${plural(leads.length, 'lead')} de la semana del ${formatoFecha(lote.semana)}.`,
      pasos: malos.length
        ? ['Excluir las audiencias o términos de los leads marcados como malos', 'Ajustar los textos de anuncios para filtrar mejor', 'Medir la calidad de leads la próxima semana']
        : ['Subir 10 % el presupuesto de los anuncios con leads buenos', 'Mantener la segmentación actual', 'Medir la calidad de leads la próxima semana'],
      kpi: 'conversion',
      fechaObjetivo: fecha.toISOString().slice(0, 10),
      revisionEspecialista: false,
    },
    historial: [
      { fecha: HOY, autor: persona.id, texto: `Calificó los leads de la semana del ${formatoFecha(lote.semana)}.` },
      { fecha: HOY, autor: 'agente', texto: 'Propuesta generada a partir del feedback de leads.' },
    ],
  };
}
