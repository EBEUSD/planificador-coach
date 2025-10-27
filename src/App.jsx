import { useState } from "react";
import VistaCalendario from "./componentes/VistaCalendario";
import PanelClientes from "./componentes/PanelClientes";
import PanelPlanes from "./componentes/PanelPlanes";
import Contadores from "./componentes/Contadores";
import Disponibilidades from "./paginas/Disponibilidades";

export default function App() {
  const [tab, setTab] = useState("cal");

  return (
    <div style={{ padding: 12 }}>
      <h2>Planificador de Coaching</h2>
      <nav
        style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}
      >
        <button onClick={() => setTab("cal")}>Calendario</button>
        <button onClick={() => setTab("clientes")}>Clientes</button>
        <button onClick={() => setTab("planes")}>Planes</button>
        <button onClick={() => setTab("disp")}>Disponibilidad</button>
      </nav>
      <Contadores />
      {tab === "cal" && <VistaCalendario />}
      {tab === "clientes" && <PanelClientes />}
      {tab === "planes" && <PanelPlanes />}
      {tab === "disp" && <Disponibilidades />}
    </div>
  );
}
