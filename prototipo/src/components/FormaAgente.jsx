// Forma animada de cada agente: su "cara" en Clusters. La forma depende del canal (para
// reconocerlos de un vistazo) y los colores de cada agente (dos especialistas del mismo canal
// no se ven iguales). Cambia de ritmo según lo que está haciendo.
//
// estado: 'reposo' | 'pensando' | 'trabajando'

// Forma y gama de color por canal (tonos dentro de la paleta AgeentIA).
const porCanal = {
  CMO: { forma: 'anillo', tonos: [214, 34] }, // azul marino + naranja de marca
  SEO: { forma: 'orbe', tonos: [212, 188] },
  SEM: { forma: 'remolino', tonos: [150, 205] },
  Pauta: { forma: 'petalos', tonos: [28, 340] },
  Redes: { forma: 'constelacion', tonos: [275, 320] },
  Email: { forma: 'capsula', tonos: [176, 222] },
  Estrategia: { forma: 'orbe', tonos: [235, 260] },
};
const formas = ['orbe', 'remolino', 'petalos', 'constelacion', 'capsula', 'anillo'];

function hash(texto = '') {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Forma y colores estables para un agente (mismo id = misma forma siempre). */
export function rasgosAgente(semilla, canal) {
  const h = hash(semilla);
  const base = porCanal[canal];
  const forma = base?.forma ?? formas[h % formas.length];
  const [t1, t2] = base?.tonos ?? [h % 360, (h >> 9) % 360];
  const desvio = ((h >> 3) % 30) - 15; // cada agente se corre un poco dentro de la gama de su canal
  return {
    forma,
    c1: `hsl(${(t1 + desvio + 360) % 360} 85% 58%)`,
    c2: `hsl(${(t2 - desvio + 360) % 360} 90% 62%)`,
    c3: `hsl(${(t1 + 360) % 360} 70% 24%)`,
    retraso: `${-((h >> 5) % 8)}s`,
  };
}

// Escala y posición de la carita según la forma (dentro del anillo va más pequeña, etc.)
const caraPorForma = {
  orbe: { escala: 0.78, y: 0 },
  remolino: { escala: 0.78, y: 0 },
  capsula: { escala: 0.62, y: 0 },
  anillo: { escala: 0.5, y: 0 },
  petalos: { escala: 0.62, y: 0 },
  constelacion: { escala: 0.7, y: 0 },
};

/** Carita del agente: ojos que parpadean y expresión según su estado. */
function Cara({ forma, estado, tamano, retraso }) {
  const { escala, y } = caraPorForma[forma] ?? caraPorForma.orbe;
  const conBoca = tamano >= 26;
  return (
    <svg
      className={`cara cara--${estado}`}
      viewBox="0 0 40 40"
      aria-hidden="true"
      style={{ transform: `translateY(${y}%) scale(${escala})`, '--retraso': retraso }}
    >
      {forma === 'constelacion' && <circle cx="20" cy="21" r="15" className="cara__fondo" />}
      <g className="cara__ojos">
        {[14, 26].map((cx) => (
          <g key={cx} className="cara__ojo">
            <ellipse cx={cx} cy="18" rx="4.4" ry="5" fill="#fff" />
            <circle cx={cx} cy="18.6" r="2.4" className="cara__pupila" />
            <circle cx={cx + 0.9} cy="17.3" r="0.8" fill="#fff" />
          </g>
        ))}
      </g>
      {conBoca &&
        (estado === 'pensando' ? (
          <ellipse cx="20" cy="28.5" rx="2" ry="2.3" className="cara__boca cara__boca--o" />
        ) : estado === 'trabajando' ? (
          <path d="M16.5 28 Q20 30.5 23.5 28" className="cara__boca" />
        ) : (
          <path d="M15 27 Q20 31.5 25 27" className="cara__boca" />
        ))}
      {conBoca && estado === 'reposo' && (
        <>
          <circle cx="10.5" cy="25" r="2" className="cara__mejilla" />
          <circle cx="29.5" cy="25" r="2" className="cara__mejilla" />
        </>
      )}
    </svg>
  );
}

export function FormaAgente({ semilla, canal, estado = 'reposo', tamano = 40, titulo, conCara = true }) {
  const r = rasgosAgente(semilla, canal);
  const estilo = { width: tamano, height: tamano, '--c1': r.c1, '--c2': r.c2, '--c3': r.c3, '--retraso': r.retraso };
  return (
    <span className={`forma forma--${r.forma} forma--${estado}`} style={estilo} role="img" aria-label={titulo ?? 'Agente'} title={titulo}>
      {r.forma === 'orbe' && <span className="forma__nucleo" />}
      {r.forma === 'remolino' && (
        <span className="forma__marco">
          <span className="forma__giro" />
        </span>
      )}
      {r.forma === 'capsula' && <span className="forma__nucleo" />}
      {r.forma === 'anillo' && (
        <>
          <span className="forma__aro" />
          <span className="forma__centro" />
          <span className="forma__orbita">
            <span className="forma__satelite" />
          </span>
        </>
      )}
      {r.forma === 'petalos' && (
        <span className="forma__orbita">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="forma__petalo" style={{ '--i': i }} />
          ))}
        </span>
      )}
      {r.forma === 'constelacion' && (
        <svg viewBox="0 0 30 30" className="forma__puntos" aria-hidden="true">
          {[0, 1, 2].flatMap((f) =>
            [0, 1, 2].map((c) => (
              <circle key={`${f}${c}`} cx={6 + c * 9} cy={6 + f * 9} r="3.2" style={{ '--i': f + c }} fill={(f + c) % 2 ? 'var(--c2)' : 'var(--c1)'} />
            )),
          )}
        </svg>
      )}
      {conCara && <Cara forma={r.forma} estado={estado} tamano={tamano} retraso={r.retraso} />}
    </span>
  );
}
