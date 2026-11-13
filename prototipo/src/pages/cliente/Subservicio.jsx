import { Link } from 'react-router-dom';
import { Bot, Sparkles } from 'lucide-react';
import { servicioPorId, subservicios } from '../../data/catalogos.js';
import { resumenAgente } from '../../lib/agentes.js';
import { formatoFecha } from '../../lib/formato.js';
import { Alerta, Chip, EstadoVacio } from '../../components/ui.jsx';

const claseTarea = { Completada: 'verde', 'Esperando aprobación': 'agente', Escalado: 'rojo' };

/** Vista de un subservicio (p. ej. SEO › Creación de blogs): qué es y qué tareas del agente le tocan. */
export function Subservicio({ cliente, datos, lectura, agente, sub }) {
  const servicio = servicioPorId[agente];
  const detalle = subservicios[agente]?.find((s) => s.id === sub);
  if (!servicio || !detalle) return <EstadoVacio titulo="Subservicio no encontrado" />;

  const a = resumenAgente(cliente, agente, datos);
  const coincide = (t) => detalle.claves.some((k) => `${t.titulo} ${t.tipo}`.toLowerCase().includes(k.toLowerCase()));
  const tareas = a.contratado ? a.tareas.filter(coincide) : [];

  return (
    <>
      <div className="seccion-titulo">
        <div>
          <span className="texto-sm atenuado">{servicio.nombre} ›</span>
          <h2>{detalle.nombre}</h2>
          <p className="texto-sm atenuado" style={{ marginTop: 4 }}>
            {detalle.descripcion}
          </p>
        </div>
        <div className="fila" style={{ gap: 8 }}>
          <Chip variante="suave" icono={Bot}>
            {servicio.agente}
          </Chip>
          {a.contratado ? <Chip variante={a.estado === 'Bloqueado' ? 'rojo' : 'verde'}>{a.estado}</Chip> : <Chip>No contratado</Chip>}
        </div>
      </div>

      {!a.contratado ? (
        <div className="tarjeta">
          <p style={{ marginBottom: 12 }}>
            {cliente.nombre} no tiene {servicio.nombre} contratado. Si encaja con sus objetivos, propónlo como oportunidad.
          </p>
          {!lectura && (
            <Link to={`/oportunidades?cliente=${cliente.id}&nueva=1&servicio=${agente}`} className="boton boton--secundario">
              <Sparkles size={16} /> Proponer {servicio.nombre}
            </Link>
          )}
        </div>
      ) : (
        <>
          {a.motivo && (
            <div style={{ marginBottom: 16 }}>
              <Alerta tipo={a.estado === 'Bloqueado' ? 'error' : 'info'}>{a.motivo}</Alerta>
            </div>
          )}
          <div className="tarjeta" style={{ padding: 0 }}>
            {tareas.length ? (
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
                  {tareas.map((t, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, color: 'var(--azul-900)' }}>{t.titulo}</td>
                      <td>{t.tipo}</td>
                      <td>{formatoFecha(t.fecha)}</td>
                      <td>
                        <Chip variante={claseTarea[t.estado]}>{t.estado}</Chip>
                      </td>
                      <td>
                        {t.aprobacionId && !lectura && (
                          <Link to={`/aprobaciones/${t.aprobacionId}`} className="boton boton--fantasma">
                            Revisar
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EstadoVacio titulo="Sin tareas este mes">
                <p className="texto-sm atenuado">El agente todavía no tiene tareas de {detalle.nombre.toLowerCase()} para este cliente.</p>
              </EstadoVacio>
            )}
          </div>
        </>
      )}
    </>
  );
}
