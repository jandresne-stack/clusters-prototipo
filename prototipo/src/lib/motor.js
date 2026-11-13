// Cliente del motor de agentes reales (Panel de Agentes AMD, en agency-agents/panel).
// Vite redirige /api al panel (vite.config.js). Si el panel no está corriendo, Clusters
// sigue funcionando con sus datos de ejemplo y las vistas de agentes reales lo avisan.

async function json(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status} del motor de agentes`);
  return data;
}

export async function equipoReal() {
  return json(await fetch('/api/clusters/equipo'));
}

/** Abre (o crea) el chat aislado de un agente para un cliente y sincroniza su ficha. */
export async function abrirSesion({ clienteId, canal, agentId, ficha }) {
  return json(
    await fetch('/api/clusters/sesion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clienteId, canal, agentId, ficha }),
    }),
  );
}

export async function aprobacionesReales() {
  return json(await fetch('/api/clusters/aprobaciones'));
}

export async function guardarAprobacion(id, cambios) {
  return json(
    await fetch(`/api/clusters/aprobaciones/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cambios),
    }),
  );
}

export async function limpiarChat(proyectoId) {
  return json(
    await fetch(`/api/projects/${proyectoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clearChat: true }),
    }),
  );
}

export function urlEntregable(proyectoId, nombre, descargar = false) {
  return `/api/projects/${proyectoId}/entregables/${encodeURIComponent(nombre)}${descargar ? '?download' : ''}`;
}

/**
 * Envía un mensaje al agente y va entregando eventos:
 * { type: 'text', delta } | { type: 'tool_start' | 'tool_end', label, ok, aprobacion } | { type: 'done' } | { type: 'error', message }
 */
export async function conversar(proyectoId, mensaje, alEvento, signal) {
  const res = await fetch(`/api/projects/${proyectoId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: mensaje }),
    signal,
  });
  if (!res.ok || !res.body) await json(res);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lineas = buffer.split('\n');
    buffer = lineas.pop() ?? '';
    for (const linea of lineas) if (linea.trim()) alEvento(JSON.parse(linea));
  }
}

/** "Pedir cambios" sobre una propuesta real: el comentario vuelve al agente, que envía otra versión. */
export async function pedirCambiosAlAgente(item, comentario) {
  const mensaje = `La ejecutiva pidió cambios en tu propuesta "${item.titulo}" (id ${item.id}).\n\nComentario: ${comentario}\n\nAjusta la propuesta y envía la nueva versión con proponer_aprobacion usando reemplaza_id="${item.id}".`;
  await conversar(item.proyectoId, mensaje, () => {});
}

// ---------- Biblioteca de agentes (proyectos sueltos por cliente) ----------

export async function catalogo() {
  return json(await fetch('/api/catalogo'));
}

export async function modelos() {
  return json(await fetch('/api/modelos'));
}

export async function proyectos(agentId) {
  return json(await fetch(`/api/projects${agentId ? `?agentId=${encodeURIComponent(agentId)}` : ''}`));
}

export async function crearProyecto(datos) {
  return json(
    await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) }),
  );
}

/** { project, messages, deliverables } */
export async function proyecto(id) {
  return json(await fetch(`/api/projects/${id}`));
}

export async function actualizarProyecto(id, cambios) {
  return json(
    await fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cambios) }),
  );
}

export async function borrarProyecto(id) {
  return json(await fetch(`/api/projects/${id}`, { method: 'DELETE' }));
}

export async function borrarEntregable(proyectoId, nombre) {
  return json(await fetch(urlEntregable(proyectoId, nombre), { method: 'DELETE' }));
}

/** Texto de un brief en PDF, DOCX, TXT o MD. */
export async function extraerTexto(archivo) {
  const form = new FormData();
  form.append('file', archivo);
  return json(await fetch('/api/extraer-texto', { method: 'POST', body: form }));
}

// ---------- Documentos base del cliente (los leen todos sus agentes) ----------

export async function documentosBase(clienteId) {
  return json(await fetch(`/api/clusters/base/${clienteId}`));
}

/** Genera en segundo plano todos los documentos o solo los de `docs` (ids). */
export async function generarDocumentosBase(clienteId, ficha, docs) {
  return json(
    await fetch(`/api/clusters/base/${clienteId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ficha, docs }),
    }),
  );
}

export async function actualizarDocumentoBase(clienteId, docId, cambios) {
  return json(
    await fetch(`/api/clusters/base/${clienteId}/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cambios),
    }),
  );
}

/** Detiene la respuesta en curso del agente (el agente sigue trabajando aunque cambies de pantalla). */
export async function detener(proyectoId) {
  return json(await fetch(`/api/projects/${proyectoId}/detener`, { method: 'POST' }));
}
