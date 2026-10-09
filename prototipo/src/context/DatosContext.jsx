import { createContext, useContext, useMemo, useState } from 'react';
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

  const valor = useMemo(
    () => ({
      clientes,
      actualizarCliente: cli.actualizar,
      agregarCliente: cli.agregar,

      aprobaciones,
      actualizarAprobacion: apr.actualizar,
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
    [clientes, aprobaciones, oportunidades, escalados, automatizaciones, lotesLeads, cli, apr, opo, esc, aut, lot],
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
