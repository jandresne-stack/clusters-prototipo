import { AlertTriangle, Bot, Info, OctagonAlert, Zap } from 'lucide-react';
import { etiquetaSalud } from '../lib/salud.js';
import { iniciales } from '../lib/formato.js';

export function Encabezado({ titulo, descripcion, children }) {
  return (
    <header className="encabezado">
      <div>
        <h1>{titulo}</h1>
        {descripcion && <p>{descripcion}</p>}
      </div>
      {children && <div className="fila">{children}</div>}
    </header>
  );
}

export function Semaforo({ salud, conTexto = true }) {
  return (
    <span className={`semaforo semaforo--${salud}`} title={etiquetaSalud[salud]}>
      <span className="semaforo__punto" />
      {conTexto && etiquetaSalud[salud]}
    </span>
  );
}

export function Chip({ variante, icono: Icono, children, title }) {
  return (
    <span className={`chip${variante ? ` chip--${variante}` : ''}`} title={title}>
      {Icono && <Icono size={13} strokeWidth={2.4} />}
      {children}
    </span>
  );
}

/** Marca obligatoria en todo lo generado por un agente (criterio general del spec). */
export function InsigniaAgente({ agente }) {
  return (
    <Chip variante="agente" icono={Bot}>
      Propuesto por {agente}
    </Chip>
  );
}

export function InsigniaGhl({ children = 'Se ejecutará en GHL' }) {
  return (
    <Chip variante="ghl" icono={Zap}>
      {children}
    </Chip>
  );
}

export function Avatar({ nombre, color, redondo, tamano = 36, texto }) {
  return (
    <span
      className={`avatar${redondo ? ' avatar--redondo' : ''}`}
      style={{ background: color, width: tamano, height: tamano, fontSize: tamano * 0.38 }}
      aria-hidden
    >
      {texto ?? iniciales(nombre)}
    </span>
  );
}

export function Progreso({ valor }) {
  return (
    <div className="progreso" role="progressbar" aria-valuenow={valor} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${valor}%` }} />
    </div>
  );
}

const iconoAlerta = { error: OctagonAlert, aviso: AlertTriangle, info: Info };

export function Alerta({ tipo = 'aviso', children }) {
  const Icono = iconoAlerta[tipo];
  return (
    <div className={`alerta${tipo !== 'aviso' ? ` alerta--${tipo}` : ''}`}>
      <Icono size={16} style={{ flex: 'none', marginTop: 2 }} />
      <span>{children}</span>
    </div>
  );
}

export function EstadoVacio({ titulo, children }) {
  return (
    <div className="estado-vacio">
      <img src="./isotipo-agentia.png" alt="" />
      <h3>{titulo}</h3>
      {children}
    </div>
  );
}
