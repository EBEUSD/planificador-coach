import { createPortal } from "react-dom";

export default function HourPickerModal({
  open,
  date,
  events = [],
  onPick,
  onClose,
}) {
  if (!open || !date) return null;

  const dKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const busy = new Set();
  for (const ev of events) {
    const s = new Date(ev.start);
    const e = new Date(ev.end);
    if (dKey(s) !== dKey(date)) continue;
    let h = s.getHours();
    const last = Math.max(h, e.getHours());
    for (; h < last; h++) busy.add(h);
  }

  const hours = Array.from({ length: 24 }, (_, h) => h);

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
    width: "min(560px, 92vw)",
    background: "#141414",
    color: "#fff",
    borderRadius: 16,
    border: "1px solid #2a2a2a",
    boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
    padding: 18,
  };
  const Header = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  };
  const Grid = {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: 8,
  };
  const Btn = {
    padding: "10px 8px",
    borderRadius: 10,
    background: "#1e1e1e",
    border: "1px solid #2a2a2a",
    color: "#fff",
    cursor: "pointer",
    textAlign: "center",
  };
  const BtnBusy = { ...Btn, opacity: 0.35, cursor: "not-allowed" };
  const Close = {
    background: "#ff6a00",
    border: "1px solid #ff8f44",
    color: "#111",
    fontWeight: 700,
    padding: "8px 12px",
    borderRadius: 10,
    cursor: "pointer",
  };

  const fmt = new Intl.DateTimeFormat("es-AR", { dateStyle: "full" }).format(
    date
  );

  return createPortal(
    <div style={Backdrop} onClick={onClose}>
      <div style={Card} onClick={(e) => e.stopPropagation()}>
        <div style={Header}>
          <h3 style={{ margin: 0 }}>Elegí la hora — {fmt}</h3>
          <button style={Close} onClick={onClose}>
            ×
          </button>
        </div>
        <div style={Grid}>
          {hours.map((h) => {
            const disabled = busy.has(h);
            const label = String(h).padStart(2, "0") + ":00";
            return (
              <button
                key={h}
                style={disabled ? BtnBusy : Btn}
                disabled={disabled}
                onClick={() => {
                  const start = new Date(date);
                  start.setHours(h, 0, 0, 0);
                  onPick?.(start);
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div
          style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}
        >
          <button style={Close} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
