import { Link } from 'react-router-dom';
import { CheckCircle2, CircleDashed, KeyRound, Loader, Pencil } from 'lucide-react';
import { servicioPorId } from '../../data/catalogos.js';
import { ejecutivaPorId } from '../../data/equipo.js';
import { accesosFaltantes } from '../../data/ficha.js';
import { Alerta, Chip } from '../../components/ui.jsx';

const iconoEstado = { Aprobado: CheckCircle2, 'No iniciado': CircleDashed };
const ghlTexto = { conectado: 'Conectado', pendiente: 'Pendiente', desconectado: 'Desconectado' };
const ghlVariante = { conectado: 'verde', pendiente: 'amarillo', desconectado: 'rojo' };

/** Paso 1 del recorrido: quién es el cliente, su kick-off y brief, y qué accesos faltan. */
export function TabInfo({ cliente, ruta, lectura }) {
  const base = ruta.filter((a) => a.id === 'kickoff' || a.id === 'brief');
  const accesos = cliente.accesosPendientes ?? accesosFaltantes[cliente.id] ?? [];
  const datos = [
    ['Rubro', cliente.rubro],
    ['Ciudad', cliente.ciudad],
    ['Modelo', `B2B ${cliente.modelo.b2b} % · B2C ${cliente.modelo.b2c} %`],
    ['Ejecutiva', ejecutivaPorId[cliente.ejecutiva]?.nombre ?? '—'],
  ];

  return (
    <>
      <div className="seccion-titulo">
        <div>
          <h2>Información del cliente</h2>
          <p className="texto-sm atenuado" style={{ marginTop: 4 }}>
            Es el contexto del que parten todos los agentes. Si algo cambia, actualízalo aquí antes de pedir nuevas acciones.
          </p>
        </div>
        {/* En onboarding, la cabecera de la ficha ya ofrece "Continuar alta". */}
        {!lectura && !cliente.onboarding && (
          <Link to={`/alta?cliente=${cliente.id}`} className="boton boton--secundario">
            <Pencil size={15} /> Editar kick-off y brief
          </Link>
        )}
      </div>

      <div className="rejilla rejilla-2">
        <div className="tarjeta">
          <h3 style={{ marginBottom: 12 }}>Datos generales</h3>
          <dl className="info-cliente">
            {datos.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
            <div>
              <dt>Servicios</dt>
              <dd className="fila fila--envolver" style={{ gap: 6 }}>
                {cliente.servicios.map((s) => (
                  <Chip key={s} variante="suave">
                    {servicioPorId[s].nombre}
                  </Chip>
                ))}
              </dd>
            </div>
            <div>
              <dt>CRM (GHL)</dt>
              <dd>
                <Chip variante={ghlVariante[cliente.ghl]}>{ghlTexto[cliente.ghl]}</Chip>
              </dd>
            </div>
          </dl>
        </div>

        <div className="pila" style={{ gap: 16 }}>
          <div className="tarjeta">
            <h3 style={{ marginBottom: 12 }}>Kick-off y brief</h3>
            <div className="pila" style={{ gap: 10 }}>
              {base.map((a) => {
                const Icono = iconoEstado[a.estado] ?? Loader;
                return (
                  <div key={a.id} className="fila" style={{ justifyContent: 'space-between' }}>
                    <span className="fila" style={{ gap: 8 }}>
                      <Icono size={16} color={a.estado === 'Aprobado' ? 'var(--salud-verde)' : 'var(--azul-600)'} />
                      {a.nombre}
                    </span>
                    <span className="texto-sm atenuado">{a.estado}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="tarjeta">
            <h3 style={{ marginBottom: 12 }}>Accesos</h3>
            {accesos.length ? (
              <Alerta tipo="aviso">
                <KeyRound size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
                Faltan: {accesos.join(', ')}
              </Alerta>
            ) : (
              <span className="fila texto-sm" style={{ gap: 6 }}>
                <CheckCircle2 size={16} color="var(--salud-verde)" /> Todos los accesos están completos
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
