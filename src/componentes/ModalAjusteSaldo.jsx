// src/componentes/ModalAsignarSesion.jsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export default function ModalAsignarSesion({
  open,
  slot,
  opciones,
  onAsignar,
  onClose,
}) {
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);

  useEffect(() => {
    if (open && slot?.start) {
      const s = new Date(slot.start);
      s.setMinutes(0, 0, 0);
      const e = new Date(s.getTime() + 60 * 60 * 1000);
      setStart(s);
      setEnd(e);
    }
  }, [open, slot]);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  if (!open) return null;

  const setHour = (h) => {
    if (!slot?.start) return;
    const base = new Date(slot.start);
    const s = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      h,
      0,
      0,
      0
    );
    const e = new Date(s.getTime() + 60 * 60 * 1000);
    setStart(s);
    setEnd(e);
  };

  const fmt = (d) =>
    d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const Backdrop = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  };

  const Card = {
    width: "min(720px, 96vw)",
    background: "#141414",
    color: "#fff",
    borderRadius: 16,
    border: "1px solid #2a2a2a",
    boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
    padding: 18,
    maxHeight: "90vh",
    overflow: "auto",
  };

  const Grid = {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  };

  const HourBtn = (h) => {
    const active = start && start.getHours() === h;
    return {
      padding: "10px 8px",
      borderRadius: 10,
      border: `1px solid ${active ? "#4e90ff" : "#333"}`,
      background: active ? "#1e72ff" : "#1a1a1a",
      color: "#fff",
      cursor: "pointer",
      textAlign: "center",
      fontSize: 13,
    };
  };

  const Btn = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #444",
    background: "#222",
    color: "#fff",
    cursor: "pointer",
  };

  const BtnOk = { ...Btn, background: "#1b7f4d", borderColor: "#32a466" };
  const BtnGhost = { ...Btn, background: "transparent" };

  const labelHour = (h) =>
    new Date(2000, 0, 1, h, 0).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  return createPortal(
    <div style={Backdrop} onClick={onClose}>
      <div style={Card} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: 0 }}>Asignar sesión</h3>
        <div style={{ opacity: 0.8, marginTop: 4 }}>
          Día:{" "}
          {slot?.start
            ? new Date(slot.start).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            : ""}
        </div>

        <div style={Grid}>
          {hours.map((h) => (
            <button key={h} style={HourBtn(h)} onClick={() => setHour(h)}>
              {labelHour(h)}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 12 }}>
          Inicio: {start ? fmt(start) : "-"} — Fin: {end ? fmt(end) : "-"}
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {opciones.map((o) => (
            <div
              key={o.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid #2a2a2a",
                borderRadius: 12,
                padding: "10px 12px",
                background: "#0f0f0f",
              }}
            >
              <div style={{ display: "grid", gap: 2 }}>
                <div style={{ fontWeight: 600 }}>{o.nombre}</div>
                <div style={{ opacity: 0.8 }}>@{o.alias}</div>
              </div>
              <button
                style={BtnOk}
                onClick={() =>
                  onAsignar(
                    { id: o.id, nombre: o.nombre, alias: o.alias },
                    { start, end }
                  )
                }
                disabled={!start || !end}
                title={!start || !end ? "Elegí una hora" : "Asignar"}
              >
                Asignar
              </button>
            </div>
          ))}
        </div>

        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}
        >
          <button style={BtnGhost} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
