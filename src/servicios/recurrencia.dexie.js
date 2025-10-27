import { db } from "./db.dexie";
import { listarExcepcionesPorBloqueYFecha } from "./excepciones.dexie";

function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function mins(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

function overlap(a1, a2, b1, b2) {
  return a1 < b2 && b1 < a2;
}

function mk(date, totalMin) {
  const cap = Math.min(totalMin, 1439);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Math.floor(cap / 60),
    cap % 60,
    0
  );
}

export async function listarBloques() {
  return await db.bloques.toArray();
}

export async function expandirBloquesEnRango(inicioRango, finRango) {
  const bloques = await listarBloques();
  const eventos = [];
  const cur = new Date(inicioRango);
  while (cur <= finRango) {
    const dow = cur.getDay();
    for (const b of bloques) {
      if (!b.habilitado) continue;
      if (!b.dias.includes(dow)) continue;
      const fechaISO = ymd(cur);
      const excs = await listarExcepcionesPorBloqueYFecha(b.id, fechaISO);
      const mi = mins(b.horaInicio);
      const mf = mins(b.horaFin);
      const step = b.split === "hour" ? 60 : mf - mi;
      for (let m = mi; m < mf; m += step) {
        const segI = m;
        const segF = Math.min(m + step, mf);
        const saltar = excs.some((e) => {
          if (e.desdeMin == null || e.hastaMin == null) return true;
          return overlap(segI, segF, e.desdeMin, e.hastaMin);
        });
        if (saltar) continue;
        const start = mk(cur, segI);
        const end = mk(cur, segF);
        eventos.push({
          id: `B-${b.id}-${fechaISO}-${segI}`,
          title: b.etiqueta,
          start,
          end,
          meta: {
            tipo: "bloque",
            bloqueId: b.id,
            fechaISO,
            desdeMin: segI,
            hastaMin: segF,
          },
        });
      }
    }
    cur.setDate(cur.getDate() + 1);
  }
  return eventos;
}
