// src/servicios/sesiones.dexie.js
import { db } from "./db.dexie";

const nz = (n) => (typeof n === "number" && !isNaN(n) ? n : 0);

export async function listarSesiones() {
  return db.sesiones.orderBy("inicioUtc").toArray();
}

export async function hayChoque(clienteId, inicio, fin) {
  const ns = new Date(inicio).getTime();
  const ne = new Date(fin).getTime();
  const rows = await db.sesiones
    .where("clienteId")
    .equals(Number(clienteId))
    .toArray();
  return rows.some((r) => {
    const rs = new Date(r.inicioUtc).getTime();
    const re = new Date(r.finUtc).getTime();
    return ns < re && ne > rs;
  });
}

export async function crearSesion({
  clienteId,
  inicioUtc,
  finUtc,
  nota = "",
  planId = null,
}) {
  return db.transaction("rw", db.sesiones, db.clientes, async () => {
    const cli = await db.clientes.get(Number(clienteId));
    if (!cli) throw new Error("Cliente inexistente");
    const sesId = await db.sesiones.add({
      clienteId: Number(clienteId),
      inicioUtc: new Date(inicioUtc).toISOString(),
      finUtc: new Date(finUtc).toISOString(),
      estado: "planificada",
      nota,
      planId,
      creadoEn: Date.now(),
    });
    if (!cli.vitalicio) {
      await db.clientes.update(cli.id, {
        disponibles: nz(cli.disponibles) - 1,
        reservadas: nz(cli.reservadas) + 1,
        usadas: nz(cli.usadas),
      });
    }
    return sesId;
  });
}

export async function actualizarSesion(id, data) {
  await db.sesiones.update(Number(id), data);
}

export async function marcarTomada(id) {
  return db.transaction("rw", db.sesiones, db.clientes, async () => {
    const ses = await db.sesiones.get(Number(id));
    if (!ses) throw new Error("Sesión inexistente");
    if (ses.estado === "tomada") return;
    const cli = await db.clientes.get(Number(ses.clienteId));
    await db.sesiones.update(ses.id, { estado: "tomada" });
    if (cli && !cli.vitalicio) {
      const wasPlanificada = ses.estado === "planificada";
      await db.clientes.update(cli.id, {
        disponibles: nz(cli.disponibles),
        reservadas: nz(cli.reservadas) - (wasPlanificada ? 1 : 0),
        usadas: nz(cli.usadas) + 1,
      });
    }
  });
}

export async function eliminarSesion(id) {
  return db.transaction("rw", db.sesiones, db.clientes, async () => {
    const ses = await db.sesiones.get(Number(id));
    if (!ses) return;
    const cli = await db.clientes.get(Number(ses.clienteId));
    await db.sesiones.delete(ses.id);
    if (cli && !cli.vitalicio) {
      if (ses.estado === "planificada") {
        await db.clientes.update(cli.id, {
          disponibles: nz(cli.disponibles) + 1,
          reservadas: nz(cli.reservadas) - 1,
          usadas: nz(cli.usadas),
        });
      } else if (ses.estado === "tomada") {
        await db.clientes.update(cli.id, {
          disponibles: nz(cli.disponibles),
          reservadas: nz(cli.reservadas),
          usadas: nz(cli.usadas) - 1,
        });
      }
    }
  });
}
