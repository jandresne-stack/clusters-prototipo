import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, MessageSquarePlus, Sparkles, Zap } from 'lucide-react';
import { servicioPorId } from '../data/catalogos.js';
import { ejecutivaPorId } from '../data/equipo.js';
import { esPendiente, useDatos } from '../context/DatosContext.jsx';
import { useSesion } from '../context/SesionContext.jsx';
import { alertasCliente, saludCliente } from '../lib/salud.js';
import { listoParaEjecucion, rutaPlaneacion } from '../lib/planeacion.js';
import { Alerta, Avatar, Chip, EstadoVacio, Progreso, Semaforo } from '../components/ui.jsx';
import { formatoFecha } from '../lib/formato.js';
import { TabPlaneacion } from './cliente/TabPlaneacion.jsx';
import { TabEquipo } from './cliente/TabEquipo.jsx';
import { TabKpis } from './cliente/TabKpis.jsx';
import { TabPlan } from './cliente/TabPlan.jsx';
import { TabAutomatizaciones } from './cliente/TabAutomatizaciones.jsx';
import { OportunidadesCliente } from './Oportunidades.jsx';
import { DialogoSolicitud } from '../components/secundarios.jsx';
import { TabLeads } from './cliente/TabLeads.jsx';
import { TabInfo } from './cliente/TabInfo.jsx';
import { Subservicio } from './cliente/Subservicio.jsx';
import { tabsCliente, tieneLeads } from '../lib/navCliente.js';
import '../styles/cliente.css';

const etiquetaGhl = { conectado: 'GHL conectado', pendiente: 'GHL pendiente', desconectado: 'GHL desconectado' };
const varianteGhl = { conectado: 'verde', pendiente: 'amarillo', desconectado: 'rojo' };

/** Ficha del cliente: planeación, equipo de agentes, KPIs, plan mensual y automatizaciones GHL. */
export function Cliente() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const datos = useDatos();
  const { rol } = useSesion();
  const navigate = useNavigate();
  const [solicitud, setSolicitud] = useState(false);
  const cliente = datos.clientes.find((c) => c.id === id);
  // Solo lectura: Especialista y Líder, o cualquier enlace con ?lectura=1 (US-14, US-15).
  const lectura = params.get('lectura') === '1' || rol !== 'ejecutiva';

  if (!cliente) {
    return (
      <div className="tarjeta">
        <EstadoVacio titulo="Cliente no encontrado">
          <Link to="/cartera" className="boton boton--secundario">
            <ArrowLeft size={16} /> Volver a la Cartera
          </Link>
        </EstadoVacio>
      </div>
    );
  }

  const salud = saludCliente(cliente);
  const ruta = rutaPlaneacion(cliente, datos.aprobaciones);
  const listo = !cliente.onboarding && listoParaEjecucion(ruta);
  const pendientesCliente = datos.aprobaciones.filter((a) => a.cliente === id && esPendiente(a));
  const porActivar = datos.oportunidades.filter((o) => o.cliente === id && o.estado === 'Aceptada' && !cliente.servicios.includes(o.servicio));

  // La navegación entre secciones vive en el menú lateral (lib/navCliente.js), en el orden del recorrido.
  const pedida = params.get('tab');
  const tab = tabsCliente.includes(pedida) && (pedida !== 'leads' || tieneLeads(cliente)) ? pedida : cliente.onboarding ? 'info' : 'kpis';

  const activar = (oportunidad) =>
    datos.actualizarCliente(cliente.id, (c) => ({
      servicios: [...c.servicios, oportunidad.servicio],
      serviciosNuevos: [...(c.serviciosNuevos ?? []), oportunidad.servicio],
    }));

  return (
    <>
      {lectura && (
        <div style={{ marginBottom: 12 }}>
          <Alerta tipo="info">Vista de solo lectura</Alerta>
        </div>
      )}
      <Link to="/cartera" className="texto-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
        <ArrowLeft size={14} /> Cartera
      </Link>

      <header className="ficha-cabecera">
        <div>
          <div className="ficha-cabecera__titulo">
            <Avatar nombre={cliente.nombre} color={cliente.color} tamano={52} />
            <div>
              <h1>{cliente.nombre}</h1>
              <div className="texto-sm" style={{ color: 'var(--azul-800)', marginTop: 2 }}>
                {cliente.rubro} · {cliente.ciudad} · B2B {cliente.modelo.b2b} % / B2C {cliente.modelo.b2c} % · Ejecutiva: {ejecutivaPorId[cliente.ejecutiva]?.nombre}
              </div>
            </div>
          </div>
          <div className="ficha-cabecera__meta">
            {cliente.servicios.map((s) => (
              <Chip key={s} variante="suave">
                {servicioPorId[s].nombre}
              </Chip>
            ))}
            <Chip variante={varianteGhl[cliente.ghl]} icono={Zap}>
              {etiquetaGhl[cliente.ghl]}
            </Chip>
            {listo && <Chip variante="verde">Listo para ejecución</Chip>}
          </div>
        </div>
        <div className="pila" style={{ alignItems: 'flex-end', minWidth: 200 }}>
          {cliente.diagnosticoInicial ? (
            <Chip variante="suave">Diagnóstico inicial en curso</Chip>
          ) : salud ? (
            <Semaforo salud={salud} />
          ) : (
            <div className="pila" style={{ gap: 4, width: 200 }}>
              <Chip>Onboarding en curso · {cliente.onboarding.pct} %</Chip>
              <Progreso valor={cliente.onboarding.pct} />
              {!lectura && (
                <Link to={`/alta?cliente=${cliente.id}`} className="boton boton--cta" style={{ marginTop: 6 }}>
                  Continuar alta (paso {cliente.onboarding.paso})
                </Link>
              )}
            </div>
          )}
          {!cliente.onboarding && (
            <div className="fila" style={{ gap: 8 }}>
              {!lectura && (
                <button className="boton boton--secundario" onClick={() => setSolicitud(true)}>
                  <MessageSquarePlus size={16} /> Nueva solicitud
                </button>
              )}
              <button className="boton boton--secundario" onClick={() => navigate(`/clientes/${cliente.id}/reporte`)}>
                <FileText size={16} /> Reporte mensual
              </button>
            </div>
          )}
          {cliente.reporteListoEl && <Chip variante="verde">Reporte listo para reunión · {formatoFecha(cliente.reporteListoEl)}</Chip>}
          {pendientesCliente.length > 0 && !lectura && (
            <Link to={`/aprobaciones?cliente=${cliente.id}`} className="boton boton--secundario">
              {pendientesCliente.length} por aprobar
            </Link>
          )}
        </div>
      </header>

      <div className="pila" style={{ marginBottom: 16 }}>
        {alertasCliente(cliente).map((a) => (
          <Alerta key={a.texto} tipo={a.tipo}>
            {a.texto}
          </Alerta>
        ))}
        {porActivar.map((o) => (
          <div key={o.id} className="alerta alerta--info" style={{ alignItems: 'center' }}>
            <Sparkles size={16} />
            <span>
              Oportunidad aceptada: <strong>{o.titulo ?? servicioPorId[o.servicio].nombre}</strong>. Activa el servicio para sumar su agente y su planeación.
            </span>
            {!lectura && (
              <button className="boton boton--primario" style={{ marginLeft: 'auto' }} onClick={() => activar(o)}>
                Activar {servicioPorId[o.servicio].nombre}
              </button>
            )}
          </div>
        ))}
      </div>

      {solicitud && <DialogoSolicitud cliente={cliente} onCerrar={() => setSolicitud(false)} />}

      {tab === 'info' && <TabInfo cliente={cliente} ruta={ruta} lectura={lectura} />}
      {tab === 'kpis' && <TabKpis cliente={cliente} />}
      {tab === 'equipo' && !params.get('sub') && <TabEquipo cliente={cliente} datos={datos} lectura={lectura} />}
      {tab === 'equipo' && params.get('sub') && (
        <Subservicio cliente={cliente} datos={datos} lectura={lectura} agente={params.get('agente')} sub={params.get('sub')} />
      )}
      {tab === 'planeacion' && <TabPlaneacion cliente={cliente} ruta={ruta} lectura={lectura} />}
      {tab === 'plan' && <TabPlan cliente={cliente} ruta={ruta} listo={listo} lectura={lectura} />}
      {tab === 'automatizaciones' && <TabAutomatizaciones cliente={cliente} lectura={lectura} />}
      {tab === 'leads' && <TabLeads cliente={cliente} lectura={lectura} />}
      {tab === 'oportunidades' && <OportunidadesCliente clienteId={cliente.id} />}
    </>
  );
}
