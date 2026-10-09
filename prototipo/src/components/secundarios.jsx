import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, CircleCheck, LifeBuoy, MessageSquarePlus, Sparkles, X } from 'lucide-react';
import { HOY, useDatos } from '../context/DatosContext.jsx';
import { useSesion } from '../context/SesionContext.jsx';
import { servicioPorId, servicios } from '../data/catalogos.js';
import { Alerta, Chip } from './ui.jsx';
import { especialistas } from '../data/equipo.js';
import '../styles/vistas-secundarias.css';

/** Ventana modal simple: se cierra con Escape, con la X o al hacer clic fuera. */
export function Dialogo({ titulo, descripcion, onCerrar, acciones, children, ancho = 560 }) {
  useEffect(() => {
    const alPulsar = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [onCerrar]);

  return (
    <div className="vs-capa" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="vs-dialogo" role="dialog" aria-modal="true" aria-label={titulo} style={{ maxWidth: ancho }}>
        <header className="vs-dialogo__cabecera">
          <div>
            <h3>{titulo}</h3>
            {descripcion && <p className="texto-sm atenuado">{descripcion}</p>}
          </div>
          <button className="boton boton--fantasma" onClick={onCerrar} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>
        <div className="vs-dialogo__cuerpo">{children}</div>
        {acciones && <footer className="vs-dialogo__pie">{acciones}</footer>}
      </div>
    </div>
  );
}

/** Pestañas con contador: opciones = [{ id, texto, n }]. */
export function Pestanas({ opciones, valor, onCambiar }) {
  return (
    <div className="vs-pestanas" role="tablist">
      {opciones.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={valor === o.id}
          className={`vs-pestana${valor === o.id ? ' activo' : ''}`}
          onClick={() => onCambiar(o.id)}
        >
          {o.texto}
          {o.n != null && <span className="vs-pestana__n">{o.n}</span>}
        </button>
      ))}
    </div>
  );
}

/** Campo de formulario con etiqueta. */
export function Campo({ etiqueta, ayuda, children }) {
  return (
    <label className="vs-campo">
      <span className="vs-campo__etiqueta">{etiqueta}</span>
      {children}
      {ayuda && <span className="texto-xs atenuado">{ayuda}</span>}
    </label>
  );
}

// Canal de especialista sugerido según el agente que hizo la propuesta.
const canalPorAgente = { SEO: 'SEO', SEM: 'SEM', Pauta: 'Meta', Redes: 'Meta', Email: 'SEM' };
export const canalesEspecialista = ['SEO', 'SEM', 'Meta'];

/**
 * US-12: escalar una aprobación o tarea a un especialista humano.
 * Crea el caso en escalados y deja el ítem en estado 'Escalado' (sale de la bandeja).
 * `item` es una aprobación de useDatos().aprobaciones; `alEscalar(caso)` es opcional.
 */
export function DialogoEscalar({ item, onCerrar, alEscalar }) {
  const { clientes, agregarEscalado, actualizarAprobacion } = useDatos();
  const cliente = clientes.find((c) => c.id === item.cliente);
  const [canal, setCanal] = useState(canalPorAgente[item.agente] ?? 'SEO');
  const [motivo, setMotivo] = useState('');
  const especialista = especialistas.find((e) => e.canal === canal);

  function escalar() {
    const caso = {
      id: `esc-${item.id}-${Date.now().toString(36)}`,
      cliente: item.cliente,
      ejecutiva: cliente.ejecutiva,
      canal,
      agente: item.agente,
      origen: 'Ejecutiva',
      tipoTarea: item.titulo,
      motivo: motivo.trim(),
      propuesta: item.contenido?.descripcion ?? item.porQue ?? item.titulo,
      comentario: null,
      creado: HOY,
      especialista: null,
      tomadoEl: null,
      estado: 'Esperando especialista',
      respuesta: null,
      aprobacion: item.id,
    };
    agregarEscalado(caso);
    actualizarAprobacion(item.id, (a) => ({
      estado: 'Escalado',
      escalado: caso.id,
      historial: [...(a.historial ?? []), { fecha: HOY, autor: cliente.ejecutiva, texto: `Escalado a especialista ${canal}: ${caso.motivo}` }],
    }));
    alEscalar?.(caso);
    onCerrar();
  }

  return (
    <Dialogo
      titulo="Escalar a especialista"
      descripcion={`${cliente.nombre} · ${item.titulo}`}
      onCerrar={onCerrar}
      acciones={
        <>
          <button className="boton boton--secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button className="boton boton--primario" disabled={!motivo.trim()} onClick={escalar}>
            <LifeBuoy size={16} /> Escalar caso
          </button>
        </>
      }
    >
      <Campo etiqueta="Canal del especialista" ayuda={especialista ? `Lo recibirá ${especialista.nombre}.` : 'Sin especialista asignado a este canal.'}>
        <select className="vs-control" value={canal} onChange={(e) => setCanal(e.target.value)}>
          {canalesEspecialista.map((c) => (
            <option key={c} value={c}>
              {c === 'Meta' ? 'Meta (pauta social)' : c}
            </option>
          ))}
        </select>
      </Campo>
      <Campo etiqueta="Motivo">
        <textarea
          className="vs-control"
          rows={4}
          autoFocus
          placeholder="¿Qué necesitas que revise el especialista?"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
      </Campo>
    </Dialogo>
  );
}

const formatoFecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });

/** '2026-09-24' → '24 sept'. */
export function fechaCorta(iso) {
  if (!iso) return '—';
  return formatoFecha.format(new Date(`${iso}T12:00:00`)).replace('.', '');
}

// ---------- US-9: Nueva solicitud del cliente ----------

// Palabras que orientan al equipo cuando la ejecutiva elige "No sé, que lo decida el equipo".
const pistasPorCanal = {
  Email: /correo|e-?mail|newsletter|bolet[ií]n|mailing/i,
  Redes: /post|publicaci|instagram|tiktok|reel|historia|redes|contenido/i,
  Pauta: /meta ads|facebook ads|pauta|publicidad en (redes|facebook|instagram)/i,
  SEM: /google ads|campa[ñn]a|anuncio|\bsem\b|presupuesto|keyword/i,
  SEO: /blog|art[ií]culo|\bseo\b|posicion|p[aá]gina|\bweb\b|sitio|ficha de google/i,
};

const pasosPorCanal = {
  SEO: ['Revisar qué páginas o búsquedas se ven afectadas', 'Preparar el cambio o el contenido', 'Publicar y medir el impacto en 2 semanas'],
  SEM: ['Revisar las campañas y el presupuesto involucrados', 'Configurar el ajuste en Google Ads', 'Medir resultados durante 7 días'],
  Redes: ['Definir mensaje y formato según la marca', 'Diseñar las piezas y el copy', 'Programar en el Social Planner de GHL'],
  Pauta: ['Definir audiencia y objetivo', 'Preparar creativos y conjunto de anuncios', 'Lanzar y optimizar durante la primera semana'],
  Email: ['Definir la audiencia en GHL', 'Redactar y diseñar el correo', 'Programar el envío y medir aperturas'],
};

function sumarDias(iso, dias) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function agenteSugerido(texto, contratados) {
  return contratados.find((c) => pistasPorCanal[c]?.test(texto)) ?? contratados[0];
}

/**
 * US-9: la ejecutiva registra una solicitud puntual del cliente.
 * Canal contratado (o "No sé") → propuesta de tareas del agente en la bandeja.
 * Canal no contratado → oportunidad de venta (US-11), sin crear tareas.
 */
export function DialogoSolicitud({ cliente, onCerrar }) {
  const { persona } = useSesion();
  const { agregarAprobacion, agregarOportunidad } = useDatos();
  const navigate = useNavigate();
  const [texto, setTexto] = useState('');
  const [canal, setCanal] = useState('nose');
  const [fecha, setFecha] = useState(sumarDias(HOY, 14));
  const [resultado, setResultado] = useState(null);

  const contratado = canal === 'nose' || cliente.servicios.includes(canal);
  const agentePrevisto = canal === 'nose' ? agenteSugerido(texto, cliente.servicios) : canal;

  function registrar() {
    const descripcion = texto.trim();
    const sufijo = Date.now().toString(36);
    const resumen = descripcion.length > 60 ? `${descripcion.slice(0, 57).trimEnd()}…` : descripcion;

    if (!contratado) {
      const opo = {
        id: `opo-${cliente.id}-sol-${sufijo}`,
        cliente: cliente.id,
        servicio: canal,
        titulo: `${servicioPorId[canal].nombre}: ${resumen}`,
        origen: 'Ejecutiva',
        agente: null,
        justificacion: `El cliente lo pidió directamente: "${descripcion}". Este canal no está contratado, así que es una oportunidad de servicio adicional.`,
        beneficio: 'Atender una necesidad que el cliente ya expresó, con un servicio que hoy no tiene.',
        estado: 'Detectada',
        creada: HOY,
        creadaEnGhl: null,
        solicitud: true,
      };
      agregarOportunidad(opo);
      setResultado({ tipo: 'oportunidad', id: opo.id });
      return;
    }

    const agente = agentePrevisto;
    const nombreAgente = servicioPorId[agente].agente;
    const asignado = canal === 'nose' ? ` Como no se indicó el canal, el equipo lo asignó al ${nombreAgente}.` : '';
    const apr = {
      id: `apr-${cliente.id}-sol-${sufijo}`,
      cliente: cliente.id,
      agente,
      tipo: 'tarea',
      titulo: `Solicitud del cliente: ${resumen}`,
      creado: HOY,
      confianza: 'Media',
      porQue: `El cliente pidió esto directamente y lo quiere para el ${fechaCorta(fecha)}. Lo dividí en tres pasos para hacerlo sin esperar al plan del próximo mes.${asignado} Revisa que el alcance coincida con lo que pidió el cliente.`,
      ghl: null,
      contenido: {
        canal: agente,
        descripcion,
        pasos: pasosPorCanal[agente],
        kpi: 'leads',
        fechaObjetivo: fecha,
        revisionEspecialista: false,
      },
      historial: [{ fecha: HOY, autor: persona.id, texto: 'Solicitud del cliente registrada por la ejecutiva' }],
      solicitud: true,
    };
    agregarAprobacion(apr);
    setResultado({ tipo: 'aprobacion', id: apr.id, agente: nombreAgente });
  }

  if (resultado) {
    const esOportunidad = resultado.tipo === 'oportunidad';
    return (
      <Dialogo
        titulo={esOportunidad ? 'Registrada como oportunidad' : 'Solicitud registrada'}
        descripcion={cliente.nombre}
        onCerrar={onCerrar}
        acciones={
          <>
            <button className="boton boton--secundario" onClick={onCerrar}>
              Cerrar
            </button>
            <button
              className="boton boton--primario"
              onClick={() => navigate(esOportunidad ? `/oportunidades?cliente=${cliente.id}` : `/aprobaciones/${resultado.id}`)}
            >
              {esOportunidad ? 'Ver oportunidad' : 'Ver propuesta'}
            </button>
          </>
        }
      >
        <div className="fila" style={{ alignItems: 'flex-start', gap: 12 }}>
          {esOportunidad ? (
            <Sparkles size={28} color="var(--naranja)" style={{ flex: 'none' }} />
          ) : (
            <CircleCheck size={28} color="var(--salud-verde)" style={{ flex: 'none' }} />
          )}
          <p className="texto-sm">
            {esOportunidad
              ? `${servicioPorId[canal].nombre} no está contratado para este cliente, así que no se crearon tareas. La solicitud quedó como oportunidad de venta para que se la propongas.`
              : `El ${resultado.agente} desglosó la solicitud en tareas. La propuesta está en tu bandeja de aprobaciones.`}
          </p>
        </div>
      </Dialogo>
    );
  }

  return (
    <Dialogo
      titulo="Nueva solicitud del cliente"
      descripcion={`${cliente.nombre} · los agentes la convierten en tareas sin esperar al plan mensual`}
      onCerrar={onCerrar}
      ancho={600}
      acciones={
        <>
          <button className="boton boton--secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button className="boton boton--primario" disabled={!texto.trim() || !fecha} onClick={registrar}>
            <MessageSquarePlus size={16} /> Registrar solicitud
          </button>
        </>
      }
    >
      <Campo etiqueta="¿Qué pidió el cliente?">
        <textarea
          className="vs-control"
          rows={4}
          autoFocus
          placeholder="Ej.: quiere un post para anunciar la nueva sede del norte"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
      </Campo>
      <div className="rejilla rejilla-2">
        <Campo etiqueta="Canal">
          <select className="vs-control" value={canal} onChange={(e) => setCanal(e.target.value)}>
            <option value="nose">No sé, que lo decida el equipo</option>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
                {cliente.servicios.includes(s.id) ? '' : ' (no contratado)'}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Fecha deseada">
          <input className="vs-control" type="date" min={HOY} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Campo>
      </div>
      {contratado ? (
        agentePrevisto && (
          <div className="fila texto-sm" style={{ gap: 8 }}>
            <span className="atenuado">Lo recibirá:</span>
            <Chip variante="agente" icono={Bot}>{servicioPorId[agentePrevisto].agente}</Chip>
          </div>
        )
      ) : (
        <Alerta tipo="info">
          {servicioPorId[canal].nombre} no está contratado. La solicitud se registrará como oportunidad de venta y no se crearán tareas.
        </Alerta>
      )}
    </Dialogo>
  );
}
