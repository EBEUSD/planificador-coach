import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  addMinutes,
  areIntervalsOverlapping,
  endOfDay,
  isSameDay,
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns";

function choca(inicio, fin, sesiones) {
  return sesiones?.some((ev) =>
    areIntervalsOverlapping(
      { start: inicio, end: fin },
      { start: ev.start, end: ev.end },
      { inclusive: false }
    )
  );
}

function generarSlots({
  baseDay,
  sesiones,
  duracionMin,
  horaInicio,
  horaFin,
  stepMin,
}) {
  if (!baseDay) return [];
  const d0 = startOfDay(baseDay);
  const d1 = endOfDay(baseDay);

  const delDia = (sesiones || []).filter(
    (e) => isSameDay(e.start, baseDay) || isSameDay(e.end, baseDay)
  );

  const slots = [];
  for (let h = horaInicio; h <= horaFin; h++) {
    for (let m = 0; m < 60; m += stepMin) {
      const candStart = setMinutes(setHours(d0, h), m);
      const candEnd = addMinutes(candStart, duracionMin);

      if (candEnd > setHours(d0, horaFin)) continue;
      if (candStart < setHours(d0, horaInicio)) continue;
      if (candStart < d0 || candEnd > d1) continue;
      if (choca(candStart, candEnd, delDia)) continue;

      slots.push({ start: candStart, end: candEnd });
    }
  }
  return slots;
}

const fmtFull = (d) =>
  d
    ? new Intl.DateTimeFormat("es-AR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d)
    : "—";
const fmtTime = (d) =>
  d
    ? d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default function ModalAsignarSesion({
  open,
  slot,
  opciones = [],
  onAsignar,
  onClose,

  sesiones = [],
  day = null,
  duracionMin = 60,
  horaInicio = 6,
  horaFin = 23,
  stepMin = 30,
}) {
  // 🔧 Siempre ejecutamos los hooks, aunque 'open' sea false.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const baseDay = useMemo(() => slot?.start ?? day, [slot, day]);

  const opcionesHora = useMemo(
    () =>
      generarSlots({
        baseDay,
        sesiones,
        duracionMin,
        horaInicio,
        horaFin,
        stepMin,
      }),
    [baseDay, sesiones, duracionMin, horaInicio, horaFin, stepMin]
  );

  const preseleccion = useMemo(() => {
    if (!slot?.start) return null;
    const idx = opcionesHora.findIndex(
      (o) => o.start.getTime() === new Date(slot.start).getTime()
    );
    return idx >= 0 ? opcionesHora[idx] : null;
  }, [slot?.start, opcionesHora]);

  const [seleccion, setSeleccion] = useState(
    preseleccion || opcionesHora[0] || null
  );
  useEffect(() => {
    setSeleccion(preseleccion || opcionesHora[0] || null);
  }, [preseleccion, opcionesHora]);

  // 🎨 estilos
  const BackdropStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    pointerEvents: "auto",
  };
  const CardStyle = {
    width: "min(780px, 92vw)",
    maxHeight: "85vh",
    overflow: "auto",
    background: "#141414",
    color: "#fff",
    borderRadius: "16px",
    border: "1px solid #2a2a2a",
    boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
    padding: "18px 18px 14px",
  };
  const HeaderStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  };
  const CloseBtn = {
    background: "#ff6a00",
    color: "#111",
    border: "none",
    borderRadius: 10,
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 700,
  };
  const SlotBox = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    padding: 12,
    border: "1px solid #2a2a2a",
    borderRadius: 12,
    background: "#0f0f0f",
    marginBottom: 12,
  };
  const TimeLabel = { color: "#9aa0a6", fontSize: 12, marginBottom: 8 };
  const TimeGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 8,
    marginBottom: 12,
  };
  const TimeBtn = {
    background: "#1b1b1b",
    border: "1px solid #2a2a2a",
    color: "#fff",
    borderRadius: 10,
    padding: "10px",
    cursor: "pointer",
  };
  const TimeBtnSel = {
    ...TimeBtn,
    background: "#ff8f44",
    borderColor: "#ff8f44",
    color: "#111",
    fontWeight: 800,
  };
  const Row = {
    display: "grid",
    gridTemplateColumns: "1fr auto auto",
    gap: 12,
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #262626",
    background: "#121212",
  };
  const Name = { fontWeight: 700 };
  const Sub = { color: "#9aa0a6", fontSize: 12 };
  const BadgeBlue = {
    background: "#1e72ff",
    border: "1px solid #4e90ff",
    color: "#fff",
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 999,
  };
  const BadgeGreen = {
    background: "#1b7f4d",
    border: "1px solid #32a466",
    color: "#fff",
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 999,
  };
  const PrimaryBtn = {
    background: "#ff6a00",
    border: "1px solid #ff8f44",
    color: "#111",
    fontWeight: 700,
    padding: "8px 12px",
    borderRadius: 10,
    cursor: "pointer",
  };
  const SecondaryBtn = {
    background: "#222",
    border: "1px solid #444",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 10,
    cursor: "pointer",
  };
  const Empty = {
    border: "1px dashed #3a3a3a",
    borderRadius: 12,
    padding: 16,
    textAlign: "center",
    color: "#b6b6b6",
  };

  // 👉 Si el modal no está abierto, ahora retornamos acá (después de correr hooks).
  if (!open) return null;

  const Content = (
    <div style={BackdropStyle} onClick={onClose}>
      <div style={CardStyle} onClick={(e) => e.stopPropagation()}>
        <div style={HeaderStyle}>
          <h3 style={{ margin: 0 }}>Asignar sesión</h3>
          <button style={CloseBtn} onClick={onClose}>
            ×
          </button>
        </div>

        {/* Selector de horario */}
        <div style={{ marginBottom: 10 }}>
          <div style={TimeLabel}>Elegí horario para el día seleccionado</div>
          {opcionesHora?.length ? (
            <div style={TimeGrid}>
              {opcionesHora.map((opt, i) => {
                const sel =
                  seleccion &&
                  opt.start.getTime() === seleccion.start.getTime();
                return (
                  <button
                    key={i}
                    style={sel ? TimeBtnSel : TimeBtn}
                    onClick={() => setSeleccion(opt)}
                  >
                    {fmtTime(opt.start)}
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={Empty}>No hay horarios libres para este día.</div>
          )}
        </div>

        {/* Resumen Inicio / Fin */}
        <div style={SlotBox}>
          <div>
            <strong>Inicio:</strong> {fmtFull(seleccion?.start || slot?.start)}
          </div>
          <div>
            <strong>Fin:</strong> {fmtFull(seleccion?.end || slot?.end)}
          </div>
        </div>

        {/* Lista de clientes */}
        {Array.isArray(opciones) && opciones.length > 0 ? (
          <div style={{ display: "grid", gap: 10 }}>
            {opciones.map((c) => (
              <div key={c.id} style={Row}>
                <div>
                  <div style={Name}>{c.nombre}</div>
                  {c.alias && <div style={Sub}>@{c.alias}</div>}
                </div>

                <div>
                  {c.tieneVitalicio ? (
                    <span style={BadgeGreen}>Vitalicio</span>
                  ) : (
                    <span style={BadgeBlue}>{c.restantes} disp.</span>
                  )}
                </div>

                <button
                  style={PrimaryBtn}
                  disabled={!seleccion}
                  onClick={() =>
                    onAsignar?.(c, seleccion || slot /* fallback */)
                  }
                >
                  Asignar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={Empty}>
            <p>
              <strong>No hay clientes con sesiones disponibles.</strong>
            </p>
            <p>
              Creá un cliente y asignale un plan (pack o vitalicio) desde{" "}
              <em>Clientes</em> y <em>Planes</em>. Luego volvé a clickear un
              horario.
            </p>
          </div>
        )}

        <div
          style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}
        >
          <button style={SecondaryBtn} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(Content, document.body);
}
