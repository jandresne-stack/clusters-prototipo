import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bot, CalendarClock, Check, ExternalLink, Inbox, UserCheck } from 'lucide-react';
import { useSesion } from '../../context/SesionContext.jsx';
import { HOY, diasDesde, esPendiente, useDatos } from '../../context/DatosContext.jsx';
import { clientes as clientesEstaticos } from '../../data/clientes.js';
import { servicios } from '../../data/catalogos.js';
import { Avatar, Chip, Encabezado, EstadoVacio, InsigniaGhl } from '../../components/ui.jsx';
import { plural } from '../../lib/formato.js';
import { ChipConfianza, diasEsperando, esAtrasada, nombreAgente, nombreTipo } from './comun.jsx';
import '../../styles/aprobaciones.css';

/** Cambios que aplica "Aprobar" sobre un ítem (compartido con el detalle). */
export function cambiosAlAprobar(item, autor) {
  const enGhl = Boolean(item.ghl);
  return {
    estado: enGhl ? 'Activo en GHL' : 'Aprobado',
    aprobadoEl: HOY,
    historial: [...item.historial, { fecha: HOY, autor, texto: enGhl ? 'Aprobado. Activo en GHL.' : 'Aprobado.' }],
  };
}

/** Automatización que queda registrada en GHL al aprobar una propuesta con `ghl` (US-16). */
export function automatizacionDesde(item) {
  const resultadoInicial = {
    email: { envios: 0, aperturas: 0, clics: 0 },
    workflow: { leadsContactados: 0, respuestas: 0 },
    post: { publicados: 0, programados: 1, interacciones: 0 },
  };
  return {
    id: `aut-${item.id}`,
    cliente: item.cliente,
    tipo: item.ghl.tipo,
    nombre: item.titulo,
    agente: item.agente,
    activadaEl: HOY,
    estado: 'Activa',
    resultado: resultadoInicial[item.ghl.tipo],
  };
}

/** US-10: aprobado por la ejecutiva, requiere visto bueno del cliente y aún no lo tiene. */
export function esperaVistoBuenoCliente(a) {
  return (a.estado === 'Aprobado' || a.estado === 'Activo en GHL') && a.requiereVistoBuenoCliente && !a.aprobadoPorCliente;
}

export function Bandeja() {
  const { persona } = useSesion();
  const datos = useDatos();
  const { aprobaciones, actualizarAprobacion, agregarAutomatizacion } = datos;
  const listaClientes = datos.clientes ?? clientesEstaticos;
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  // Vista: 'pendientes' (US-5) o 'cliente' (US-10: esperan visto bueno del cliente).
  const vista = params.get('vista') === 'cliente' ? 'cliente' : 'pendientes';
  const filtroCliente = params.get('cliente') ?? 'todos';
  const [filtroAgente, setFiltroAgente] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  const misClientes = useMemo(() => listaClientes.filter((c) => c.ejecutiva === persona.id), [listaClientes, persona.id]);
  const clientePorId = useMemo(() => Object.fromEntries(misClientes.map((c) => [c.id, c])), [misClientes]);

  // Todo lo pendiente de todos los clientes de la ejecutiva, lo más antiguo primero.
  const pendientes = useMemo(
    () =>
      aprobaciones
        .filter((a) => clientePorId[a.cliente] && esPendiente(a))
        .sort((a, b) => a.creado.localeCompare(b.creado)),
    [aprobaciones, clientePorId],
  );
  const esperanCliente = useMemo(
    () =>
      aprobaciones
        .filter((a) => clientePorId[a.cliente] && esperaVistoBuenoCliente(a))
        .sort((a, b) => (a.aprobadoEl ?? a.creado).localeCompare(b.aprobadoEl ?? b.creado)),
    [aprobaciones, clientePorId],
  );

  const lista = vista === 'cliente' ? esperanCliente : pendientes;
  const visibles = lista
    .filter((a) => filtroCliente === 'todos' || a.cliente === filtroCliente)
    .filter((a) => filtroAgente === 'todos' || a.agente === filtroAgente)
    .filter((a) => filtroTipo === 'todos' || a.tipo === filtroTipo);

  const atrasadas = pendientes.filter(esAtrasada).length;

  function cambiarParam(clave, valor, porDefecto) {
    const siguiente = new URLSearchParams(params);
    if (valor === porDefecto) siguiente.delete(clave);
    else siguiente.set(clave, valor);
    setParams(siguiente, { replace: true });
  }
  const cambiarCliente = (id) => cambiarParam('cliente', id, 'todos');
  const cambiarVista = (v) => cambiarParam('vista', v, 'pendientes');

  function aprobar(e, item) {
    e.stopPropagation();
    actualizarAprobacion(item.id, (actual) => cambiosAlAprobar(actual, persona.id));
    if (item.ghl) agregarAutomatizacion(automatizacionDesde(item));
  }

  const descripcion =
    vista === 'cliente'
      ? `${plural(esperanCliente.length, 'ítem aprobado', 'ítems aprobados')} que esperan el visto bueno del cliente`
      : `${plural(pendientes.length, 'ítem pendiente', 'ítems pendientes')} en ${plural(new Set(pendientes.map((a) => a.cliente)).size, 'cliente')}${atrasadas ? ` · ${plural(atrasadas, 'atrasado')}` : ''}`;

  return (
    <>
      <Encabezado titulo="Aprobaciones" descripcion={descripcion}>
        <label className="filtro">
          Cliente
          <select value={filtroCliente} onChange={(e) => cambiarCliente(e.target.value)}>
            <option value="todos">Todos</option>
            {misClientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="filtro">
          Agente
          <select value={filtroAgente} onChange={(e) => setFiltroAgente(e.target.value)}>
            <option value="todos">Todos</option>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.agente}
              </option>
            ))}
          </select>
        </label>
        <label className="filtro">
          Tipo
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="todos">Todos</option>
            {Object.entries(nombreTipo).map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
      </Encabezado>

      <div className="conmutador" role="tablist">
        <button role="tab" aria-selected={vista === 'pendientes'} className={vista === 'pendientes' ? 'activo' : ''} onClick={() => cambiarVista('pendientes')}>
          <Inbox size={14} /> Pendientes de aprobación
          {pendientes.length > 0 && <span className="conmutador__contador">{pendientes.length}</span>}
        </button>
        <button role="tab" aria-selected={vista === 'cliente'} className={vista === 'cliente' ? 'activo' : ''} onClick={() => cambiarVista('cliente')}>
          <UserCheck size={14} /> Esperan visto bueno del cliente
          {esperanCliente.length > 0 && <span className="conmutador__contador">{esperanCliente.length}</span>}
        </button>
      </div>

      {lista.length === 0 ? (
        <div className="tarjeta">
          <EstadoVacio titulo={vista === 'cliente' ? 'Ningún ítem espera el visto bueno del cliente' : 'No tienes aprobaciones pendientes'}>
            <p className="atenuado">
              {vista === 'cliente'
                ? 'Cuando apruebes algo que requiera visto bueno del cliente, aparecerá aquí hasta que lo registres.'
                : 'Cuando un agente proponga algo nuevo, aparecerá aquí.'}
            </p>
          </EstadoVacio>
        </div>
      ) : (
        <div className="tarjeta tabla-envoltorio" style={{ padding: 0 }}>
          <table className="tabla tabla--aprobaciones">
            <thead>
              <tr>
                <th>Ítem</th>
                <th>Cliente</th>
                <th>Agente</th>
                <th>{vista === 'cliente' ? 'Aprobado hace' : 'Esperando'}</th>
                <th>Confianza</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EstadoVacio titulo="Ningún ítem coincide con el filtro">
                      <button
                        className="boton boton--fantasma"
                        onClick={() => {
                          cambiarCliente('todos');
                          setFiltroAgente('todos');
                          setFiltroTipo('todos');
                        }}
                      >
                        Quitar filtros
                      </button>
                    </EstadoVacio>
                  </td>
                </tr>
              )}
              {visibles.map((a) => {
                const cliente = clientePorId[a.cliente];
                const esVistoBueno = vista === 'cliente';
                const dias = esVistoBueno ? diasDesde(a.aprobadoEl ?? a.creado) : diasEsperando(a);
                const atrasada = !esVistoBueno && esAtrasada(a);
                const esPlan = a.tipo === 'plan-mensual';
                const ghlDesconectado = Boolean(a.ghl) && cliente.ghl !== 'conectado';
                const rutaDetalle = esPlan && !esVistoBueno ? `/clientes/${a.cliente}?tab=plan` : `/aprobaciones/${a.id}`;
                return (
                  <tr key={a.id} className="fila-aprobacion" onClick={() => navigate(rutaDetalle)}>
                    <td>
                      <div className="fila-aprobacion__titulo">{a.titulo}</div>
                      <div className="fila-aprobacion__meta">
                        <span className="texto-xs atenuado" style={{ fontWeight: 600, alignSelf: 'center' }}>
                          {nombreTipo[a.tipo]}
                        </span>
                        {atrasada && <Chip variante="atrasado">Atrasado</Chip>}
                        {a.ghl && <InsigniaGhl>{a.estado === 'Activo en GHL' ? 'Activo en GHL' : 'Se ejecutará en GHL'}</InsigniaGhl>}
                        {a.requiereVistoBuenoCliente && !esVistoBueno && <Chip variante="suave">Requiere visto bueno del cliente</Chip>}
                      </div>
                    </td>
                    <td>
                      <div className="fila">
                        <Avatar nombre={cliente.nombre} color={cliente.color} tamano={30} />
                        <span className="texto-sm" style={{ fontWeight: 600, maxWidth: 170 }}>
                          {cliente.nombre}
                        </span>
                      </div>
                    </td>
                    <td>
                      <Chip variante="agente" icono={Bot} title={`Propuesto por ${nombreAgente(a.agente)}`}>
                        {nombreAgente(a.agente)}
                      </Chip>
                    </td>
                    <td>
                      <span className={`antiguedad${atrasada ? ' antiguedad--atrasada' : ''}`}>
                        <CalendarClock size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
                        {dias === 0 ? 'Hoy' : plural(dias, 'día')}
                      </span>
                    </td>
                    <td>
                      <ChipConfianza confianza={a.confianza} corta />
                    </td>
                    <td>
                      <div className="fila" style={{ gap: 6, justifyContent: 'flex-end' }}>
                        {esVistoBueno ? (
                          <button className="boton boton--secundario" onClick={(e) => { e.stopPropagation(); navigate(rutaDetalle); }}>
                            <UserCheck size={14} /> Registrar visto bueno
                          </button>
                        ) : esPlan ? (
                          <button className="boton boton--secundario" onClick={(e) => { e.stopPropagation(); navigate(rutaDetalle); }}>
                            <ExternalLink size={14} /> Revisar plan
                          </button>
                        ) : (
                          <button
                            className="boton boton--primario"
                            disabled={ghlDesconectado}
                            title={ghlDesconectado ? 'Conecta la subcuenta GHL para activar' : 'Aprobar sin abrir el detalle'}
                            onClick={(e) => aprobar(e, a)}
                          >
                            <Check size={14} /> Aprobar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
