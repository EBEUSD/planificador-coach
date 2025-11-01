import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ModalAsignarSesion({
  open,
  slot,
  opciones = [],
  onAsignar,
  onClose,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

 

  const fmt = (d) =>
    d
      ? new Intl.DateTimeFormat("es-AR", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(d)
      : "—";

  const BackdropStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999, // por encima del calendario
    pointerEvents: "auto",
  };

  const CardStyle = {
    width: "min(720px, 92vw)",
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

  const Content = (
    <div style={BackdropStyle} onClick={onClose}>
      <div style={CardStyle} onClick={(e) => e.stopPropagation()}>
        <div style={HeaderStyle}>
          <h3 style={{ margin: 0 }}>Asignar sesión</h3>
          <button style={CloseBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <div style={SlotBox}>
          <div>
            <strong>Inicio:</strong> {fmt(slot?.start)}
          </div>
          <div>
            <strong>Fin:</strong> {fmt(slot?.end)}
          </div>
        </div>

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

                <button style={PrimaryBtn} onClick={() => onAsignar?.(c)}>
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
