# Plataforma Clusters: equipo de agentes IA para la ejecutiva

## Problema
Muchas pymes creen que con inteligencia artificial pueden resolver solas todo su marketing digital, pero sin criterio estratégico humano los resultados no llegan. AMD quiere ofrecerles **Clusters**: un servicio 360 (SEO, SEM, redes sociales, pauta social, email marketing) a bajo costo, ejecutado por agentes de IA y dirigido por una ejecutiva de marketing.

Hoy cada canal de un cliente lo atiende un especialista humano distinto (SEO on-page/off-page, blog, datos estructurados para GEO/AEO, creación y optimización de campañas SEM, estudio de keywords compartido). Ese modelo no escala para clientes pequeños. Una ejecutiva generalista que atiende entre 10 y 25 clientes no tiene hoy un lugar donde:

- centralizar el brief, los accesos, la marca, los objetivos y la estrategia de cada cliente;
- ver de un vistazo la salud de toda su cartera;
- recibir, entender y aprobar lo que propone cada agente;
- detectar oportunidades de nuevos servicios para clientes existentes;
- saber cuándo y cómo escalar a un especialista humano.

Además, AMD ya tiene Go High Level (GHL), con una subcuenta por cliente (CRM, leads, conversaciones) y un CRM interno para su propia venta, pero aún no lo aprovecha a fondo. Hoy nada conecta el trabajo por canal con los leads que llegan a GHL ni con las automatizaciones que GHL podría ejecutar.

Sin esa herramienta, la información queda dispersa en decenas de archivos por cliente (kick-off, brief, benchmarking, buyer persona, KW research, checklists, budgets, guidelines, deck de estrategia), las aprobaciones del cliente se pierden en WhatsApp y el modelo Clusters no puede operar.

## Objetivo
Construir un **prototipo navegable** (HTML/React clicable, datos de ejemplo, marca AMD) de la interfaz con la que la ejecutiva de Clusters dirige a su "equipo" de agentes de IA por cliente, para validar el flujo con ejecutivas reales antes de construir backend y agentes.

El prototipo debe demostrar que la ejecutiva puede, sin salir de la plataforma: dar de alta un cliente siguiendo la metodología de planeación estratégica de AMD, revisar y aprobar el trabajo de los agentes, seguir KPIs de negocio y de canal, registrar el feedback del cliente, proponer servicios adicionales y escalar casos a especialistas.

**Go High Level** tiene dos papeles en la plataforma, ambos simulados en el prototipo:
1. **Fuente de datos:** leads, pipelines y tiempos de respuesta de la subcuenta GHL de cada cliente.
2. **Brazo de ejecución:** los agentes ejecutan en GHL las campañas de email, los workflows de seguimiento de leads y la publicación en redes (Social Planner). Todo pasa antes por la aprobación de la ejecutiva.

Además, las oportunidades de venta cruzada llegan al pipeline comercial interno de AMD en GHL.

**Cómo se medirá el éxito del servicio** (a instrumentar en versiones posteriores):
- Retención de clientes Clusters y venta cruzada de servicios (metas numéricas pendientes de definir).
- Mejora mes a mes de los KPIs de negocio de los clientes (leads, CPL/CPA, conversión).

**Éxito del prototipo:** al menos 3 ejecutivas completan en una sesión de prueba, sin ayuda, las tareas: dar de alta un cliente, aprobar una propuesta, registrar feedback de leads y escalar un caso.

## User Stories

**Ejecutiva de Clusters** (usuaria principal: generalista de marketing, escritorio, 10–25 clientes)

- **US-1:** Como ejecutiva de Clusters, quiero ver toda mi cartera de clientes con su estado de salud para decidir a quién atender primero.
- **US-2:** Como ejecutiva de Clusters, quiero dar de alta un cliente con un asistente paso a paso basado en la metodología de AMD para que toda su información quede centralizada desde el primer día.
- **US-3:** Como ejecutiva de Clusters, quiero seguir la ruta de planeación estratégica de cada cliente, con sus artefactos y dependencias, para saber qué falta antes de pasar a ejecución.
- **US-4:** Como ejecutiva de Clusters, quiero revisar un artefacto o propuesta generado por un agente, con su explicación en lenguaje simple, para aprobarlo con criterio aunque no sea especialista en ese canal.
- **US-5:** Como ejecutiva de Clusters, quiero una bandeja única con todo lo que espera mi aprobación en todos mis clientes para no dejar nada bloqueado.
- **US-6:** Como ejecutiva de Clusters, quiero ver los KPIs de negocio y de canal de un cliente para evaluar si la estrategia está funcionando.
- **US-7:** Como ejecutiva de Clusters, quiero ver el equipo de agentes de cada cliente y lo que está haciendo cada uno para saber el estado del trabajo por canal.
- **US-8:** Como ejecutiva de Clusters, quiero aprobar el plan mensual que proponen los agentes para que el cliente tenga un rumbo claro cada mes.
- **US-9:** Como ejecutiva de Clusters, quiero registrar una solicitud puntual del cliente para que los agentes la conviertan en tareas sin esperar al siguiente plan mensual.
- **US-10:** Como ejecutiva de Clusters, quiero registrar el feedback del cliente (aprobaciones recibidas por WhatsApp y calidad semanal de leads) para que los agentes optimicen con información real.
- **US-11:** Como ejecutiva de Clusters, quiero ver oportunidades de venta cruzada detectadas por los agentes o por mí para proponerle al cliente servicios que le convengan.
- **US-12:** Como ejecutiva de Clusters, quiero escalar un caso a un especialista humano para resolver lo que excede a los agentes.
- **US-13:** Como ejecutiva de Clusters, quiero previsualizar el reporte mensual de un cliente para llevarlo a la reunión mensual.
- **US-16:** Como ejecutiva de Clusters, quiero aprobar y controlar las automatizaciones que los agentes ejecutan en Go High Level para que nada se envíe ni se publique sin mi visto bueno.

**Especialista de canal** (usuario secundario)

- **US-14:** Como especialista de canal, quiero una cola con los casos escalados a mi canal para atenderlos con todo el contexto del cliente.

**Líder de Clusters** (usuario secundario)

- **US-15:** Como líder de Clusters, quiero un tablero con la carga y la salud de cartera de cada ejecutiva para balancear el equipo y detectar clientes en riesgo.

## Criterios de aceptación

### Generales (aplican a todo el prototipo)
- [ ] Toda la interfaz está en español y usa la identidad visual de AMD (colores, logo, tipografía).
- [ ] El prototipo funciona en escritorio a partir de 1280 px de ancho.
- [ ] Todos los datos son ficticios: al menos 15 clientes de ejemplo distribuidos entre 2 ejecutivas, con al menos un cliente en cada uno de los estados de salud y casos borde descritos abajo.
- [ ] Desde un selector de rol visible (sin login real) se puede cambiar entre las vistas de Ejecutiva, Especialista y Líder.
- [ ] Todo contenido generado por un agente se identifica visualmente como "propuesto por agente" y muestra el nombre del agente (ej. "Agente SEO").

### US-1
- [ ] Dado que la ejecutiva entra a la plataforma, cuando carga la vista Cartera, entonces ve una fila o tarjeta por cliente con: nombre, servicios contratados, semáforo de salud (verde/amarillo/rojo), número de aprobaciones pendientes, alertas activas y oportunidades de venta.
- [ ] El semáforo se muestra en rojo cuando al menos un KPI de negocio está más de un 20 % por debajo de su meta, en amarillo cuando está entre un 1 % y un 20 % por debajo, y en verde en el resto de los casos.
- [ ] Dada la vista Cartera, cuando la ejecutiva ordena o filtra por salud, pendientes o servicio contratado, entonces la lista se actualiza según ese criterio.
- [ ] Dado un cliente cuyo onboarding está incompleto, entonces aparece con la etiqueta "Onboarding en curso" y el porcentaje completado, en lugar del semáforo.
- [ ] Dado que la ejecutiva no tiene clientes, entonces se muestra el mensaje "Aún no tienes clientes en tu cartera" con el botón "Dar de alta cliente".
- [ ] Dado un cliente cuya subcuenta GHL figura como desconectada, entonces aparece la alerta "GHL desconectado: sin datos de leads ni automatizaciones".

### US-2
- [ ] Dado que la ejecutiva pulsa "Dar de alta cliente", entonces se abre un asistente con estos pasos en orden: 1) Datos generales y URL, 2) Kick-off, 3) Brief por línea de negocio, 4) Accesos y tracking, 5) Marca, 6) Objetivos, presupuesto y zonas, 7) Servicios contratados, 8) Resumen y diagnóstico inicial.
- [ ] El paso Kick-off contiene las categorías de la metodología AMD: líneas de negocio y servicios prioritarios, competidores, % B2B/B2C, CRM y proceso comercial, tiempo de respuesta al lead, ticket promedio, tiempo de cierre, estacionalidad, presupuesto, zonas geográficas, objetivos orgánico vs. pauta, pauta y agencias previas, estado de tracking, responsable de ejecutar SEO, producción audiovisual, flujo de aprobación de contenidos, pilares y expertos para autoría E-E-A-T.
- [ ] El paso Brief permite crear uno o más briefs, uno por línea de negocio, con los campos: momento de la marca, competidores directos, % B2B/B2C, perfil de empresa, demografía, cargo, hábitos, cómo buscan y deciden, keywords que usan, problemas que resuelven, objeciones, diferenciales, fortalezas y debilidades, y estacionalidad.
- [ ] El paso Accesos incluye primero la **subcuenta de Go High Level** del cliente, con dos opciones: "Vincular subcuenta existente" o "Crear subcuenta nueva" (simulado). El estado resultante es "Conectado" o "Pendiente".
- [ ] El paso Accesos muestra además una lista de plataformas (WordPress/CMS, Google Ads, Meta Business, Search Console, GA4, GTM, Clarity, redes sociales) con el estado "Conectado", "Pendiente" o "No aplica". **No hay campos para escribir usuarios ni contraseñas.**
- [ ] El paso Marca permite adjuntar el manual de marca (PDF) y otros archivos del cliente.
- [ ] El paso Servicios contratados muestra SEO, SEM, Redes sociales, Pauta social y Email marketing como opciones activables.
- [ ] Dado que la ejecutiva sale del asistente sin terminar, cuando vuelve al cliente, entonces retoma el paso donde lo dejó con los datos ya ingresados.
- [ ] Dado que falta un acceso requerido por un servicio contratado (ej. Google Ads con SEM contratado), cuando llega al resumen, entonces ve la advertencia "El Agente SEM no puede empezar: falta acceso a Google Ads" y aun así puede finalizar el alta.
- [ ] Dado que la ejecutiva finaliza el alta, entonces el cliente aparece en la Cartera y cada agente de los servicios contratados muestra el estado "Diagnóstico inicial en curso".

### US-3
- [ ] Dado un cliente, cuando la ejecutiva abre la pestaña "Planeación", entonces ve la ruta de planeación con estos artefactos y su estado (No iniciado, En curso por agente, Esperando aprobación, Aprobado):
  - Kick-off → Brief(s) → en paralelo: Benchmarking, KW Research, Checklists de diagnóstico (SEO, Web para Ads, Redes) → Buyer Persona → Estrategia → Matriz OGSM y Budgets (Google Ads / Meta Ads) → Guideline Ads mensual.
- [ ] Cada artefacto indica el canal al que pertenece (Transversal, SEO, SEM, Meta, Redes) y qué agente lo elabora.
- [ ] Dado un artefacto cuyas dependencias no están aprobadas (ej. Buyer Persona sin Brief aprobado), entonces aparece bloqueado con el texto "Requiere: <artefactos pendientes>".
- [ ] Dado que todos los artefactos de planeación de los servicios contratados están aprobados, entonces el cliente muestra el estado "Listo para ejecución" y se habilita el primer plan mensual (US-8).
- [ ] Solo se muestran los artefactos que corresponden a los servicios contratados (ej. sin Redes contratado no aparece el Checklist de Redes, ni la Matriz OGSM de Redes).

### US-4
- [ ] Dado un artefacto o propuesta en estado "Esperando aprobación", cuando la ejecutiva lo abre, entonces ve el contenido completo del artefacto con su estructura de la metodología AMD. Por ejemplo, el KW Research muestra estas columnas: Clasificación, Importancia, Keyword, Tipo, Intención, Uso, Volumen, KD, Puja y Tendencia.
- [ ] La vista incluye un bloque "Por qué lo propongo" de máximo 5 frases en lenguaje no técnico, escrito por el agente.
- [ ] La vista incluye un indicador de confianza del agente (Alta / Media / Baja).
- [ ] La ejecutiva dispone de tres acciones: "Aprobar", "Pedir cambios" (requiere un comentario de al menos 1 carácter) y "Escalar a especialista" (abre US-12).
- [ ] Dado que la ejecutiva pide cambios, entonces el ítem pasa a "En curso por agente" y el comentario queda visible en el historial del ítem.
- [ ] Dado que la confianza del agente es Baja, entonces se muestra el aviso "El agente recomienda revisión de un especialista" junto a la acción Escalar.

### US-5
- [ ] Dada la bandeja de Aprobaciones, entonces lista todos los ítems pendientes de todos los clientes de la ejecutiva, con: cliente, agente, tipo de ítem (artefacto de planeación, plan mensual, tarea de ejecución, propuesta de servicio), antigüedad en días y confianza.
- [ ] La bandeja se puede filtrar por cliente, por agente y por tipo.
- [ ] Los ítems con más de 3 días de antigüedad se destacan como "Atrasado".
- [ ] Dado que se aprueba un ítem desde la bandeja, entonces desaparece de la lista y el contador de pendientes se actualiza tanto en la bandeja como en la Cartera.
- [ ] Dado que no hay pendientes, entonces se muestra "No tienes aprobaciones pendientes".

### US-6
- [ ] Dada la vista de un cliente, entonces la sección KPIs muestra arriba los KPIs de negocio (leads/mes, CPL/CPA, tasa de conversión a cotización, tiempo de respuesta al lead) con su valor actual, meta y variación frente al mes anterior.
- [ ] Debajo se muestran los KPIs por canal contratado:
  - **SEO:** visibilidad de keywords, keywords en top 10, tráfico orgánico, salud del sitio, autoridad de dominio y PageSpeed.
  - **SEM:** inversión, CPC, CTR, clics, conversiones, costo por conversión y leads por semana.
  - **Meta:** CPM, alcance, frecuencia, CTR, CPL.
  - **Redes:** crecimiento de comunidad, engagement e interacciones.
- [ ] Los KPIs de leads/mes, tasa de conversión a cotización y tiempo de respuesta al lead se muestran con la etiqueta "Fuente: GHL". El resto indica su plataforma de origen (ej. "Fuente: Google Ads").
- [ ] Cada KPI muestra una tendencia de al menos 6 meses.
- [ ] Dado un canal no contratado, entonces su bloque de KPIs no aparece.
- [ ] Dado un KPI sin datos (ej. acceso pendiente), entonces se muestra "Sin datos: falta acceso a <plataforma>" en lugar de un valor.

### US-7
- [ ] Dada la vista de un cliente, entonces la sección Equipo muestra una tarjeta por agente: SEO, SEM, Redes sociales, Pauta social y Email marketing.
- [ ] Cada tarjeta de un agente de servicio contratado muestra: estado (Trabajando / Esperando aprobación / Bloqueado / En pausa), número de tareas en curso, número de pendientes de aprobación y la última acción con su fecha.
- [ ] Los agentes SEO y SEM llevan a una vista de detalle con la lista de tareas de ese canal. Por ejemplo, SEO: optimización on-page por URL, artículos de blog, datos estructurados, estrategia de backlinks y directorios. SEM: creación de campañas, optimización de campañas, ajuste de keywords.
- [ ] Los agentes Redes sociales, Pauta social y Email marketing muestran solo la tarjeta resumen, sin vista de detalle completa.
- [ ] Las tarjetas de los agentes Email marketing y Redes sociales muestran la insignia "Ejecuta en GHL". La tarjeta del Agente SEM muestra además cuántos workflows de seguimiento de leads tiene activos en GHL.
- [ ] Dado un servicio no contratado, entonces su tarjeta aparece atenuada con el texto "No contratado" y un botón "Ver oportunidad" (US-11), no vacía.
- [ ] Dado un agente bloqueado, entonces la tarjeta indica el motivo (ej. "Falta acceso a Search Console").

### US-8
- [ ] Dado un cliente "Listo para ejecución", cuando empieza un mes, entonces aparece en la bandeja un "Plan mensual" propuesto por los agentes, con las tareas por canal, la fecha objetivo de cada tarea y el KPI al que aporta.
- [ ] La ejecutiva puede aprobar el plan completo, o quitar o posponer tareas individuales antes de aprobarlo.
- [ ] Cada tarea del plan indica si requiere revisión obligatoria de un especialista. Esto aplica a los cambios técnicos complejos en el sitio y a la distribución de un aumento de presupuesto de pauta.
- [ ] Dado un plan aprobado, entonces las tareas aparecen en el Equipo (US-7) con el estado "Trabajando".
- [ ] La vista del plan muestra el progreso del mes en tareas completadas sobre el total.

### US-9
- [ ] Dado un cliente, cuando la ejecutiva pulsa "Nueva solicitud", entonces puede escribir la solicitud en texto libre, elegir el canal o marcar "No sé, que lo decida el equipo", y fijar una fecha deseada.
- [ ] Dado que se registra la solicitud, entonces en la bandeja aparece una propuesta del agente correspondiente que la desglosa en tareas, para su aprobación.
- [ ] Dada una solicitud cuyo canal no está contratado, entonces el sistema la marca como oportunidad de venta (US-11) en lugar de crear tareas.

### US-10
- [ ] Dado un ítem aprobado por la ejecutiva que requiere visto bueno del cliente, entonces puede marcarlo como "Aprobado por el cliente" indicando el canal (WhatsApp, reunión, correo) y la fecha.
- [ ] Dado un cliente con SEM o Pauta social contratado, entonces cada semana aparece la tarea "Revisión semanal de leads" con el lote de leads de la semana, traído de la subcuenta GHL del cliente (simulado). Cada lead muestra nombre, fecha, canal/campaña de origen, etapa del pipeline en GHL y tiempo de primera respuesta.
- [ ] Dado un cliente con la subcuenta GHL desconectada, entonces la revisión semanal muestra "No se pueden traer leads: GHL desconectado".
- [ ] En esa revisión, la ejecutiva califica los leads como Bueno / Regular / Malo, individualmente o en lote, y puede añadir el motivo (ej. "fuera de zona", "B2C cuando buscamos B2B").
- [ ] Dado que se guarda la calificación, entonces el Agente SEM o de Pauta genera una propuesta de optimización basada en ese feedback, que entra en la bandeja.
- [ ] Dada una revisión semanal sin completar después de 7 días, entonces aparece como alerta en la Cartera.

### US-11
- [ ] Dada la vista Oportunidades (global y por cliente), entonces cada oportunidad muestra: cliente, servicio sugerido, origen (Agente o Ejecutiva), justificación en lenguaje simple y beneficio esperado. Ejemplo: "Cliente B2B con SEM: LinkedIn Ads para llegar a decisores".
- [ ] La ejecutiva puede crear una oportunidad manualmente para cualquier cliente.
- [ ] Cada oportunidad tiene los estados: Detectada → Propuesta al cliente → Aceptada / Rechazada.
- [ ] Dado que una oportunidad pasa a "Propuesta al cliente", entonces se crea (simulado) en el pipeline comercial interno de AMD en GHL y la oportunidad muestra "Creada en GHL" con la fecha.
- [ ] Dado que una oportunidad pasa a "Aceptada", entonces el servicio queda activable en los servicios contratados del cliente y aparece el artefacto de planeación correspondiente (US-3).
- [ ] La Cartera muestra el número de oportunidades abiertas por cliente.

### US-12
- [ ] Dado un ítem o una tarea, cuando la ejecutiva pulsa "Escalar a especialista", entonces elige el canal del especialista, escribe el motivo y el ítem pasa al estado "Escalado".
- [ ] Dada una tarea marcada como de revisión obligatoria (US-8), entonces se escala automáticamente al aprobar el plan, sin intervención de la ejecutiva.
- [ ] Dado un ítem escalado, entonces la ejecutiva ve en él el estado "Esperando especialista", el especialista asignado (o "Sin asignar") y los días transcurridos.
- [ ] Dado que el especialista resuelve el caso, entonces el ítem vuelve a la bandeja de la ejecutiva con la respuesta del especialista, para su aprobación final.

### US-13
- [ ] Dado un cliente, cuando la ejecutiva abre "Reporte mensual", entonces ve una vista previa con: resumen del mes, KPIs de negocio vs. meta, KPIs por canal, tareas completadas, aprendizajes y próximos pasos propuestos, y oportunidades sugeridas.
- [ ] La vista previa usa la marca AMD e incluye el logo del cliente.
- [ ] La ejecutiva puede editar los textos de resumen y próximos pasos antes de "Marcar como listo para reunión".
- [ ] El botón "Descargar PDF" existe y muestra el mensaje "Disponible en la versión final", sin generar el archivo.

### US-16
- [ ] Toda propuesta que se ejecutará en GHL lleva la insignia "Se ejecutará en GHL" en la bandeja (US-5) y en su detalle (US-4). Esto aplica a campañas o secuencias de email, workflows de seguimiento de leads (WhatsApp/SMS/email) y posts programados en el Social Planner.
- [ ] El detalle de una propuesta para GHL muestra una vista previa de lo que se enviará o publicará: asunto y cuerpo del email, mensajes de cada paso del workflow con sus tiempos de espera, o copy e imagen del post con fecha y red. También muestra a qué audiencia o disparador aplica (ej. "Lead nuevo desde Google Ads").
- [ ] Dado que la ejecutiva aprueba una propuesta para GHL, entonces pasa al estado "Activo en GHL" (simulado). Si no la aprueba, no se ejecuta nada.
- [ ] Dado un cliente, cuando la ejecutiva abre la sección "Automatizaciones GHL", entonces ve la lista de automatizaciones activas y pausadas con: tipo, agente que la creó, fecha de activación y un resultado básico (ej. envíos y aperturas en email, leads contactados en workflows, posts publicados).
- [ ] La ejecutiva puede pausar o reactivar cualquier automatización desde esa lista.
- [ ] Dado un cliente con la subcuenta GHL desconectada, entonces las propuestas para GHL no se pueden aprobar y muestran "Conecta la subcuenta GHL para activar".

### US-14
- [ ] Dado el rol Especialista, entonces la vista principal muestra una cola de casos escalados de su canal con: cliente, ejecutiva, motivo, días de espera y tipo de tarea.
- [ ] Dado un caso, cuando el especialista lo abre, entonces ve la propuesta del agente, el comentario de la ejecutiva y un acceso de solo lectura a la ficha del cliente (brief, estrategia, KPIs).
- [ ] El especialista puede "Tomar caso", responder con una resolución o corrección y "Devolver a ejecutiva".
- [ ] Los casos con más de 3 días sin tomar se destacan como "Atrasado".

### US-15
- [ ] Dado el rol Líder, entonces el tablero muestra una fila por ejecutiva con: número de clientes, número de clientes en rojo/amarillo/verde, aprobaciones pendientes, aprobaciones atrasadas, casos escalados abiertos y oportunidades abiertas.
- [ ] Dada una ejecutiva, cuando el líder hace clic en ella, entonces ve su Cartera en modo solo lectura.
- [ ] El tablero muestra totales del equipo: clientes activos, clientes en riesgo (rojo) y oportunidades aceptadas en el mes.

## Fuera de alcance
- Backend, base de datos y persistencia real (los datos viven en el prototipo).
- Agentes de IA reales: todo lo que "genera un agente" es contenido de ejemplo predefinido.
- Integraciones con Google Ads, Meta, Search Console, GA4, GTM, WordPress, WhatsApp, CRM o herramientas SEO (Semrush, Screaming Frog, etc.).
- Integración real con la API de Go High Level: lectura de leads, creación de subcuentas, activación de workflows, envíos y oportunidades en el pipeline de AMD. Todo esto es simulado en el prototipo.
- Construir o editar workflows de GHL desde Clusters: la plataforma solo muestra, aprueba, pausa y reactiva lo que proponen los agentes.
- Usar las conversaciones de GHL como canal con el cliente (aprobaciones, reportes, agenda de reuniones): las aprobaciones del cliente se siguen registrando a mano (US-10).
- Formularios, funnels y landings de GHL.
- Que Clusters funcione embebido dentro de GHL (menú o app personalizada).
- Autenticación, login y gestión real de permisos y roles (se usa un selector de rol).
- Gestión y almacenamiento de credenciales de acceso de clientes.
- Portal o acceso del cliente final a la plataforma.
- Generación real del reporte PDF.
- Detalle completo de los agentes de Redes sociales, Pauta social y Email marketing (solo tarjeta resumen).
- Metodología detallada de la fase de **ejecución**: AMD aún no la ha compartido, así que las tareas de ejecución del prototipo son genéricas por canal.
- Plantilla de **Entidades SEO** (el documento fuente está vacío).
- Facturación, planes de precio de Clusters y rentabilidad por cliente.
- Versión móvil o tablet.
- Metas numéricas de retención y venta cruzada, y su medición.
