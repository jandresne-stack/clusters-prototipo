import { Link } from 'react-router-dom';
import { CheckCircle2, CircleDashed, Clock, Lock, Loader } from 'lucide-react';
import { etapas, listoParaEjecucion } from '../../lib/planeacion.js';
import { Alerta, Chip } from '../../components/ui.jsx';

const presentacion = {
  Aprobado: { clase: 'aprobado', icono: CheckCircle2, color: 'var(--salud-verde)' },
  'Esperando aprobación': { clase: 'esperando', icono: Clock, color: '#b86a00' },
  'En curso por agente': { clase: 'curso', icono: Loader, color: 'var(--azul-600)' },
  'En curso': { clase: 'curso', icono: Loader, color: 'var(--azul-600)' },
  'No iniciado': { clase: 'no-iniciado', icono: CircleDashed, color: 'var(--azul-400)' },
  Bloqueado: { clase: 'bloqueado', icono: Lock, color: 'var(--azul-400)' },
};

export function TabPlaneacion({ cliente, ruta, lectura }) {
  const aprobados = ruta.filter((a) => a.estado === 'Aprobado').length;
  const listo = listoParaEjecucion(ruta);

  return (
    <>
      <div className="seccion-titulo">
        <div>
          <h2>Ruta de planeación</h2>
          <p className="texto-sm atenuado" style={{ marginTop: 4 }}>
            {aprobados} de {ruta.length} artefactos aprobados · solo se muestran los de los servicios contratados
          </p>
        </div>
        {listo ? (
          <Chip variante="verde" icono={CheckCircle2}>
            Listo para ejecución
          </Chip>
        ) : (
          <Chip variante="amarillo">En planeación</Chip>
        )}
      </div>

      {cliente.onboarding && (
        <div style={{ marginBottom: 16 }}>
          <Alerta tipo="info">
            El Kick-off se completa en el asistente de alta (paso {cliente.onboarding.paso}: {cliente.onboarding.pasoNombre}).{' '}
            {!lectura && <Link to={`/alta?cliente=${cliente.id}`}>Continuar el alta</Link>}
          </Alerta>
        </div>
      )}

      <div className="ruta">
        {etapas.map((nombre, i) => {
          const items = ruta.filter((a) => a.etapa === i);
          if (!items.length) return null;
          return (
            <div key={nombre} className="ruta__etapa">
              <div className="ruta__etapa-titulo">
                <span className="ruta__numero">{i + 1}</span>
                {nombre}
              </div>
              {items.map((a) => (
                <Artefacto key={a.id} artefacto={a} lectura={lectura} />
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}

function Artefacto({ artefacto: a, lectura }) {
  const { clase, icono: Icono, color } = presentacion[a.estado];
  return (
    <div className={`artefacto artefacto--${clase}`}>
      <h4>{a.nombre}</h4>
      <div className="fila fila--envolver" style={{ gap: 4 }}>
        <Chip variante="suave">{a.canal}</Chip>
      </div>
      <span className="atenuado">Elabora: {a.autor}</span>
      <span className="estado-artefacto" style={{ color }}>
        <Icono size={13} strokeWidth={2.4} /> {a.estado === 'Bloqueado' ? 'Bloqueado' : a.estado}
      </span>
      {a.estado === 'Bloqueado' && <span style={{ color: 'var(--azul-800)', fontWeight: 600 }}>Requiere: {a.faltan.join(', ')}</span>}
      {a.aprobacionId && !lectura && (
        <Link to={`/aprobaciones/${a.aprobacionId}`} className="boton boton--primario" style={{ padding: '6px 12px', fontSize: 12 }}>
          Revisar y aprobar
        </Link>
      )}
    </div>
  );
}
