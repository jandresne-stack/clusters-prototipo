import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader, Send, Square, TriangleAlert, User } from 'lucide-react';
import { conversar, detener } from '../lib/motor.js';
import { Alerta, EstadoVacio } from './ui.jsx';
import { Markdown } from './Markdown.jsx';
import { FormaAgente } from './FormaAgente.jsx';

function Herramientas({ lista }) {
  if (!lista?.length) return null;
  return (
    <ul className="chat-herramientas">
      {lista.map((t, i) => (
        <li key={i} className={!t.corriendo && !t.ok ? 'fallo' : ''}>
          {t.corriendo ? <Loader size={13} className="girando" /> : t.ok ? <CheckCircle2 size={13} /> : <TriangleAlert size={13} />}
          {t.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * Chat con un agente real sobre un proyecto aislado del motor. Lo usan el chat del equipo de
 * cada cliente de Clusters y los proyectos de la Biblioteca de agentes.
 */
export function Conversacion({
  proyectoId,
  nombreAgente,
  semilla, // id del agente: define su forma y colores
  canal,
  mensajes,
  vacio,
  sugerencias = [],
  pedidoInicial,
  lectura = false,
  trabajandoFondo = false, // el agente sigue con un pedido anterior (p. ej. saliste y volviste)
  alTerminar,
  alEvento,
}) {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [pendiente, setPendiente] = useState(null); // mensaje propio mientras responde el agente
  const [vivo, setVivo] = useState({ texto: '', herramientas: [] });
  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const pedidoEnviado = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [mensajes, vivo, pendiente]);

  const enviar = useCallback(
    async (mensaje) => {
      const m = mensaje.trim();
      if (!m || enviando || trabajandoFondo || !proyectoId) return;
      setTexto('');
      setEnviando(true);
      setError('');
      setPendiente(m);
      setVivo({ texto: '', herramientas: [] });
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        await conversar(
          proyectoId,
          m,
          (e) => {
            alEvento?.(e);
            if (e.type === 'text') setVivo((v) => ({ ...v, texto: v.texto + e.delta }));
            else if (e.type === 'tool_start') setVivo((v) => ({ ...v, herramientas: [...v.herramientas, { label: e.label, corriendo: true, nombre: e.name }] }));
            else if (e.type === 'tool_end')
              setVivo((v) => {
                const h = [...v.herramientas];
                const i = h.findLastIndex((x) => x.corriendo && x.nombre === e.name);
                if (i >= 0) h[i] = { label: e.label, ok: e.ok };
                return { ...v, herramientas: h };
              });
            else if (e.type === 'error') setError(e.message);
          },
          controller.signal,
        );
      } catch (e) {
        if (e.name !== 'AbortError') setError(e.message);
      } finally {
        abortRef.current = null;
        // El motor guarda la respuesta (o lo que alcanzó a escribir si se detuvo)
        await new Promise((r) => setTimeout(r, 300));
        await alTerminar?.();
        setPendiente(null);
        setVivo({ texto: '', herramientas: [] });
        setEnviando(false);
      }
    },
    [enviando, trabajandoFondo, proyectoId, alTerminar, alEvento],
  );

  useEffect(() => {
    if (!pedidoInicial || !proyectoId || pedidoEnviado.current || lectura) return;
    pedidoEnviado.current = true;
    enviar(pedidoInicial);
  }, [pedidoInicial, proyectoId, enviar, lectura]);

  return (
    <section className="tarjeta chat-agente__chat">
      <div className="chat-agente__mensajes" ref={scrollRef}>
        {!mensajes && <p className="atenuado texto-sm">Abriendo la conversación…</p>}
        {mensajes?.length === 0 && !enviando && vacio && <EstadoVacio titulo={vacio.titulo}>{vacio.texto && <p className="texto-sm atenuado" style={{ maxWidth: 460 }}>{vacio.texto}</p>}</EstadoVacio>}
        {mensajes?.map((m) => (
          <div key={m.id} className={`mensaje mensaje--${m.role}`}>
            {m.role === 'user' ? (
              <span className="mensaje__avatar">
                <User size={16} />
              </span>
            ) : (
              <span className="mensaje__avatar mensaje__avatar--forma">
                <FormaAgente semilla={semilla} canal={canal} tamano={30} />
              </span>
            )}
            <div className="mensaje__cuerpo">
              {m.role === 'assistant' ? (
                <>
                  <div className="mensaje__autor">{nombreAgente}</div>
                  <Herramientas lista={m.tools} />
                  <Markdown>{m.content}</Markdown>
                </>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        {pendiente && (
          <div className="mensaje mensaje--user">
            <span className="mensaje__avatar">
              <User size={16} />
            </span>
            <div className="mensaje__cuerpo">{pendiente}</div>
          </div>
        )}
        {enviando && (
          <div className="mensaje mensaje--assistant">
            <span className="mensaje__avatar mensaje__avatar--forma">
              <FormaAgente semilla={semilla} canal={canal} tamano={30} estado={vivo.herramientas.some((h) => h.corriendo) ? 'trabajando' : 'pensando'} />
            </span>
            <div className="mensaje__cuerpo">
              <div className="mensaje__autor">
                {nombreAgente} <Loader size={12} className="girando" />
              </div>
              <Herramientas lista={vivo.herramientas} />
              {vivo.texto ? <Markdown>{vivo.texto}</Markdown> : !vivo.herramientas.length && <span className="atenuado texto-sm">Pensando…</span>}
            </div>
          </div>
        )}
        {trabajandoFondo && !enviando && (
          <div className="mensaje mensaje--assistant">
            <span className="mensaje__avatar mensaje__avatar--forma">
              <FormaAgente semilla={semilla} canal={canal} tamano={30} estado="trabajando" />
            </span>
            <div className="mensaje__cuerpo">
              <div className="mensaje__autor">
                {nombreAgente} <Loader size={12} className="girando" />
              </div>
              <span className="atenuado texto-sm">Sigue trabajando en el último pedido. La respuesta aparecerá aquí sola.</span>
            </div>
          </div>
        )}
        {error && <Alerta tipo="error">{error}</Alerta>}
      </div>

      {!lectura && (
        <div className="chat-agente__redactar">
          {mensajes?.length === 0 && !enviando && sugerencias.length > 0 && (
            <div className="fila fila--envolver" style={{ gap: 6, marginBottom: 10 }}>
              {sugerencias.map((s) => (
                <button key={s} className="chip chip--suave chip--boton" onClick={() => enviar(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="fila" style={{ alignItems: 'flex-end' }}>
            <textarea
              className="campo-texto"
              rows={2}
              value={texto}
              disabled={!proyectoId}
              placeholder={`Escríbele a ${nombreAgente ?? 'el agente'}… (Enter envía, Shift+Enter salto de línea)`}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  enviar(texto);
                }
              }}
            />
            {enviando || trabajandoFondo ? (
              <button
                className="boton boton--secundario"
                onClick={() => {
                  detener(proyectoId).catch(() => {});
                  abortRef.current?.abort();
                }}
              >
                <Square size={14} /> Detener
              </button>
            ) : (
              <button className="boton boton--primario" onClick={() => enviar(texto)} disabled={!texto.trim() || !proyectoId}>
                <Send size={16} /> Enviar
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
