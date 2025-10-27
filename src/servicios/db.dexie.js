import Dexie from "dexie";

export const db = new Dexie("planificadorCoach");
db.version(1).stores({
  clientes: "++id, nombre, alias, zonaHoraria, activo",
  planes:
    "++id, clienteId, etiqueta, sesionesTotales, sesionesRestantes, esVitalicio, estado",
  sesiones: "++id, clienteId, planId, inicioUtc, finUtc, estado",
});
db.version(2).stores({ bloques: "++id, clienteId, dias" });
db.version(3).stores({ bloques_excepciones: "++id, bloqueId, fechaISO" });
db.version(4).stores({ disponibilidades: "++id, clienteId" });
