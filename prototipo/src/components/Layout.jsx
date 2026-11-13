import { useRef, useState } from 'react';
import { Link, Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { seccionesCliente } from '../lib/navCliente.js';
import {
  ArrowLeft,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  LayoutGrid,
  LifeBuoy,
  Palette,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import { inicioPorRol, personasPorRol, roles, useSesion } from '../context/SesionContext.jsx';
import { clientes } from '../data/clientes.js';
import { esPendiente, useDatos } from '../context/DatosContext.jsx';
import { Avatar } from './ui.jsx';

// Navegación por rol. `contador` calcula la burbuja numérica a partir de la persona activa.
const navegacion = {
  ejecutiva: [
    { a: '/cartera', texto: 'Cartera', icono: LayoutGrid },
    {
      a: '/aprobaciones',
      texto: 'Aprobaciones',
      icono: Inbox,
      contador: (p, d) => {
        const suyos = new Set(clientes.filter((c) => c.ejecutiva === p.id).map((c) => c.id));
        return d.aprobaciones.filter((a) => suyos.has(a.cliente) && esPendiente(a)).length;
      },
    },
    { a: '/oportunidades', texto: 'Oportunidades', icono: Sparkles },
    { a: '/escalados', texto: 'Escalados', icono: LifeBuoy },
  ],
  especialista: [{ a: '/casos', texto: 'Casos escalados', icono: LifeBuoy }],
  lider: [{ a: '/equipo', texto: 'Tablero del equipo', icono: Users }],
};

const sumar = (items) => items.reduce((t, i) => t + (i.contador ?? 0), 0);
const CLAVE_LATERAL = 'clusters.lateralExpandido';

function leerExpandido() {
  try {
    return localStorage.getItem(CLAVE_LATERAL) === '1';
  } catch {
    return false;
  }
}

/**
 * Lateral estilo HubSpot. Contraído: riel de íconos y, al pasar el mouse, un panel flotante por
 * sección (en Servicios, cada servicio abre su propio submenú en cascada). Con la flecha del pie se
 * expande a la columna completa con nombres y los servicios como acordeón.
 */
export function Layout() {
  const { rol, persona } = useSesion();
  const datos = useDatos();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const enCliente = useMatch('/clientes/:id/*');
  const cliente = enCliente && datos.clientes.find((c) => c.id === enCliente.params.id);
  const [expandido, setExpandido] = useState(leerExpandido);

  const alternar = () =>
    setExpandido((v) => {
      try {
        localStorage.setItem(CLAVE_LATERAL, v ? '0' : '1');
      } catch {
        /* sin almacenamiento: solo dura esta visita */
      }
      return !v;
    });

  const params = new URLSearchParams(search);
  const lectura = params.get('lectura') === '1';
  const enReporte = pathname.endsWith('/reporte');
  const tabActual = !cliente || enReporte ? null : params.get('tab') ?? (cliente.onboarding ? 'info' : 'kpis');
  const secciones = cliente ? seccionesCliente(cliente, datos) : [];

  const destino = (item) => {
    if (item.ruta) return `/clientes/${cliente.id}/${item.ruta}${lectura ? '?lectura=1' : ''}`;
    const p = new URLSearchParams({ tab: item.tab });
    if (item.agente) p.set('agente', item.agente);
    if (item.sub) p.set('sub', item.sub);
    if (lectura) p.set('lectura', '1');
    return `/clientes/${cliente.id}?${p}`;
  };
  const esActivo = (item) => {
    if (item.ruta) return enReporte;
    if (item.tab !== tabActual) return false;
    if (item.tab !== 'equipo') return true;
    return (item.agente ?? null) === params.get('agente') && (item.sub ?? null) === params.get('sub');
  };
  const menu = { destino, esActivo };
  const trabajo = navegacion[rol].map((n) => ({ ...n, n: n.contador?.(persona, datos) ?? 0, activo: pathname.startsWith(n.a) }));

  return (
    <div className={`app${expandido ? ' app--expandido' : ''}`}>
      <aside className={`riel${expandido ? ' riel--expandido' : ''}`}>
        <Link to={inicioPorRol[rol]} className="riel__logo" title="Clusters · AgeentIA">
          {expandido ? (
            <>
              <img src="./logo-agentia-blanco.png" alt="AgeentIA" className="riel__logo-completo" />
              <span className="sidebar__producto">Clusters</span>
            </>
          ) : (
            <img src="./isotipo-agentia.png" alt="AgeentIA" />
          )}
        </Link>

        {expandido ? (
          <div className="columna">
            {rol === 'ejecutiva' && (
              <button className="boton boton--cta columna__alta" onClick={() => navigate('/alta')}>
                <UserPlus size={16} /> Dar de alta cliente
              </button>
            )}

            {cliente && (
              <div className="columna__cliente">
                <Link to="/cartera" className="columna__volver">
                  <ArrowLeft size={13} /> Cartera
                </Link>
                <div className="panel__cliente">
                  <Avatar nombre={cliente.nombre} color={cliente.color} tamano={30} />
                  <div>
                    <strong>{cliente.nombre}</strong>
                    <span>
                      {cliente.rubro} · {cliente.ciudad}
                    </span>
                  </div>
                </div>
                {secciones.map((s, i) => (
                  <div key={s.id} className="columna__seccion">
                    <div className="columna__seccion-titulo">
                      <span className="sidebar__paso">{i + 1}</span>
                      {s.titulo}
                    </div>
                    <Grupos grupos={s.grupos} modo="columna" {...menu} />
                  </div>
                ))}
              </div>
            )}

            <div className="columna__seccion-titulo">{rol === 'ejecutiva' ? 'Mi trabajo' : 'Vista'}</div>
            {trabajo.map(({ a, texto, icono: Icono, n, activo }) => (
              <Link key={a} to={a} className={`panel__item${activo ? ' activo' : ''}`}>
                <Icono size={16} /> {texto}
                {n > 0 && <span className="nav-item__contador">{n}</span>}
              </Link>
            ))}
            <Link to="/estilo" className={`panel__item${pathname === '/estilo' ? ' activo' : ''}`}>
              <Palette size={16} /> Guía de estilo
            </Link>
          </div>
        ) : (
          <>
            {rol === 'ejecutiva' && (
              <Flotante etiqueta="Dar de alta cliente" icono={UserPlus} cta activo={pathname === '/alta'} onClick={() => navigate('/alta')}>
                <PanelTitulo>Dar de alta cliente</PanelTitulo>
                <p className="panel__nota">Carga el kick-off, el brief y los accesos de un cliente nuevo.</p>
              </Flotante>
            )}

            {cliente && (
              <>
                <div className="riel__separador" />
                <Flotante etiqueta={cliente.nombre} avatar={cliente} onClick={() => navigate(destino({ tab: 'info' }))}>
                  <div className="panel__cliente">
                    <Avatar nombre={cliente.nombre} color={cliente.color} tamano={32} />
                    <div>
                      <strong>{cliente.nombre}</strong>
                      <span>
                        {cliente.rubro} · {cliente.ciudad}
                      </span>
                    </div>
                  </div>
                  <Link to="/cartera" className="panel__item">
                    <ArrowLeft size={14} /> Volver a la cartera
                  </Link>
                </Flotante>
                {secciones.map((s, i) => {
                  const items = s.grupos.flatMap((g) => g.items);
                  return (
                    <Flotante
                      key={s.id}
                      etiqueta={s.titulo}
                      icono={s.icono}
                      paso={i + 1}
                      contador={sumar(items)}
                      activo={items.some(esActivo)}
                      onClick={() => navigate(destino(items[0]))}
                    >
                      <PanelTitulo paso={i + 1}>{s.titulo}</PanelTitulo>
                      <Grupos grupos={s.grupos} modo="flotante" {...menu} />
                    </Flotante>
                  );
                })}
              </>
            )}

            <div className="riel__separador" />
            {trabajo.map(({ a, texto, icono, n, activo }) => (
              <Flotante key={a} etiqueta={texto} icono={icono} contador={n} activo={activo} onClick={() => navigate(a)}>
                <PanelTitulo>{rol === 'ejecutiva' ? 'Mi trabajo' : 'Vista'}</PanelTitulo>
                <Link to={a} className={`panel__item${activo ? ' activo' : ''}`}>
                  {texto}
                  {n > 0 && <span className="nav-item__contador">{n}</span>}
                </Link>
              </Flotante>
            ))}
          </>
        )}

        <div className="riel__pie">
          {!expandido && (
            <Flotante etiqueta="Guía de estilo" icono={Palette} activo={pathname === '/estilo'} onClick={() => navigate('/estilo')}>
              <Link to="/estilo" className="panel__item">
                Guía de estilo
              </Link>
            </Flotante>
          )}
          <button type="button" className="riel__expandir" onClick={alternar} title={expandido ? 'Contraer menú' : 'Ver menú completo'}>
            {expandido ? (
              <>
                <ChevronsLeft size={18} /> Contraer
              </>
            ) : (
              <ChevronsRight size={18} />
            )}
          </button>
        </div>
      </aside>

      <div className="principal">
        <Topbar />
        <main className="contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function PanelTitulo({ paso, children }) {
  return (
    <div className="panel__titulo">
      {paso && <span className="sidebar__paso">{paso}</span>}
      {children}
    </div>
  );
}

/** Grupos de una sección. Los grupos de servicio se muestran como una fila que despliega sus subservicios. */
function Grupos({ grupos, modo, destino, esActivo }) {
  return grupos.map((g, gi) =>
    g.servicio ? (
      <FilaServicio key={g.servicio} grupo={g} modo={modo} destino={destino} esActivo={esActivo} />
    ) : (
      <div key={g.titulo ?? gi} className="panel__grupo">
        {g.titulo && <div className="panel__grupo-titulo">{g.titulo}</div>}
        {g.items.map((it) => (
          <Link key={it.nombre} to={destino(it)} className={`panel__item${it.sutil ? ' panel__item--sutil' : ''}${esActivo(it) ? ' activo' : ''}`}>
            {it.nombre}
            {it.contador > 0 && <span className="nav-item__contador">{it.contador}</span>}
          </Link>
        ))}
      </div>
    ),
  );
}

/**
 * Un servicio contratado. En el panel flotante, al pasar el mouse abre un submenú a la derecha con
 * todos sus subservicios; en la columna completa es un acordeón (abierto si contiene la vista actual).
 */
function FilaServicio({ grupo: g, modo, destino, esActivo }) {
  const contieneActivo = g.items.some(esActivo);
  const [abierto, setAbierto] = useState(contieneActivo);
  const [pos, setPos] = useState(null);
  const ref = useRef();
  const cierre = useRef();

  const lista = g.items.map((it) => (
    <Link key={it.nombre} to={destino(it)} className={`panel__item${it.sub ? ' panel__item--sub' : ''}${esActivo(it) ? ' activo' : ''}`}>
      {it.nombre}
      {it.contador > 0 && <span className="nav-item__contador">{it.contador}</span>}
    </Link>
  ));

  if (modo === 'columna') {
    return (
      <div className="servicio">
        <button type="button" className={`panel__item servicio__fila${contieneActivo ? ' servicio__fila--activa' : ''}`} onClick={() => setAbierto((v) => !v)}>
          {abierto ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          {g.titulo}
          {g.contador > 0 && <span className="nav-item__contador">{g.contador}</span>}
        </button>
        {abierto && <div className="servicio__subs">{lista}</div>}
      </div>
    );
  }

  const abrir = () => {
    clearTimeout(cierre.current);
    const r = ref.current.getBoundingClientRect();
    const alto = window.innerHeight;
    const top = Math.max(8, Math.min(r.top - 10, alto - (g.items.length * 37 + 70)));
    setPos({ top, left: r.right + 2, maxHeight: alto - top - 12 });
  };
  const cerrar = () => {
    cierre.current = setTimeout(() => setPos(null), 120);
  };

  return (
    <div ref={ref} onMouseEnter={abrir} onMouseLeave={cerrar}>
      <Link to={destino(g.items[0])} className={`panel__item servicio__fila${contieneActivo || pos ? ' servicio__fila--activa' : ''}`}>
        {g.titulo}
        {g.contador > 0 && <span className="nav-item__contador">{g.contador}</span>}
        <ChevronRight size={15} className="servicio__flecha" />
      </Link>
      {pos && (
        <div className="panel panel--sub" style={pos}>
          <PanelTitulo>{g.titulo}</PanelTitulo>
          {lista}
        </div>
      )}
    </div>
  );
}

/** Botón del riel con su panel flotante. El panel es `position: fixed` y se ajusta al alto de la ventana. */
function Flotante({ etiqueta, icono: Icono, avatar, paso, contador, activo, cta, onClick, children }) {
  const [pos, setPos] = useState(null);
  const cierre = useRef();
  const ref = useRef();

  const abrir = () => {
    clearTimeout(cierre.current);
    const r = ref.current.getBoundingClientRect();
    const alto = window.innerHeight;
    const top = Math.max(8, Math.min(r.top - 8, alto - 360));
    setPos({ top, maxHeight: alto - top - 12 });
  };
  const cerrar = () => {
    cierre.current = setTimeout(() => setPos(null), 150);
  };

  return (
    <div className="riel__slot" ref={ref} onMouseEnter={abrir} onMouseLeave={cerrar}>
      <button
        type="button"
        className={`riel__boton${activo ? ' activo' : ''}${cta ? ' riel__boton--cta' : ''}`}
        aria-label={etiqueta}
        onClick={() => {
          setPos(null);
          onClick?.();
        }}
      >
        {avatar ? <Avatar nombre={avatar.nombre} color={avatar.color} tamano={30} /> : <Icono size={20} />}
        {paso && <span className="riel__paso">{paso}</span>}
        {contador > 0 && <span className="riel__contador">{contador}</span>}
      </button>
      {pos && (
        <div className="panel" style={pos} onClick={(e) => e.target.closest('a') && setPos(null)}>
          {children}
        </div>
      )}
    </div>
  );
}

const nombreSeccion = {
  cartera: 'Cartera',
  aprobaciones: 'Aprobaciones',
  oportunidades: 'Oportunidades',
  escalados: 'Escalados',
  clientes: 'Cliente',
  alta: 'Dar de alta cliente',
  casos: 'Casos escalados',
  equipo: 'Tablero del equipo',
  estilo: 'Guía de estilo',
};

function Topbar() {
  const { rol, persona, cambiarRol, cambiarPersona } = useSesion();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const seccion = nombreSeccion[pathname.split('/')[1]] ?? '';

  return (
    <div className="topbar">
      <div className="topbar__ruta">
        <BriefcaseBusiness size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
        Clusters / <strong>{seccion}</strong>
      </div>

      <div className="topbar__acciones">
        <label className="selector-rol">
          Ver como
          <select
            value={rol}
            onChange={(e) => {
              cambiarRol(e.target.value);
              navigate(inicioPorRol[e.target.value]);
            }}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
          {personasPorRol[rol].length > 1 && (
            <select value={persona.id} onChange={(e) => cambiarPersona(e.target.value)}>
              {personasPorRol[rol].map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                  {p.canal ? ` · ${p.canal}` : ''}
                </option>
              ))}
            </select>
          )}
        </label>
        <Avatar nombre={persona.nombre} texto={persona.iniciales} color={persona.color} redondo tamano={36} />
      </div>
    </div>
  );
}
