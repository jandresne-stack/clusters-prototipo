import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, CircleCheck, Download, Lightbulb, Sparkles } from 'lucide-react';
import { useSesion } from '../context/SesionContext.jsx';
import { HOY, esPendiente, estadosOportunidadAbierta, useDatos } from '../context/DatosContext.jsx';
import { kpisNegocio, mesActual, meses, servicioPorId } from '../data/catalogos.js';
import { bloquesKpiCanal } from '../lib/kpisCanal.js';
import { brecha, etiquetaSalud, kpiDisponible, saludCliente } from '../lib/salud.js';
import { formatoFecha, formatoKpi } from '../lib/formato.js';
import { Alerta, Avatar, Chip, EstadoVacio, InsigniaAgente, Semaforo } from '../components/ui.jsx';
import { TarjetaKpi, Variacion } from '../components/Kpi.jsx';
import '../styles/cliente.css';
import '../styles/reporte.css';

/*
 * US-13: vista previa del reporte mensual de un cliente (ruta /clientes/:id/reporte).
 * La ejecutiva edita el resumen y los próximos pasos y lo marca como listo para la reunión:
 * se guarda en el cliente como { reporteListoEl, reporteTextos: { resumen, proximos } }.
 * Con rol especialista o líder el reporte es de solo lectura.
 */

// Trabajo de ejemplo del mes por canal (la metodología de ejecución de AMD aún no está definida).
const trabajoDelMes = {
  SEO: ['Optimización on-page de 4 URLs prioritarias', 'Publicación de 2 artículos de blog con autoría E-E-A-T', 'Corrección de 12 errores técnicos del sitio'],
  SEM: ['Optimización semanal de pujas y keywords negativas', 'Prueba A/B de anuncios responsivos', 'Ajuste de zonas geográficas y horarios'],
  Redes: ['12 publicaciones programadas en el Social Planner de GHL', '2 reels publicados', 'Respuesta a comentarios y mensajes'],
  Pauta: ['Renovación de creativos en Meta Ads', 'Optimización de audiencias según la calidad de los leads'],
  Email: ['2 campañas de email enviadas desde GHL', 'Ajuste de la secuencia de bienvenida'],
};

function fuenteCpl(servicios) {
  return [servicios.includes('SEM') && 'Google Ads', servicios.includes('Pauta') && 'Meta Ads'].filter(Boolean).join(' + ');
}

/** KPIs de negocio listos para TarjetaKpi, con los mismos textos de "sin datos" que la ficha. */
function kpisNegocioDe(cliente) {
  return kpisNegocio.map((def) => {
    const datos = cliente.kpis[def.id];
    const fuente = def.fuente === 'GHL' ? 'GHL' : fuenteCpl(cliente.servicios);
    if (!datos) return { ...def, fuente: '—', sinDatos: 'No aplica: sin pauta contratada' };
    if (!kpiDisponible(def, cliente)) return { ...def, fuente, sinDatos: 'Sin datos: falta acceso a GHL' };
    return { ...def, fuente, ...datos };
  });
}

function textoResumen(cliente, salud) {
  const leads = cliente.kpis.leads;
  const actual = leads.serie[leads.serie.length - 1];
  const anterior = leads.serie[leads.serie.length - 2];
  const estado = {
    verde: 'cumplió sus metas de negocio',
    amarillo: 'estuvo cerca de sus metas, con algunos indicadores por debajo',
    rojo: 'tuvo un mes difícil: al menos un indicador de negocio quedó más de un 20 % por debajo de la meta',
  }[salud];
  // Los leads salen de GHL: sin la subcuenta conectada no se citan cifras.
  const detalleLeads =
    cliente.ghl === 'conectado'
      ? ` Los leads ${actual >= anterior ? 'subieron' : 'bajaron'} de ${anterior} a ${actual} frente al mes anterior (meta: ${leads.meta}).`
      : ' La subcuenta de GHL está desconectada, así que este mes no hay datos de leads.';
  return `En ${mesActual.toLowerCase()}, ${cliente.nombre} ${estado}.${detalleLeads} El equipo de agentes trabajó en ${cliente.servicios.map((s) => servicioPorId[s].nombre).join(', ')}.`;
}

/** Aprendizajes del mes: el mejor y el peor KPI de negocio frente a la meta, y el mayor cambio por canal. */
function aprendizajes(cliente) {
  const lista = [];
  const negocio = kpisNegocio
    .filter((def) => kpiDisponible(def, cliente))
    .map((def) => ({ def, b: brecha(def, cliente.kpis[def.id]), k: cliente.kpis[def.id] }))
    .sort((a, b) => a.b - b.b);

  if (negocio.length) {
    const mejor = negocio[0];
    const peor = negocio[negocio.length - 1];
    if (mejor.b <= 0) {
      lista.push(`${mejor.def.nombre} superó la meta (${formatoKpi(mejor.k.serie.at(-1), mejor.def.unidad)} frente a ${formatoKpi(mejor.k.meta, mejor.def.unidad)}). Lo que funcionó este mes debe mantenerse.`);
    }
    if (peor.b > 0.01) {
      lista.push(`${peor.def.nombre} quedó un ${Math.round(peor.b * 100)} % por debajo de la meta. Es la prioridad del próximo mes.`);
    }
  }

  for (const bloque of bloquesKpiCanal(cliente)) {
    const cambios = bloque.kpis
      .filter((k) => k.serie && k.mayorEsMejor != null)
      .map((k) => {
        const cambio = (k.serie.at(-1) - k.serie.at(-2)) / k.serie.at(-2);
        return { k, cambio, bueno: cambio > 0 === k.mayorEsMejor };
      })
      .sort((a, b) => Math.abs(b.cambio) - Math.abs(a.cambio));
    const destacado = cambios[0];
    if (destacado && Math.abs(destacado.cambio) >= 0.02) {
      const pct = `${Math.round(Math.abs(destacado.cambio) * 100)} %`;
      lista.push(
        `${bloque.titulo}: ${destacado.k.nombre.toLowerCase()} ${destacado.cambio > 0 ? 'subió' : 'bajó'} un ${pct}${destacado.bueno ? ', una mejora clara.' : '. Hay que revisar la causa.'}`,
      );
    }
  }
  return lista.slice(0, 5);
}

export function Reporte() {
  const { id } = useParams();
  const { rol } = useSesion();
  const { clientes, aprobaciones, oportunidades, actualizarCliente } = useDatos();
  const cliente = clientes.find((c) => c.id === id);
  const soloLectura = rol !== 'ejecutiva';

  if (!cliente) {
    return (
      <div className="tarjeta">
        <EstadoVacio titulo="No encontramos este cliente">
          <Link className="boton boton--secundario" to="/cartera">
            Volver a la cartera
          </Link>
        </EstadoVacio>
      </div>
    );
  }

  if (cliente.onboarding || !cliente.kpis) {
    return (
      <>
        <BarraReporte cliente={cliente} />
        <div className="tarjeta">
          <EstadoVacio titulo="El reporte mensual estará disponible al terminar el onboarding">
            <p className="atenuado texto-sm">
              {cliente.nombre} va en el paso {cliente.onboarding?.paso}: {cliente.onboarding?.pasoNombre}.
            </p>
          </EstadoVacio>
        </div>
      </>
    );
  }

  return (
    <ContenidoReporte
      key={cliente.id}
      cliente={cliente}
      aprobaciones={aprobaciones}
      oportunidades={oportunidades}
      soloLectura={soloLectura}
      guardar={(textos) => actualizarCliente(cliente.id, { reporteListoEl: HOY, reporteTextos: textos })}
    />
  );
}

function BarraReporte({ cliente, children }) {
  return (
    <div className="rp-barra">
      <Link to={`/clientes/${cliente.id}`} className="boton boton--fantasma">
        <ArrowLeft size={16} /> Volver a la ficha
      </Link>
      <div className="fila" style={{ gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function ContenidoReporte({ cliente, aprobaciones, oportunidades, soloLectura, guardar }) {
  const salud = saludCliente(cliente);
  const negocio = kpisNegocioDe(cliente);
  const canales = bloquesKpiCanal(cliente);
  const lecciones = useMemo(() => aprendizajes(cliente), [cliente]);

  const pendientes = aprobaciones.filter((a) => a.cliente === cliente.id && esPendiente(a));
  const abiertas = oportunidades.filter((o) => o.cliente === cliente.id && estadosOportunidadAbierta.includes(o.estado));
  const completadasPlan = aprobaciones
    .filter((a) => a.cliente === cliente.id && a.tipo === 'plan-mensual' && a.estado === 'Aprobado')
    .flatMap((p) => p.contenido.tareas.filter((t) => t.estado === 'Completada'));

  const iniciales = useMemo(
    () =>
      cliente.reporteTextos ?? {
        resumen: textoResumen(cliente, salud),
        proximos:
          pendientes.length > 0
            ? pendientes.slice(0, 4).map((a) => `• ${a.titulo}`).join('\n')
            : '• Mantener la estrategia actual y revisar los KPIs a mitad de mes.',
      },
    // Los textos por defecto se calculan una sola vez al abrir el reporte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [textos, setTextos] = useState(iniciales);
  const [avisoPdf, setAvisoPdf] = useState(false);
  const guardado = cliente.reporteTextos ?? null;
  const cambios = !guardado || guardado.resumen !== textos.resumen || guardado.proximos !== textos.proximos;
  const listo = Boolean(cliente.reporteListoEl);

  return (
    <>
      <BarraReporte cliente={cliente}>
        {listo && (
          <Chip variante="verde" icono={CircleCheck}>
            Listo para reunión · {formatoFecha(cliente.reporteListoEl)}
          </Chip>
        )}
        <button className="boton boton--secundario" onClick={() => setAvisoPdf(true)}>
          <Download size={16} /> Descargar PDF
        </button>
        {!soloLectura && (
          <button className="boton boton--cta" disabled={listo && !cambios} onClick={() => guardar(textos)}>
            <CircleCheck size={16} /> {listo ? (cambios ? 'Guardar cambios' : 'Listo para reunión') : 'Marcar como listo para reunión'}
          </button>
        )}
      </BarraReporte>

      {avisoPdf && (
        <div style={{ marginBottom: 16 }}>
          <Alerta tipo="info">
            Disponible en la versión final.{' '}
            <button className="boton boton--fantasma" style={{ padding: 0 }} onClick={() => setAvisoPdf(false)}>
              Entendido
            </button>
          </Alerta>
        </div>
      )}
      {soloLectura && (
        <div style={{ marginBottom: 16 }}>
          <Alerta tipo="info">Vista de solo lectura.</Alerta>
        </div>
      )}

      <article className="rp-hoja">
        <header className="rp-portada">
          <div className="rp-portada__marca">
            <img src="./logo-agentia.png" alt="AgeentIA · AMD" />
            <span className="rp-portada__producto">Clusters</span>
          </div>
          <div className="rp-portada__cliente">
            <div>
              <div className="rp-portada__titulo">Reporte mensual · {mesActual}</div>
              <h1>{cliente.nombre}</h1>
              <div className="texto-sm atenuado">
                {cliente.rubro} · {cliente.ciudad}
              </div>
            </div>
            <Avatar nombre={cliente.nombre} color={cliente.color} tamano={64} />
          </div>
          <div className="fila fila--envolver" style={{ gap: 10 }}>
            <Semaforo salud={salud} />
            <span className="texto-sm atenuado">Salud general: {etiquetaSalud[salud].toLowerCase()}</span>
            <span className="texto-sm atenuado">· Período {meses[0]}–{meses[meses.length - 1]} 2026</span>
          </div>
        </header>

        <Seccion numero={1} titulo="Resumen del mes" editable={!soloLectura}>
          <TextoEditable
            valor={textos.resumen}
            soloLectura={soloLectura}
            filas={4}
            onCambiar={(resumen) => setTextos((t) => ({ ...t, resumen }))}
          />
        </Seccion>

        <Seccion numero={2} titulo="KPIs de negocio vs. meta">
          <div className="rejilla-kpi">
            {negocio.map((k) => (
              <TarjetaKpi key={k.id} {...k} destacada />
            ))}
          </div>
        </Seccion>

        <Seccion numero={3} titulo="KPIs por canal">
          <div className="rp-canales">
            {canales.map((bloque) => (
              <div key={bloque.canal} className="rp-canal">
                <h4>{bloque.titulo}</h4>
                <table className="rp-tabla">
                  <thead>
                    <tr>
                      <th>Indicador</th>
                      <th>{meses.at(-2)}</th>
                      <th>{meses.at(-1)}</th>
                      <th>Variación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bloque.kpis.map((k) => (
                      <tr key={k.id}>
                        <td>
                          {k.nombre}
                          <div className="texto-xs atenuado">Fuente: {k.fuente}</div>
                        </td>
                        {k.sinDatos ? (
                          <td colSpan={3} className="atenuado">
                            {k.sinDatos}
                          </td>
                        ) : (
                          <>
                            <td>{formatoKpi(k.serie.at(-2), k.unidad)}</td>
                            <td>
                              <strong>{formatoKpi(k.serie.at(-1), k.unidad)}</strong>
                            </td>
                            <td>
                              <Variacion actual={k.serie.at(-1)} anterior={k.serie.at(-2)} mayorEsMejor={k.mayorEsMejor} />
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            {canales.length === 0 && <p className="atenuado texto-sm">Los canales contratados no tienen KPIs propios en este reporte.</p>}
          </div>
        </Seccion>

        <Seccion numero={4} titulo="Tareas completadas">
          <div className="rp-tareas">
            {cliente.servicios.map((s) => {
              const delPlan = completadasPlan.filter((t) => t.canal === s).map((t) => t.titulo);
              const tareas = [...delPlan, ...(trabajoDelMes[s] ?? [])];
              return (
                <div key={s} className="rp-tareas__grupo">
                  <div className="fila" style={{ gap: 8 }}>
                    <Bot size={16} color="var(--naranja)" />
                    <strong>{servicioPorId[s].agente}</strong>
                  </div>
                  <ul>
                    {tareas.map((t) => (
                      <li key={t}>
                        <CircleCheck size={14} color="var(--salud-verde)" /> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Seccion>

        <Seccion numero={5} titulo="Aprendizajes">
          <div className="propuesta-agente pila" style={{ gap: 10 }}>
            <InsigniaAgente agente="el equipo de agentes" />
            {lecciones.length === 0 ? (
              <p className="texto-sm">Un mes estable: no hubo cambios relevantes en los indicadores.</p>
            ) : (
              <ul className="rp-lista">
                {lecciones.map((l) => (
                  <li key={l}>
                    <Lightbulb size={15} color="var(--naranja)" /> {l}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Seccion>

        <Seccion numero={6} titulo="Próximos pasos" editable={!soloLectura}>
          <TextoEditable
            valor={textos.proximos}
            soloLectura={soloLectura}
            filas={5}
            onCambiar={(proximos) => setTextos((t) => ({ ...t, proximos }))}
          />
        </Seccion>

        <Seccion numero={7} titulo="Oportunidades sugeridas">
          {abiertas.length === 0 ? (
            <p className="atenuado texto-sm">No hay oportunidades abiertas para este cliente.</p>
          ) : (
            <div className="rp-oportunidades">
              {abiertas.map((o) => (
                <div key={o.id} className="rp-oportunidad">
                  <div className="fila" style={{ justifyContent: 'space-between', gap: 8 }}>
                    <strong>
                      <Sparkles size={15} color="var(--naranja)" style={{ verticalAlign: -2, marginRight: 6 }} />
                      {o.titulo}
                    </strong>
                    <Chip variante="suave">{servicioPorId[o.servicio].nombre}</Chip>
                  </div>
                  <p className="texto-sm">{o.beneficio}</p>
                </div>
              ))}
            </div>
          )}
        </Seccion>

        <footer className="rp-pie">
          <img src="./isotipo-agentia.png" alt="" />
          <span>Preparado por el equipo Clusters de AMD · Datos de ejemplo del prototipo</span>
        </footer>
      </article>
    </>
  );
}

function Seccion({ numero, titulo, editable, children }) {
  return (
    <section className="rp-seccion">
      <div className="rp-seccion__titulo">
        <span className="rp-seccion__numero">{numero}</span>
        <h2>{titulo}</h2>
        {editable && <span className="rp-seccion__editable">Editable</span>}
      </div>
      {children}
    </section>
  );
}

function TextoEditable({ valor, onCambiar, soloLectura, filas }) {
  if (soloLectura) return <p className="rp-texto">{valor}</p>;
  return (
    <textarea
      className="rp-texto rp-texto--editable"
      rows={filas}
      value={valor}
      onChange={(e) => onCambiar(e.target.value)}
      aria-label="Texto editable del reporte"
    />
  );
}
