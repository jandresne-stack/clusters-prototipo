import { Bot } from 'lucide-react';
import { Alerta, Avatar, Chip, Encabezado, InsigniaAgente, InsigniaGhl, Progreso, Semaforo } from '../components/ui.jsx';

const colores = [
  ['--azul-950', '#08203F', 'Fondo oscuro, barra lateral'],
  ['--azul-900', '#01346B', 'Primario, títulos'],
  ['--azul-800', '#284365', 'Texto secundario'],
  ['--azul-600', '#0A55CC', 'Acento, botones, enlaces'],
  ['--azul-400', '#7993B4', 'Texto atenuado'],
  ['--azul-300', '#B2C5DD', 'Bordes'],
  ['--azul-200', '#D8E5F6', 'Chips, filas'],
  ['--azul-50', '#F5F9FF', 'Fondo de página'],
  ['--naranja', '#FF9300', 'Isotipo, agentes'],
  ['--verde-cta', '#4DCB96', 'Acción principal'],
];

const tipos = [
  ['Tit · 36 / SemiBold', 36, 600],
  ['Tit2 · 28 / SemiBold', 28, 600],
  ['sub · 24 / Regular', 24, 400],
  ['botones · 20 / Bold', 20, 700],
  ['txt · 18 / Regular', 18, 400],
  ['card · 16 / Regular', 16, 400],
];

export default function GuiaEstilo() {
  return (
    <>
      <Encabezado
        titulo={
          <>
            Identidad visual <span className="destacado">AgeentIA</span>
          </>
        }
        descripcion="Tokens extraídos del Figma AgeentIA (Home). Esta página sirve para validar la marca antes de construir las vistas."
      />

      <div className="rejilla rejilla-2">
        <section className="tarjeta">
          <h3 style={{ marginBottom: 14 }}>Logo</h3>
          <div className="rejilla rejilla-2">
            <div style={{ padding: 20, borderRadius: 12, background: 'var(--azul-50)' }}>
              <img src="./logo-agentia.png" alt="Logo AgeentIA" style={{ width: '100%' }} />
            </div>
            <div style={{ padding: 20, borderRadius: 12, background: 'var(--grad-hero)' }}>
              <img src="./logo-agentia-blanco.png" alt="Logo AgeentIA blanco" style={{ width: '100%' }} />
            </div>
          </div>
        </section>

        <section className="tarjeta">
          <h3 style={{ marginBottom: 14 }}>Tipografía · Manrope</h3>
          <div className="pila">
            {tipos.map(([nombre, tamano, peso]) => (
              <div key={nombre} className="fila" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontSize: tamano, fontWeight: peso, letterSpacing: '-0.04em', color: 'var(--azul-900)', lineHeight: 1.1 }}>
                  Atención y ventas
                </span>
                <span className="texto-xs atenuado">{nombre}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="tarjeta" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 14 }}>Color</h3>
        <div className="rejilla" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {colores.map(([variable, hex, uso]) => (
            <div key={variable}>
              <div style={{ height: 64, borderRadius: 12, background: `var(${variable})`, border: '1px solid var(--azul-200)' }} />
              <div className="texto-sm" style={{ fontWeight: 700, marginTop: 6 }}>
                {hex}
              </div>
              <div className="texto-xs atenuado">{uso}</div>
            </div>
          ))}
        </div>
        <div className="rejilla rejilla-3" style={{ marginTop: 16 }}>
          <div style={{ height: 56, borderRadius: 12, background: 'var(--grad-primario)' }} />
          <div style={{ height: 56, borderRadius: 12, background: 'var(--grad-hero)' }} />
          <div style={{ height: 56, borderRadius: 12, background: 'var(--grad-naranja)' }} />
        </div>
      </section>

      <div className="rejilla rejilla-2" style={{ marginTop: 16 }}>
        <section className="tarjeta">
          <h3 style={{ marginBottom: 14 }}>Botones</h3>
          <div className="fila fila--envolver">
            <button className="boton boton--cta">Dar de alta cliente</button>
            <button className="boton boton--primario">Aprobar</button>
            <button className="boton boton--secundario">Pedir cambios</button>
            <button className="boton boton--peligro">Escalar a especialista</button>
            <button className="boton boton--fantasma">Ver detalle</button>
          </div>
        </section>

        <section className="tarjeta">
          <h3 style={{ marginBottom: 14 }}>Estados e insignias</h3>
          <div className="fila fila--envolver">
            <Semaforo salud="verde" />
            <Semaforo salud="amarillo" />
            <Semaforo salud="rojo" />
            <Chip>Onboarding en curso · 40 %</Chip>
            <Chip variante="atrasado">Atrasado</Chip>
            <InsigniaGhl />
            <InsigniaGhl>Ejecuta en GHL</InsigniaGhl>
            <Chip variante="suave">SEO</Chip>
          </div>
          <div style={{ marginTop: 14, maxWidth: 280 }}>
            <Progreso valor={62} />
          </div>
        </section>
      </div>

      <div className="rejilla rejilla-2" style={{ marginTop: 16 }}>
        <section className="propuesta-agente">
          <div className="fila" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <InsigniaAgente agente="Agente SEO" />
            <Chip variante="verde">Confianza alta</Chip>
          </div>
          <h4 style={{ marginBottom: 6 }}>Por qué lo propongo</h4>
          <p className="texto-sm" style={{ color: 'var(--azul-800)' }}>
            Así se ve todo lo que genera un agente: borde naranja, insignia con el nombre del agente y la
            explicación en lenguaje simple.
          </p>
        </section>

        <section className="tarjeta pila">
          <h3>Alertas</h3>
          <Alerta tipo="error">GHL desconectado: sin datos de leads ni automatizaciones</Alerta>
          <Alerta>El Agente SEM no puede empezar: falta acceso a Google Ads</Alerta>
          <Alerta tipo="info">Disponible en la versión final</Alerta>
          <div className="fila">
            <Avatar nombre="Laura Méndez" color="#0a55cc" redondo />
            <Avatar nombre="Café de Origen Tolima" color="#8a5a2b" />
            <span className="avatar" style={{ background: 'var(--grad-naranja)' }}>
              <Bot size={18} />
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
