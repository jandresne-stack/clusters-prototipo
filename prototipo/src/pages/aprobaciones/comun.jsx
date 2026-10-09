// Piezas compartidas por la bandeja (US-5) y el detalle (US-4, US-16) de aprobaciones.
import { Chip } from '../../components/ui.jsx';
import { diasDesde } from '../../context/DatosContext.jsx';
import { servicioPorId } from '../../data/catalogos.js';
import { ejecutivaPorId, especialistaPorId } from '../../data/equipo.js';

export const nombreTipo = {
  artefacto: 'Artefacto de planeación',
  'plan-mensual': 'Plan mensual',
  tarea: 'Tarea de ejecución',
  'propuesta-servicio': 'Propuesta de servicio',
};

export const nombreTipoGhl = { email: 'Campaña de email', workflow: 'Workflow de seguimiento', post: 'Post en Social Planner' };

/** 'SEO' -> 'Agente SEO' (nombre del catálogo). */
export function nombreAgente(id) {
  return servicioPorId[id]?.agente ?? `Agente ${id}`;
}

/** Spec US-5: más de 3 días esperando = Atrasado. */
export function diasEsperando(a) {
  return diasDesde(a.creado);
}
export function esAtrasada(a) {
  return diasEsperando(a) > 3;
}

const varianteConfianza = { Alta: 'verde', Media: 'amarillo', Baja: 'rojo' };
export function ChipConfianza({ confianza, corta = false }) {
  return (
    <Chip variante={varianteConfianza[confianza]} title={`Confianza del agente: ${confianza.toLowerCase()}`}>
      {corta ? confianza : `Confianza ${confianza.toLowerCase()}`}
    </Chip>
  );
}

const varianteEstado = {
  Aprobado: 'verde',
  'Activo en GHL': 'ghl',
  'En curso por agente': 'amarillo',
  Escalado: 'rojo',
};
export function ChipEstado({ estado = 'Esperando aprobación' }) {
  return <Chip variante={varianteEstado[estado] ?? 'suave'}>{estado}</Chip>;
}

const fecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
const fechaHora = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** '2026-09-30' -> '30 sept 2026'. Acepta también '2026-10-01 12:00'. */
export function formatoFecha(iso) {
  if (!iso) return '—';
  const conHora = iso.includes(' ');
  const d = new Date(conHora ? iso.replace(' ', 'T') : `${iso}T12:00:00`);
  return conHora ? fechaHora.format(d) : fecha.format(d);
}

/** Nombre legible del autor de una entrada de historial ('agente' o id de equipo.js). */
export function nombreAutor(autor, agente) {
  if (autor === 'agente') return nombreAgente(agente);
  return ejecutivaPorId[autor]?.nombre ?? especialistaPorId[autor]?.nombre ?? autor;
}

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const numero = new Intl.NumberFormat('es-CO');
const columnasCop = new Set(['Puja', 'Presupuesto', 'CPL esperado', 'Meta']);

/** Formatea una celda de artefacto según la columna (las de dinero van en COP). */
export function formatoCelda(valor, columna) {
  if (valor == null) return '—';
  if (typeof valor !== 'number') return valor;
  return columnasCop.has(columna) ? cop.format(valor) : numero.format(valor);
}

/** Canal de especialista por defecto al escalar, según el agente que propuso. */
export const canalEspecialistaPorAgente = { SEO: 'SEO', SEM: 'SEM', Pauta: 'Meta', Redes: 'Meta', Email: 'SEM' };
export const canalesEspecialista = [
  { id: 'SEO', nombre: 'Especialista SEO' },
  { id: 'SEM', nombre: 'Especialista SEM' },
  { id: 'Meta', nombre: 'Especialista Meta / Pauta social' },
];
