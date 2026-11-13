// Menú lateral de un cliente, ordenado según el recorrido acordado en la reunión del 6-oct-2026:
// 1) información del cliente, 2) comercial y CRM (lo que más se usa), 3) servicios según
// relevancia para ese cliente, desglosados en subservicios, 4) resultados.
// El lateral (components/Layout.jsx) lo pinta como riel de íconos + panel flotante, estilo HubSpot.
import { BarChart3, IdCard, Megaphone, Users } from 'lucide-react';
import { servicios, subservicios } from '../data/catalogos.js';
import { esPendiente } from '../context/DatosContext.jsx';
import { rutaPlaneacion } from './planeacion.js';

export const tieneLeads = (cliente) =>
  !cliente.onboarding && (cliente.servicios.includes('SEM') || cliente.servicios.includes('Pauta'));

/**
 * Secciones del menú del cliente: { id, titulo, icono, grupos: [{ titulo?, sutil?, items }] }.
 * Cada ítem lleva `tab` (pestaña de la ficha) y opcionalmente `agente`, `sub` o `ruta`, más un `contador`.
 */
export function seccionesCliente(cliente, datos) {
  const id = cliente.id;
  const pendientes = datos.aprobaciones.filter((a) => a.cliente === id && esPendiente(a));
  const ruta = rutaPlaneacion(cliente, datos.aprobaciones);
  const porCanal = (canal) => pendientes.filter((a) => a.agente === canal || a.contenido?.canal === canal).length;

  // Servicios contratados: primero los que más piden atención; empate = orden del catálogo.
  const contratados = servicios
    .filter((s) => cliente.servicios.includes(s.id))
    .map((s, i) => ({ s, i, n: porCanal(s.id) }))
    .sort((a, b) => b.n - a.n || a.i - b.i);
  const sinContratar = servicios.filter((s) => !cliente.servicios.includes(s.id));

  return [
    {
      id: 'cliente',
      titulo: 'Cliente',
      icono: IdCard,
      grupos: [{ items: [{ tab: 'info', nombre: 'Información y kick-off' }] }],
    },
    {
      id: 'comercial',
      titulo: 'Comercial y CRM',
      icono: Users,
      grupos: [
        {
          items: [
            ...(tieneLeads(cliente)
              ? [{ tab: 'leads', nombre: 'Leads', contador: datos.lotesLeads.filter((l) => l.cliente === id && l.estado === 'Pendiente').length }]
              : []),
            {
              tab: 'oportunidades',
              nombre: 'Oportunidades',
              contador: datos.oportunidades.filter((o) => o.cliente === id && (o.estado === 'Detectada' || o.estado === 'Propuesta al cliente')).length,
            },
            { tab: 'automatizaciones', nombre: 'Automatizaciones GHL', contador: pendientes.filter((a) => a.ghl).length },
          ],
        },
      ],
    },
    {
      id: 'servicios',
      titulo: 'Servicios',
      icono: Megaphone,
      grupos: [
        ...contratados.map(({ s, n }) => ({
          servicio: s.id,
          titulo: s.nombre,
          contador: n,
          items: [
            { tab: 'equipo', agente: s.id, nombre: 'Resumen del agente', contador: n },
            ...subservicios[s.id].map((x) => ({ tab: 'equipo', agente: s.id, sub: x.id, nombre: x.nombre })),
          ],
        })),
        {
          titulo: 'Planeación',
          items: [
            { tab: 'planeacion', nombre: 'Ruta de planeación', contador: ruta.filter((a) => a.estado === 'Esperando aprobación').length },
            { tab: 'plan', nombre: 'Plan mensual', contador: pendientes.some((a) => a.tipo === 'plan-mensual') ? 1 : 0 },
          ],
        },
        ...(sinContratar.length
          ? [{ titulo: 'Por agregar', sutil: true, items: sinContratar.map((s) => ({ tab: 'equipo', agente: s.id, nombre: s.nombre, sutil: true })) }]
          : []),
      ],
    },
    {
      id: 'resultados',
      titulo: 'Resultados',
      icono: BarChart3,
      grupos: [
        {
          items: [
            { tab: 'kpis', nombre: 'KPIs' },
            ...(!cliente.onboarding ? [{ ruta: 'reporte', nombre: 'Reporte mensual' }] : []),
          ],
        },
      ],
    },
  ];
}

export const tabsCliente = ['info', 'leads', 'oportunidades', 'automatizaciones', 'equipo', 'planeacion', 'plan', 'kpis'];
