import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, Sparkles, UserPlus } from 'lucide-react';
import { useSesion } from '../context/SesionContext.jsx';
import { esPendiente, estadosOportunidadAbierta, useDatos } from '../context/DatosContext.jsx';
import { clientes } from '../data/clientes.js';
import { servicioPorId, servicios } from '../data/catalogos.js';
import { ejecutivaPorId } from '../data/equipo.js';
import { alertasCliente, etiquetaSalud, saludCliente } from '../lib/salud.js';
import { plural } from '../lib/formato.js';
import { Alerta, Avatar, Chip, Encabezado, EstadoVacio, Progreso, Semaforo } from '../components/ui.jsx';

// Orden "peor primero" del semáforo; diagnóstico y onboarding van al final porque no tienen salud aún.
const pesoSalud = { rojo: 0, amarillo: 1, verde: 2, diagnostico: 3, onboarding: 4 };

/** Estado que muestra la Cartera: semáforo, o 'diagnostico' / 'onboarding' cuando todavía no hay KPIs. */
function estadoCartera(c) {
  if (c.onboarding) return 'onboarding';
  if (c.diagnosticoInicial) return 'diagnostico'; // recién dado de alta: los agentes aún no tienen datos
  return saludCliente(c);
}

const ordenes = {
  salud: { texto: 'Salud (peor primero)', fn: (a, b) => pesoSalud[a.salud] - pesoSalud[b.salud] || b.alertas.length - a.alertas.length },
  pendientes: { texto: 'Más pendientes', fn: (a, b) => b.pendientes - a.pendientes },
  alertas: { texto: 'Más alertas', fn: (a, b) => b.alertas.length - a.alertas.length },
  nombre: { texto: 'Nombre (A–Z)', fn: (a, b) => a.nombre.localeCompare(b.nombre, 'es') },
};

export function Cartera() {
  const { persona } = useSesion();
  const datos = useDatos();
  const { aprobaciones, oportunidades } = datos;
  // Los clientes salen del almacén compartido (altas y servicios nuevos se reflejan aquí).
  const listaClientes = datos.clientes ?? clientes;
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // US-15: el Líder entra con ?ejecutiva=<id>&lectura=1 para ver la cartera de una ejecutiva sin acciones.
  const lectura = params.get('lectura') === '1';
  const ejecutivaId = params.get('ejecutiva') ?? persona.id;
  const ejecutivaVista = ejecutivaPorId[ejecutivaId] ?? persona;
  const [filtroSalud, setFiltroSalud] = useState('todas');
  const [filtroServicio, setFiltroServicio] = useState('todos');
  const [orden, setOrden] = useState('salud');

  // Cartera de la ejecutiva activa, enriquecida con lo que la tabla necesita mostrar.
  // Pendientes y oportunidades se cuentan desde el almacén compartido, no desde clientes.js,
  // para que al aprobar desde la bandeja (US-5) el contador baje también aquí.
  const cartera = useMemo(
    () =>
      listaClientes
        .filter((c) => c.ejecutiva === ejecutivaId)
        .map((c) => ({
          ...c,
          salud: estadoCartera(c),
          alertas: alertasCliente(c),
          pendientes: aprobaciones.filter((a) => a.cliente === c.id && esPendiente(a)).length,
          oportunidadesAbiertas: oportunidades.filter((o) => o.cliente === c.id && estadosOportunidadAbierta.includes(o.estado))
            .length,
        })),
    [ejecutivaId, listaClientes, aprobaciones, oportunidades],
  );

  const avisoLectura = lectura && (
    <div style={{ marginBottom: 16 }}>
      <Alerta tipo="info">
        <span className="fila" style={{ gap: 12 }}>
          <Eye size={14} />
          Viendo la cartera de <strong>{ejecutivaVista.nombre}</strong> · solo lectura
          <Link to="/equipo" className="boton boton--fantasma" style={{ padding: '4px 10px' }}>
            <ArrowLeft size={14} /> Volver al tablero
          </Link>
        </span>
      </Alerta>
    </div>
  );

  const resumen = useMemo(() => {
    const r = { verde: 0, amarillo: 0, rojo: 0, onboarding: 0, pendientes: 0, oportunidades: 0 };
    for (const c of cartera) {
      if (c.salud in r) r[c.salud] += 1; // 'diagnostico' no cuenta en el resumen de salud
      r.pendientes += c.pendientes;
      r.oportunidades += c.oportunidadesAbiertas;
    }
    return r;
  }, [cartera]);

  const visibles = useMemo(
    () =>
      cartera
        .filter((c) => filtroSalud === 'todas' || c.salud === filtroSalud)
        .filter((c) => filtroServicio === 'todos' || c.servicios.includes(filtroServicio))
        .sort(ordenes[orden].fn),
    [cartera, filtroSalud, filtroServicio, orden],
  );

  if (cartera.length === 0) {
    return (
      <>
        {avisoLectura}
        <Encabezado titulo="Cartera" />
        <div className="tarjeta">
          <EstadoVacio titulo={lectura ? `${ejecutivaVista.nombre} aún no tiene clientes en su cartera` : 'Aún no tienes clientes en tu cartera'}>
            {!lectura && (
              <>
                <p className="atenuado">Cuando des de alta tu primer cliente, aquí verás su salud, pendientes y oportunidades.</p>
                <button className="boton boton--cta" onClick={() => navigate('/alta')}>
                  <UserPlus size={16} /> Dar de alta cliente
                </button>
              </>
            )}
          </EstadoVacio>
        </div>
      </>
    );
  }

  const hayFiltro = filtroSalud !== 'todas' || filtroServicio !== 'todos';

  return (
    <>
      {avisoLectura}
      <Encabezado
        titulo={lectura ? `Cartera de ${ejecutivaVista.nombre}` : 'Cartera'}
        descripcion={`${plural(cartera.length, 'cliente')} · ${plural(resumen.pendientes, 'aprobación pendiente', 'aprobaciones pendientes')} · ${plural(resumen.oportunidades, 'oportunidad abierta', 'oportunidades abiertas')}`}
      >
        <label className="filtro">
          Salud
          <select value={filtroSalud} onChange={(e) => setFiltroSalud(e.target.value)}>
            <option value="todas">Todas</option>
            <option value="rojo">Crítico</option>
            <option value="amarillo">En riesgo</option>
            <option value="verde">En meta</option>
            <option value="onboarding">Onboarding en curso</option>
            <option value="diagnostico">Diagnóstico inicial</option>
          </select>
        </label>
        <label className="filtro">
          Servicio
          <select value={filtroServicio} onChange={(e) => setFiltroServicio(e.target.value)}>
            <option value="todos">Todos</option>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="filtro">
          Ordenar por
          <select value={orden} onChange={(e) => setOrden(e.target.value)}>
            {Object.entries(ordenes).map(([id, o]) => (
              <option key={id} value={id}>
                {o.texto}
              </option>
            ))}
          </select>
        </label>
      </Encabezado>

      <div className="rejilla rejilla-4" style={{ marginBottom: 20 }}>
        {['rojo', 'amarillo', 'verde', 'onboarding'].map((s) => (
          <button
            key={s}
            type="button"
            className={`resumen-salud resumen-salud--${s}${filtroSalud === s ? ' activo' : ''}`}
            onClick={() => setFiltroSalud(filtroSalud === s ? 'todas' : s)}
          >
            <span className="resumen-salud__valor">{resumen[s]}</span>
            <span className="resumen-salud__texto">{s === 'onboarding' ? 'Onboarding en curso' : etiquetaSalud[s]}</span>
          </button>
        ))}
      </div>

      <div className="tarjeta tabla-envoltorio" style={{ padding: 0 }}>
        <table className="tabla tabla--clientes">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Servicios</th>
              <th>Salud</th>
              <th>Pendientes</th>
              <th>Alertas</th>
              <th>Oportunidades</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EstadoVacio titulo="Ningún cliente coincide con el filtro">
                    <button
                      className="boton boton--fantasma"
                      onClick={() => {
                        setFiltroSalud('todas');
                        setFiltroServicio('todos');
                      }}
                    >
                      Quitar filtros
                    </button>
                  </EstadoVacio>
                </td>
              </tr>
            )}
            {visibles.map((c) => (
              <tr key={c.id} className="fila-cliente" onClick={() => navigate(`/clientes/${c.id}`)}>
                <td>
                  <div className="fila">
                    <Avatar nombre={c.nombre} color={c.color} />
                    <div>
                      <div className="fila-cliente__nombre">{c.nombre}</div>
                      <div className="texto-xs atenuado">
                        {c.rubro} · {c.ciudad}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="fila fila--envolver" style={{ gap: 6 }}>
                    {c.servicios.map((s) => (
                      <Chip key={s} variante="suave">
                        {servicioPorId[s].nombre}
                      </Chip>
                    ))}
                  </div>
                </td>
                <td>
                  {c.onboarding ? (
                    <div className="pila" style={{ gap: 6, minWidth: 150 }}>
                      <span className="texto-sm" style={{ fontWeight: 700, color: '#9a6b00' }}>
                        Onboarding en curso · {c.onboarding.pct} %
                      </span>
                      <Progreso valor={c.onboarding.pct} />
                      <span className="texto-xs atenuado">
                        Paso {c.onboarding.paso}: {c.onboarding.pasoNombre}
                      </span>
                    </div>
                  ) : c.salud === 'diagnostico' ? (
                    <Chip variante="suave" title="Los agentes están haciendo el diagnóstico inicial; aún no hay KPIs">
                      Diagnóstico inicial en curso
                    </Chip>
                  ) : (
                    <Semaforo salud={c.salud} />
                  )}
                </td>
                <td>
                  {c.pendientes > 0 ? (
                    <span className="contador-pendientes">{c.pendientes}</span>
                  ) : (
                    <span className="atenuado">—</span>
                  )}
                </td>
                <td>
                  {c.alertas.length === 0 ? (
                    <span className="atenuado">—</span>
                  ) : (
                    <div className="pila" style={{ gap: 4 }}>
                      {c.alertas.map((a) => (
                        <span key={a.texto} className={`alerta-fila alerta-fila--${a.tipo}`}>
                          {a.texto}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td>
                  {c.oportunidadesAbiertas > 0 ? (
                    <Chip variante="agente" icono={Sparkles}>
                      {c.oportunidadesAbiertas}
                    </Chip>
                  ) : (
                    <span className="atenuado">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hayFiltro && (
        <p className="texto-sm atenuado" style={{ marginTop: 12 }}>
          Mostrando {visibles.length} de {cartera.length} clientes.
        </p>
      )}
    </>
  );
}
