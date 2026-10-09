const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const numero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

/** Formatea el valor de un KPI según su unidad. */
export function formatoKpi(valor, unidad) {
  if (valor == null) return '—';
  if (unidad === 'COP') return cop.format(valor);
  if (unidad === '%') return `${numero.format(valor)} %`;
  if (unidad === 'min') return `${numero.format(valor)} min`;
  return numero.format(valor);
}

export function iniciales(nombre) {
  return nombre
    .replace(/[^\p{L}\s]/gu, '')
    .split(/\s+/)
    .filter((p) => p.length > 2 || /^[A-ZÁÉÍÓÚ]/.test(p))
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export function plural(n, singular, pluralTexto = `${singular}s`) {
  return `${n} ${n === 1 ? singular : pluralTexto}`;
}

const fecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** '2026-09-30' → '30 sept'. */
export function formatoFecha(iso) {
  return iso ? fecha.format(new Date(iso)) : '—';
}
