import { db } from "./db.dexie";

export async function crearBloque({
  clienteId,
  etiqueta,
  dias,
  horaInicio,
  horaFin,
  zonaHoraria,
  esVitalicio = true,
  split = "hour",
  notas = "",
}) {
  return await db
    .table("bloques")
    ?.add?.({
      clienteId: Number(clienteId),
      etiqueta,
      dias,
      horaInicio,
      horaFin,
      zonaHoraria,
      esVitalicio,
      split,
      notas,
      habilitado: true,
      creadoEn: new Date(),
    });
}

if (!db.tables.find((t) => t.name === "bloques")) {
  db.version(2).stores({ bloques: "++id, clienteId, dias" });
}
