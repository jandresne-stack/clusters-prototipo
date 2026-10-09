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

## Identidad visual

Tomada del Figma "AgeentIA": tipografía Manrope, azules `#08203F` / `#01346B` / `#0A55CC`, naranja `#FF9300`, verde CTA `#4DCB96`.
