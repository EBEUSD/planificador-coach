import { useEffect, useMemo, useState } from "react";
import base from "../estilos/Formularios.module.css";
import ux from "../estilos/Disponibilidad.module.css";
import { listarClientes } from "../servicios/clientes.dexie";
import {
  guardarDisponibilidad,
  obtenerDisponibilidad,
} from "../servicios/disponibilidades.dexie";
import { sugerirTurnosParaCliente } from "../servicios/sugerencias";
import {
  elegirPlanParaAsignar,
  ajustarRestantes,
} from "../servicios/planes.dexie";
import { crearSesion, hayChoque } from "../servicios/sesiones.dexie";
import TimezoneSelect from "./TimezoneSelect";

const horas = Array.from(
  { length: 24 },
  (_, h) => `${String(h).padStart(2, "0")}:00`
);
const N = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function groupByDay(slots) {
  const fmtD = new Intl.DateTimeFormat(undefined, { dateStyle: "full" });
  const fmtT = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const map = new Map();
  for (const s of slots) {
    const key = new Date(
      s.start.getFullYear(),
      s.start.getMonth(),
      s.start.getDate()
    )
      .toISOString()
      .slice(0, 10);
    if (!map.has(key)) map.set(key, { label: fmtD.format(s.start), times: [] });
    map
      .get(key)
      .times.push({
        label: `${fmtT.format(s.start)} → ${fmtT.format(s.end)}`,
        start: s.start,
        end: s.end,
      });
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({ key, ...v }));
}

export default function DisponibilidadCliente() {
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [zonaHoraria, setZonaHoraria] = useState(
    "America/Argentina/Buenos_Aires"
  );
  const [dias, setDias] = useState([1, 2, 3, 4, 5]);
  const [rangos, setRangos] = useState({
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  });
  const [sugerencias, setSugerencias] = useState([]);
  const [dirty, setDirty] = useState(false);

  const [edit, setEdit] = useState(null);
  const [tmpInicio, setTmpInicio] = useState("16:00");
  const [tmpFin, setTmpFin] = useState("19:00");

  useEffect(() => {
    (async () => {
      const lista = await listarClientes();
      setClientes(lista);
      if (!clienteId && lista.length) setClienteId(String(lista[0].id));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      if (!clienteId) return;
      const d = await obtenerDisponibilidad(clienteId);
      if (d) {
        setZonaHoraria(d.zonaHoraria);
        setDias(d.dias);
        setRangos(d.rangos);
      } else {
        setZonaHoraria("America/Argentina/Buenos_Aires");
        setDias([1, 2, 3, 4, 5]);
        setRangos({ 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] });
      }
      setSugerencias([]);
      setDirty(false);
      setEdit(null);
    })();
  }, [clienteId]);

  const toggleDia = (dow) => {
    setDias((prev) => {
      const next = prev.includes(dow)
        ? prev.filter((d) => d !== dow)
        : [...prev, dow].sort();
      setDirty(true);
      if (!next.includes(dow) && edit?.dow === dow) setEdit(null);
      return next;
    });
  };

  const startAdd = (dow) => {
    setEdit({ dow, idx: null });
    setTmpInicio("16:00");
    setTmpFin("19:00");
  };
  const startEdit = (dow, idx, r) => {
    setEdit({ dow, idx });
    setTmpInicio(r.inicio);
    setTmpFin(r.fin);
  };
  const cancelEdit = () => setEdit(null);

  const commitEdit = () => {
    if (!edit) return;
    const { dow, idx } = edit;
    setRangos((prev) => {
      const arr = [...(prev[dow] || [])];
      const nuevo = { inicio: tmpInicio, fin: tmpFin };
      if (idx == null) arr.push(nuevo);
      else arr[idx] = nuevo;
      setDirty(true);
      return { ...prev, [dow]: arr };
    });
    setEdit(null);
  };
  const delRango = (dow, idx) => {
    setRangos((prev) => {
      const arr = [...(prev[dow] || [])];
      arr.splice(idx, 1);
      setDirty(true);
      return { ...prev, [dow]: arr };
    });
  };

  const aplicarGrupo = (diasObjetivo) => {
    setRangos((prev) => {
      const base = { ...prev };
      for (const d of diasObjetivo)
        base[d] = [...(base[d] || []), { inicio: tmpInicio, fin: tmpFin }];
      setDirty(true);
      return base;
    });
  };
  const limpiarGrupo = (diasObjetivo) => {
    setRangos((prev) => {
      const base = { ...prev };
      for (const d of diasObjetivo) base[d] = [];
      setDirty(true);
      return base;
    });
  };

  const puedeGuardar = useMemo(() => !!clienteId, [clienteId]);
  const guardar = async () => {
    if (dirty) {
      await guardarDisponibilidad({ clienteId, zonaHoraria, dias, rangos });
      setDirty(false);
    }
    const sugs = await sugerirTurnosParaCliente(clienteId, new Date());
    setSugerencias(sugs);
  };

  const grupos = useMemo(() => groupByDay(sugerencias), [sugerencias]);
  const diasMostrados = useMemo(() => dias.slice().sort(), [dias]);

  async function asignar(slot) {
    if (!clienteId) return;
    // choque por seguridad (aunque las sugerencias ya evitan choques)
    const choca = await hayChoque(slot.start, slot.end);
    if (choca) {
      alert("Ese horario se ocupó recién. Elegí otra sugerencia.");
      await guardar();
      return;
    }

    const plan = await elegirPlanParaAsignar(clienteId);
    if (!plan) {
      alert(
        "Este cliente no tiene saldo ni plan vitalicio. Creá o recargá un plan primero."
      );
      return;
    }

    const fechaTxt = new Intl.DateTimeFormat(undefined, {
      dateStyle: "full",
    }).format(slot.start);
    const horaTxt =
      new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }).format(slot.start) +
      " → " +
      new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }).format(slot.end);
    const clienteNombre =
      clientes.find((c) => String(c.id) === String(clienteId))?.nombre ||
      "cliente";
    const etiquetaPlan =
      plan.etiqueta || (plan.esVitalicio ? "Vitalicio" : "Pack");

    const ok = confirm(
      `Asignar ${horaTxt} (${fechaTxt}) a ${clienteNombre} usando plan "${etiquetaPlan}"?`
    );
    if (!ok) return;

    await crearSesion({
      clienteId,
      planId: plan.id,
      inicioUtc: slot.start,
      finUtc: slot.end,
      estado: "agendada",
    });
    if (!plan.esVitalicio) await ajustarRestantes(plan.id, -1);

    // refrescar sugerencias para que desaparezca ese hueco
    await guardar();
    alert("Sesión agendada ✔");
  }

  return (
    <div className={`${base.panel} ${ux.wrap}`}>
      <div className={`${base.card} ${base.full}`}>
        <h3>Disponibilidad del cliente</h3>

        <div className={ux.header}>
          <div className={ux.field}>
            <span className={ux.label}>Cliente</span>
            <select
              className={ux.input}
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
          <div className={ux.field}>
            <span className={ux.label}>Zona horaria</span>
            <TimezoneSelect
              value={zonaHoraria}
              onChange={(v) => {
                setZonaHoraria(v);
                setDirty(true);
              }}
              id="tz-disp"
            />
          </div>
        </div>

        <div className={ux.days}>
          {N.map((n, i) => (
            <label
              key={i}
              className={`${ux.dayChip} ${dias.includes(i) ? ux.dayOn : ""}`}
            >
              <input
                type="checkbox"
                checked={dias.includes(i)}
                onChange={() => toggleDia(i)}
              />
              {n}
            </label>
          ))}
        </div>

        <div className={ux.field}>
          <span className={ux.label}>Rápidas</span>
          <div className={ux.quick}>
            <select
              className={ux.sel}
              value={tmpInicio}
              onChange={(e) => setTmpInicio(e.target.value)}
            >
              {horas.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span>→</span>
            <select
              className={ux.sel}
              value={tmpFin}
              onChange={(e) => setTmpFin(e.target.value)}
            >
              {horas.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <button
              className={ux.qbtn}
              onClick={() => aplicarGrupo([1, 2, 3, 4, 5])}
            >
              Añadir a L–V
            </button>
            <button className={ux.qbtn} onClick={() => aplicarGrupo([0, 6])}>
              Añadir a S–D
            </button>
            <button
              className={ux.qbtn}
              onClick={() => limpiarGrupo([1, 2, 3, 4, 5])}
            >
              Limpiar L–V
            </button>
            <button className={ux.qbtn} onClick={() => limpiarGrupo([0, 6])}>
              Limpiar S–D
            </button>
          </div>
        </div>
      </div>

      <div className={ux.dayList}>
        {diasMostrados.map((dow) => {
          const arr = rangos[dow] || [];
          return (
            <div key={dow} className={ux.dayCard}>
              <div className={ux.dayHead}>
                <span className={ux.dayTitle}>{N[dow]}</span>
                <button className={ux.addIcon} onClick={() => startAdd(dow)}>
                  + Añadir rango
                </button>
              </div>

              <div className={ux.chips}>
                {arr.length === 0 && (
                  <span className={ux.badge}>Sin rangos</span>
                )}
                {arr.map((r, idx) => (
                  <span key={idx} className={ux.chip}>
                    {r.inicio} → {r.fin}
                    <button
                      className={ux.chipBtn}
                      onClick={() => startEdit(dow, idx, r)}
                    >
                      Editar
                    </button>
                    <button
                      className={ux.chipBtn}
                      onClick={() => delRango(dow, idx)}
                    >
                      Quitar
                    </button>
                  </span>
                ))}
              </div>

              {edit?.dow === dow && (
                <div className={ux.editor}>
                  <select
                    className={ux.sel}
                    value={tmpInicio}
                    onChange={(e) => setTmpInicio(e.target.value)}
                  >
                    {horas.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <span>→</span>
                  <select
                    className={ux.sel}
                    value={tmpFin}
                    onChange={(e) => setTmpFin(e.target.value)}
                  >
                    {horas.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <button className={ux.ok} onClick={commitEdit}>
                    Aceptar
                  </button>
                  <button className={ux.cancel} onClick={cancelEdit}>
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={ux.actions}>
        <button
          className={ux.cta}
          onClick={guardar}
          disabled={!puedeGuardar}
          title={!clienteId ? "Seleccioná un cliente" : ""}
        >
          Guardar y sugerir
        </button>
      </div>

      {!!grupos.length && (
        <div className={base.full}>
          <h3>Sugerencias (semana actual)</h3>
          <div className={ux.sugWrap}>
            {grupos.map((g) => (
              <div key={g.key} className={ux.sugGroup}>
                <div className={ux.sugHead}>
                  <span>{g.label}</span>
                  <span className={ux.badge}>{g.times.length} opciones</span>
                </div>
                <div className={ux.times}>
                  {g.times.map((t, i) => (
                    <span
                      key={i}
                      className={ux.time}
                      title="Click para agendar"
                      onClick={() => asignar(t)}
                    >
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
