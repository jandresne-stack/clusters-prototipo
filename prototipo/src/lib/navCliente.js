// Menú lateral de un cliente, ordenado según el recorrido acordado en la reunión del 6-oct-2026:
// 1) información del cliente, 2) comercial y CRM (lo que más se usa), 3) servicios según
// relevancia para ese cliente, 4) resultados. La ficha (pages/Cliente.jsx) usa los mismos ids.
import {
  BarChart3,
  Bot,
  CalendarCheck,
  ClipboardList,
  FileText,
  Filter,
  FolderOpen,
  IdCard,
  PlusCircle,
  Sparkles,
  Zap,
} from 'lucide-react';
import { servicios } from '../data/catalogos.js';
import { esPendiente } from '../context/DatosContext.jsx';
import { rutaPlaneacion } from './planeacion.js';

export const tieneLeads = (cliente) =>
  !cliente.onboarding && (cliente.servicios.includes('SEM') || cliente.servicios.includes('Pauta'));

/**
 * Devuelve las secciones del menú del cliente. Cada ítem tiene `tab` (pestaña de la ficha),
 * opcionalmente `agente` (servicio) o `ruta` (página propia), y un `contador` de pendientes.
 */
export function seccionesCliente(cliente, datos) {
  const id = cliente.id;
  const pendientes = datos.aprobaciones.filter((a) => a.cliente === id && esPendiente(a));
  const ruta = rutaPlaneacion(cliente, datos.aprobaciones);
  const porCanal = (canal) => pendientes.filter((a) => a.agente === canal || a.contenido?.canal === canal).length;

  // Servicios contratados primero los que más piden atención; empate = orden del catálogo.
  const contratados = servicios
    .filter((s) => cliente.servicios.includes(s.id))
    .map((s, i) => ({ s, i, n: porCanal(s.id) }))
    .sort((a, b) => b.n - a.n || a.i - b.i);
  const sinContratar = servicios.length - contratados.length;

  return [
    {
      titulo: 'Cliente',
      items: [
        { tab: 'info', nombre: 'Información y kick-off', icono: IdCard },
        { tab: 'base', nombre: 'Documentos base', icono: FolderOpen },
      ],
    },
    {
      titulo: 'Comercial y CRM',
      items: [
        ...(tieneLeads(cliente)
          ? [{ tab: 'leads', nombre: 'Leads', icono: Filter, contador: datos.lotesLeads.filter((l) => l.cliente === id && l.estado === 'Pendiente').length }]
          : []),
        {
          tab: 'oportunidades',
          nombre: 'Oportunidades',
          icono: Sparkles,
          contador: datos.oportunidades.filter((o) => o.cliente === id && (o.estado === 'Detectada' || o.estado === 'Propuesta al cliente')).length,
        },
        { tab: 'automatizaciones', nombre: 'Automatizaciones GHL', icono: Zap, contador: pendientes.filter((a) => a.ghl).length },
      ],
    },
    {
      titulo: 'Servicios',
      items: [
        ...contratados.map(({ s, n }) => ({ tab: 'equipo', agente: s.id, nombre: s.nombre, icono: Bot, contador: n })),
        { tab: 'planeacion', nombre: 'Planeación', icono: ClipboardList, contador: ruta.filter((a) => a.estado === 'Esperando aprobación').length },
        { tab: 'plan', nombre: 'Plan mensual', icono: CalendarCheck, contador: pendientes.some((a) => a.tipo === 'plan-mensual') ? 1 : 0 },
        { tab: 'equipo', nombre: sinContratar > 0 ? 'Agregar servicio' : 'Todos los agentes', icono: PlusCircle, sutil: true },
      ],
    },
    {
      titulo: 'Resultados',
      items: [
        { tab: 'kpis', nombre: 'KPIs', icono: BarChart3 },
        ...(!cliente.onboarding ? [{ ruta: 'reporte', nombre: 'Reporte mensual', icono: FileText }] : []),
      ],
    },
  ];
}

export const tabsCliente = ['info', 'base', 'leads', 'oportunidades', 'automatizaciones', 'equipo', 'planeacion', 'plan', 'kpis'];
