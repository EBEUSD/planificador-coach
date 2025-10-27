import { db } from "./db.dexie";
import { expandirBloquesEnRango } from "./recurrencia.dexie";
import { obtenerDisponibilidad } from "./disponibilidades.dexie";
import { startOfWeek, addDays } from "date-fns";
import { zonedTimeToUtc } from "date-fns-tz";

function rangoHoras(dateLocal, tz, hIni, hFin) {
  const toLocal = (hhmm) => {
    const [hh, mm] = hhmm.split(":").map(Number);
    return new Date(
      dateLocal.getFullYear(),
      dateLocal.getMonth(),
      dateLocal.getDate(),
      hh,
      mm || 0,
      0
    );
  };
  const sLocal = toLocal(hIni);
  let eLocal = toLocal(hFin);
  if (eLocal <= sLocal) eLocal.setDate(eLocal.getDate() + 1); // 00:00 => día siguiente, o fin <= inicio
  return { start: zonedTimeToUtc(sLocal, tz), end: zonedTimeToUtc(eLocal, tz) };
}

function splitEnHoras(r) {
  const out = [];
  const cur = new Date(r.start);
  while (cur < r.end) {
    const next = new Date(cur);
    next.setHours(next.getHours() + 1);
    if (next <= r.end) out.push({ start: new Date(cur), end: next });
    cur.setHours(cur.getHours() + 1);
  }
  return out;
}

function overlap(a, b) {
  return a.start < b.end && b.start < a.end;
}

export async function sugerirTurnosParaCliente(
  clienteId,
  weekRef = new Date()
) {
  const disp = await obtenerDisponibilidad(clienteId);
  if (!disp) return [];
  const weekStart = startOfWeek(weekRef, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  const bloques = await expandirBloquesEnRango(weekStart, weekEnd);
  const sesiones = await db.sesiones.toArray();
  const ocupados = [
    ...bloques.map((e) => ({ start: e.start, end: e.end })),
    ...sesiones.map((s) => ({
      start: new Date(s.inicioUtc),
      end: new Date(s.finUtc),
    })),
  ];
  const sugeridos = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);
    const dow = day.getDay();
    if (!disp.dias.includes(dow)) continue;
    const rangos = disp.rangos[dow] || [];
    for (const r of rangos) {
      const rangoUtc = rangoHoras(day, disp.zonaHoraria, r.inicio, r.fin);
      const horas = splitEnHoras(rangoUtc);
      for (const h of horas) {
        const choca = ocupados.some((o) => overlap(h, o));
        if (!choca) sugeridos.push(h);
      }
    }
  }
  return sugeridos.sort((a, b) => a.start - b.start);
}
