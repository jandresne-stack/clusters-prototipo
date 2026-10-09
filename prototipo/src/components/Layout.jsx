import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BriefcaseBusiness,
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

export function Layout() {
  const { rol, persona } = useSesion();
  const datos = useDatos();
  const navigate = useNavigate();

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

        <div className="sidebar__seccion">{rol === 'ejecutiva' ? 'Mi trabajo' : 'Vista'}</div>
        {navegacion[rol].map(({ a, texto, icono: Icono, contador }) => {
          const n = contador?.(persona, datos);
          return (
            <NavLink key={a} to={a} className={({ isActive }) => `nav-item${isActive ? ' activo' : ''}`}>
              <Icono size={18} />
              {texto}
              {n > 0 && <span className="nav-item__contador">{n}</span>}
            </NavLink>
          );
        })}

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
