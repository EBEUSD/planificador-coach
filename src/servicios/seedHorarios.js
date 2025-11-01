import { db } from "./db.dexie";

function mkISOFromLocal(y, m, d, hh, mm = 0) {
  const local = new Date(y, m - 1, d, hh, mm, 0, 0);
  local.setMilliseconds(0);
  return local.toISOString();
}
function mondayOfWeek(d) {
  const res = new Date(d);
  const day = res.getDay() || 7; // 1..7 (lun=1..dom=7)
  res.setDate(res.getDate() - (day - 1));
  res.setHours(0, 0, 0, 0);
  return res;
}
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function ymdLocal(d) {
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()];
}
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/^@+/, "")
    .trim();

async function findClienteId(tag) {
  const all = await db.clientes.toArray();
  const hit = all.find((c) => norm(c.alias) === tag || norm(c.nombre) === tag);
  return hit?.id || null;
}
async function upsertSesiones(rows) {
  const exist = await db.sesiones.toArray();
  const seen = new Set(exist.map((e) => `${e.clienteId}|${e.inicioUtc}`));
  const nuevos = rows.filter((e) => !seen.has(`${e.clienteId}|${e.inicioUtc}`));
  if (nuevos.length) await db.sesiones.bulkAdd(nuevos);
  return { inserted: nuevos.length, totalTried: rows.length };
}

export async function resetAutoHorarios() {
  const all = await db.sesiones.toArray();
  const ids = all
    .filter((s) => String(s.nota || "").startsWith("Auto: "))
    .map((s) => s.id);
  if (ids.length) await db.sesiones.bulkDelete(ids);
  return ids.length;
}

export async function ensureHorariosDefault() {
  const rsId = await findClienteId("rs");
  const ppwId = await findClienteId("ppw");
  const premierId = await findClienteId("premier");
  if (!rsId && !ppwId && !premierId) return { inserted: 0, totalTried: 0 };

  const hoy = new Date();
  const baseLunes = mondayOfWeek(hoy); // semana ACTUAL
  const semanas = 12;
  const rows = [];

  for (let w = 0; w < semanas; w++) {
    const lunes = addDays(baseLunes, w * 7);

    // Lunes a viernes: RS 15–18 y PPW 21–23:59
    for (let i = 0; i < 5; i++) {
      const dia = addDays(lunes, i); // lun..vie
      const [y, m, d] = ymdLocal(dia);

      // si el inicio ya pasó hoy, no lo generamos
      const now = new Date();
      const start15 = new Date(y, m - 1, d, 15, 0, 0, 0);
      const start21 = new Date(y, m - 1, d, 21, 0, 0, 0);

      if (rsId && start15 >= now) {
        rows.push({
          clienteId: rsId,
          inicioUtc: mkISOFromLocal(y, m, d, 15, 0),
          finUtc: mkISOFromLocal(y, m, d, 18, 0),
          estado: "planificada",
          nota: "Auto: RS 15-18",
          planId: null,
          creadoEn: Date.now(),
        });
      }
      if (ppwId && start21 >= now) {
        rows.push({
          clienteId: ppwId,
          inicioUtc: mkISOFromLocal(y, m, d, 21, 0),
          finUtc: mkISOFromLocal(y, m, d, 23, 59),
          estado: "planificada",
          nota: "Auto: PPW 21-23:59",
          planId: null,
          creadoEn: Date.now(),
        });
      }
    }

    // Sábado: Premier 20–21 y 22–23
    if (premierId) {
      const sab = addDays(lunes, 5);
      const [y, m, d] = ymdLocal(sab);
      const now = new Date();
      const start20 = new Date(y, m - 1, d, 20, 0, 0, 0);
      const start22 = new Date(y, m - 1, d, 22, 0, 0, 0);

      if (start20 >= now) {
        rows.push({
          clienteId: premierId,
          inicioUtc: mkISOFromLocal(y, m, d, 20, 0),
          finUtc: mkISOFromLocal(y, m, d, 21, 0),
          estado: "planificada",
          nota: "Auto: Premier 20-21",
          planId: null,
          creadoEn: Date.now(),
        });
      }
      if (start22 >= now) {
        rows.push({
          clienteId: premierId,
          inicioUtc: mkISOFromLocal(y, m, d, 22, 0),
          finUtc: mkISOFromLocal(y, m, d, 23, 0),
          estado: "planificada",
          nota: "Auto: Premier 22-23",
          planId: null,
          creadoEn: Date.now(),
        });
      }
    }
  }

  return upsertSesiones(rows);
}
