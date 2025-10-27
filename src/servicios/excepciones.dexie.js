import { db } from "./db.dexie";

export async function agregarExcepcion({
  bloqueId,
  fechaISO,
  desdeMin = null,
  hastaMin = null,
}) {
  return await db
    .table("bloques_excepciones")
    ?.add?.({
      bloqueId: Number(bloqueId),
      fechaISO,
      desdeMin,
      hastaMin,
      creadoEn: new Date(),
    });
}

export async function listarExcepcionesPorBloqueYFecha(bloqueId, fechaISO) {
  const all = await db
    .table("bloques_excepciones")
    .where({ bloqueId: Number(bloqueId) })
    .toArray();
  return all.filter((e) => e.fechaISO === fechaISO);
}

if (!db.tables.find((t) => t.name === "bloques_excepciones")) {
  db.version(3).stores({ bloques_excepciones: "++id, bloqueId, fechaISO" });
}
