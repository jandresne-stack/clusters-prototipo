---
name: spec
description: Genera un documento de especificación (spec) en Markdown dentro de docs/spec/ con una estructura fija - Título, Problema, Objetivo, User Stories, Criterios de aceptación y Fuera de alcance. Úsala cuando el usuario diga "spec", "crea la spec", "documenta esta funcionalidad", "escribe los requerimientos", "pasa esto a una spec", o al terminar un brainstorm con las ideas ya claras.
---

# Spec — Especificación de funcionalidad

Tu función es convertir ideas **ya claras** (normalmente salidas de la skill `brainstorm`) en un archivo Markdown dentro de `docs/spec/`, siguiendo **siempre** la misma plantilla. Mantener la estructura consistente garantiza que quien implemente (persona o agente) tenga todo el contexto necesario antes de escribir código, reduciendo malentendidos y retrabajo.

## Antes de escribir

1. **Verifica que hay suficiente claridad.** Necesitas saber como mínimo: quién es el usuario, qué problema tiene, qué se quiere lograr, qué debe pasar para darlo por terminado y qué queda fuera.
2. Si falta cualquiera de esos puntos, **no inventes**: indica qué falta y ejecuta la skill `brainstorm` (o haz las preguntas puntuales necesarias) antes de continuar.
3. Revisa si ya existe una spec de la misma funcionalidad en `docs/spec/`. Si existe, pregunta si se actualiza esa o se crea una nueva.

## Archivo

- Ruta: `docs/spec/<nombre-en-kebab-case>.md` (crea la carpeta si no existe).
- El nombre sale del título, en minúsculas, sin tildes ni caracteres especiales. Ej: "Recuperar contraseña por email" → `docs/spec/recuperar-contrasena-por-email.md`.

## Plantilla fija

Usa exactamente estas secciones, en este orden y con estos encabezados. No agregues ni quites secciones.

```markdown
# <Título>

## Problema
<Qué necesidad o dolor del usuario se busca resolver. Quién lo sufre, en qué situación y qué pasa hoy si no se resuelve.>

## Objetivo
<Qué se espera lograr con la solución. Incluye cómo se medirá el éxito cuando sea posible.>

## User Stories
- **US-1:** Como <tipo de usuario>, quiero <acción> para <beneficio>.
- **US-2:** Como <tipo de usuario>, quiero <acción> para <beneficio>.

## Criterios de aceptación
### US-1
- [ ] Dado <contexto>, cuando <acción>, entonces <resultado verificable>.
- [ ] …

### US-2
- [ ] …

## Fuera de alcance
- <Qué NO se va a construir en esta iteración.>
- …
```

## Cómo redactar cada sección

**Título** — Nombre claro y descriptivo de la funcionalidad, orientado a lo que el usuario logra (no a la implementación). Bien: "Exportar reporte de auditoría a PDF". Mal: "Endpoint /export".

**Problema** — Habla del usuario y su dolor, no de la solución. Nada de tecnología aquí.

**Objetivo** — El resultado esperado. Si hubo una métrica de éxito en el brainstorm, inclúyela.

**User Stories** — Una user story describe una característica desde el punto de vista del usuario: *Como [tipo de usuario], quiero [acción] para [beneficio]*.
- El "para" es obligatorio: explica el valor, no lo repite.
- Cada story debe ser pequeña, independiente y aportar valor por sí misma (criterio INVEST: Independiente, Negociable, Valiosa, Estimable, Pequeña, Testeable).
- Usa tipos de usuario concretos ("administrador de la agencia", "cliente con cuenta"), no "el usuario" genérico si hay varios.
- Si una story es demasiado grande, divídela.

**Criterios de aceptación** — Condiciones específicas y verificables que determinan si la funcionalidad está completa.
- Agrúpalos por user story.
- Formato preferido: *Dado / Cuando / Entonces*.
- Cada criterio debe poder probarse con un sí/no. Evita "rápido", "intuitivo", "amigable": usa valores concretos ("responde en menos de 2 s", "muestra el mensaje 'Email no válido'").
- Incluye los casos borde y errores identificados en el brainstorm.

**Fuera de alcance** — Lista explícita de lo que NO se hará en esta iteración, para evitar expectativas incorrectas. Incluye las ideas que surgieron en el brainstorm pero se pospusieron.

## Después de escribir

1. Muestra la ruta del archivo creado.
2. Señala cualquier suposición que hayas tenido que hacer para que el usuario la valide.
3. No empieces a implementar hasta que el usuario apruebe la spec.
