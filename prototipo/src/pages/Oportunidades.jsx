import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Plus, Send, Sparkles, UserRound, X } from 'lucide-react';
import { useSesion } from '../context/SesionContext.jsx';
import { HOY, estadosOportunidadAbierta, useDatos } from '../context/DatosContext.jsx';
import { servicioPorId, servicios } from '../data/catalogos.js';
import { Avatar, Chip, Encabezado, EstadoVacio, InsigniaAgente, InsigniaGhl } from '../components/ui.jsx';
import { Campo, Dialogo, fechaCorta } from '../components/secundarios.jsx';
import '../styles/vistas-secundarias.css';

/*
 * US-11: oportunidades de venta cruzada.
 * Vista global de la ejecutiva en /oportunidades. Acepta ?cliente=<id> para filtrar y
 * ?nueva=1 (con ?cliente y ?servicio opcionales) para abrir el formulario de alta manual,
 * por ejemplo desde el botón "Ver oportunidad" de una tarjeta de agente no contratado.
 * <OportunidadesCliente clienteId> sirve para incrustar las de un solo cliente en su ficha.
 */

const filtrosEstado = [
  { id: 'abiertas', texto: 'Abiertas', clase: 'azul', incluye: estadosOportunidadAbierta },
  { id: 'Detectada', texto: 'Detectadas', clase: 'naranja', incluye: ['Detectada'] },
  { id: 'Propuesta al cliente', texto: 'Propuestas al cliente', clase: 'azul', incluye: ['Propuesta al cliente'] },
  { id: 'Aceptada', texto: 'Aceptadas', clase: 'verde', incluye: ['Aceptada'] },
  { id: 'Rechazada', texto: 'Rechazadas', clase: 'rojo', incluye: ['Rechazada'] },
];

export function Oportunidades() {
  const { persona } = useSesion();
  const { clientes, oportunidades } = useDatos();
  const [params, setParams] = useSearchParams();
  const [estado, setEstado] = useState('abiertas');
  const [filtroServicio, setFiltroServicio] = useState('todos');
  const [filtroOrigen, setFiltroOrigen] = useState('todos');
  const filtroCliente = params.get('cliente') ?? 'todos';
  const nueva = params.get('nueva') === '1';

  const misClientes = useMemo(() => clientes.filter((c) => c.ejecutiva === persona.id), [clientes, persona.id]);
  const ids = useMemo(() => new Set(misClientes.map((c) => c.id)), [misClientes]);
  const mias = useMemo(() => oportunidades.filter((o) => ids.has(o.cliente)), [oportunidades, ids]);

  const base = mias
    .filter((o) => filtroCliente === 'todos' || o.cliente === filtroCliente)
    .filter((o) => filtroServicio === 'todos' || o.servicio === filtroServicio)
    .filter((o) => filtroOrigen === 'todos' || o.origen === filtroOrigen);
  const filtro = filtrosEstado.find((f) => f.id === estado);
  const visibles = base
    .filter((o) => filtro.incluye.includes(o.estado))
    .sort((a, b) => (b.cerradaEl ?? b.creada).localeCompare(a.cerradaEl ?? a.creada));

  function cambiarParam(clave, valor) {
    const p = new URLSearchParams(params);
    if (valor == null || valor === 'todos') p.delete(clave);
    else p.set(clave, valor);
    if (clave === 'nueva' && valor == null) p.delete('servicio');
    setParams(p, { replace: true });
  }

  return (
    <>
      <Encabezado
        titulo="Oportunidades"
        descripcion="Servicios adicionales que les convienen a tus clientes, detectados por los agentes o por ti."
      >
        <button className="boton boton--primario" onClick={() => cambiarParam('nueva', '1')}>
          <Plus size={16} /> Nueva oportunidad
        </button>
      </Encabezado>

      <div className="rejilla" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', marginBottom: 20 }}>
        {filtrosEstado.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`vs-metrica vs-metrica--${f.clase}${estado === f.id ? ' activo' : ''}`}
            onClick={() => setEstado(f.id)}
          >
            <span className="vs-metrica__valor">{base.filter((o) => f.incluye.includes(o.estado)).length}</span>
            <span className="vs-metrica__texto">{f.texto}</span>
          </button>
        ))}
      </div>

      <div className="fila fila--envolver" style={{ gap: 16, marginBottom: 20 }}>
        <label className="filtro">
          Cliente
          <select value={filtroCliente} onChange={(e) => cambiarParam('cliente', e.target.value)}>
            <option value="todos">Todos</option>
            {misClientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="filtro">
          Servicio sugerido
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
          Origen
          <select value={filtroOrigen} onChange={(e) => setFiltroOrigen(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="Agente">Agente</option>
            <option value="Ejecutiva">Ejecutiva</option>
          </select>
        </label>
      </div>

      <ListaOportunidades
        oportunidades={visibles}
        vacio={
          <EstadoVacio titulo={estado === 'abiertas' ? 'No tienes oportunidades abiertas' : 'Ninguna oportunidad coincide con el filtro'}>
            <button className="boton boton--secundario" onClick={() => cambiarParam('nueva', '1')}>
              <Plus size={16} /> Crear una oportunidad
            </button>
          </EstadoVacio>
        }
      />

      {nueva && (
        <DialogoNuevaOportunidad
          clientes={misClientes}
          clienteInicial={params.get('cliente')}
          servicioInicial={params.get('servicio')}
          onCerrar={() => cambiarParam('nueva', null)}
          alCrear={() => setEstado('Detectada')}
        />
      )}
    </>
  );
}

/** Oportunidades de un solo cliente, para su ficha. */
export function OportunidadesCliente({ clienteId }) {
  const { oportunidades } = useDatos();
  const navigate = useNavigate();
  const lista = oportunidades.filter((o) => o.cliente === clienteId);
  const abiertas = lista.filter((o) => estadosOportunidadAbierta.includes(o.estado));
  const cerradas = lista.filter((o) => !estadosOportunidadAbierta.includes(o.estado));

  return (
    <div className="pila" style={{ gap: 16 }}>
      <div className="fila" style={{ justifyContent: 'space-between' }}>
        <h3>Oportunidades</h3>
        <button className="boton boton--secundario" onClick={() => navigate(`/oportunidades?cliente=${clienteId}&nueva=1`)}>
          <Plus size={16} /> Nueva oportunidad
        </button>
      </div>
      <ListaOportunidades
        oportunidades={[...abiertas, ...cerradas]}
        mostrarCliente={false}
        vacio={<EstadoVacio titulo="Este cliente no tiene oportunidades registradas" />}
      />
    </div>
  );
}

function ListaOportunidades({ oportunidades, mostrarCliente = true, vacio }) {
  const [rechazando, setRechazando] = useState(null);
  if (oportunidades.length === 0) return <div className="tarjeta">{vacio}</div>;
  return (
    <>
      <div className="vs-oportunidades">
        {oportunidades.map((o) => (
          <TarjetaOportunidad key={o.id} o={o} mostrarCliente={mostrarCliente} onRechazar={() => setRechazando(o)} />
        ))}
      </div>
      {rechazando && <DialogoRechazo o={rechazando} onCerrar={() => setRechazando(null)} />}
    </>
  );
}

const pasosEmbudo = ['Detectada', 'Propuesta al cliente', 'Cerrada'];

function Embudo({ estado }) {
  const indice = estado === 'Detectada' ? 0 : estado === 'Propuesta al cliente' ? 1 : 2;
  return (
    <div className="vs-embudo" aria-label={`Estado: ${estado}`}>
      {pasosEmbudo.map((p, i) => {
        const texto = i === 2 && indice === 2 ? estado : i === 2 ? 'Aceptada / Rechazada' : p;
        const clase = i < indice ? 'hecho' : i > indice ? '' : i === 2 ? estado.toLowerCase() : 'actual';
        return (
          <span key={p} className="fila" style={{ gap: 6 }}>
            {i > 0 && <span aria-hidden>→</span>}
            <span className={`vs-embudo__paso ${clase}`}>{texto}</span>
          </span>
        );
      })}
    </div>
  );
}

function TarjetaOportunidad({ o, mostrarCliente, onRechazar }) {
  const { clientes, actualizarOportunidad, actualizarAprobacion } = useDatos();
  const navigate = useNavigate();
  const cliente = clientes.find((c) => c.id === o.cliente);
  const servicio = servicioPorId[o.servicio];
  const cerrada = !estadosOportunidadAbierta.includes(o.estado);

  function proponer() {
    actualizarOportunidad(o.id, { estado: 'Propuesta al cliente', creadaEnGhl: HOY });
    // Si el agente la había enviado también a la bandeja, ya quedó atendida.
    if (o.aprobacion) {
      actualizarAprobacion(o.aprobacion, (a) => ({
        estado: 'Aprobado',
        historial: [...(a.historial ?? []), { fecha: HOY, autor: cliente.ejecutiva, texto: 'Oportunidad propuesta al cliente y creada en GHL.' }],
      }));
    }
  }

  function aceptar() {
    actualizarOportunidad(o.id, { estado: 'Aceptada', aceptadaEl: HOY, cerradaEl: HOY });
  }

  return (
    <article className={`tarjeta vs-oportunidad${cerrada ? ' vs-oportunidad--cerrada' : ''}`}>
      <div className="vs-oportunidad__cabecera">
        {mostrarCliente && <Avatar nombre={cliente.nombre} color={cliente.color} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          {mostrarCliente && (
            <button
              className="boton boton--fantasma texto-sm"
              style={{ padding: 0, fontWeight: 700 }}
              onClick={() => navigate(`/clientes/${cliente.id}`)}
            >
              {cliente.nombre}
            </button>
          )}
          <div className="vs-oportunidad__titulo">{o.titulo}</div>
        </div>
        <Chip>{servicio.nombre}</Chip>
      </div>

      <div className="fila fila--envolver" style={{ gap: 8 }}>
        {o.origen === 'Agente' ? (
          <InsigniaAgente agente={servicioPorId[o.agente]?.agente ?? 'Agente'} />
        ) : (
          <Chip variante="suave" icono={UserRound}>
            Detectada por la ejecutiva
          </Chip>
        )}
        <span className="texto-xs atenuado">Desde el {fechaCorta(o.creada)}</span>
      </div>

      <div className={o.origen === 'Agente' ? 'propuesta-agente pila' : 'pila'} style={{ gap: 10 }}>
        <div className="vs-oportunidad__bloque">
          <strong>Por qué</strong>
          {o.justificacion}
        </div>
        <div className="vs-oportunidad__bloque">
          <strong>Beneficio esperado</strong>
          {o.beneficio}
        </div>
      </div>

      {o.estado === 'Rechazada' && o.motivoCierre && (
        <div className="vs-oportunidad__bloque">
          <strong>Motivo del rechazo</strong>
          {o.motivoCierre}
        </div>
      )}

      <Embudo estado={o.estado} />

      <div className="vs-oportunidad__pie">
        <div className="fila" style={{ gap: 8 }}>
          {o.creadaEnGhl ? (
            <InsigniaGhl>Creada en GHL · {fechaCorta(o.creadaEnGhl)}</InsigniaGhl>
          ) : (
            <span className="texto-xs atenuado">Aún no está en el pipeline de AMD</span>
          )}
          {o.estado === 'Aceptada' && (
            <Chip variante="verde" icono={Check}>
              Aceptada el {fechaCorta(o.aceptadaEl ?? o.cerradaEl)}
            </Chip>
          )}
        </div>
        {!cerrada && (
          <div className="fila" style={{ gap: 8 }}>
            <button className="boton boton--fantasma" onClick={onRechazar}>
              <X size={16} /> {o.estado === 'Detectada' ? 'Descartar' : 'Rechazada'}
            </button>
            {o.estado === 'Detectada' ? (
              <button className="boton boton--primario" onClick={proponer}>
                <Send size={16} /> Proponer al cliente
              </button>
            ) : (
              <button className="boton boton--cta" onClick={aceptar}>
                <Check size={16} /> Aceptada
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function DialogoRechazo({ o, onCerrar }) {
  const { actualizarOportunidad, actualizarAprobacion } = useDatos();
  const [motivo, setMotivo] = useState('');
  const descartar = o.estado === 'Detectada';

  function confirmar() {
    actualizarOportunidad(o.id, { estado: 'Rechazada', cerradaEl: HOY, motivoCierre: motivo.trim() || null });
    if (o.aprobacion) actualizarAprobacion(o.aprobacion, { estado: 'Rechazado' });
    onCerrar();
  }

  return (
    <Dialogo
      titulo={descartar ? 'Descartar oportunidad' : 'Marcar como rechazada por el cliente'}
      descripcion={o.titulo}
      onCerrar={onCerrar}
      acciones={
        <>
          <button className="boton boton--secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button className="boton boton--peligro" onClick={confirmar}>
            <X size={16} /> {descartar ? 'Descartar' : 'Marcar rechazada'}
          </button>
        </>
      }
    >
      <Campo etiqueta="Motivo (opcional)" ayuda="Ayuda a los agentes a proponer mejor la próxima vez.">
        <textarea
          className="vs-control"
          rows={3}
          autoFocus
          placeholder={descartar ? 'Ej.: el cliente no tiene presupuesto este trimestre' : 'Ej.: prefiere esperar a ver resultados en SEM'}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
      </Campo>
    </Dialogo>
  );
}

function DialogoNuevaOportunidad({ clientes, clienteInicial, servicioInicial, onCerrar, alCrear }) {
  const { agregarOportunidad } = useDatos();
  const [clienteId, setClienteId] = useState(clientes.some((c) => c.id === clienteInicial) ? clienteInicial : (clientes[0]?.id ?? ''));
  const cliente = clientes.find((c) => c.id === clienteId);
  const disponibles = servicios.filter((s) => !cliente?.servicios.includes(s.id));
  const [servicio, setServicio] = useState(servicioInicial ?? '');
  const servicioValido = disponibles.some((s) => s.id === servicio) ? servicio : (disponibles[0]?.id ?? '');
  const [titulo, setTitulo] = useState('');
  const [justificacion, setJustificacion] = useState('');
  const [beneficio, setBeneficio] = useState('');
  const completo = cliente && servicioValido && titulo.trim() && justificacion.trim() && beneficio.trim();

  function crear() {
    agregarOportunidad({
      id: `opo-${clienteId}-${Date.now().toString(36)}`,
      cliente: clienteId,
      servicio: servicioValido,
      titulo: titulo.trim(),
      origen: 'Ejecutiva',
      agente: null,
      justificacion: justificacion.trim(),
      beneficio: beneficio.trim(),
      estado: 'Detectada',
      creada: HOY,
      creadaEnGhl: null,
    });
    alCrear?.();
    onCerrar();
  }

  return (
    <Dialogo
      titulo="Nueva oportunidad"
      descripcion="Registra un servicio que crees que le conviene al cliente."
      onCerrar={onCerrar}
      ancho={600}
      acciones={
        <>
          <button className="boton boton--secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button className="boton boton--primario" disabled={!completo} onClick={crear}>
            <Sparkles size={16} /> Crear oportunidad
          </button>
        </>
      }
    >
      <div className="rejilla rejilla-2">
        <Campo etiqueta="Cliente">
          <select className="vs-control" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Servicio sugerido">
          <select
            className="vs-control"
            value={servicioValido}
            disabled={disponibles.length === 0}
            onChange={(e) => setServicio(e.target.value)}
          >
            {disponibles.length === 0 && <option value="">Ya tiene todos los servicios</option>}
            {disponibles.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      <Campo etiqueta="Oportunidad">
        <input
          className="vs-control"
          placeholder="Ej.: LinkedIn Ads para llegar a decisores"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
      </Campo>
      <Campo etiqueta="Por qué le conviene">
        <textarea className="vs-control" rows={3} value={justificacion} onChange={(e) => setJustificacion(e.target.value)} />
      </Campo>
      <Campo etiqueta="Beneficio esperado">
        <textarea className="vs-control" rows={2} value={beneficio} onChange={(e) => setBeneficio(e.target.value)} />
      </Campo>
    </Dialogo>
  );
}
