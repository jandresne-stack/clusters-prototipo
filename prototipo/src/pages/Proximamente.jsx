import { useParams } from 'react-router-dom';
import { Hammer } from 'lucide-react';
import { clientePorId } from '../data/clientes.js';
import { Encabezado } from '../components/ui.jsx';

/** Marcador para las vistas que se construyen en partes posteriores del prototipo. */
export default function Proximamente({ titulo, parte, historias }) {
  const { id } = useParams();
  const cliente = id && clientePorId[id];

  return (
    <>
      <Encabezado titulo={cliente ? cliente.nombre : titulo} descripcion={cliente && `${cliente.rubro} · ${cliente.ciudad}`} />
      <div className="tarjeta tarjeta--oscura" style={{ maxWidth: 640 }}>
        <div className="fila" style={{ marginBottom: 10 }}>
          <Hammer size={20} color="var(--naranja-claro)" />
          <h3>En construcción · parte {parte}</h3>
        </div>
        <p style={{ color: 'var(--azul-200)' }}>
          Esta vista llega en la parte {parte} del prototipo y cubre {historias}.
        </p>
      </div>
    </>
  );
}
