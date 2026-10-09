// Personas ficticias del equipo Clusters de AMD.

export const ejecutivas = [
  { id: 'laura', nombre: 'Laura Méndez', iniciales: 'LM', color: '#0a55cc' },
  { id: 'carolina', nombre: 'Carolina Ríos', iniciales: 'CR', color: '#7a3fd1' },
  // Ejecutiva recién incorporada, sin cartera: permite ver el estado vacío de la Cartera.
  { id: 'sofia', nombre: 'Sofía Vargas', iniciales: 'SV', color: '#1fa971', nueva: true },
];

export const especialistas = [
  { id: 'andres', nombre: 'Andrés Pardo', iniciales: 'AP', canal: 'SEO', color: '#01346b' },
  { id: 'julian', nombre: 'Julián Torres', iniciales: 'JT', canal: 'SEM', color: '#e0414f' },
  { id: 'valentina', nombre: 'Valentina Gómez', iniciales: 'VG', canal: 'Meta', color: '#ff7a00' },
];

export const lider = { id: 'mariana', nombre: 'Mariana Castro', iniciales: 'MC', color: '#08203f' };

export const ejecutivaPorId = Object.fromEntries(ejecutivas.map((e) => [e.id, e]));
export const especialistaPorId = Object.fromEntries(especialistas.map((e) => [e.id, e]));
