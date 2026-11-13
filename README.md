# Clusters — prototipo de interfaz

Prototipo navegable de **Clusters**, la plataforma con la que la ejecutiva de marketing de AMD dirige a su equipo de agentes de IA por cliente (SEO, SEM, redes, pauta social, email marketing, con Go High Level como fuente de datos y brazo de ejecución).

Todos los datos son ficticios. No hay backend: el estado vive en memoria (`src/context/DatosContext.jsx`) y se reinicia al recargar.

## Cómo correrlo

Requiere Node 18 o superior.

```bash
cd prototipo
npm install
npm run dev
```

Abre http://localhost:5173.

Para generar una versión estática que se puede abrir sin servidor (o subir a cualquier hosting):

```bash
cd prototipo
npm run build
```

El resultado queda en `prototipo/dist/`. Usa rutas relativas y HashRouter, así que funciona desde cualquier carpeta.

## Qué incluye

| Ruta | Pantalla |
|---|---|
| `#/cartera` | Cartera de clientes con estado de salud |
| `#/alta` | Alta de cliente paso a paso (metodología AMD) |
| `#/clientes/:id` | Ficha del cliente: KPIs, equipo de agentes, planeación, plan mensual, automatizaciones GHL, leads, oportunidades |
| `#/clientes/:id/reporte` | Reporte para el cliente |
| `#/aprobaciones` | Bandeja de aprobaciones y detalle |
| `#/oportunidades` | Oportunidades de venta cruzada |
| `#/escalados` | Casos escalados a especialistas |
| `#/casos` | Vista del especialista |
| `#/equipo` | Tablero de la líder de equipo |
| `#/estilo` | Guía de estilo (tokens de la marca AgeentIA) |

El rol (ejecutiva, especialista, líder) se cambia desde el shell de la app.

## Estructura

```
docs/spec/       Spec funcional con las 16 user stories que cubre el prototipo
prototipo/       App React + Vite
  src/pages/     Pantallas
  src/data/      Datos ficticios
  src/context/   Estado compartido (rol, datos)
  src/styles/    Tokens y estilos
.claude/         Skills de brainstorm/spec y config para levantar el prototipo desde Claude Code
```

## Agentes reales (rama `integracion-agentes`)

Los agentes de Clusters pueden funcionar con agentes de IA reales. El motor es el **Panel de Agentes AMD**
(`agency-agents/panel`): guarda la llave de OpenRouter, las conversaciones y las propuestas. Clusters no cambia su
flujo: los agentes reales entran por las mismas pantallas.

| En Clusters | Qué hace ahora |
|---|---|
| Equipo de agentes → **CMO del cliente** | Director de marketing por cliente (`agency-agents/panel/clusters/agentes/cmo.md`). Lee documentos base, KPIs y el estado de Clusters; propone el **plan mensual** (aparece en Plan mensual para quitar, posponer y aprobar) y, si la ejecutiva lo confirma, encarga trabajo a los agentes de cada canal. |
| Cliente → **Documentos base** | Un investigador escribe 5 documentos (negocio, competencia, audiencia, voz de marca, estrategia) con la ficha, el sitio y la web. Todos los agentes del cliente los leen antes de trabajar; la ejecutiva los edita y marca como revisados. Se configuran en `agency-agents/panel/clusters/documentos-base.json`. |
| Equipo de agentes → **Abrir chat** | Chat con el agente real del canal, aislado por cliente. Cada canal tiene un agente principal y especialistas. |
| Planeación → **Generar con agente** | El agente elabora el artefacto con la estructura de la metodología AMD y lo envía a la bandeja. |
| Aprobaciones | Las propuestas reales aparecen junto a las de ejemplo. **Pedir cambios** devuelve el comentario al agente, que envía una nueva versión. |
| Barra lateral → **Biblioteca de agentes** (`#/agentes`) | Carpetas (SEO, Paid Media, Google Ads…), buscador de todos los agentes y proyectos sueltos por cliente: ficha, brief (pegado o PDF/DOCX), chat y entregables. **Mis proyectos** reúne todas las conversaciones. |

El agente recibe la ficha del cliente (kick-off, briefs, accesos, objetivos, KPIs). Qué agente respalda cada canal se
configura en `agency-agents/panel/clusters/equipo.json` y la estructura de cada artefacto en `plantillas.json`.

Para correrlo con agentes reales, en dos terminales:

```bash
npm --prefix ../agency-agents/panel run dev   # motor en http://localhost:3010 (requiere OPENROUTER_API_KEY)
npm --prefix prototipo run dev                 # Clusters en http://localhost:5173 (redirige /api al motor)
```

Sin el motor, Clusters sigue funcionando con sus datos de ejemplo.

## Identidad visual

Tomada del Figma "AgeentIA": tipografía Manrope, azules `#08203F` / `#01346B` / `#0A55CC`, naranja `#FF9300`, verde CTA `#4DCB96`.
