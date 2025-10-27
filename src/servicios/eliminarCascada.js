import { db } from "./db.dexie";

export async function eliminarClienteCascada(clienteId) {
  const id = Number(clienteId);
  const planes = await db.planes.where({ clienteId: id }).toArray();
  for (const p of planes) await db.planes.delete(p.id);
  const sesiones = await db.sesiones.where({ clienteId: id }).toArray();
  for (const s of sesiones) await db.sesiones.delete(s.id);
  const bloques = await db.bloques.where({ clienteId: id }).toArray();
  for (const b of bloques) {
    const excs = await db.bloques_excepciones
      .where({ bloqueId: b.id })
      .toArray();
    for (const e of excs) await db.bloques_excepciones.delete(e.id);
    await db.bloques.delete(b.id);
  }
  const disp =
    (await db.disponibilidades.where({ clienteId: id }).toArray?.()) || [];
  for (const d of disp) await db.disponibilidades.delete(d.id);
  await db.clientes.delete(id);
}
