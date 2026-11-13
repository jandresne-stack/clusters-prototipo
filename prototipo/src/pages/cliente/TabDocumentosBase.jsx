import { useCallback, useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, CircleDashed, Download, Loader, Pencil, RefreshCw, Sparkles, TriangleAlert, X } from 'lucide-react';
import { actualizarDocumentoBase, documentosBase, generarDocumentosBase } from '../../lib/motor.js';
import { fichaParaAgente } from '../../lib/fichaAgente.js';
import { Alerta, Chip } from '../../components/ui.jsx';
import { Markdown } from '../../components/Markdown.jsx';
import '../../styles/agentes-reales.css';

const fecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function EstadoDoc({ doc }) {
  if (doc.estado === 'generando')
    return (
      <Chip variante="agente">
        <Loader size={12} className="girando" /> Investigando y escribiendo…
      </Chip>
    );
  if (doc.estado === 'pendiente') return <Chip variante="suave">{doc.contenido ? 'En cola para regenerar' : 'Sin generar'}</Chip>;
  if (doc.estado === 'error') return <Chip variante="rojo">Error</Chip>;
  if (doc.revisado) return <Chip variante="verde" icono={CheckCircle2}>Revisado</Chip>;
  return <Chip variante="amarillo">Listo · sin revisar</Chip>;
}

/**
 * Documentos base del cliente (estilo "handoff"): un investigador los escribe con la ficha, el
 * sitio y la web, y todos los agentes de este cliente los leen antes de trabajar.
 */
export function TabDocumentosBase({ cliente, lectura }) {
  const [estado, setEstado] = useState(null);
  const [error, setError] = useState('');
  const [abierto, setAbierto] = useState(null); // id del documento
  const [editando, setEditando] = useState(null); // texto en edición

  const cargar = useCallback(async () => {
    try {
      setEstado(await documentosBase(cliente.id));
      setError('');
    } catch (e) {
      setError(e.message.includes('motor') ? e.message : 'No hay conexión con el motor de agentes.');
    }
  }, [cliente.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Mientras el investigador trabaja, se refresca solo
  useEffect(() => {
    if (!estado?.generando) return;
    const t = setInterval(cargar, 3000);
    return () => clearInterval(t);
  }, [estado?.generando, cargar]);

  async function generar(ids) {
    setError('');
    try {
      setEstado(await generarDocumentosBase(cliente.id, fichaParaAgente(cliente), ids));
    } catch (e) {
      setError(e.message);
    }
  }

  async function guardar(docId, cambios) {
    try {
      setEstado(await actualizarDocumentoBase(cliente.id, docId, cambios));
    } catch (e) {
      setError(e.message);
    }
  }

  if (!estado) return error ? <Alerta tipo="error">{error}</Alerta> : <p className="atenuado texto-sm">Cargando documentos base…</p>;

  const docs = estado.documentos;
  const listos = docs.filter((d) => d.estado === 'listo').length;
  const ninguno = docs.every((d) => !d.contenido);
  const doc = docs.find((d) => d.id === abierto);

  const descargar = (d) => {
    const url = URL.createObjectURL(new Blob([d.contenido], { type: 'text/markdown' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `${cliente.id}-${d.id}.md` });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="seccion-titulo">
        <div>
          <h2>Documentos base</h2>
          <p className="texto-sm atenuado" style={{ marginTop: 4, maxWidth: 760 }}>
            Todos los agentes de {cliente.nombre} leen estos documentos antes de trabajar, así nadie se sale del mensaje. Los escribe un investigador con la
            ficha del cliente, su sitio web y la competencia. Revísalos y corrígelos: lo que edites es lo que leerán los agentes.
          </p>
        </div>
        {!lectura && (
          <button className="boton boton--primario" onClick={() => generar()} disabled={estado.generando}>
            {estado.generando ? <Loader size={16} className="girando" /> : <Sparkles size={16} />}
            {estado.generando ? 'Generando…' : ninguno ? 'Generar documentos base' : 'Regenerar todos'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ marginBottom: 12 }}>
          <Alerta tipo="error">{error}</Alerta>
        </div>
      )}
      {ninguno && !estado.generando && (
        <div style={{ marginBottom: 16 }}>
          <Alerta tipo="info">
            Este cliente aún no tiene documentos base. Generarlos toma unos minutos (el investigador revisa el sitio y busca a la competencia) y
            cuesta aproximadamente lo mismo que unas pocas conversaciones con un agente.
            {!cliente.borrador?.url && ' No hay URL del sitio en la ficha: el investigador trabajará con el brief y lo que encuentre en la web.'}
          </Alerta>
        </div>
      )}

      <div className="fila fila--envolver" style={{ gap: 8, marginBottom: 14 }}>
        <Chip variante="suave">
          {listos} de {docs.length} listos
        </Chip>
        <Chip variante="suave">{docs.filter((d) => d.revisado).length} revisados</Chip>
        {estado.costoTotal > 0 && <Chip variante="suave">Costo acumulado: ${estado.costoTotal.toFixed(2)} USD</Chip>}
      </div>

      <div className="rejilla rejilla-3">
        {docs.map((d, i) => (
          <article key={d.id} className={`tarjeta doc-base doc-base--${d.estado}`}>
            <div className="fila" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="doc-base__numero">{i + 1}</span>
              <EstadoDoc doc={d} />
            </div>
            <h3>{d.nombre}</h3>
            <p className="texto-sm atenuado">{d.descripcion}</p>
            {d.estado === 'error' && (
              <p className="texto-xs" style={{ color: 'var(--salud-rojo)' }}>
                <TriangleAlert size={12} style={{ verticalAlign: -2 }} /> {d.error}
              </p>
            )}
            {d.actualizado && (
              <p className="texto-xs atenuado">
                {d.editado ? 'Editado' : 'Generado'} {fecha.format(new Date(d.actualizado))}
                {d.fuentes?.length ? ` · ${d.fuentes.length} fuentes` : ''}
              </p>
            )}
            <div className="fila fila--envolver" style={{ gap: 6, marginTop: 'auto' }}>
              {d.contenido ? (
                <button className="boton boton--secundario" onClick={() => setAbierto(d.id)}>
                  <BookOpen size={14} /> Ver
                </button>
              ) : (
                <span className="texto-xs atenuado">
                  <CircleDashed size={12} style={{ verticalAlign: -2 }} /> Aún no existe
                </span>
              )}
              {!lectura && d.contenido && !estado.generando && (
                <button className="boton boton--fantasma" onClick={() => generar([d.id])} title="Volver a investigar y escribir solo este documento">
                  <RefreshCw size={14} /> Regenerar
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {doc && (
        <div className="modal-fondo" onClick={() => !editando && setAbierto(null)}>
          <div className="modal-entregable" onClick={(e) => e.stopPropagation()}>
            <div className="fila" style={{ justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--azul-200)', gap: 10 }}>
              <div className="fila" style={{ gap: 10, minWidth: 0 }}>
                <strong style={{ color: 'var(--azul-900)' }}>{doc.nombre}</strong>
                <EstadoDoc doc={doc} />
              </div>
              <div className="fila" style={{ gap: 6 }}>
                {!lectura && editando === null && (
                  <>
                    <button className="boton boton--secundario" onClick={() => guardar(doc.id, { revisado: !doc.revisado })}>
                      <CheckCircle2 size={14} /> {doc.revisado ? 'Quitar revisado' : 'Marcar como revisado'}
                    </button>
                    <button className="boton boton--secundario" onClick={() => setEditando(doc.contenido)}>
                      <Pencil size={14} /> Editar
                    </button>
                  </>
                )}
                {editando !== null && (
                  <>
                    <button
                      className="boton boton--primario"
                      onClick={async () => {
                        await guardar(doc.id, { contenido: editando });
                        setEditando(null);
                      }}
                    >
                      Guardar cambios
                    </button>
                    <button className="boton boton--fantasma" onClick={() => setEditando(null)}>
                      Cancelar
                    </button>
                  </>
                )}
                {editando === null && (
                  <>
                    <button className="boton boton--fantasma" onClick={() => descargar(doc)} title="Descargar .md">
                      <Download size={16} />
                    </button>
                    <button className="boton boton--fantasma" onClick={() => setAbierto(null)}>
                      <X size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
            <div style={{ padding: '16px 20px', overflow: 'auto' }}>
              {editando !== null ? (
                <textarea className="campo-texto" style={{ width: '100%', minHeight: '60vh', fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 13 }} value={editando} onChange={(e) => setEditando(e.target.value)} />
              ) : (
                <>
                  <Markdown>{doc.contenido}</Markdown>
                  {doc.fuentes?.length > 0 && (
                    <details style={{ marginTop: 16 }}>
                      <summary className="texto-sm" style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--azul-900)' }}>
                        Fuentes que revisó el investigador ({doc.fuentes.length})
                      </summary>
                      <ul className="texto-xs atenuado" style={{ marginTop: 8 }}>
                        {doc.fuentes.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
