import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { diasDesde, esPendiente, estadosOportunidadAbierta, useDatos } from '../context/DatosContext.jsx';
import { ejecutivas } from '../data/equipo.js';
import { saludCliente } from '../lib/salud.js';
import { plural } from '../lib/formato.js';
import { Avatar, Chip, Encabezado, EstadoVacio, Semaforo } from '../components/ui.jsx';
import '../styles/vistas-secundarias.css';

/*
 * US-15: tablero del líder de Clusters (rol Líder, ruta /equipo).
 * Una fila por ejecutiva con carga y salud de cartera. Al hacer clic se abre su Cartera
 * en solo lectura: /cartera?ejecutiva=<id>&lectura=1.
 */

// "Aceptadas en el mes": desde el inicio del mes del historial (septiembre) hasta hoy.
const INICIO_MES = '2026-09-01';

export function TableroEquipo() {
  const navigate = useNavigate();
  const { clientes, aprobaciones, escalados, oportunidades } = useDatos();

  const { filas, totales, enRiesgo } = useMemo(() => {
    const conSalud = clientes.map((c) => ({ ...c, salud: saludCliente(c) }));
    const ejecutivaDe = Object.fromEntries(clientes.map((c) => [c.id, c.ejecutiva]));

    const filas = ejecutivas.map((ej) => {
      const cartera = conSalud.filter((c) => c.ejecutiva === ej.id);
      const ids = new Set(cartera.map((c) => c.id));
      const pendientes = aprobaciones.filter((a) => ids.has(a.cliente) && esPendiente(a));
      return {
        ...ej,
        clientes: cartera.length,
        rojo: cartera.filter((c) => c.salud === 'rojo').length,
        amarillo: cartera.filter((c) => c.salud === 'amarillo').length,
        verde: cartera.filter((c) => c.salud === 'verde').length,
        onboarding: cartera.filter((c) => !c.salud).length,
        pendientes: pendientes.length,
        atrasadas: pendientes.filter((a) => diasDesde(a.creado) > 3).length,
        escalados: escalados.filter((e) => e.ejecutiva === ej.id && e.estado !== 'Resuelto').length,
        oportunidades: oportunidades.filter((o) => ids.has(o.cliente) && estadosOportunidadAbierta.includes(o.estado)).length,
      };
    });

    const aceptadasMes = oportunidades.filter(
      (o) => o.estado === 'Aceptada' && (o.aceptadaEl ?? o.cerradaEl ?? '') >= INICIO_MES && ejecutivaDe[o.cliente],
    ).length;

    return {
      filas,
      enRiesgo: conSalud.filter((c) => c.salud === 'rojo'),
      totales: {
        activos: conSalud.filter((c) => c.salud).length,
        onboarding: conSalud.filter((c) => !c.salud).length,
        rojo: conSalud.filter((c) => c.salud === 'rojo').length,
        aceptadasMes,
      },
    };
  }, [clientes, aprobaciones, escalados, oportunidades]);

  const verCartera = (id) => navigate(`/cartera?ejecutiva=${id}&lectura=1`);
  const nombreEjecutiva = Object.fromEntries(ejecutivas.map((e) => [e.id, e.nombre]));

  return (
    <>
      <Encabezado titulo="Tablero del equipo" descripcion="Carga y salud de cartera de cada ejecutiva de Clusters." />

      <div className="rejilla rejilla-3" style={{ marginBottom: 20 }}>
        <div className="vs-metrica vs-metrica--azul">
          <span className="vs-metrica__valor">{totales.activos}</span>
          <span className="vs-metrica__texto">
            Clientes activos
            {totales.onboarding > 0 && <span className="atenuado"> · {totales.onboarding} en onboarding</span>}
          </span>
        </div>
        <div className="vs-metrica vs-metrica--rojo">
          <span className="vs-metrica__valor">{totales.rojo}</span>
          <span className="vs-metrica__texto">Clientes en riesgo (rojo)</span>
        </div>
        <div className="vs-metrica vs-metrica--verde">
          <span className="vs-metrica__valor">{totales.aceptadasMes}</span>
          <span className="vs-metrica__texto">Oportunidades aceptadas en el mes</span>
        </div>
      </div>

      <div className="tarjeta tabla-envoltorio" style={{ padding: 0, marginBottom: 24 }}>
        <table className="tabla">
          <thead>
            <tr>
              <th style={{ paddingLeft: 20 }}>Ejecutiva</th>
              <th>Clientes</th>
              <th>Salud de cartera</th>
              <th>Aprobaciones pendientes</th>
              <th>Atrasadas</th>
              <th>Escalados abiertos</th>
              <th>Oportunidades abiertas</th>
              <th aria-label="Ver cartera" />
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id} className="vs-fila-ejecutiva" onClick={() => verCartera(f.id)} title={`Ver la cartera de ${f.nombre}`}>
                <td style={{ paddingLeft: 20 }}>
                  <div className="fila">
                    <Avatar nombre={f.nombre} texto={f.iniciales} color={f.color} redondo />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--azul-900)' }}>{f.nombre}</div>
                      {f.nueva && <span className="texto-xs atenuado">Recién incorporada</span>}
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`vs-numero${f.clientes === 0 ? ' vs-numero--cero' : ''}`}>{f.clientes}</span>
                  {f.onboarding > 0 && <div className="texto-xs atenuado">{f.onboarding} en onboarding</div>}
                </td>
                <td>
                  {f.clientes === 0 ? (
                    <span className="texto-sm atenuado">Sin cartera</span>
                  ) : (
                    <span className="vs-salud-mini" aria-label={`${f.rojo} en rojo, ${f.amarillo} en amarillo, ${f.verde} en verde`}>
                      <span className={`rojo${f.rojo === 0 ? ' cero' : ''}`} title="Crítico">{f.rojo}</span>
                      <span className={`amarillo${f.amarillo === 0 ? ' cero' : ''}`} title="En riesgo">{f.amarillo}</span>
                      <span className={`verde${f.verde === 0 ? ' cero' : ''}`} title="En meta">{f.verde}</span>
                    </span>
                  )}
                </td>
                <td>
                  <span className={`vs-numero${f.pendientes === 0 ? ' vs-numero--cero' : ''}`}>{f.pendientes}</span>
                </td>
                <td>
                  {f.atrasadas > 0 ? <Chip variante="atrasado">{plural(f.atrasadas, 'atrasada')}</Chip> : <span className="vs-numero vs-numero--cero">0</span>}
                </td>
                <td>
                  <span className={`vs-numero${f.escalados === 0 ? ' vs-numero--cero' : ''}`}>{f.escalados}</span>
                </td>
                <td>
                  <span className={`vs-numero${f.oportunidades === 0 ? ' vs-numero--cero' : ''}`}>{f.oportunidades}</span>
                </td>
                <td style={{ paddingRight: 20, textAlign: 'right' }}>
                  <ChevronRight size={18} className="atenuado" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginBottom: 12 }}>Clientes en riesgo</h3>
      <div className="tarjeta tabla-envoltorio" style={{ padding: 0 }}>
        {enRiesgo.length === 0 ? (
          <EstadoVacio titulo="Ningún cliente está en rojo" />
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Cliente</th>
                <th>Ejecutiva</th>
                <th>Salud</th>
                <th>Pendientes</th>
              </tr>
            </thead>
            <tbody>
              {enRiesgo.map((c) => (
                <tr key={c.id} className="vs-fila-ejecutiva" onClick={() => verCartera(c.ejecutiva)}>
                  <td style={{ paddingLeft: 20 }}>
                    <div className="fila">
                      <Avatar nombre={c.nombre} color={c.color} tamano={30} />
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--azul-900)' }}>{c.nombre}</div>
                        <div className="texto-xs atenuado">
                          {c.rubro} · {c.ciudad}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="texto-sm">{nombreEjecutiva[c.ejecutiva]}</td>
                  <td>
                    <Semaforo salud="rojo" />
                  </td>
                  <td>
                    <span className="vs-numero">{aprobaciones.filter((a) => a.cliente === c.id && esPendiente(a)).length}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
