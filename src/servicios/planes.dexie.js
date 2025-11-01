import { db } from "./db.dexie";

export async function asignarPlan(
  clienteId,
  { etiqueta, sesiones, vitalicio }
) {
  return db.transaction("rw", db.clientes, db.planes, async () => {
    const idNum = Number(clienteId);
    const cli = await db.clientes.get(idNum);
    if (!cli) throw new Error("cliente inexistente");
    const planId = await db.planes.add({
      clienteId: idNum,
      etiqueta,
      sesiones: Number(sesiones || 0),
      vitalicio: Boolean(vitalicio),
      fecha: new Date().toISOString(),
    });
    if (!vitalicio && Number(sesiones) > 0) {
      await db.clientes.update(idNum, {
        disponibles: Number(cli.disponibles || 0) + Number(sesiones),
      });
    }
    return planId;
  });
}

export async function crearPlan(clienteId, data) {
  return asignarPlan(clienteId, data);
}

export async function listarPlanesPorCliente(clienteId) {
  return db.planes
    .where("clienteId")
    .equals(Number(clienteId))
    .reverse()
    .sortBy("fecha");
}

function normalizarPlan(p) {
  if (!p) return null;
  return { ...p, esVitalicio: Boolean(p.vitalicio) };
}

export async function elegirPlanParaAsignar(clienteId) {
  const planes = await listarPlanesPorCliente(clienteId);
  const noVitalicio = planes.find(
    (p) => !p.vitalicio && Number(p.sesiones) > 0
  );
  if (noVitalicio) return normalizarPlan(noVitalicio);
  const vitalicio = planes.find((p) => p.vitalicio);
  return normalizarPlan(vitalicio) || null;
}

export async function ajustarReservadas(clienteId, delta) {
  const idNum = Number(clienteId);
  await db.clientes
    .where("id")
    .equals(idNum)
    .modify((c) => {
      const cur = typeof c.reservadas === "number" ? c.reservadas : 0;
      c.reservadas = Math.max(0, cur + Number(delta));
    });
}

export async function ajustarDisponibles(clienteId, delta) {
  const idNum = Number(clienteId);
  await db.clientes
    .where("id")
    .equals(idNum)
    .modify((c) => {
      const cur = typeof c.disponibles === "number" ? c.disponibles : 0;
      c.disponibles = Math.max(0, cur + Number(delta));
    });
}

export async function reservarUnidad(clienteId) {
  const idNum = Number(clienteId);
  const cli = await db.clientes.get(idNum);
  if (!cli) throw new Error("cliente inexistente");
  if (cli.vitalicio) {
    await ajustarReservadas(idNum, +1);
    return;
  }
  if (Number(cli.disponibles || 0) <= 0) throw new Error("sin disponibles");
  await db.clientes.update(idNum, {
    disponibles: Number(cli.disponibles) - 1,
    reservadas: Number(cli.reservadas || 0) + 1,
  });
}

export async function revertirReserva(clienteId) {
  const idNum = Number(clienteId);
  const cli = await db.clientes.get(idNum);
  if (!cli) return;
  if (cli.vitalicio) {
    await ajustarReservadas(idNum, -1);
    return;
  }
  await db.clientes.update(idNum, {
    disponibles: Number(cli.disponibles || 0) + 1,
    reservadas: Math.max(0, Number(cli.reservadas || 0) - 1),
  });
}

export async function moverReservaAUsada(clienteId, delta = 1) {
  const idNum = Number(clienteId);
  await db.clientes
    .where("id")
    .equals(idNum)
    .modify((c) => {
      const r = typeof c.reservadas === "number" ? c.reservadas : 0;
      const u = typeof c.usadas === "number" ? c.usadas : 0;
      const d = Number(delta);
      c.reservadas = Math.max(0, r - d);
      c.usadas = Math.max(0, u + d);
    });
}

export async function revertirUsada(clienteId, delta = 1) {
  const idNum = Number(clienteId);
  const cli = await db.clientes.get(idNum);
  if (!cli) return;
  await db.clientes.update(idNum, {
    usadas: Math.max(0, Number(cli.usadas || 0) - Number(delta)),
    disponibles: Number(cli.disponibles || 0) + Number(delta),
  });
}

export async function saldoCliente(clienteId) {
  const cli = await db.clientes.get(Number(clienteId));
  if (!cli) return { restantes: 0, tieneVitalicio: false };
  return {
    restantes: Number(cli.disponibles || 0),
    tieneVitalicio: Boolean(cli.vitalicio),
  };
}

export async function ajustarRestantes(clienteId, delta) {
  return ajustarDisponibles(clienteId, delta);
}
