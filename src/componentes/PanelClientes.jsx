import { useEffect, useState, useMemo } from "react";
import s from "../estilos/Formularios.module.css";
import { crearCliente, listarClientes } from "../servicios/clientes.dexie";
import { eliminarClienteCascada } from "../servicios/eliminarCascada";
import { saldoCliente, recargarSesiones } from "../servicios/planes.dexie";
import TimezoneSelect from "./TimezoneSelect";

export default function PanelClientes() {
  const [form, setForm] = useState({
    nombre: "",
    alias: "",
    zonaHoraria: "America/Argentina/Buenos_Aires",
    notas: "",
  });
  const [items, setItems] = useState([]);
  const [filtro, setFiltro] = useState("all"); // all | con | sin | vit

  const load = async () => {
    const base = await listarClientes();
    const withSaldo = await Promise.all(
      base.map(async (c) => {
        const sld = await saldoCliente(c.id);
        return { ...c, saldo: sld.restantes, vitalicio: sld.tieneVitalicio };
      })
    );
    withSaldo.sort((a, b) => b.saldo - a.saldo);
    setItems(withSaldo);
  };
  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    await crearCliente(form);
    setForm({
      nombre: "",
      alias: "",
      zonaHoraria: "America/Argentina/Buenos_Aires",
      notas: "",
    });
    load();
  }

  async function borrar(id) {
    const ok = confirm("¿Eliminar cliente y todo su contenido?");
    if (!ok) return;
    await eliminarClienteCascada(id);
    load();
  }

  async function recargar(id) {
    const v = prompt("¿Cuántas sesiones querés agregar? (número)");
    if (!v) return;
    const n = Number(v);
    if (Number.isNaN(n) || n <= 0) {
      alert("Ingresá un número válido.");
      return;
    }
    await recargarSesiones({ clienteId: id, cantidad: n });
    load();
  }

  // Reglas del filtro:
  // - "con": solo packs con saldo > 0 (excluye vitalicios)
  // - "sin": saldo == 0 y no vitalicio
  // - "vit": vitalicios
  const filtrados = useMemo(() => {
    if (filtro === "con")
      return items.filter((c) => !c.vitalicio && (c.saldo || 0) > 0);
    if (filtro === "sin")
      return items.filter((c) => !c.vitalicio && (c.saldo || 0) === 0);
    if (filtro === "vit") return items.filter((c) => c.vitalicio);
    return items;
  }, [items, filtro]);

  const countCon = items.filter(
    (c) => !c.vitalicio && (c.saldo || 0) > 0
  ).length;
  const countSin = items.filter(
    (c) => !c.vitalicio && (c.saldo || 0) === 0
  ).length;
  const countVit = items.filter((c) => c.vitalicio).length;

  return (
    <div className={s.panel}>
      <form className={`${s.card} ${s.full}`} onSubmit={submit}>
        <h3>Nuevo cliente</h3>
        <div className={s.row}>
          <label style={{ width: 120 }}>Nombre</label>
          <input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
        </div>
        <div className={s.row}>
          <label style={{ width: 120 }}>Alias</label>
          <input
            value={form.alias}
            onChange={(e) => setForm({ ...form, alias: e.target.value })}
          />
        </div>
        <div className={s.row}>
          <label style={{ width: 120 }}>Zona horaria</label>
          <TimezoneSelect
            value={form.zonaHoraria}
            onChange={(v) => setForm({ ...form, zonaHoraria: v })}
            id="tz-clientes"
          />
        </div>
        <div className={s.row}>
          <label style={{ width: 120 }}>Notas</label>
          <textarea
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
          />
        </div>
        <div className={s.row} style={{ justifyContent: "flex-end" }}>
          <button type="submit">Guardar</button>
        </div>
      </form>

      <div className={s.card}>
        <div
          className={s.row}
          style={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <h3>Clientes</h3>
          <div className={s.seg}>
            <button
              className={`${s.segBtn} ${filtro === "all" ? s.segOn : ""}`}
              onClick={() => setFiltro("all")}
            >
              Todos <span className={s.badge}>{items.length}</span>
            </button>
            <button
              className={`${s.segBtn} ${filtro === "con" ? s.segOn : ""}`}
              onClick={() => setFiltro("con")}
            >
              Con pendientes <span className={s.badgeOk}>{countCon}</span>
            </button>
            <button
              className={`${s.segBtn} ${filtro === "sin" ? s.segOn : ""}`}
              onClick={() => setFiltro("sin")}
            >
              Sin pendientes <span className={s.badgeZero}>{countSin}</span>
            </button>
            <button
              className={`${s.segBtn} ${filtro === "vit" ? s.segOn : ""}`}
              onClick={() => setFiltro("vit")}
            >
              Vitalicios <span className={s.badge}>{countVit}</span>
            </button>
          </div>
        </div>

        <div className={s.list}>
          {filtrados.map((c) => (
            <div
              key={c.id}
              className={s.row}
              style={{ justifyContent: "space-between", width: "100%" }}
            >
              <div className={s.row} style={{ flexWrap: "wrap", gap: 6 }}>
                <strong>{c.nombre}</strong>
                {c.alias && <span className={s.badge}>@{c.alias}</span>}
                {c.vitalicio && <span className={s.badgeOk}>Vitalicio</span>}
                {!c.vitalicio && (
                  <span className={c.saldo > 0 ? s.badgeOk : s.badgeZero}>
                    {c.saldo} disponibles
                  </span>
                )}
                <span className={s.badge}>{c.zonaHoraria}</span>
              </div>
              <div className={s.row} style={{ gap: 6 }}>
                {!c.vitalicio && (
                  <button onClick={() => recargar(c.id)}>Recargar</button>
                )}
                <button onClick={() => borrar(c.id)}>Borrar</button>
              </div>
            </div>
          ))}
          {filtrados.length === 0 && (
            <div className={s.row}>
              <span className={s.badge}>Sin resultados</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
