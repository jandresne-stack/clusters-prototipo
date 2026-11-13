import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { aprobacionesReales, guardarAprobacion, pedirCambiosAlAgente } from '../lib/motor.js';
import { clientes as clientesIniciales } from '../data/clientes.js';
import { aprobaciones as aprobacionesIniciales } from '../data/aprobaciones.js';
import { oportunidades as oportunidadesIniciales } from '../data/oportunidades.js';
import { escalados as escaladosIniciales } from '../data/escalados.js';
import { automatizaciones as automatizacionesIniciales } from '../data/automatizaciones.js';
import { lotesLeads as lotesIniciales } from '../data/leads.js';

/**
 * Almacén en memoria del prototipo: lo que cambia por acciones de la usuaria
 * (aprobar, escalar, pausar, calificar leads…) vive aquí para que todas las vistas
 * vean el mismo estado. Se reinicia al recargar la página (spec: sin persistencia).
 *
 * Cada colección expone: lista, actualizar<X>(id, cambios | (item) => cambios), agregar<X>(item), quitar<X>(id).
 */
const DatosContext = createContext(null);

export const HOY = '2026-10-01';

function useColeccion(inicial) {
  const [lista, setLista] = useState(inicial);
  const acciones = useMemo(
    () => ({
      actualizar(id, cambios) {
        setLista((l) =>
          l.map((item) => (item.id === id ? { ...item, ...(typeof cambios === 'function' ? cambios(item) : cambios) } : item)),
        );
      },
      agregar(item) {
        setLista((l) => [item, ...l]);
      },
      quitar(id) {
        setLista((l) => l.filter((item) => item.id !== id));
      },
      reemplazar(fn) {
        setLista(fn);
      },
    }),
    [],
  );
  return [lista, acciones];
}

export function DatosProvider({ children }) {
  const [clientes, cli] = useColeccion(clientesIniciales);
  const [aprobaciones, apr] = useColeccion(aprobacionesIniciales);
  const [oportunidades, opo] = useColeccion(oportunidadesIniciales);
  const [escalados, esc] = useColeccion(escaladosIniciales);
  const [automatizaciones, aut] = useColeccion(automatizacionesIniciales);
  const [lotesLeads, lot] = useColeccion(lotesIniciales);

  // ---------- Agentes reales (motor: agency-agents/panel) ----------
  // Las propuestas que envían los agentes reales se suman a la bandeja junto a las de ejemplo.
  // Sus cambios de estado se guardan en el motor; "Pedir cambios" se lo devuelve al agente.
  const aprobacionesRef = useRef(aprobaciones);
  aprobacionesRef.current = aprobaciones;
  const [motor, setMotor] = useState({ conectado: null, trabajando: [] });

  const recargarAprobacionesReales = useCallback(async () => {
    try {
      const reales = (await aprobacionesReales()).map((a) => ({
        ...a,
        // El prototipo vive en una fecha fija (HOY); una propuesta real nunca sale "del futuro".
        creadoReal: a.creado,
        creado: a.creado > HOY ? HOY : a.creado,
      }));
      apr.reemplazar((l) => [...reales, ...l.filter((x) => x.origen !== 'agente-real')]);
      setMotor((m) => (m.conectado ? m : { ...m, conectado: true }));
    } catch {
      setMotor((m) => ({ ...m, conectado: false }));
    }
  }, [apr]);

  useEffect(() => {
    recargarAprobacionesReales();
    const t = setInterval(recargarAprobacionesReales, 20000);
    return () => clearInterval(t);
  }, [recargarAprobacionesReales]);

  const actualizarAprobacion = useCallback(
    (id, cambios) => {
      const actual = aprobacionesRef.current.find((a) => a.id === id);
      apr.actualizar(id, cambios);
      if (actual?.origen !== 'agente-real') return;
      const delta = typeof cambios === 'function' ? cambios(actual) : cambios;
      const guardado = guardarAprobacion(id, delta).catch(() => {});
      if (delta.estado === 'En curso por agente' && actual.estado !== 'En curso por agente') {
        const comentario = [...(delta.historial ?? [])].reverse().find((h) => h.texto?.startsWith('Pedir cambios:'))?.texto.replace('Pedir cambios: ', '') ?? '';
        setMotor((m) => ({ ...m, trabajando: [...m.trabajando, id] }));
        // Primero queda guardado el comentario; luego el agente rehace (si no, pisaría su nueva versión)
        guardado
          .then(() => pedirCambiosAlAgente(actual, comentario))
          .catch(() => {})
          .finally(() => {
            setMotor((m) => ({ ...m, trabajando: m.trabajando.filter((x) => x !== id) }));
            recargarAprobacionesReales();
          });
      }
    },
    [apr, recargarAprobacionesReales],
  );

  const valor = useMemo(
    () => ({
      clientes,
      actualizarCliente: cli.actualizar,
      agregarCliente: cli.agregar,

      aprobaciones,
      actualizarAprobacion,
      recargarAprobacionesReales,
      motor,
      agregarAprobacion: apr.agregar,
      quitarAprobacion: apr.quitar,

      oportunidades,
      actualizarOportunidad: opo.actualizar,
      agregarOportunidad: opo.agregar,

      escalados,
      actualizarEscalado: esc.actualizar,
      agregarEscalado: esc.agregar,

      automatizaciones,
      actualizarAutomatizacion: aut.actualizar,
      agregarAutomatizacion: aut.agregar,

      lotesLeads,
      actualizarLote: lot.actualizar,
    }),
    [clientes, aprobaciones, oportunidades, escalados, automatizaciones, lotesLeads, cli, apr, opo, esc, aut, lot, actualizarAprobacion, recargarAprobacionesReales, motor],
  );

  return <DatosContext.Provider value={valor}>{children}</DatosContext.Provider>;
}

export function useDatos() {
  const ctx = useContext(DatosContext);
  if (!ctx) throw new Error('useDatos debe usarse dentro de <DatosProvider>');
  return ctx;
}

// ---------- Derivados compartidos ----------

/** Días entre una fecha ISO y HOY. */
export function diasDesde(fechaIso) {
  return Math.round((new Date(HOY) - new Date(fechaIso)) / 86400000);
}

export const estadosOportunidadAbierta = ['Detectada', 'Propuesta al cliente'];

/** Ítems que esperan a la ejecutiva: sin estado o en 'Esperando aprobación'. */
export function esPendiente(a) {
  return !a.estado || a.estado === 'Esperando aprobación';
}
