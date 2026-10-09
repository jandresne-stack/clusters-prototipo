import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSesion } from '../context/SesionContext.jsx';
import { diasDesde, useDatos } from '../context/DatosContext.jsx';
import { especialistaPorId } from '../data/equipo.js';
import { plural } from '../lib/formato.js';
import { Alerta, Avatar, Chip, Encabezado, EstadoVacio } from '../components/ui.jsx';
import { Pestanas, fechaCorta } from '../components/secundarios.jsx';
import { ChipEstadoCaso, DetalleCaso, casoAtrasado } from './Casos.jsx';
import '../styles/vistas-secundarias.css';

/*
 * US-12: casos que la ejecutiva escaló a especialistas (rol Ejecutiva, ruta /escalados).
 * Muestra el estado, el especialista asignado (o "Sin asignar") y los días transcurridos.
 * Acepta ?caso=<id> para abrir un caso directamente.
 * Para escalar un ítem nuevo, usa <DialogoEscalar> de components/secundarios.jsx.
 */

export function Escalados() {
  const { persona } = useSesion();
  const { escalados, clientes } = useDatos();
  const [params, setParams] = useSearchParams();
  const [pestana, setPestana] = useState('abiertos');
  const seleccion = params.get('caso');

  const mios = escalados.filter((e) => e.ejecutiva === persona.id);
  const grupos = {
    abiertos: mios.filter((e) => e.estado !== 'Resuelto'),
    resueltos: mios.filter((e) => e.estado === 'Resuelto'),
  };
  const lista = [...grupos[pestana]].sort((a, b) => a.creado.localeCompare(b.creado));
  const caso = mios.find((e) => e.id === seleccion) ?? null;
  const sinAsignar = grupos.abiertos.filter((e) => !e.especialista).length;
  const atrasados = grupos.abiertos.filter(casoAtrasado).length;

  function seleccionar(id) {
    const p = new URLSearchParams(params);
    if (id) p.set('caso', id);
    else p.delete('caso');
    setParams(p, { replace: true });
  }

  return (
    <>
      <Encabezado
        titulo="Escalados"
        descripcion={`${plural(grupos.abiertos.length, 'caso abierto', 'casos abiertos')} · ${sinAsignar} sin asignar`}
      />

      {atrasados > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Alerta>
            {atrasados === 1 ? '1 caso lleva' : `${atrasados} casos llevan`} más de 3 días esperando sin que un especialista lo tome.
          </Alerta>
        </div>
      )}

      <Pestanas
        valor={pestana}
        onCambiar={(p) => {
          setPestana(p);
          seleccionar(null);
        }}
        opciones={[
          { id: 'abiertos', texto: 'Abiertos', n: grupos.abiertos.length },
          { id: 'resueltos', texto: 'Resueltos', n: grupos.resueltos.length },
        ]}
      />

      <div className="vs-dividido">
        <div className="tarjeta tabla-envoltorio" style={{ padding: 0 }}>
          {lista.length === 0 ? (
            <EstadoVacio titulo={pestana === 'abiertos' ? 'No tienes casos escalados abiertos' : 'Aún no tienes casos resueltos'}>
              {pestana === 'abiertos' && (
                <p className="atenuado texto-sm">Puedes escalar cualquier propuesta desde su detalle con "Escalar a especialista".</p>
              )}
            </EstadoVacio>
          ) : (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Caso</th>
                  <th>Especialista</th>
                  <th>Estado</th>
                  <th>{pestana === 'abiertos' ? 'Días' : 'Resuelto'}</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((e) => {
                  const cliente = clientes.find((c) => c.id === e.cliente);
                  const especialista = e.especialista ? especialistaPorId[e.especialista] : null;
                  return (
                    <tr
                      key={e.id}
                      className={`vs-caso-fila${seleccion === e.id ? ' seleccionado' : ''}`}
                      onClick={() => seleccionar(e.id)}
                    >
                      <td>
                        <div className="fila">
                          <Avatar nombre={cliente.nombre} color={cliente.color} tamano={30} />
                          <strong style={{ color: 'var(--azul-900)' }}>{cliente.nombre}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="pila" style={{ gap: 2 }}>
                          <span className="texto-sm" style={{ fontWeight: 700 }}>
                            {e.tipoTarea}
                          </span>
                          <span className="texto-xs atenuado">
                            Canal {e.canal}
                            {e.origen === 'Automático' && ' · escalado automático'}
                          </span>
                        </div>
                      </td>
                      <td>
                        {especialista ? (
                          <div className="fila" style={{ gap: 8 }}>
                            <Avatar nombre={especialista.nombre} texto={especialista.iniciales} color={especialista.color} redondo tamano={26} />
                            <span className="texto-sm">{especialista.nombre}</span>
                          </div>
                        ) : (
                          <span className="texto-sm atenuado">Sin asignar</span>
                        )}
                      </td>
                      <td>
                        <ChipEstadoCaso caso={e} />
                      </td>
                      <td>
                        {pestana === 'abiertos' ? (
                          <div className="pila" style={{ gap: 4 }}>
                            <span className="texto-sm" style={{ fontWeight: 700 }}>
                              {plural(diasDesde(e.creado), 'día')}
                            </span>
                            {casoAtrasado(e) && <Chip variante="atrasado">Atrasado</Chip>}
                          </div>
                        ) : (
                          <span className="texto-sm">{fechaCorta(e.resueltoEl)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="vs-detalle">
          {caso ? (
            <DetalleCaso key={caso.id} caso={caso} modo="ejecutiva" />
          ) : (
            <div className="tarjeta">
              <EstadoVacio titulo="Selecciona un caso">
                <p className="atenuado texto-sm">Verás el motivo, la propuesta del agente y la respuesta del especialista.</p>
              </EstadoVacio>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
