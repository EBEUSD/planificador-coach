import { db } from "./db.dexie";

export async function crearPlan({
  clienteId,
  etiqueta,
  sesionesTotales,
  esVitalicio = false,
}) {
  const restantes =
    esVitalicio || sesionesTotales == null ? null : Number(sesionesTotales);
  return await db.planes.add({
    clienteId: Number(clienteId),
    etiqueta,
    sesionesTotales: esVitalicio ? null : Number(sesionesTotales ?? 0),
    sesionesRestantes: restantes,
    esVitalicio,
    estado: "activo",
    creadoEn: new Date(),
  });
}

export async function listarPlanesPorCliente(clienteId) {
  return await db.planes.where({ clienteId: Number(clienteId) }).toArray();
}

export async function ajustarRestantes(planId, delta) {
  const plan = await db.planes.get(Number(planId));
  if (!plan || plan.esVitalicio) return;
  const next = Math.max(0, (plan.sesionesRestantes ?? 0) + delta);
  await db.planes.update(plan.id, { sesionesRestantes: next });
}

export async function saldoCliente(clienteId) {
  const planes = await db.planes
    .where({ clienteId: Number(clienteId) })
    .toArray();
  const restantes = planes
    .filter((p) => !p.esVitalicio && p.estado === "activo")
    .reduce((acc, p) => acc + (p.sesionesRestantes ?? 0), 0);
  const tieneVitalicio = planes.some(
    (p) => p.esVitalicio && p.estado === "activo"
  );
  return { restantes, tieneVitalicio };
}

export async function recargarSesiones({ clienteId, cantidad, etiqueta }) {
  const cant = Math.max(0, Number(cantidad || 0));
  if (!cant) return null;
  const planes = await db.planes
    .where({ clienteId: Number(clienteId) })
    .toArray();
  const activos = planes.filter((p) => !p.esVitalicio && p.estado === "activo");
  const target = activos.sort(
    (a, b) => new Date(b.creadoEn) - new Date(a.creadoEn)
  )[0];
  if (target) {
    const tot = (target.sesionesTotales ?? 0) + cant;
    const rest = (target.sesionesRestantes ?? 0) + cant;
    await db.planes.update(target.id, {
      sesionesTotales: tot,
      sesionesRestantes: rest,
    });
    return target.id;
  }
  return await crearPlan({
    clienteId,
    etiqueta: etiqueta || `Recarga x${cant}`,
    sesionesTotales: cant,
    esVitalicio: false,
  });
}

/** Devuelve el plan a consumir para una sesión:
 *  - Prioriza packs con saldo (>0), el más antiguo primero.
 *  - Si no hay packs con saldo y existe vitalicio: devuelve el vitalicio.
 *  - Si no hay nada: null.
 */
export async function elegirPlanParaAsignar(clienteId) {
  const planes = await listarPlanesPorCliente(clienteId);
  const packs = planes
    .filter(
      (p) =>
        !p.esVitalicio &&
        p.estado === "activo" &&
        (p.sesionesRestantes ?? 0) > 0
    )
    .sort((a, b) => new Date(a.creadoEn) - new Date(b.creadoEn)); // consumir el más viejo
  if (packs.length) return packs[0];
  const vit = planes.find((p) => p.esVitalicio && p.estado === "activo");
  return vit || null;
}
