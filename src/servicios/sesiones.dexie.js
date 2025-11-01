// src/servicios/sesiones.dexie.js
import { db } from "./db.dexie";

export async function listarSesiones() {
  return db.sesiones.toArray();
}

export async function crearSesion({ clienteId, inicioUtc, finUtc, nota = "" }) {
  const sesion = {
    clienteId: Number(clienteId),
    inicioUtc: new Date(inicioUtc).toISOString(),
    finUtc: new Date(finUtc).toISOString(),
    estado: "pendiente",
    nota,
    planId: null,
    creadoEn: Date.now(),
  };
  return db.sesiones.add(sesion);
}

export async function actualizarSesion(id, patch) {
  return db.sesiones.update(id, patch);
}

export async function marcarTomada(id) {
  return db.sesiones.update(id, { estado: "tomada" });
}

export async function eliminarSesion(id) {
  return db.sesiones.delete(id);
}

export async function hayChoque(inicioUtc, finUtc, clienteId = null) {
  const i = new Date(inicioUtc).getTime();
  const f = new Date(finUtc).getTime();

  const coll = clienteId
    ? db.sesiones.where("clienteId").equals(Number(clienteId))
    : db.sesiones.toCollection();

  const list = await coll.toArray();

  return list.some((s) => {
    const si = new Date(s.inicioUtc).getTime();
    const sf = new Date(s.finUtc).getTime();
    return Math.max(i, si) < Math.min(f, sf);
  });
}
