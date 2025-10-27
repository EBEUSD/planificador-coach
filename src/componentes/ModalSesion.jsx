import { useEffect, useMemo, useState } from "react";
import estilos from "../estilos/Modal.module.css";
import { aUtc } from "../servicios/tz";
import { crearSesion } from "../servicios/sesiones.dexie";
import { listarPlanesPorCliente } from "../servicios/planes.dexie";

export default function ModalSesion({ slot, clientes, onClose, onCreada }) {
  const [clienteId, setClienteId] = useState("");
  const [planes, setPlanes] = useState([]);
  const [planId, setPlanId] = useState("");
  const [notas, setNotas] = useState("");

  const cliente = useMemo(
    () => clientes.find((c) => String(c.id) === String(clienteId)),
    [clienteId, clientes]
  );

  useEffect(() => {
    (async () => {
      if (!clienteId) {
        setPlanes([]);
        setPlanId("");
        return;
      }
      const ps = await listarPlanesPorCliente(clienteId);
      setPlanes(ps);
      const preferido = ps.find(
        (p) => !p.esVitalicio && (p.sesionesRestantes ?? 0) > 0
      );
      setPlanId(preferido ? preferido.id : "");
    })();
  }, [clienteId]);

  async function crear() {
    if (!cliente) return;
    const tz = cliente.zonaHoraria || "America/Argentina/Buenos_Aires";
    const inicioUtc = aUtc(slot.start, tz);
    const finUtc = aUtc(slot.end, tz);
    const id = await crearSesion({
      clienteId: cliente.id,
      planId: planId || null,
      inicioUtc,
      finUtc,
      notas,
    });
    onCreada({ id, title: cliente.nombre, start: inicioUtc, end: finUtc });
    onClose();
  }

  return (
    <div className={estilos.backdrop}>
      <div className={estilos.modal}>
        <h3>Nueva sesión</h3>
        <label>Cliente</label>
        <select
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
        <label>Plan (opcional)</label>
        <select
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          disabled={!clienteId}
        >
          <option value="">Sin plan (no descuenta)</option>
          {planes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.etiqueta}{" "}
              {p.esVitalicio
                ? "(Vitalicio)"
                : `(${p.sesionesRestantes}/${p.sesionesTotales})`}
            </option>
          ))}
        </select>
        <label>Notas</label>
        <textarea value={notas} onChange={(e) => setNotas(e.target.value)} />
        <div className={estilos.row}>
          <button onClick={onClose}>Cancelar</button>
          <button onClick={crear} disabled={!clienteId}>
            Crear
          </button>
        </div>
      </div>
    </div>
  );
}
