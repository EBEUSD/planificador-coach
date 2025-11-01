import { useEffect, useState } from "react";
import "../estilos/Modal.module.css";

export default function ModalAccionEvento({
  open,
  onClose,
  evento,
  onTomar,
  onCancelar,
  onBorrar,
  onNota,
}) {
  const [nota, setNota] = useState("");

  useEffect(() => {
    setNota(evento?.meta?.nota || "");
  }, [evento]);

  if (!open) return null;

  return (
    <div className="m-backdrop" onClick={onClose}>
      <div className="m-card" onClick={(e) => e.stopPropagation()}>
        <div className="m-header">
          <h4 className="m-title">Acción para “{evento?.title}”</h4>
          <button className="m-x" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="m-body">
          <div className="m-row">
            <button className="btn-primary" onClick={onTomar}>
              Tomada (descontar 1)
            </button>
            <button className="btn-secondary" onClick={onCancelar}>
              Cancelar (devuelve 1)
            </button>
            <button className="btn-danger" onClick={onBorrar}>
              Borrar
            </button>
          </div>

          <div className="m-note">
            <label>Nota</label>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Agregar una nota…"
            />
            <div className="m-row-right">
              <button className="btn-secondary" onClick={() => onNota(nota)}>
                Guardar nota
              </button>
            </div>
          </div>
        </div>

        <div className="m-footer">
          <button className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
