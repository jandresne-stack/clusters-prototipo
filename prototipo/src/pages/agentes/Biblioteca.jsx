import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, FolderOpen, Plus, Search } from 'lucide-react';
import { catalogo as cargarCatalogo, crearProyecto, proyectos as listarProyectos } from '../../lib/motor.js';
import { Alerta, Chip, Encabezado, EstadoVacio } from '../../components/ui.jsx';
import { FormProyecto, proyectoVacio } from './FormProyecto.jsx';
import { FormaAgente } from '../../components/FormaAgente.jsx';
import { canalDeAgente, useEquipo } from '../../lib/equipo.js';
import '../../styles/cliente.css';

// ---------- Datos compartidos ----------

let cache = null;

/** Catálogo del motor (carpetas y agentes). Se muestra lo último conocido y se refresca al entrar. */
export function useCatalogo() {
  const [estado, setEstado] = useState({ datos: cache, error: '' });
  useEffect(() => {
    cargarCatalogo()
      .then((d) => {
        cache = d;
        setEstado({ datos: d, error: '' });
      })
      .catch(() =>
        setEstado({ datos: null, error: 'No hay conexión con el motor de agentes. Arráncalo con: npm --prefix panel run dev (en agency-agents).' }),
      );
  }, []);
  return estado;
}

function useProyectos(agentId) {
  const [lista, setLista] = useState(null);
  useEffect(() => {
    listarProyectos(agentId).then(setLista).catch(() => setLista([]));
  }, [agentId]);
  return lista;
}

const fechaCorta = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Los proyectos de clientes de Clusters se abren desde la ficha del cliente; los sueltos, en la Biblioteca. */
export function rutaProyecto(p) {
  return p.externo?.app === 'clusters'
    ? `/clientes/${p.externo.clienteId}/agentes/${p.externo.canal}?agente=${encodeURIComponent(p.agentId)}`
    : `/agentes/proyectos/${p.id}`;
}

function Cargando({ error }) {
  if (error) return <Alerta tipo="error">{error}</Alerta>;
  return <p className="atenuado texto-sm">Cargando agentes…</p>;
}

/** Forma del agente: la misma que tiene en el equipo de los clientes de Clusters. */
export function IconoAgente({ agente, tamano = 40, estado }) {
  const equipo = useEquipo();
  return <FormaAgente semilla={agente.id} canal={canalDeAgente(equipo, agente.id)} tamano={tamano} estado={estado} titulo={agente.name} />;
}

function TarjetaAgente({ agente, proyectos }) {
  return (
    <Link to={`/agentes/agente/${agente.id}`} className="tarjeta tarjeta-enlace">
      <div className="fila" style={{ gap: 12, marginBottom: 8 }}>
        <IconoAgente agente={agente} />
        <h3 style={{ margin: 0 }}>{agente.name}</h3>
      </div>
      <p className="texto-sm atenuado recorte-3">{agente.description}</p>
      <div className="fila fila--envolver" style={{ gap: 6, marginTop: 10 }}>
        {agente.source === 'claude' && <Chip variante="agente">Mis agentes</Chip>}
        {proyectos != null && <Chip variante="suave">{proyectos} {proyectos === 1 ? 'proyecto' : 'proyectos'}</Chip>}
      </div>
    </Link>
  );
}

export function ListaProyectos({ lista, agentes, vacio = 'Todavía no hay proyectos.' }) {
  if (!lista) return <p className="atenuado texto-sm">Cargando proyectos…</p>;
  if (!lista.length) return <EstadoVacio titulo={vacio} />;
  const porId = Object.fromEntries((agentes ?? []).map((a) => [a.id, a]));
  return (
    <div className="tarjeta" style={{ padding: 0 }}>
      <table className="tabla">
        <thead>
          <tr>
            <th>Proyecto</th>
            <th>Agente</th>
            <th>Sitio</th>
            <th>Actualizado</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((p) => (
            <tr key={p.id}>
              <td>
                <Link to={rutaProyecto(p)} style={{ fontWeight: 700, color: 'var(--azul-900)' }}>
                  {p.titulo}
                </Link>
                {p.titulo !== p.cliente && <div className="texto-xs atenuado">{p.cliente}</div>}
                {p.externo?.app === 'clusters' && (
                  <div style={{ marginTop: 4 }}>
                    <Chip variante="suave">Cliente de Clusters</Chip>
                  </div>
                )}
              </td>
              <td>{porId[p.agentId] ? `${porId[p.agentId].emoji} ${porId[p.agentId].name}` : p.agentId}</td>
              <td className="texto-sm">{p.url || <span className="atenuado">—</span>}</td>
              <td className="texto-sm">{fechaCorta.format(new Date(p.updatedAt))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- /agentes : carpetas ----------

export function Biblioteca() {
  const { datos, error } = useCatalogo();
  const proyectos = useProyectos();
  const [busqueda, setBusqueda] = useState('');

  const encontrados = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    if (!t || !datos) return null;
    return datos.todos.filter((a) => a.name.toLowerCase().includes(t) || a.description.toLowerCase().includes(t)).slice(0, 24);
  }, [busqueda, datos]);

  return (
    <>
      <Encabezado
        titulo="Biblioteca de agentes"
        descripcion="Elige una carpeta, entra a un agente y abre un proyecto por cliente. Cada proyecto tiene su propio chat, brief y entregables, aislados de los demás."
      >
        <Link to="/agentes/proyectos" className="boton boton--secundario">
          <Briefcase size={16} /> Mis proyectos
        </Link>
      </Encabezado>

      {!datos ? (
        <Cargando error={error} />
      ) : (
        <>
          {!datos.configurado && (
            <div style={{ marginBottom: 16 }}>
              <Alerta tipo="aviso">Falta la clave de OpenRouter en agency-agents/panel/.env.local: los agentes no podrán responder.</Alerta>
            </div>
          )}

          <div className="buscador-agentes">
            <Search size={16} />
            <input className="campo-texto" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder={`Buscar entre los ${datos.todos.length} agentes (SEO, Meta, email…)`} />
          </div>

          {encontrados ? (
            encontrados.length ? (
              <div className="rejilla rejilla-3">
                {encontrados.map((a) => (
                  <TarjetaAgente key={a.id} agente={a} />
                ))}
              </div>
            ) : (
              <EstadoVacio titulo={`Ningún agente coincide con “${busqueda}”`} />
            )
          ) : (
            <div className="rejilla rejilla-3">
              {datos.categorias.map((c) => {
                const ids = new Set(c.agentes.map((a) => a.id));
                const n = proyectos?.filter((p) => ids.has(p.agentId)).length;
                return (
                  <Link key={c.id} to={`/agentes/carpeta/${c.id}`} className="tarjeta tarjeta-enlace">
                    <div className="fila" style={{ gap: 12, marginBottom: 8 }}>
                      <span className="emoji-agente" style={{ background: `${c.color}22` }}>
                        {c.icono}
                      </span>
                      <h3 style={{ margin: 0 }}>{c.nombre}</h3>
                    </div>
                    <p className="texto-sm atenuado">{c.descripcion}</p>
                    <div className="fila" style={{ gap: 6, marginTop: 10 }}>
                      <Chip variante="suave">
                        <FolderOpen size={12} style={{ verticalAlign: -1 }} /> {c.agentes.length} agentes
                      </Chip>
                      {n != null && <Chip variante="suave">{n} proyectos</Chip>}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="seccion-titulo" style={{ marginTop: 28 }}>
            <h2>Proyectos recientes</h2>
          </div>
          <ListaProyectos lista={proyectos?.slice(0, 8)} agentes={datos.todos} vacio="Todavía no hay proyectos: entra a un agente y crea el primero." />
        </>
      )}
    </>
  );
}

// ---------- /agentes/carpeta/:id ----------

export function Carpeta() {
  const { id } = useParams();
  const { datos, error } = useCatalogo();
  const proyectos = useProyectos();
  const carpeta = datos?.categorias.find((c) => c.id === id);

  return (
    <>
      <Link to="/agentes" className="texto-sm enlace-volver">
        <ArrowLeft size={14} /> Biblioteca de agentes
      </Link>
      {!datos ? (
        <Cargando error={error} />
      ) : !carpeta ? (
        <EstadoVacio titulo="Carpeta no encontrada" />
      ) : (
        <>
          <Encabezado titulo={`${carpeta.icono} ${carpeta.nombre}`} descripcion={carpeta.descripcion} />
          <div className="rejilla rejilla-3">
            {carpeta.agentes.map((a) => (
              <TarjetaAgente key={a.id} agente={a} proyectos={proyectos?.filter((p) => p.agentId === a.id).length} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

// ---------- /agentes/agente/:agentId ----------

export function AgenteBiblioteca() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { datos, error } = useCatalogo();
  const proyectos = useProyectos(agentId);
  const [nuevo, setNuevo] = useState(false);
  const agente = datos?.todos.find((a) => a.id === agentId);
  const carpeta = datos?.categorias.find((c) => c.agentes.some((a) => a.id === agentId));

  async function crear(d) {
    const p = await crearProyecto({ ...d, agentId });
    navigate(`/agentes/proyectos/${p.id}`);
  }

  if (!datos) return <Cargando error={error} />;
  if (!agente) return <EstadoVacio titulo="Agente no encontrado" />;
  const abierto = nuevo || proyectos?.length === 0;

  return (
    <>
      <Link to={carpeta ? `/agentes/carpeta/${carpeta.id}` : '/agentes'} className="texto-sm enlace-volver">
        <ArrowLeft size={14} /> {carpeta ? carpeta.nombre : 'Biblioteca de agentes'}
      </Link>
      <header className="chat-agente__cabecera">
        <div className="fila" style={{ gap: 14, alignItems: 'flex-start' }}>
          <IconoAgente agente={agente} tamano={52} />
          <div>
            <h1>{agente.name}</h1>
            <p className="texto-sm atenuado" style={{ maxWidth: 760, marginTop: 4 }}>
              {agente.description}
            </p>
          </div>
        </div>
        {!abierto && (
          <button className="boton boton--primario" onClick={() => setNuevo(true)}>
            <Plus size={16} /> Nuevo proyecto
          </button>
        )}
      </header>

      {abierto && (
        <section className="tarjeta" style={{ marginBottom: 24 }}>
          <div className="fila" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
            <h3>Nuevo proyecto con {agente.name}</h3>
            {nuevo && (
              <button className="boton boton--fantasma" onClick={() => setNuevo(false)}>
                Cancelar
              </button>
            )}
          </div>
          <FormProyecto inicial={proyectoVacio} modeloPorDefecto={datos.modeloPorDefecto} textoBoton="Crear proyecto y abrir chat" alGuardar={crear} />
        </section>
      )}

      <div className="seccion-titulo">
        <h2>Proyectos con este agente</h2>
      </div>
      <ListaProyectos lista={proyectos} agentes={datos.todos} vacio="Crea el primer proyecto para un cliente." />
    </>
  );
}

// ---------- /agentes/proyectos ----------

export function MisProyectos() {
  const { datos } = useCatalogo();
  const proyectos = useProyectos();
  return (
    <>
      <Link to="/agentes" className="texto-sm enlace-volver">
        <ArrowLeft size={14} /> Biblioteca de agentes
      </Link>
      <Encabezado
        titulo="Mis proyectos"
        descripcion="Todas las conversaciones con agentes: las de la Biblioteca y las de los equipos de tus clientes de Clusters. Cada una es independiente."
      />
      <ListaProyectos lista={proyectos} agentes={datos?.todos} vacio="Todavía no hay proyectos." />
    </>
  );
}
