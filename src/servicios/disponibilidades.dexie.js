import { db } from "./db.dexie";

if (!db.tables.find((t) => t.name === "disponibilidades")) {
  db.version(4).stores({ disponibilidades: "++id, clienteId" });
}

export async function guardarDisponibilidad({
  clienteId,
  zonaHoraria,
  dias,
  rangos,
}) {
  const prev = await db.disponibilidades
    .where({ clienteId: Number(clienteId) })
    .first();
  const payload = {
    clienteId: Number(clienteId),
    zonaHoraria,
    dias,
    rangos,
    actualizadoEn: new Date(),
  };
  if (prev) {
    await db.disponibilidades.update(prev.id, payload);
    return prev.id;
  }
  return await db.disponibilidades.add(payload);
}

export async function obtenerDisponibilidad(clienteId) {
  return await db.disponibilidades
    .where({ clienteId: Number(clienteId) })
    .first();
}
