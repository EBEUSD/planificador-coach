import { useEffect, useState, useMemo } from "react";
import ui from "../estilos/Planes.module.css";
import { listarClientes } from "../servicios/clientes.dexie";
import { crearPlan, listarPlanesPorCliente } from "../servicios/planes.dexie";

const PRESETS = [
  { label: "Sesión suelta", sesiones: 1 },
  { label: "Pack x2", sesiones: 2 },
  { label: "Pack x4", sesiones: 4 },
  { label: "Pack x8", sesiones: 8 },
];

export default function PanelPlanes() {
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [form, setForm] = useState({
    etiqueta: "Pack x4",
    sesionesTotales: 4,
    esVitalicio: false,
  });
  const [planes, setPlanes] = useState([]);

  useEffect(() => {
    (async () => setClientes(await listarClientes()))();
  }, []);
  useEffect(() => {
    (async () => {
      if (clienteId) setPlanes(await listarPlanesPorCliente(clienteId));
      else setPlanes([]);
    })();
  }, [clienteId]);

  async function submit(e) {
    e.preventDefault();
    await crearPlan({ clienteId, ...form });
    setForm({ etiqueta: "Pack x4", sesionesTotales: 4, esVitalicio: false });
    setPlanes(await listarPlanesPorCliente(clienteId));
  }

  const puedeCrear = useMemo(() => {
    if (!clienteId) return false;
    if (form.esVitalicio) return true;
    return Number(form.sesionesTotales) > 0;
  }, [clienteId, form]);

  return (
    <div className={ui.wrap}>
      <div className={ui.card}>
        <h3 className={ui.title}>Asignar plan</h3>

        <form onSubmit={submit} className={ui.grid}>
          <div>
            <div className={ui.row}>
              <span className={ui.label}>Cliente</span>
              <select
                className={ui.select}
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
              >
                <option value="">Elegir…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className={ui.row}>
              <span className={ui.label}>Etiqueta</span>
              <input
                className={ui.input}
                value={form.etiqueta}
                onChange={(e) => setForm({ ...form, etiqueta: e.target.value })}
              />
            </div>

            <div className={ui.row}>
              <span className={ui.label}>Sesiones</span>
              <input
                className={ui.input}
                type="number"
                min="0"
                value={form.sesionesTotales}
                onChange={(e) =>
                  setForm({ ...form, sesionesTotales: Number(e.target.value) })
                }
                disabled={form.esVitalicio}
              />
            </div>

            <div className={ui.row}>
              <span className={ui.label}>Vitalicio</span>
              <label className={ui.toggle}>
                <input
                  type="checkbox"
                  checked={form.esVitalicio}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      esVitalicio: e.target.checked,
                      sesionesTotales: e.target.checked
                        ? 0
                        : form.sesionesTotales || 4,
                      etiqueta: e.target.checked
                        ? "Vitalicio"
                        : form.etiqueta === "Vitalicio"
                        ? "Pack x4"
                        : form.etiqueta,
                    })
                  }
                />
                {form.esVitalicio ? "Sí" : "No"}
              </label>
            </div>

            <div className={ui.footer}>
              <button disabled={!puedeCrear}>Crear plan</button>
            </div>
            <div className={ui.hint}>
              Tip: usá los presets de la derecha para completar rápido.
            </div>
          </div>

          <div>
            <div className={ui.presetArea}>
              {PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.label}
                  className={ui.preset}
                  onClick={() =>
                    setForm({
                      etiqueta: p.label,
                      sesionesTotales: p.sesiones,
                      esVitalicio: false,
                    })
                  }
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                className={ui.preset}
                onClick={() =>
                  setForm({
                    etiqueta: "Vitalicio",
                    sesionesTotales: 0,
                    esVitalicio: true,
                  })
                }
              >
                Vitalicio
              </button>
            </div>
          </div>
        </form>
      </div>

      {clienteId && (
        <div className={ui.card}>
          <h3 className={ui.title}>Planes del cliente</h3>
          <div className={ui.list}>
            {planes.map((p) => {
              const total = p.esVitalicio
                ? 1
                : Math.max(1, p.sesionesTotales || 1);
              const rest = p.esVitalicio
                ? 1
                : Math.max(0, p.sesionesRestantes || 0);
              const pct = Math.round((rest / total) * 100);
              return (
                <div key={p.id} className={ui.item}>
                  <div className={ui.itemHead}>
                    <span className={ui.name}>{p.etiqueta}</span>
                    <div className={ui.badges}>
                      {p.esVitalicio ? (
                        <span className={ui.badge}>Vitalicio</span>
                      ) : (
                        <span className={rest > 0 ? ui.badgeOk : ui.badgeZero}>
                          {rest}/{p.sesionesTotales} disponibles
                        </span>
                      )}
                      <span className={ui.badge}>{p.estado}</span>
                    </div>
                  </div>

                  {!p.esVitalicio && (
                    <div className={ui.progressWrap}>
                      <div className={ui.progressBar}>
                        <div
                          className={ui.progressFill}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={ui.badge}>{pct}%</span>
                    </div>
                  )}
                </div>
              );
            })}
            {planes.length === 0 && (
              <span className={ui.badge}>Sin planes aún</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
