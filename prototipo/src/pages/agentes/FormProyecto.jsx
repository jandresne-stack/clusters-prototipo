import { useEffect, useRef, useState } from 'react';
import { Paperclip } from 'lucide-react';
import { extraerTexto, modelos as listarModelos } from '../../lib/motor.js';
import { Alerta } from '../../components/ui.jsx';

export const proyectoVacio = {
  titulo: '',
  cliente: '',
  url: '',
  pais: '',
  idioma: 'Español',
  sector: '',
  competidores: '',
  objetivos: '',
  brief: '',
  modelo: '',
};

function Campo({ etiqueta, children, ancho }) {
  return (
    <label className="campo-proyecto" style={ancho ? { gridColumn: '1 / -1' } : undefined}>
      <span>{etiqueta}</span>
      {children}
    </label>
  );
}

/** Ficha de un proyecto de la Biblioteca: cliente, URL, contexto y brief (pegado o subido). */
export function FormProyecto({ inicial, modeloPorDefecto, textoBoton, alGuardar, compacto = false }) {
  const [d, setD] = useState({ ...proyectoVacio, ...inicial, modelo: inicial?.modelo || modeloPorDefecto || '' });
  const [modelos, setModelos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const [error, setError] = useState('');
  const [guardado, setGuardado] = useState(false);
  const archivoRef = useRef(null);

  useEffect(() => {
    listarModelos().then(setModelos).catch(() => {});
  }, []);

  const set = (k) => (e) => {
    setGuardado(false);
    setD((x) => ({ ...x, [k]: e.target.value }));
  };

  async function subir(archivo) {
    setLeyendo(true);
    setError('');
    try {
      const { text, name } = await extraerTexto(archivo);
      setD((x) => ({ ...x, brief: x.brief.trim() ? `${x.brief.trim()}\n\n--- ${name} ---\n${text}` : text }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLeyendo(false);
      if (archivoRef.current) archivoRef.current.value = '';
    }
  }

  async function enviar(e) {
    e.preventDefault();
    if (!d.cliente.trim()) return setError('El nombre del cliente es obligatorio.');
    setGuardando(true);
    setError('');
    try {
      await alGuardar(d);
      setGuardado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  const opciones = modelos.length ? modelos : [{ id: d.modelo, input: 0, output: 0 }];

  return (
    <form className={`form-proyecto${compacto ? ' form-proyecto--compacto' : ''}`} onSubmit={enviar}>
      <Campo etiqueta="Cliente *">
        <input className="campo-texto" value={d.cliente} onChange={set('cliente')} placeholder="Pepito S.A.S." />
      </Campo>
      <Campo etiqueta="Nombre del proyecto">
        <input className="campo-texto" value={d.titulo} onChange={set('titulo')} placeholder="Auditoría SEO Q4 (opcional)" />
      </Campo>
      <Campo etiqueta="Sitio web">
        <input className="campo-texto" value={d.url} onChange={set('url')} placeholder="https://" />
      </Campo>
      <Campo etiqueta="Sector">
        <input className="campo-texto" value={d.sector} onChange={set('sector')} placeholder="Ej. Salud dental" />
      </Campo>
      <Campo etiqueta="País / mercado">
        <input className="campo-texto" value={d.pais} onChange={set('pais')} placeholder="Colombia" />
      </Campo>
      <Campo etiqueta="Idioma de trabajo">
        <input className="campo-texto" value={d.idioma} onChange={set('idioma')} />
      </Campo>
      <Campo etiqueta="Competidores" ancho>
        <input className="campo-texto" value={d.competidores} onChange={set('competidores')} placeholder="competidor1.com, competidor2.com" />
      </Campo>
      <Campo etiqueta="Objetivos" ancho>
        <textarea className="campo-texto" rows={2} value={d.objetivos} onChange={set('objetivos')} placeholder="Aumentar tráfico orgánico, generar leads…" />
      </Campo>
      <Campo
        etiqueta={
          <span className="fila" style={{ justifyContent: 'space-between' }}>
            Brief
            <button type="button" className="boton boton--fantasma" style={{ padding: '2px 8px' }} onClick={() => archivoRef.current?.click()} disabled={leyendo}>
              <Paperclip size={14} /> {leyendo ? 'Leyendo…' : 'Subir PDF / DOCX / TXT'}
            </button>
          </span>
        }
        ancho
      >
        <textarea className="campo-texto" rows={compacto ? 9 : 8} value={d.brief} onChange={set('brief')} placeholder="Pega aquí el brief completo del cliente…" />
        <input ref={archivoRef} type="file" accept=".pdf,.docx,.txt,.md" hidden onChange={(e) => e.target.files?.[0] && subir(e.target.files[0])} />
      </Campo>
      <Campo etiqueta="Modelo de IA" ancho>
        <select className="campo-texto" value={d.modelo} onChange={set('modelo')}>
          {opciones.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id}
              {m.input ? ` · $${m.input.toFixed(2)} / $${m.output.toFixed(2)} por 1M tokens` : ''}
            </option>
          ))}
        </select>
      </Campo>
      {error && (
        <div style={{ gridColumn: '1 / -1' }}>
          <Alerta tipo="error">{error}</Alerta>
        </div>
      )}
      <div className="fila" style={{ gridColumn: '1 / -1' }}>
        <button className="boton boton--primario" disabled={guardando}>
          {guardando ? 'Guardando…' : textoBoton}
        </button>
        {guardado && compacto && <span className="texto-sm" style={{ color: 'var(--salud-verde)' }}>✓ Guardado</span>}
      </div>
    </form>
  );
}
