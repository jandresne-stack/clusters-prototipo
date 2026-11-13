import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { inicioPorRol, useSesion } from './context/SesionContext.jsx';
import { Cartera } from './pages/Cartera.jsx';
import { Bandeja } from './pages/aprobaciones/Bandeja.jsx';
import { Detalle } from './pages/aprobaciones/Detalle.jsx';
import { Cliente } from './pages/Cliente.jsx';
import { Oportunidades } from './pages/Oportunidades.jsx';
import { Escalados } from './pages/Escalados.jsx';
import { Casos } from './pages/Casos.jsx';
import { TableroEquipo } from './pages/TableroEquipo.jsx';
import { Alta } from './pages/Alta.jsx';
import { Reporte } from './pages/Reporte.jsx';
import { ChatAgente } from './pages/cliente/ChatAgente.jsx';
import { AgenteBiblioteca, Biblioteca, Carpeta, MisProyectos } from './pages/agentes/Biblioteca.jsx';
import { ProyectoAgente } from './pages/agentes/ProyectoAgente.jsx';
import GuiaEstilo from './pages/GuiaEstilo.jsx';

function Inicio() {
  const { rol } = useSesion();
  return <Navigate to={inicioPorRol[rol]} replace />;
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />

        {/* Ejecutiva */}
        <Route path="/cartera" element={<Cartera />} />
        <Route path="/aprobaciones" element={<Bandeja />} />
        <Route path="/aprobaciones/:id" element={<Detalle />} />
        <Route path="/oportunidades" element={<Oportunidades />} />
        <Route path="/escalados" element={<Escalados />} />
        <Route path="/alta" element={<Alta />} />
        <Route path="/clientes/:id" element={<Cliente />} />
        <Route path="/clientes/:id/reporte" element={<Reporte />} />
        {/* Agentes reales: chat aislado por cliente y agente (motor: agency-agents/panel) */}
        <Route path="/clientes/:id/agentes/:canal" element={<ChatAgente />} />

        {/* Especialista y Líder */}
        <Route path="/casos" element={<Casos />} />
        <Route path="/equipo" element={<TableroEquipo />} />

        {/* Biblioteca de agentes: carpetas, agentes y proyectos sueltos por cliente */}
        <Route path="/agentes" element={<Biblioteca />} />
        <Route path="/agentes/carpeta/:id" element={<Carpeta />} />
        <Route path="/agentes/agente/:agentId" element={<AgenteBiblioteca />} />
        <Route path="/agentes/proyectos" element={<MisProyectos />} />
        <Route path="/agentes/proyectos/:id" element={<ProyectoAgente />} />

        <Route path="/estilo" element={<GuiaEstilo />} />
        <Route path="*" element={<Inicio />} />
      </Route>
    </Routes>
  );
}
