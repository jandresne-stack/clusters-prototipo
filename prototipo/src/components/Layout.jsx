import { Link, NavLink, Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { seccionesCliente } from '../lib/navCliente.js';
import {
  BriefcaseBusiness,
  Inbox,
  LayoutGrid,
  LifeBuoy,
  Palette,
  Sparkles,
  UserPlus,
  Users,
  Library,
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

export function Layout() {
  const { rol, persona } = useSesion();
  const datos = useDatos();
  const navigate = useNavigate();
  const enCliente = useMatch('/clientes/:id/*');
  const cliente = enCliente && datos.clientes.find((c) => c.id === enCliente.params.id);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar__logo">
          <img src="./logo-agentia-blanco.png" alt="AgeentIA · CRM + AI all in one" />
          <span className="sidebar__producto">Clusters</span>
        </div>

        {rol === 'ejecutiva' && (
          <button className="boton boton--cta" style={{ margin: '0 4px 8px' }} onClick={() => navigate('/alta')}>
            <UserPlus size={16} /> Dar de alta cliente
          </button>
        )}

        {cliente && <MenuCliente cliente={cliente} datos={datos} />}

        <div className="sidebar__seccion">{rol === 'ejecutiva' ? 'Mi trabajo' : 'Vista'}</div>
        {navegacion[rol].map(({ a, texto, icono: Icono, contador }) => {
          const n = contador?.(persona, datos);
          return (
            <NavLink key={a} to={a} className={({ isActive }) => `nav-item${cliente ? ' nav-item--compacto' : ''}${isActive ? ' activo' : ''}`}>
              <Icono size={cliente ? 16 : 18} />
              {texto}
              {n > 0 && <span className="nav-item__contador">{n}</span>}
            </NavLink>
          );
        })}

        {/* Agentes reales: biblioteca con todos los agentes y proyectos sueltos por cliente */}
        <div className="sidebar__seccion">Agentes IA</div>
        <NavLink
          to="/agentes"
          className={({ isActive }) => `nav-item${isActive ? ' activo' : ''}`}
          title={datos.motor.conectado === false ? 'Motor de agentes desconectado' : 'Motor de agentes conectado'}
        >
          <Library size={18} /> Biblioteca de agentes
          <span className={`estado-motor estado-motor--${datos.motor.conectado === false ? 'off' : datos.motor.conectado ? 'on' : 'espera'}`} />
        </NavLink>

        <div className="sidebar__pie">
          <NavLink to="/estilo" className={({ isActive }) => `nav-item${isActive ? ' activo' : ''}`}>
            <Palette size={18} /> Guía de estilo
          </NavLink>
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

/** Menú del cliente abierto, en el orden del recorrido: cliente → comercial/CRM → servicios → resultados. */
function MenuCliente({ cliente, datos }) {
  const { pathname, search } = useLocation();
  const params = new URLSearchParams(search);
  const lectura = params.get('lectura') === '1';
  const enReporte = pathname.endsWith('/reporte');
  // El chat con un agente (/clientes/:id/agentes/:canal) cuenta como la sección de ese servicio.
  const chat = pathname.match(/\/agentes\/([^/]+)/);
  const tabActual = enReporte ? null : chat ? 'equipo' : params.get('tab') ?? (cliente.onboarding ? 'info' : 'kpis');
  const agenteActual = chat ? decodeURIComponent(chat[1]) : params.get('agente');

  const destino = (item) => {
    if (item.ruta) return `/clientes/${cliente.id}/${item.ruta}${lectura ? '?lectura=1' : ''}`;
    const p = new URLSearchParams({ tab: item.tab });
    if (item.agente) p.set('agente', item.agente);
    if (lectura) p.set('lectura', '1');
    return `/clientes/${cliente.id}?${p}`;
  };
  const esActivo = (item) =>
    item.ruta ? enReporte && pathname.endsWith(`/${item.ruta}`) : item.tab === tabActual && (item.agente ?? null) === (item.tab === 'equipo' ? agenteActual : null);

  return (
    <div className="menu-cliente">
      <div className="menu-cliente__cabecera">
        <Avatar nombre={cliente.nombre} color={cliente.color} tamano={28} />
        <span>{cliente.nombre}</span>
      </div>
      {seccionesCliente(cliente, datos).map((seccion, i) => (
        <div key={seccion.titulo}>
          <div className="sidebar__seccion sidebar__seccion--paso">
            <span className="sidebar__paso">{i + 1}</span>
            {seccion.titulo}
          </div>
          {seccion.items.map((item) => {
            const Icono = item.icono;
            return (
              <Link
                key={item.nombre}
                to={destino(item)}
                className={`nav-item${item.sutil ? ' nav-item--sutil' : ''}${esActivo(item) ? ' activo' : ''}`}
              >
                <Icono size={17} />
                {item.nombre}
                {item.contador > 0 && <span className="nav-item__contador">{item.contador}</span>}
              </Link>
            );
          })}
        </div>
      ))}
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
  agentes: 'Biblioteca de agentes',
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
