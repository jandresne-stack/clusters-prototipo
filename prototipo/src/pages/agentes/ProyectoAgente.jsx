import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Download, FileText, Trash2, X } from 'lucide-react';
import { actualizarProyecto, borrarEntregable, borrarProyecto, limpiarChat, proyecto as cargarProyecto, urlEntregable } from '../../lib/motor.js';
import { Alerta, EstadoVacio } from '../../components/ui.jsx';
import { Conversacion } from '../../components/Conversacion.jsx';
import { Markdown } from '../../components/Markdown.jsx';
import { FormProyecto } from './FormProyecto.jsx';
import { IconoAgente, rutaProyecto, useCatalogo } from './Biblioteca.jsx';
import { canalDeAgente, useEquipo } from '../../lib/equipo.js';

const sugerencias = [
  'Revisa el sitio web del cliente y dame un diagnóstico inicial.',
  'Resume el brief y dime qué información falta para trabajar bien.',
  'Propón un plan de trabajo priorizado para los próximos 90 días.',
  'Analiza a los competidores y dime dónde están las oportunidades.',
];

const tamano = (b) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`);

/** Proyecto de la Biblioteca: chat aislado con un agente para un cliente, con su ficha y entregables. */
export function ProyectoAgente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { datos: catalogo } = useCatalogo();
  const equipo = useEquipo();
  const [p, setP] = useState(null);
  const [error, setError] = useState('');
  const [pestana, setPestana] = useState('ficha');
  const [vista, setVista] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const d = await cargarProyecto(id);
      setP(d);
      setError('');
      return d;
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    cargar().then((d) => d?.deliverables.length && setPestana('entregables'));
  }, [cargar]);

  useEffect(() => {
    if (!p?.trabajando) return;
    const t = setInterval(cargar, 4000);
    return () => clearInterval(t);
  }, [p?.trabajando, cargar]);

  // Los proyectos de clientes de Clusters viven en la ficha del cliente
  useEffect(() => {
    if (p?.project.externo?.app === 'clusters') navigate(rutaProyecto(p.project), { replace: true });
  }, [p, navigate]);

  if (error) return <Alerta tipo="error">{error}</Alerta>;
  if (!p) return <p className="atenuado texto-sm">Abriendo el proyecto…</p>;

  const { project, messages, deliverables } = p;
  const agente = catalogo?.todos.find((a) => a.id === project.agentId);
  const costo = messages.reduce((s, m) => s + (m.cost ?? 0), 0);

  async function abrir(nombre) {
    const r = await fetch(urlEntregable(project.id, nombre));
    setVista({ nombre, contenido: await r.text() });
  }

  return (
    <>
      <Link to={`/agentes/agente/${project.agentId}`} className="texto-sm enlace-volver">
        <ArrowLeft size={14} /> {agente?.name ?? 'Agente'}
      </Link>
      <header className="chat-agente__cabecera">
        <div className="fila" style={{ gap: 14 }}>
          {agente && <IconoAgente agente={agente} tamano={52} estado={p.trabajando ? 'trabajando' : 'reposo'} />}
          <div style={{ minWidth: 0 }}>
            <h1>{project.titulo}</h1>
            <div className="texto-sm atenuado">
              {agente?.name} · {project.cliente} · {project.modelo}
              {costo > 0 && ` · $${costo.toFixed(3)} USD`}
            </div>
          </div>
        </div>
        <div className="fila">
          <button
            className="boton boton--fantasma"
            onClick={async () => {
              if (!confirm('¿Borrar el historial de este chat? La ficha y los entregables se conservan.')) return;
              await limpiarChat(project.id);
              cargar();
            }}
          >
            Limpiar chat
          </button>
          <button
            className="boton boton--peligro"
            onClick={async () => {
              if (!confirm(`¿Eliminar el proyecto "${project.titulo}" con su chat y entregables? No se puede deshacer.`)) return;
              await borrarProyecto(project.id);
              navigate(`/agentes/agente/${project.agentId}`);
            }}
          >
            <Trash2 size={14} /> Eliminar
          </button>
        </div>
      </header>

      {catalogo && !catalogo.configurado && (
        <div style={{ marginBottom: 12 }}>
          <Alerta tipo="aviso">Falta la clave de OpenRouter en agency-agents/panel/.env.local: el agente no podrá responder.</Alerta>
        </div>
      )}

      <div className="chat-agente chat-agente--ancho">
        <Conversacion
          proyectoId={project.id}
          nombreAgente={agente?.name ?? 'Agente'}
          semilla={project.agentId}
          canal={canalDeAgente(equipo, project.agentId)}
          mensajes={messages}
          trabajandoFondo={Boolean(p.trabajando)}
          sugerencias={sugerencias}
          vacio={{ titulo: `${agente?.name ?? 'El agente'} ya tiene la ficha de ${project.cliente}`, texto: 'Escríbele o empieza con una sugerencia.' }}
          alEvento={(e) => e.type === 'tool_end' && e.deliverable && setPestana('entregables')}
          alTerminar={cargar}
        />

        <aside className="tarjeta" style={{ padding: 0 }}>
          <div className="pestanas-lateral">
            <button className={pestana === 'entregables' ? 'activa' : ''} onClick={() => setPestana('entregables')}>
              Entregables ({deliverables.length})
            </button>
            <button className={pestana === 'ficha' ? 'activa' : ''} onClick={() => setPestana('ficha')}>
              Ficha del cliente
            </button>
          </div>
          <div style={{ padding: 16, maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
            {pestana === 'entregables' ? (
              deliverables.length ? (
                <ul className="lista-propuestas">
                  {deliverables.map((d) => (
                    <li key={d.name}>
                      <button className="enlace-boton" onClick={() => abrir(d.name)}>
                        <FileText size={13} style={{ verticalAlign: -2 }} /> {d.name}
                      </button>
                      <span className="fila" style={{ gap: 4 }}>
                        <span className="texto-xs atenuado">{tamano(d.size)}</span>
                        <a href={urlEntregable(project.id, d.name, true)} title="Descargar" className="boton boton--fantasma" style={{ padding: 4 }}>
                          <Download size={14} />
                        </a>
                        <button
                          className="boton boton--fantasma"
                          style={{ padding: 4, color: 'var(--salud-rojo)' }}
                          title="Eliminar"
                          onClick={async () => {
                            if (!confirm(`¿Eliminar ${d.name}?`)) return;
                            await borrarEntregable(project.id, d.name);
                            cargar();
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EstadoVacio titulo="Aún no hay entregables">
                  <p className="texto-sm atenuado">Aquí quedan los archivos del agente: sitemaps, auditorías, planes de keywords, copys… Pídele “guárdalo como entregable”.</p>
                </EstadoVacio>
              )
            ) : (
              <FormProyecto
                inicial={project}
                modeloPorDefecto={catalogo?.modeloPorDefecto}
                textoBoton="Guardar ficha"
                compacto
                alGuardar={async (d) => {
                  await actualizarProyecto(project.id, d);
                  cargar();
                }}
              />
            )}
          </div>
        </aside>
      </div>

      {vista && (
        <div className="modal-fondo" onClick={() => setVista(null)}>
          <div className="modal-entregable" onClick={(e) => e.stopPropagation()}>
            <div className="fila" style={{ justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--azul-200)' }}>
              <strong style={{ color: 'var(--azul-900)' }}>{vista.nombre}</strong>
              <div className="fila" style={{ gap: 6 }}>
                <a className="boton boton--secundario" href={urlEntregable(project.id, vista.nombre, true)}>
                  <Download size={14} /> Descargar
                </a>
                <button className="boton boton--secundario" onClick={() => navigator.clipboard.writeText(vista.contenido)}>
                  <Copy size={14} /> Copiar
                </button>
                <button className="boton boton--fantasma" onClick={() => setVista(null)}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <div style={{ padding: '16px 20px', overflow: 'auto' }}>
              {vista.nombre.endsWith('.md') ? <Markdown>{vista.contenido}</Markdown> : <pre className="texto-sm" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{vista.contenido}</pre>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
