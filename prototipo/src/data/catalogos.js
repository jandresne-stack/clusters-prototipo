// Catálogos fijos de la plataforma: servicios, agentes, KPIs y meses del historial.

export const servicios = [
  { id: 'SEO', nombre: 'SEO', agente: 'Agente SEO' },
  { id: 'SEM', nombre: 'SEM', agente: 'Agente SEM' },
  { id: 'Redes', nombre: 'Redes sociales', agente: 'Agente Redes sociales', ejecutaEnGhl: true },
  { id: 'Pauta', nombre: 'Pauta social', agente: 'Agente Pauta social' },
  { id: 'Email', nombre: 'Email marketing', agente: 'Agente Email marketing', ejecutaEnGhl: true },
];

export const servicioPorId = Object.fromEntries(servicios.map((s) => [s.id, s]));

// Subservicios de cada servicio (menú lateral y vista por subservicio). `claves` filtra las tareas
// del agente cuyo título o tipo las menciona; es una aproximación mientras no exista el dato real.
const sub = (id, nombre, descripcion, claves = []) => ({ id, nombre, descripcion, claves });
export const subservicios = {
  SEO: [
    sub('auditoria', 'Auditoría técnica', 'Revisión de rastreo, indexación, velocidad y datos estructurados del sitio.', ['checklist', 'técnic', 'schema', 'estructurados']),
    sub('onpage', 'Optimización on-page', 'Títulos, encabezados, contenido y enlazado interno de las páginas clave.', ['on-page', 'onpage']),
    sub('blogs', 'Creación de blogs', 'Artículos que responden las búsquedas de los clientes potenciales.', ['blog', 'artículo']),
    sub('geo', 'GEO / AEO', 'Visibilidad del negocio en respuestas de ChatGPT, Gemini y AI Overviews.', ['geo', 'aeo', 'faq']),
    sub('local', 'SEO local y Google Business', 'Ficha de Google Business Profile, reseñas y directorios locales.', ['local', 'directorio', 'business']),
    sub('enlaces', 'Backlinks', 'Enlaces desde sitios del sector que suben la autoridad del dominio.', ['backlink', 'enlace']),
  ],
  SEM: [
    sub('busqueda', 'Red de búsqueda', 'Anuncios de texto para quien ya busca el servicio en Google.', ['búsqueda', 'keyword', 'negativas', 'puja']),
    sub('display', 'Display', 'Banners en sitios y apps de la red de Google para recordar la marca.', ['display']),
    sub('pmax', 'Performance Max', 'Campaña automatizada en todos los canales de Google a partir de los objetivos.', ['performance', 'pmax']),
    sub('shopping', 'Shopping', 'Productos con foto y precio en los resultados de Google.', ['shopping']),
    sub('youtube', 'YouTube Ads', 'Anuncios en video para alcance y recordación.', ['youtube', 'video']),
  ],
  Redes: [
    sub('parrilla', 'Parrilla de contenidos', 'Calendario mensual de publicaciones por red.', ['parrilla', 'calendario']),
    sub('publicaciones', 'Publicaciones y diseño', 'Piezas, copys y programación en cada red.', ['publica', 'post', 'contenido']),
    sub('comunidad', 'Gestión de comunidad', 'Respuesta a comentarios y mensajes.', ['comunidad', 'comentario']),
  ],
  Pauta: [
    sub('meta', 'Meta Ads', 'Campañas en Facebook e Instagram.', ['meta', 'creativo', 'facebook', 'instagram']),
    sub('tiktok', 'TikTok Ads', 'Campañas en TikTok para audiencias jóvenes.', ['tiktok']),
    sub('linkedin', 'LinkedIn Ads', 'Campañas B2B por cargo, empresa y sector.', ['linkedin']),
  ],
  Email: [
    sub('campanas', 'Campañas y boletines', 'Envíos puntuales y boletín mensual.', ['boletín', 'campaña']),
    sub('flujos', 'Flujos automáticos', 'Secuencias de bienvenida, seguimiento y reactivación.', ['flujo', 'workflow', 'secuencia']),
    sub('listas', 'Listas y segmentación', 'Bases de contactos limpias y segmentadas.', ['lista', 'segment']),
  ],
};

// KPIs de negocio (US-6). `mayorEsMejor` define en qué dirección se mide la brecha contra la meta.
export const kpisNegocio = [
  { id: 'leads', nombre: 'Leads / mes', unidad: '', mayorEsMejor: true, fuente: 'GHL' },
  { id: 'cpl', nombre: 'CPL / CPA', unidad: 'COP', mayorEsMejor: false, fuente: 'Google Ads / Meta' },
  { id: 'conversion', nombre: 'Conversión a cotización', unidad: '%', mayorEsMejor: true, fuente: 'GHL' },
  { id: 'respuesta', nombre: 'Tiempo de respuesta al lead', unidad: 'min', mayorEsMejor: false, fuente: 'GHL' },
];

export const kpiNegocioPorId = Object.fromEntries(kpisNegocio.map((k) => [k.id, k]));

// Historial de 6 meses que usan todas las series de ejemplo (el último es el mes actual).
export const meses = ['Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep'];
export const mesActual = 'Septiembre 2026';

export const estadosGhl = {
  conectado: 'Conectado',
  pendiente: 'Pendiente',
  desconectado: 'Desconectado',
};
