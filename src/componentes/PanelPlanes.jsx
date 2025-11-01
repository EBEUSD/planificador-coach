import { useEffect, useState } from "react";
import { listarClientes } from "../servicios/clientes.dexie";
import { crearPlan } from "../servicios/planes.dexie";
import s from "../estilos/Formularios.module.css";

export default function PanelPlanes() {
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [sesiones, setSesiones] = useState(4);
  const [etiqueta, setEtiqueta] = useState("Pack x4");
  const [vitalicio, setVitalicio] = useState(false);

  useEffect(() => {
    (async () => {
      const cs = await listarClientes();
      setClientes(cs);
      if (!clienteId && cs.length) setClienteId(String(cs[0].id));
    })();
  }, []);

  const setPreset = (n) => {
    if (n === "vitalicio") {
      setVitalicio(true);
      setSesiones(0);
      setEtiqueta("Vitalicio");
      return;
    }
    setVitalicio(false);
    const map = { 1: "Sesión", 2: "Pack x2", 4: "Pack x4", 8: "Pack x8" };
    setSesiones(n);
    setEtiqueta(map[n] || `Pack x${n}`);
  };

  const guardar = async () => {
    if (!clienteId) return;
    await crearPlan(Number(clienteId), {
      etiqueta,
      sesiones: Number(sesiones || 0),
      vitalicio,
    });
    setPreset(4);
    alert("Plan creado");
  };

  return (
    <div className={s.panel}>
      <div className={s.card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h3 style={{ margin: 0 }}>Asignar plan</h3>
          <span className={s.badge}>Clientes: {clientes.length}</span>
        </div>

        <p className={s.muted}>
          Crea un paquete de sesiones o marca al cliente como vitalicio.
        </p>

        <div className={s.row2}>
          <div className={s.field}>
            <span className={s.label}>Cliente</span>
            <select
              className={s.input}
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
            >
              <option value="">Elegir...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className={s.field}>
            <span className={s.label}>Sesiones</span>
            <input
              className={s.input}
              type="number"
              min="0"
              value={sesiones}
              onChange={(e) => setSesiones(e.target.value)}
            />
          </div>
        </div>

        <div className={s.field}>
          <span className={s.label}>Presets</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className={sesiones === 1 && !vitalicio ? s.chipOn : s.chip}
              onClick={() => setPreset(1)}
            >
              Sesión
            </button>
            <button
              className={sesiones === 2 && !vitalicio ? s.chipOn : s.chip}
              onClick={() => setPreset(2)}
            >
              x2
            </button>
            <button
              className={sesiones === 4 && !vitalicio ? s.chipOn : s.chip}
              onClick={() => setPreset(4)}
            >
              x4
            </button>
            <button
              className={sesiones === 8 && !vitalicio ? s.chipOn : s.chip}
              onClick={() => setPreset(8)}
            >
              x8
            </button>
            <button
              className={vitalicio ? s.chipOn : s.chip}
              onClick={() => setPreset("vitalicio")}
            >
              Vitalicio
            </button>
          </div>
        </div>

        <div className={s.field}>
          <span className={s.label}>Etiqueta</span>
          <input
            className={s.input}
            value={etiqueta}
            onChange={(e) => setEtiqueta(e.target.value)}
          />
        </div>

        <div
          className={s.field}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <span className={s.label}>Vitalicio</span>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={vitalicio}
              onChange={(e) => {
                setVitalicio(e.target.checked);
                if (e.target.checked) {
                  setSesiones(0);
                  if (!/vitalicio/i.test(etiqueta)) setEtiqueta("Vitalicio");
                }
              }}
            />
            {vitalicio ? "Sí" : "No"}
          </label>
        </div>

        <button className={s.cta} onClick={guardar} disabled={!clienteId}>
          Crear plan
        </button>
      </div>
    </div>
  );
}
