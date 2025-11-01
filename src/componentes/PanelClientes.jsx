import { useEffect, useMemo, useState } from "react";
import base from "../estilos/Formularios.module.css";
import ux from "../estilos/Clientes.module.css";
import {
  listarClientes,
  crearCliente,
  borrarCliente,
} from "../servicios/clientes.dexie";
import TimezoneSelect from "../componentes/TimezoneSelect";

function Badge({ children, tone = "default" }) {
  const tones = {
    default: "#2b2b2b",
    blue: "#1e72ff",
    red: "#7a1a1a",
    green: "#1b7f4d",
    orange: "#ff6a00",
  };
  const style = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    border: "1px solid rgba(255,255,255,.08)",
    background: tones[tone] || tones.default,
    color: tone === "default" ? "#ddd" : "#fff",
  };
  return <span style={style}>{children}</span>;
}

function HeaderChip({ active, onClick, children, count }) {
  const style = {
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 14,
    cursor: "pointer",
    background: active ? "#ff6a00" : "#222",
    color: active ? "#111" : "#ddd",
    border: active ? "1px solid #ff8f44" : "1px solid #333",
  };
  return (
    <button onClick={onClick} style={style}>
      {children}{" "}
      <span
        style={{
          marginLeft: 8,
          padding: "2px 8px",
          borderRadius: 999,
          fontSize: 12,
          background: active ? "#111" : "#333",
          color: active ? "#ff6a00" : "#bbb",
        }}
      >
        {count}
      </span>
    </button>
  );
}

export default function PanelClientes() {
  const [clientes, setClientes] = useState([]);
  const [filtro, setFiltro] = useState("todos");

  const [openNuevo, setOpenNuevo] = useState(false);
  const [nombre, setNombre] = useState("");
  const [alias, setAlias] = useState("");
  const [tz, setTz] = useState("America/Argentina/Buenos_Aires");
  const puedeGuardar = nombre.trim().length > 0;

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    const list = await listarClientes();
    setClientes(list);
  }

  async function handleCrear() {
    if (!puedeGuardar) return;
    await crearCliente({
      nombre: nombre.trim(),
      alias: alias.trim(),
      tz,
      disponibles: 0,
      vitalicio: false,
    });
    setOpenNuevo(false);
    setNombre("");
    setAlias("");
    setTz("America/Argentina/Buenos_Aires");
    await cargar();
  }

  async function handleBorrar(id) {
    await borrarCliente(id);
    await cargar();
  }

  const counts = useMemo(() => {
    const total = clientes.length;
    const con = clientes.filter(
      (c) => (Number(c.disponibles) || 0) > 0 || c.vitalicio
    ).length;
    const sin = clientes.filter(
      (c) => !c.vitalicio && (Number(c.disponibles) || 0) === 0
    ).length;
    const vit = clientes.filter((c) => !!c.vitalicio).length;
    return { total, con, sin, vit };
  }, [clientes]);

  const listFiltrada = useMemo(() => {
    if (filtro === "con")
      return clientes.filter(
        (c) => (Number(c.disponibles) || 0) > 0 || c.vitalicio
      );
    if (filtro === "sin")
      return clientes.filter(
        (c) => !c.vitalicio && (Number(c.disponibles) || 0) === 0
      );
    if (filtro === "vit") return clientes.filter((c) => !!c.vitalicio);
    return clientes;
  }, [clientes, filtro]);

  return (
    <div className={base.panel}>
      <div className={ux.header}>
        <div className={ux.titleWrap}>
          <h2 className={ux.title}>Clientes</h2>
          <Badge>{`Total: ${counts.total}`}</Badge>
        </div>
        <div className={ux.actions}>
          <HeaderChip
            active={filtro === "todos"}
            onClick={() => setFiltro("todos")}
            count={counts.total}
          >
            Todos
          </HeaderChip>
          <HeaderChip
            active={filtro === "con"}
            onClick={() => setFiltro("con")}
            count={counts.con}
          >
            Con pendientes
          </HeaderChip>
          <HeaderChip
            active={filtro === "sin"}
            onClick={() => setFiltro("sin")}
            count={counts.sin}
          >
            Sin pendientes
          </HeaderChip>
          <HeaderChip
            active={filtro === "vit"}
            onClick={() => setFiltro("vit")}
            count={counts.vit}
          >
            Vitalicios
          </HeaderChip>
          <button className={ux.newBtn} onClick={() => setOpenNuevo(true)}>
            Nuevo cliente
          </button>
        </div>
      </div>

      <div className={ux.list}>
        {listFiltrada.map((c) => (
          <div key={c.id} className={ux.card}>
            <div className={ux.avatar}>
              {String(c.nombre || "?")
                .trim()
                .charAt(0)
                .toUpperCase()}
            </div>
            <div className={ux.info}>
              <div className={ux.nameRow}>
                <div className={ux.name}>{c.nombre}</div>
                <button
                  className={ux.dangerBtn}
                  onClick={() => handleBorrar(c.id)}
                >
                  Borrar
                </button>
              </div>
              <div className={ux.sub}>@{c.alias || "usuario"}</div>
              <div className={ux.metaRow}>
                <Badge>{c.tz || "America/Argentina/Buenos_Aires"}</Badge>
                {c.vitalicio ? (
                  <Badge tone="green">Vitalicio</Badge>
                ) : (
                  <Badge tone="blue">{`${Number(
                    c.disponibles || 0
                  )} disponibles`}</Badge>
                )}
              </div>
            </div>
          </div>
        ))}

        {!listFiltrada.length && (
          <div className={ux.empty}>
            <div className={ux.emptyIcon}>👥</div>
            <div className={ux.emptyTitle}>Sin resultados</div>
            <div className={ux.emptySub}>
              Cambiá el filtro o creá un cliente nuevo.
            </div>
          </div>
        )}
      </div>

      {openNuevo && (
        <div className={ux.backdrop} onClick={() => setOpenNuevo(false)}>
          <div className={ux.modal} onClick={(e) => e.stopPropagation()}>
            <div className={ux.modalHead}>
              <h3>Nuevo cliente</h3>
              <button className={ux.close} onClick={() => setOpenNuevo(false)}>
                ×
              </button>
            </div>

            <div className={ux.formGrid}>
              <label className={ux.label}>Nombre</label>
              <input
                className={ux.input}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre y apellido"
              />

              <label className={ux.label}>Alias</label>
              <input
                className={ux.input}
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="@alias"
              />

              <label className={ux.label}>Zona horaria</label>
              <TimezoneSelect
                id="tz-nuevo-cliente"
                value={tz}
                onChange={(v) => setTz(v)}
              />
            </div>

            <div className={ux.modalFoot}>
              <button
                className={ux.ghostBtn}
                onClick={() => setOpenNuevo(false)}
              >
                Cancelar
              </button>
              <button
                className={ux.primaryBtn}
                disabled={!puedeGuardar}
                onClick={handleCrear}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
