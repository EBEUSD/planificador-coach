import { db } from "./db.dexie";
import { ajustarRestantes } from "./planes.dexie";

// Crea una sesión y descuenta 1 del plan (si no es vitalicio)
export async function crearSesion({
  clienteId,
  planId = null,
  inicioUtc,
  finUtc,
  nota = "",
}) {
  const id = await db.sesiones.add({
    clienteId: Number(clienteId),
    planId: planId != null ? Number(planId) : null,
    inicioUtc: new Date(inicioUtc).toISOString(),
    finUtc: new Date(finUtc).toISOString(),
    estado: "confirmada",
    nota,
  });
  if (planId != null) await ajustarRestantes(Number(planId), -1);
  return id;
}

export async function crearSesionYDescontar(payload) {
  return await crearSesion(payload);
}

export async function eliminarSesion(id) {
  await db.sesiones.delete(Number(id));
}

export async function listarSesiones() {
  return await db.sesiones.toArray();
}

export async function listarSesionesCliente(clienteId) {
  return await db.sesiones.where({ clienteId: Number(clienteId) }).toArray();
}

export async function listarSesionesEnRango(inicio, fin) {
  const all = await db.sesiones.toArray();
  const i = new Date(inicio);
  const f = new Date(fin);
  return all.filter((s) => {
    const a = new Date(s.inicioUtc);
    const b = new Date(s.finUtc);
    return a < f && i < b;
  });
}


function overlap(a1, a2, b1, b2) {
  return a1 < b2 && b1 < a2;
}

export async function hayChoque({ inicioUtc, finUtc, ignorarSesionId = null }) {
  const i = new Date(inicioUtc);
  const f = new Date(finUtc);
  const sesiones = await db.sesiones.toArray();
  return sesiones.some((s) => {
    if (ignorarSesionId != null && Number(s.id) === Number(ignorarSesionId))
      return false;
    const a = new Date(s.inicioUtc);
    const b = new Date(s.finUtc);
    return overlap(i, f, a, b);
  });
}

