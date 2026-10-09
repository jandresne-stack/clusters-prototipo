import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { meses } from '../data/catalogos.js';
import { formatoKpi } from '../lib/formato.js';

const W = 220;
const H = 56;
const PAD = 6;

/**
 * Tendencia de 6 meses de una sola serie: línea de 2px en el acento, meta como línea punteada
 * y tooltip por mes al pasar el mouse (zona de hover = columna completa del mes).
 */
export function Tendencia({ serie, meta, unidad }) {
  const [hover, setHover] = useState(null);
  const valores = meta != null ? [...serie, meta] : serie;
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = max - min || 1;
  const x = (i) => PAD + (i * (W - PAD * 2)) / (serie.length - 1);
  const y = (v) => H - PAD - ((v - min) / rango) * (H - PAD * 2);
  const puntos = serie.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const ultimo = serie.length - 1;
  const activo = hover ?? ultimo;

  return (
    <div className="tendencia">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Tendencia ${meses[0]}–${meses[ultimo]}`}>
        {meta != null && <line x1={PAD} x2={W - PAD} y1={y(meta)} y2={y(meta)} className="tendencia__meta" />}
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={0} y2={H} className="tendencia__guia" />}
        <polyline points={puntos} className="tendencia__linea" />
        <circle cx={x(activo)} cy={y(serie[activo])} r={4} className="tendencia__punto" />
        {serie.map((_, i) => (
          <rect
            key={i}
            x={x(i) - (W - PAD * 2) / (serie.length - 1) / 2}
            y={0}
            width={(W - PAD * 2) / (serie.length - 1)}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
      {hover != null && (
        <div className="tendencia__tooltip" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <strong>{meses[hover]}</strong> {formatoKpi(serie[hover], unidad)}
        </div>
      )}
      <div className="tendencia__ejes">
        <span>{meses[0]}</span>
        {meta != null && <span className="tendencia__leyenda-meta">- - meta</span>}
        <span>{meses[ultimo]}</span>
      </div>
    </div>
  );
}

/** Variación frente al mes anterior, con flecha y texto (nunca solo color). */
export function Variacion({ actual, anterior, mayorEsMejor }) {
  if (anterior == null || anterior === 0) return null;
  const cambio = (actual - anterior) / anterior;
  const plano = Math.abs(cambio) < 0.005;
  const bueno = mayorEsMejor == null || plano ? null : cambio > 0 === mayorEsMejor;
  const Icono = plano ? Minus : cambio > 0 ? ArrowUpRight : ArrowDownRight;
  const clase = bueno == null ? 'neutra' : bueno ? 'buena' : 'mala';
  return (
    <span className={`variacion variacion--${clase}`} title="Frente al mes anterior">
      <Icono size={14} strokeWidth={2.6} />
      {plano ? 'Sin cambio' : `${cambio > 0 ? '+' : ''}${(cambio * 100).toFixed(1).replace('.', ',')} %`}
    </span>
  );
}

/** Tarjeta de KPI: valor actual, meta, variación, fuente y tendencia de 6 meses (US-6). */
export function TarjetaKpi({ nombre, unidad, fuente, serie, meta, mayorEsMejor, sinDatos, destacada }) {
  return (
    <div className={`tarjeta-kpi${destacada ? ' tarjeta-kpi--negocio' : ''}`}>
      <div className="tarjeta-kpi__nombre">{nombre}</div>
      {sinDatos ? (
        <div className="tarjeta-kpi__sin-datos">{sinDatos}</div>
      ) : (
        <>
          <div className="fila" style={{ alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span className="tarjeta-kpi__valor">{formatoKpi(serie[serie.length - 1], unidad)}</span>
            <Variacion actual={serie[serie.length - 1]} anterior={serie[serie.length - 2]} mayorEsMejor={mayorEsMejor} />
          </div>
          {meta != null && <div className="tarjeta-kpi__meta">Meta: {formatoKpi(meta, unidad)}</div>}
          <Tendencia serie={serie} meta={meta} unidad={unidad} />
        </>
      )}
      <div className="tarjeta-kpi__fuente">Fuente: {fuente}</div>
    </div>
  );
}
