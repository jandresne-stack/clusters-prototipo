import { createContext, useContext, useMemo, useState } from 'react';
import { ejecutivas, especialistas, lider } from '../data/equipo.js';
import { DatosProvider } from './DatosContext.jsx';

/**
 * Sesión simulada: el spec pide un selector de rol visible en lugar de login.
 * `rol` decide la navegación; `personaId` es la ejecutiva o el especialista que se está viendo.
 */
const SesionContext = createContext(null);

export const roles = [
  { id: 'ejecutiva', nombre: 'Ejecutiva' },
  { id: 'especialista', nombre: 'Especialista' },
  { id: 'lider', nombre: 'Líder' },
];

export const personasPorRol = {
  ejecutiva: ejecutivas,
  especialista: especialistas,
  lider: [lider],
};

export const inicioPorRol = {
  ejecutiva: '/cartera',
  especialista: '/casos',
  lider: '/equipo',
};

export function SesionProvider({ children }) {
  const [rol, setRol] = useState('ejecutiva');
  const [personaId, setPersonaId] = useState(ejecutivas[0].id);

  const valor = useMemo(() => {
    const persona = personasPorRol[rol].find((p) => p.id === personaId) ?? personasPorRol[rol][0];
    return {
      rol,
      persona,
      cambiarRol(nuevoRol) {
        setRol(nuevoRol);
        setPersonaId(personasPorRol[nuevoRol][0].id);
      },
      cambiarPersona: setPersonaId,
    };
  }, [rol, personaId]);

  return (
    <SesionContext.Provider value={valor}>
      <DatosProvider>{children}</DatosProvider>
    </SesionContext.Provider>
  );
}

export function useSesion() {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error('useSesion debe usarse dentro de <SesionProvider>');
  return ctx;
}
