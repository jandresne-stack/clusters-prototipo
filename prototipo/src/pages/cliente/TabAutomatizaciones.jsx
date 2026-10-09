import { Link } from 'react-router-dom';
import { Mail, Megaphone, Pause, Play, Workflow } from 'lucide-react';
import { servicioPorId } from '../../data/catalogos.js';
import { HOY, esPendiente, useDatos } from '../../context/DatosContext.jsx';
import { formatoFecha } from '../../lib/formato.js';
import { Alerta, Chip, EstadoVacio, InsigniaGhl } from '../../components/ui.jsx';

const tipos = {
  email: { nombre: 'Email', icono: Mail },
  workflow: { nombre: 'Workflow de seguimiento', icono: Workflow },
  post: { nombre: 'Post en Social Planner', icono: Megaphone },
};

const numero = new Intl.NumberFormat('es-CO');
const pct = (a, b) => (b ? ` (${Math.round((a / b) * 100)} %)` : '');

function resultado(a) {
  const r = a.resultado;
  if (a.tipo === 'email') return `${numero.format(r.envios)} envíos · ${numero.format(r.aperturas)} aperturas${pct(r.aperturas, r.envios)} · ${numero.format(r.clics)} clics`;
  if (a.tipo === 'workflow') return `${numero.format(r.leadsContactados)} leads contactados · ${numero.format(r.respuestas)} respuestas${pct(r.respuestas, r.leadsContactados)}`;
  return `${numero.format(r.publicados)} publicados · ${numero.format(r.programados)} programados · ${numero.format(r.interacciones)} interacciones`;
}

/** US-16: lista de automatizaciones activas y pausadas en la subcuenta GHL del cliente. */
export function TabAutomatizaciones({ cliente, lectura }) {
  const { automatizaciones, actualizarAutomatizacion, aprobaciones } = useDatos();
  const desconectado = cliente.ghl !== 'conectado';
  const lista = automatizaciones.filter((a) => a.cliente === cliente.id);
  const propuestas = aprobaciones.filter((a) => a.cliente === cliente.id && a.ghl && esPendiente(a));
  const puedeEditar = !lectura;

  return (
    <>
      {desconectado && (
        <div style={{ marginBottom: 16 }}>
          <Alerta tipo="error">
            {cliente.ghl === 'pendiente'
              ? 'La subcuenta GHL está pendiente de vincular. Conecta la subcuenta GHL para activar automatizaciones.'
              : 'GHL desconectado: sin datos de leads ni automatizaciones. Conecta la subcuenta GHL para activar.'}
          </Alerta>
        </div>
      )}

      {propuestas.length > 0 && (
        <>
          <div className="seccion-titulo">
            <h2>Propuestas por aprobar</h2>
          </div>
          <div className="pila" style={{ marginBottom: 8 }}>
            {propuestas.map((p) => (
              <div key={p.id} className="propuesta-agente fila" style={{ justifyContent: 'space-between' }}>
                <div>
                  <h4>{p.titulo}</h4>
                  <div className="fila texto-xs" style={{ marginTop: 6, gap: 6 }}>
                    <InsigniaGhl />
                    <Chip variante="agente">Propuesto por {servicioPorId[p.agente].agente}</Chip>
                    {p.ghl.audiencia && <span style={{ color: 'var(--azul-800)' }}>Aplica a: {p.ghl.audiencia}</span>}
                  </div>
                </div>
                <Link to={`/aprobaciones/${p.id}`} className="boton boton--primario">
                  Revisar
                </Link>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="seccion-titulo">
        <h2>Automatizaciones en GHL</h2>
        <span className="texto-sm atenuado">
          {lista.filter((a) => a.estado === 'Activa').length} activas · {lista.filter((a) => a.estado === 'Pausada').length} pausadas
        </span>
      </div>

      {lista.length === 0 ? (
        <div className="tarjeta">
          <EstadoVacio titulo="Aún no hay automatizaciones activas">
            <p className="atenuado">Cuando apruebes una propuesta que se ejecuta en GHL, aparecerá aquí.</p>
          </EstadoVacio>
        </div>
      ) : (
        <div className="tarjeta" style={{ padding: 0 }}>
          <table className="tabla">
            <thead>
              <tr>
                <th>Automatización</th>
                <th>Creada por</th>
                <th>Activada</th>
                <th>Resultado</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lista.map((a) => {
                const { nombre, icono: Icono } = tipos[a.tipo];
                const activa = a.estado === 'Activa';
                return (
                  <tr key={a.id}>
                    <td>
                      <div className="fila">
                        <Icono size={18} color="var(--azul-600)" />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--azul-900)' }}>{a.nombre}</div>
                          <div className="texto-xs atenuado">{nombre}</div>
                        </div>
                      </div>
                    </td>
                    <td>{servicioPorId[a.agente]?.agente ?? a.agente}</td>
                    <td>{formatoFecha(a.activadaEl)}</td>
                    <td className="texto-xs" style={{ color: 'var(--azul-800)', maxWidth: 280 }}>
                      {resultado(a)}
                      {a.nota && <div style={{ marginTop: 4, color: 'var(--salud-rojo)', fontWeight: 600 }}>{a.nota}</div>}
                    </td>
                    <td>
                      <Chip variante={activa ? 'verde' : 'suave'}>{activa ? 'Activa en GHL' : 'Pausada'}</Chip>
                    </td>
                    <td>
                      {puedeEditar && (
                        <button
                          className="boton boton--secundario"
                          disabled={!activa && desconectado}
                          title={!activa && desconectado ? 'Conecta la subcuenta GHL para activar' : undefined}
                          onClick={() =>
                            actualizarAutomatizacion(a.id, activa ? { estado: 'Pausada', pausadaEl: HOY } : { estado: 'Activa', pausadaEl: undefined })
                          }
                        >
                          {activa ? <Pause size={14} /> : <Play size={14} />} {activa ? 'Pausar' : 'Reactivar'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
