import { Link } from 'react-router-dom';
import { CheckCircle2, CircleDashed, Clock, Lock, Loader, Sparkles } from 'lucide-react';
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
                <Artefacto key={a.id} artefacto={a} lectura={lectura} cliente={cliente} />
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}

// Agente real que elabora cada artefacto: el del canal, o el de estrategia para los transversales.
const canalAgente = { SEO: 'SEO', SEM: 'SEM', Meta: 'Pauta', Redes: 'Redes', Transversal: 'Estrategia' };

function Artefacto({ artefacto: a, lectura, cliente }) {
  const generable = !lectura && a.autor !== 'Ejecutiva' && !cliente.onboarding && (a.estado === 'No iniciado' || a.estado === 'En curso por agente');
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
      {generable && (
        <Link
          to={`/clientes/${cliente.id}/agentes/${canalAgente[a.canal]}?pedir=${encodeURIComponent(a.nombre)}`}
          className="boton boton--secundario"
          style={{ padding: '6px 12px', fontSize: 12 }}
        >
          <Sparkles size={13} /> Generar con agente
        </Link>
      )}
      {a.aprobacionId && !lectura && (
        <Link to={`/aprobaciones/${a.aprobacionId}`} className="boton boton--primario" style={{ padding: '6px 12px', fontSize: 12 }}>
          Revisar y aprobar
        </Link>
      )}
    </div>
  );
}
