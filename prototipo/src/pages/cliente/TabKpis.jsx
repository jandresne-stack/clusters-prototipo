import { kpisNegocio } from '../../data/catalogos.js';
import { bloquesKpiCanal } from '../../lib/kpisCanal.js';
import { Alerta } from '../../components/ui.jsx';
import { TarjetaKpi } from '../../components/Kpi.jsx';

// Fuente del CPL/CPA según la pauta contratada.
function fuenteCpl(servicios) {
  const f = [servicios.includes('SEM') && 'Google Ads', servicios.includes('Pauta') && 'Meta Ads'].filter(Boolean);
  return f.join(' + ');
}

export function TabKpis({ cliente }) {
  if (cliente.onboarding) {
    return <Alerta tipo="info">Los KPIs aparecen cuando termine el alta y los agentes completen el diagnóstico inicial.</Alerta>;
  }

  const negocio = kpisNegocio.map((def) => {
    const datos = cliente.kpis?.[def.id];
    if (!cliente.kpis) return { ...def, fuente: def.fuente === 'GHL' ? 'GHL' : fuenteCpl(cliente.servicios) || '—', sinDatos: 'Sin datos: diagnóstico inicial en curso' };
    const fuente = def.fuente === 'GHL' ? 'GHL' : fuenteCpl(cliente.servicios);
    if (!datos) return { ...def, fuente: '—', sinDatos: 'No aplica: sin pauta contratada' };
    if (def.fuente === 'GHL' && cliente.ghl !== 'conectado') return { ...def, fuente, sinDatos: 'Sin datos: falta acceso a GHL' };
    return { ...def, fuente, ...datos };
  });

  return (
    <>
      <div className="seccion-titulo">
        <h2>KPIs de negocio</h2>
        <span className="texto-sm atenuado">Septiembre 2026 vs. meta · tendencia abr–sep</span>
      </div>
      <div className="rejilla-kpi">
        {negocio.map((k) => (
          <TarjetaKpi key={k.id} {...k} destacada />
        ))}
      </div>

      {bloquesKpiCanal(cliente).map((bloque) => (
        <section key={bloque.canal}>
          <div className="seccion-titulo">
            <h2>{bloque.titulo}</h2>
          </div>
          <div className="rejilla-kpi">
            {bloque.kpis.map((k) => (
              <TarjetaKpi key={k.id} {...k} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
