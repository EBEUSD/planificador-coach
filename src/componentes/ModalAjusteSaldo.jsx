import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ModalAjusteSaldo({ open, cliente, onApply, onClose }) {
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    if (open) setCantidad(1);
  }, [open]);

  if (!open) return null;

  const Backdrop = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999
  };

  const Card = {
    width: "min(520px, 92vw)",
    background: "#141414",
    color: "#fff",
    borderRadius: 16,
    border: "1px solid #2a2a2a",
    boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
    padding: 18
  };

  const Row = { display: "grid", gap: 10, marginTop: 10 };
  const Actions = { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 };

  const Btn = {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #444",
    background: "#222",
    color: "#fff",
    cursor: "pointer"
  };

  const BtnDanger = { ...Btn, background: "#3a1a1a", borderColor: "#6a2b2b" };
  const BtnOk = { ...Btn, background: "#1b7f4d", borderColor: "#32a466", color: "#fff" };
  const BtnGhost = { ...Btn, background: "transparent" };

  return createPortal(
    <div style={Backdrop} onClick={onClose}>
      <div style={Card} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: 0 }}>Ajustar sesiones</h3>
        <div style={{ opacity: 0.8, marginTop: 4 }}>
          {cliente?.nombre} — disponibles: {cliente?.disponibles ?? 0}
        </div>

        <div style={Row}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Cantidad</span>
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(Math.max(1, Number(e.target.value || 1)))}
              style={{
                background: "#0f0f0f",
                color: "#fff",
                border: "1px solid #2a2a2a",
                borderRadius: 10,
                padding: "10px 12px",
                width: 140
              }}
            />
          </label>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={BtnDanger}
              onClick={() => onApply?.(-Math.abs(cantidad))}
              title="Descontar de disponibles"
            >
              Quitar
            </button>
            <button
              style={BtnOk}
              onClick={() => onApply?.(Math.abs(cantidad))}
              title="Sumar a disponibles"
            >
              Devolver
            </button>
          </div>
        </div>

        <div style={Actions}>
          <button style={BtnGhost} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
