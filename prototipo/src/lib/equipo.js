import { useEffect, useState } from 'react';
import { equipoReal } from './motor.js';

// Equipo real (canal -> agente principal y especialistas), pedido una sola vez al motor.
// Sirve para que cada agente tenga la misma forma en todas las pantallas.
let cache = null;
let pedido = null;

export function useEquipo() {
  const [equipo, setEquipo] = useState(cache);
  useEffect(() => {
    if (cache) return;
    pedido ??= equipoReal().then((e) => (cache = e));
    pedido.then(setEquipo).catch(() => {
      pedido = null;
    });
  }, []);
  return equipo;
}

/** Canal de Clusters al que pertenece un agente (principal o especialista), si tiene. */
export function canalDeAgente(equipo, agentId) {
  if (!equipo) return undefined;
  for (const [canal, m] of Object.entries(equipo)) {
    if (m.principal.id === agentId || m.especialistas.some((a) => a.id === agentId)) return canal;
  }
  return undefined;
}
