import Dexie from "dexie";

export const db = new Dexie("planificador-coach");

db.version(4)
  .stores({
    clientes:
      "++id,nombre,alias,tz,disponibles,reservadas,usadas,vitalicio,createdAt",
    planes: "++id,clienteId,etiqueta,sesiones,vitalicio,fecha",
    sesiones: "++id,clienteId,inicioUtc,finUtc,estado,nota,planId,creadoEn",
    bloques: "++id,start,end,creadoEn",
  })
  .upgrade(async (tx) => {
    await tx
      .table("clientes")
      .toCollection()
      .modify((c) => {
        if (typeof c.disponibles !== "number") c.disponibles = 0;
        if (typeof c.reservadas !== "number") c.reservadas = 0;
        if (typeof c.usadas !== "number") c.usadas = 0;
        if (!c.tz) c.tz = "America/Argentina/Buenos_Aires";
        if (typeof c.vitalicio !== "boolean") c.vitalicio = false;
        if (typeof c.createdAt !== "number") c.createdAt = Date.now();
      });
  });
