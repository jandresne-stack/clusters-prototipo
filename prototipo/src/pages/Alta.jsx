import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, FileUp, Link2, Plus, PlusCircle, Trash2, X } from 'lucide-react';
import { servicios } from '../data/catalogos.js';
import { HOY, useDatos } from '../context/DatosContext.jsx';
import { useSesion } from '../context/SesionContext.jsx';
import { Alerta, Chip, Encabezado } from '../components/ui.jsx';
import '../styles/cliente.css';
import '../styles/alta.css';

// Pasos del asistente, en el orden del spec (US-2).
const pasos = [
  'Datos generales y URL',
  'Kick-off',
  'Brief por línea de negocio',
  'Accesos y tracking',
  'Marca',
  'Objetivos, presupuesto y zonas',
  'Servicios contratados',
  'Resumen y diagnóstico inicial',
];

// Categorías del Kick-off de la metodología AMD (PREGUNTAS KICK OFF).
const camposKickoff = [
  ['lineas', 'Líneas de negocio y servicios prioritarios'],
  ['competidores', 'Competidores'],
  ['crm', 'CRM y proceso comercial'],
  ['respuesta', 'Tiempo de respuesta al lead'],
  ['ticket', 'Ticket promedio'],
  ['cierre', 'Tiempo de cierre'],
  ['estacionalidad', 'Estacionalidad'],
  ['presupuesto', 'Presupuesto'],
  ['zonas', 'Zonas geográficas'],
  ['objetivos', 'Objetivos orgánico vs. pauta'],
  ['pautaPrevia', 'Pauta y agencias previas'],
  ['tracking', 'Estado de tracking'],
  ['responsableSeo', 'Responsable de ejecutar SEO'],
  ['audiovisual', 'Producción audiovisual'],
  ['aprobacion', 'Flujo de aprobación de contenidos'],
  ['eeat', 'Pilares y expertos para autoría E-E-A-T'],
];

// Campos de cada brief (BRIEF por línea de negocio).
const camposBrief = [
  ['momento', 'Momento de la marca'],
  ['competidores', 'Competidores directos'],
  ['perfilEmpresa', 'Perfil de empresa'],
  ['demografia', 'Demografía'],
  ['cargo', 'Cargo'],
  ['habitos', 'Hábitos'],
  ['comoBuscan', 'Cómo buscan y deciden'],
  ['keywords', 'Keywords que usan'],
  ['problemas', 'Problemas que resuelven'],
  ['objeciones', 'Objeciones'],
  ['diferenciales', 'Diferenciales'],
  ['fortalezas', 'Fortalezas y debilidades'],
  ['estacionalidad', 'Estacionalidad'],
];

const plataformas = ['WordPress / CMS', 'Google Ads', 'Meta Business', 'Search Console', 'GA4', 'GTM', 'Clarity', 'Redes sociales'];
const estadosAcceso = ['Conectado', 'Pendiente', 'No aplica'];

// Acceso sin el cual el agente de cada servicio no puede empezar.
const accesoRequerido = { SEO: 'Search Console', SEM: 'Google Ads', Pauta: 'Meta Business', Redes: 'Redes sociales' };

// Subcuentas GHL existentes de la agencia (simuladas) para "Vincular subcuenta existente".
const subcuentasGhl = ['AMD · Cliente sin asignar 01', 'AMD · Cliente sin asignar 02', 'AMD · Demo comercial'];

const colores = ['#0a55cc', '#e0414f', '#1fa971', '#ff7a00', '#6f42c1', '#0e8f8f', '#b8860b', '#284365'];

function briefVacio(linea = '') {
  return { id: `brief-${Math.random().toString(36).slice(2, 8)}`, linea, b2b: 50, ...Object.fromEntries(camposBrief.map(([k]) => [k, ''])) };
}

function borradorVacio() {
  return {
    nombre: '',
    url: '',
    rubro: '',
    ciudad: '',
    kickoff: { b2b: 50, ...Object.fromEntries(camposKickoff.map(([k]) => [k, ''])) },
    briefs: [briefVacio()],
    ghl: { modo: null, subcuenta: '', estado: 'Pendiente' },
    accesos: Object.fromEntries(plataformas.map((p) => [p, 'Pendiente'])),
    archivos: [],
    objetivos: { leads: '', cpl: '', conversion: '', respuesta: '', presupuesto: '', zonas: '' },
    servicios: [],
  };
}

/** Borrador de ejemplo para los clientes de onboarding que vienen en los datos (sin borrador guardado). */
function borradorDesde(cliente) {
  const b = borradorVacio();
  const paso = cliente.onboarding?.paso ?? 1;
  b.nombre = cliente.nombre;
  b.url = `https://www.${cliente.id.replace(/-/g, '')}.com.co`;
  b.rubro = cliente.rubro;
  b.ciudad = cliente.ciudad;
  b.servicios = [...cliente.servicios];
  b.kickoff.b2b = cliente.modelo.b2b;
  if (paso > 2) {
    Object.assign(b.kickoff, {
      lineas: `Servicio principal de ${cliente.rubro.toLowerCase()}`,
      competidores: 'Dos competidores locales con mejor presencia en Google',
      crm: 'Hoy en Excel y WhatsApp; se migra a GHL',
      respuesta: 'Entre 2 y 6 horas',
      zonas: cliente.ciudad,
    });
  }
  if (paso > 3) b.briefs = [{ ...briefVacio(cliente.rubro), momento: 'Crecimiento: quiere más clientes nuevos', diferenciales: 'Atención personalizada y garantía' }];
  if (paso > 4) {
    b.ghl = { modo: 'vincular', subcuenta: subcuentasGhl[0], estado: cliente.ghl === 'conectado' ? 'Conectado' : 'Pendiente' };
  }
  for (const p of plataformas) {
    if (paso >= 4) b.accesos[p] = (cliente.accesosPendientes ?? []).includes(p) ? 'Pendiente' : 'Conectado';
  }
  if (paso >= 4 && !cliente.servicios.some((s) => s === 'Redes' || s === 'Pauta')) b.accesos['Redes sociales'] = 'No aplica';
  if (paso > 5) b.archivos = ['Manual de marca.pdf'];
  return b;
}

const slug = (texto) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export function Alta() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { clientes, agregarCliente, actualizarCliente } = useDatos();
  const { persona } = useSesion();

  // Retomar un alta a medias (?cliente=<id>) en el paso y con los datos donde se dejó.
  const existente = clientes.find((c) => c.id === params.get('cliente'));
  const [clienteId, setClienteId] = useState(existente?.id ?? null);
  const [paso, setPaso] = useState(existente?.onboarding?.paso ?? 1);
  const [b, setB] = useState(() => (existente ? (existente.borrador ?? borradorDesde(existente)) : borradorVacio()));
  const [intento, setIntento] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [paso]);

  const set = (cambios) => setB((x) => ({ ...x, ...cambios }));
  const setEn = (clave, cambios) => setB((x) => ({ ...x, [clave]: { ...x[clave], ...cambios } }));

  const ghlEstado = b.ghl.estado;
  const avisos = useMemo(
    () =>
      b.servicios
        .filter((s) => (s === 'Email' ? ghlEstado !== 'Conectado' : b.accesos[accesoRequerido[s]] !== 'Conectado'))
        .map((s) => {
          const nombre = servicios.find((x) => x.id === s).agente;
          const falta = s === 'Email' ? 'la subcuenta GHL' : accesoRequerido[s];
          return `El ${nombre} no puede empezar: falta acceso a ${falta}`;
        }),
    [b.servicios, b.accesos, ghlEstado],
  );

  if (params.get('cliente') && !existente) {
    return <Alerta tipo="error">No encontramos ese cliente.</Alerta>;
  }

  const valido = paso !== 1 || (b.nombre.trim() && b.url.trim());

  // Cada avance guarda el borrador en el almacén, así salir y volver retoma el paso (US-2).
  const guardar = (siguiente, extra = {}) => {
    const datosCliente = {
      nombre: b.nombre.trim(),
      rubro: b.rubro || 'Sin rubro',
      ciudad: b.ciudad || '—',
      modelo: { b2b: Number(b.kickoff.b2b), b2c: 100 - Number(b.kickoff.b2b) },
      servicios: b.servicios,
      ghl: ghlEstado === 'Conectado' ? 'conectado' : 'pendiente',
      accesosPendientes: plataformas.filter((p) => b.accesos[p] === 'Pendiente'),
      borrador: b,
      onboarding: { pct: Math.round(((siguiente - 1) / pasos.length) * 100), paso: siguiente, pasoNombre: pasos[siguiente - 1] },
      ...extra,
    };
    if (clienteId) {
      actualizarCliente(clienteId, datosCliente);
      return clienteId;
    }
    let id = slug(b.nombre) || 'cliente-nuevo';
    while (clientes.some((c) => c.id === id)) id += '-2';
    agregarCliente({
      id,
      color: colores[clientes.length % colores.length],
      ejecutiva: persona.id,
      kpis: null,
      pendientes: 0,
      oportunidadesAbiertas: 0,
      ...datosCliente,
    });
    setClienteId(id);
    return id;
  };

  const avanzar = () => {
    if (!valido) {
      setIntento(true);
      return;
    }
    setIntento(false);
    guardar(paso + 1);
    setPaso(paso + 1);
  };

  const finalizar = () => {
    const id = guardar(pasos.length, { onboarding: null, diagnosticoInicial: true, altaEl: HOY });
    navigate(`/clientes/${id}?tab=equipo`);
  };

  const salir = () => {
    if (clienteId) guardar(paso);
    navigate('/cartera');
  };

  return (
    <>
      <Encabezado
        titulo={existente ? `Alta de ${existente.nombre}` : 'Dar de alta cliente'}
        descripcion="Sigue la metodología de planeación estratégica de AMD. Puedes salir y retomar donde lo dejaste."
      >
        <button className="boton boton--secundario" onClick={salir}>
          <X size={16} /> Guardar y salir
        </button>
      </Encabezado>

      <div className="alta">
        <ol className="alta__pasos">
          {pasos.map((nombre, i) => {
            const n = i + 1;
            const estado = n < paso ? 'hecho' : n === paso ? 'actual' : '';
            return (
              <li key={nombre} className={`alta__paso ${estado}`}>
                <button disabled={n > paso} onClick={() => n < paso && setPaso(n)}>
                  <span className="alta__numero">{n < paso ? <Check size={14} /> : n}</span>
                  {nombre}
                </button>
              </li>
            );
          })}
        </ol>

        <section className="tarjeta alta__cuerpo">
          <h2 style={{ marginBottom: 4 }}>
            {paso}. {pasos[paso - 1]}
          </h2>
          <p className="texto-sm atenuado" style={{ marginBottom: 18 }}>
            Paso {paso} de {pasos.length}
          </p>

          {paso === 1 && <PasoDatos b={b} set={set} intento={intento} />}
          {paso === 2 && <PasoKickoff k={b.kickoff} set={(c) => setEn('kickoff', c)} />}
          {paso === 3 && <PasoBriefs briefs={b.briefs} set={(briefs) => set({ briefs })} />}
          {paso === 4 && <PasoAccesos b={b} setGhl={(c) => setEn('ghl', c)} setAcceso={(p, v) => setEn('accesos', { [p]: v })} />}
          {paso === 5 && <PasoMarca archivos={b.archivos} set={(archivos) => set({ archivos })} />}
          {paso === 6 && <PasoObjetivos o={b.objetivos} set={(c) => setEn('objetivos', c)} />}
          {paso === 7 && <PasoServicios elegidos={b.servicios} set={(s) => set({ servicios: s })} />}
          {paso === 8 && <PasoResumen b={b} avisos={avisos} />}

          <div className="alta__acciones">
            {paso > 1 && (
              <button className="boton boton--secundario" onClick={() => setPaso(paso - 1)}>
                <ArrowLeft size={16} /> Anterior
              </button>
            )}
            <span style={{ flex: 1 }} />
            {paso < pasos.length ? (
              <button className="boton boton--primario" onClick={avanzar}>
                Siguiente <ArrowRight size={16} />
              </button>
            ) : (
              <button className="boton boton--cta" onClick={finalizar} disabled={!b.servicios.length}>
                <Check size={16} /> Finalizar alta
              </button>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function Campo({ etiqueta, children, ancho }) {
  return (
    <label className="alta__campo" style={ancho ? { gridColumn: '1 / -1' } : undefined}>
      <span>{etiqueta}</span>
      {children}
    </label>
  );
}

function PasoDatos({ b, set, intento }) {
  return (
    <div className="alta__rejilla">
      <Campo etiqueta="Nombre del cliente *">
        <input className="campo-texto" value={b.nombre} onChange={(e) => set({ nombre: e.target.value })} placeholder="Ej. Clínica Dental Sonrisa Norte" />
        {intento && !b.nombre.trim() && <small className="alta__error">Escribe el nombre del cliente</small>}
      </Campo>
      <Campo etiqueta="URL del sitio *">
        <input className="campo-texto" value={b.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://" />
        {intento && !b.url.trim() && <small className="alta__error">Escribe la URL del sitio</small>}
      </Campo>
      <Campo etiqueta="Rubro">
        <input className="campo-texto" value={b.rubro} onChange={(e) => set({ rubro: e.target.value })} placeholder="Ej. Salud dental" />
      </Campo>
      <Campo etiqueta="Ciudad">
        <input className="campo-texto" value={b.ciudad} onChange={(e) => set({ ciudad: e.target.value })} placeholder="Ej. Bogotá" />
      </Campo>
    </div>
  );
}

function PasoKickoff({ k, set }) {
  return (
    <div className="alta__rejilla">
      <Campo etiqueta={`% B2B / B2C: ${k.b2b} % / ${100 - k.b2b} %`} ancho>
        <input type="range" min={0} max={100} step={5} value={k.b2b} onChange={(e) => set({ b2b: Number(e.target.value) })} />
      </Campo>
      {camposKickoff.map(([clave, etiqueta]) => (
        <Campo key={clave} etiqueta={etiqueta}>
          <textarea className="campo-texto" rows={2} value={k[clave]} onChange={(e) => set({ [clave]: e.target.value })} />
        </Campo>
      ))}
    </div>
  );
}

function PasoBriefs({ briefs, set }) {
  const actualizar = (id, cambios) => set(briefs.map((x) => (x.id === id ? { ...x, ...cambios } : x)));
  return (
    <div className="pila" style={{ gap: 16 }}>
      {briefs.map((brief, i) => (
        <div key={brief.id} className="alta__brief">
          <div className="fila" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <input
              className="campo-texto"
              style={{ maxWidth: 360, fontWeight: 700 }}
              placeholder={`Línea de negocio ${i + 1}`}
              value={brief.linea}
              onChange={(e) => actualizar(brief.id, { linea: e.target.value })}
            />
            {briefs.length > 1 && (
              <button className="boton boton--fantasma" style={{ color: 'var(--salud-rojo)' }} onClick={() => set(briefs.filter((x) => x.id !== brief.id))}>
                <Trash2 size={14} /> Quitar brief
              </button>
            )}
          </div>
          <div className="alta__rejilla">
            <Campo etiqueta={`% B2B / B2C: ${brief.b2b} % / ${100 - brief.b2b} %`} ancho>
              <input type="range" min={0} max={100} step={5} value={brief.b2b} onChange={(e) => actualizar(brief.id, { b2b: Number(e.target.value) })} />
            </Campo>
            {camposBrief.map(([clave, etiqueta]) => (
              <Campo key={clave} etiqueta={etiqueta}>
                <textarea className="campo-texto" rows={2} value={brief[clave]} onChange={(e) => actualizar(brief.id, { [clave]: e.target.value })} />
              </Campo>
            ))}
          </div>
        </div>
      ))}
      <button className="boton boton--secundario" style={{ alignSelf: 'flex-start' }} onClick={() => set([...briefs, briefVacio()])}>
        <Plus size={16} /> Agregar brief de otra línea de negocio
      </button>
    </div>
  );
}

function PasoAccesos({ b, setGhl, setAcceso }) {
  const { ghl } = b;
  return (
    <>
      <div className="alta__brief" style={{ marginBottom: 18 }}>
        <div className="fila" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <h3>Subcuenta de Go High Level</h3>
          <Chip variante={ghl.estado === 'Conectado' ? 'verde' : 'amarillo'}>{ghl.estado}</Chip>
        </div>
        <div className="fila" style={{ gap: 10, alignItems: 'stretch' }}>
          <button className={`alta__opcion${ghl.modo === 'vincular' ? ' activa' : ''}`} onClick={() => setGhl({ modo: 'vincular', estado: ghl.subcuenta ? 'Conectado' : 'Pendiente' })}>
            <Link2 size={18} />
            <strong>Vincular subcuenta existente</strong>
          </button>
          <button className={`alta__opcion${ghl.modo === 'crear' ? ' activa' : ''}`} onClick={() => setGhl({ modo: 'crear', subcuenta: '', estado: 'Pendiente' })}>
            <PlusCircle size={18} />
            <strong>Crear subcuenta nueva</strong>
          </button>
        </div>
        {ghl.modo === 'vincular' && (
          <div style={{ marginTop: 12, maxWidth: 360 }}>
            <Campo etiqueta="Subcuenta">
              <select className="campo-texto" value={ghl.subcuenta} onChange={(e) => setGhl({ subcuenta: e.target.value, estado: e.target.value ? 'Conectado' : 'Pendiente' })}>
                <option value="">Elige una subcuenta…</option>
                {subcuentasGhl.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Campo>
          </div>
        )}
        {ghl.modo === 'crear' && (
          <p className="texto-sm" style={{ marginTop: 12, color: 'var(--azul-800)' }}>
            Se solicitó la creación de la subcuenta (simulado). Queda en estado Pendiente hasta que GHL la active.
          </p>
        )}
      </div>

      <h3 style={{ marginBottom: 10 }}>Plataformas</h3>
      <p className="texto-sm atenuado" style={{ marginBottom: 12 }}>
        Solo se registra el estado de cada acceso. Los usuarios y contraseñas nunca se escriben en la plataforma.
      </p>
      <div className="tarjeta" style={{ padding: 0 }}>
        {plataformas.map((p) => (
          <div key={p} className="alta__acceso">
            <strong>{p}</strong>
            <div className="alta__segmentado" role="radiogroup" aria-label={`Estado de ${p}`}>
              {estadosAcceso.map((e) => (
                <button key={e} role="radio" aria-checked={b.accesos[p] === e} className={b.accesos[p] === e ? 'activo' : ''} onClick={() => setAcceso(p, e)}>
                  {e}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function PasoMarca({ archivos, set }) {
  return (
    <>
      <label className="alta__subida">
        <FileUp size={28} color="var(--azul-600)" />
        <strong>Adjunta el manual de marca (PDF) y otros archivos del cliente</strong>
        <span className="texto-sm atenuado">Logo, paleta, fotos de producto… (en el prototipo solo se guarda el nombre)</span>
        <input
          type="file"
          multiple
          hidden
          onChange={(e) => {
            set([...archivos, ...[...e.target.files].map((f) => f.name)]);
            e.target.value = '';
          }}
        />
      </label>
      {archivos.length > 0 && (
        <div className="pila" style={{ marginTop: 14 }}>
          {archivos.map((nombre, i) => (
            <div key={`${nombre}-${i}`} className="fila alta__archivo">
              <FileUp size={16} /> {nombre}
              <button className="boton boton--fantasma" style={{ marginLeft: 'auto' }} onClick={() => set(archivos.filter((_, j) => j !== i))} aria-label={`Quitar ${nombre}`}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function PasoObjetivos({ o, set }) {
  const campo = (clave, etiqueta, placeholder) => (
    <Campo etiqueta={etiqueta}>
      <input className="campo-texto" value={o[clave]} placeholder={placeholder} onChange={(e) => set({ [clave]: e.target.value })} />
    </Campo>
  );
  return (
    <div className="alta__rejilla">
      {campo('leads', 'Meta de leads / mes', 'Ej. 120')}
      {campo('cpl', 'Meta de CPL / CPA (COP)', 'Ej. 45000')}
      {campo('conversion', 'Meta de conversión a cotización (%)', 'Ej. 25')}
      {campo('respuesta', 'Meta de tiempo de respuesta al lead (min)', 'Ej. 10')}
      {campo('presupuesto', 'Presupuesto mensual de pauta (COP)', 'Ej. 3000000')}
      {campo('zonas', 'Zonas geográficas', 'Ej. Bogotá y Chía')}
    </div>
  );
}

function PasoServicios({ elegidos, set }) {
  return (
    <div className="rejilla rejilla-3">
      {servicios.map((s) => {
        const activo = elegidos.includes(s.id);
        return (
          <button
            key={s.id}
            role="switch"
            aria-checked={activo}
            className={`alta__opcion alta__servicio${activo ? ' activa' : ''}`}
            onClick={() => set(activo ? elegidos.filter((x) => x !== s.id) : [...elegidos, s.id])}
          >
            <span className="alta__interruptor" />
            <strong>{s.nombre}</strong>
            <span className="texto-xs atenuado">{s.agente}</span>
          </button>
        );
      })}
    </div>
  );
}

function PasoResumen({ b, avisos }) {
  const pendientes = plataformas.filter((p) => b.accesos[p] === 'Pendiente');
  return (
    <div className="pila" style={{ gap: 16 }}>
      <div className="rejilla rejilla-2">
        <Resumen titulo="Cliente">
          <strong>{b.nombre}</strong> · {b.url}
          <br />
          {b.rubro || 'Sin rubro'} · {b.ciudad || 'Sin ciudad'} · B2B {b.kickoff.b2b} % / B2C {100 - b.kickoff.b2b} %
        </Resumen>
        <Resumen titulo="Kick-off y briefs">
          {camposKickoff.filter(([k]) => b.kickoff[k]).length} de {camposKickoff.length} categorías del Kick-off respondidas
          <br />
          {b.briefs.length} {b.briefs.length === 1 ? 'brief' : 'briefs'}: {b.briefs.map((x) => x.linea || 'Sin nombre').join(', ')}
        </Resumen>
        <Resumen titulo="Accesos">
          Subcuenta GHL: <strong>{b.ghl.estado}</strong>
          <br />
          {pendientes.length ? `Pendientes: ${pendientes.join(', ')}` : 'Todos los accesos conectados'}
        </Resumen>
        <Resumen titulo="Servicios contratados">
          {b.servicios.length ? (
            <div className="fila fila--envolver" style={{ gap: 4 }}>
              {b.servicios.map((s) => (
                <Chip key={s} variante="suave">
                  {servicios.find((x) => x.id === s).nombre}
                </Chip>
              ))}
            </div>
          ) : (
            'Ninguno: elige al menos uno en el paso 7'
          )}
        </Resumen>
      </div>

      {avisos.map((a) => (
        <Alerta key={a}>{a}</Alerta>
      ))}

      <Alerta tipo="info">
        Al finalizar, el cliente aparece en tu Cartera y cada agente de los servicios contratados empieza el diagnóstico inicial
        (Benchmarking, KW Research y checklists).
      </Alerta>
    </div>
  );
}

function Resumen({ titulo, children }) {
  return (
    <div className="alta__brief">
      <div className="texto-xs atenuado" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
        {titulo}
      </div>
      <div className="texto-sm" style={{ color: 'var(--azul-800)' }}>
        {children}
      </div>
    </div>
  );
}
