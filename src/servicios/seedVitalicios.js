import { db } from "./db.dexie";
import { crearCliente, listarClientes } from "./clientes.dexie";

async function upsertCliente({ nombre, alias, vitalicio = true }) {
  const lista = await listarClientes();
  let cli = lista.find((c) => (c.nombre || "").toLowerCase() === nombre.toLowerCase());
  if (!cli) {
    const id = await crearCliente({ nombre, alias, vitalicio, disponibles: 0 });
    return id;
  }
  await db.clientes.update(cli.id, { vitalicio: true });
  return cli.id;
}

function sameHour(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate() &&
    a.getHours() === b.getHours()
  );
}

async function crearSiNoExiste(clienteId, start, end) {
  const existentes = await db.sesiones.where("clienteId").equals(Number(clienteId)).toArray();
  const ya = existentes.some((s) => sameHour(new Date(s.inicioUtc), start));
  if (ya) return;
  await db.sesiones.add({
    clienteId: Number(clienteId),
    inicioUtc: start.toISOString(),
    finUtc: end.toISOString(),
    estado: "pendiente",
    nota: "",
    creadoEn: Date.now(),
  });
}

async function generarRangoHoras({ clienteId, diasSemana, horaInicio, horaFin, dias = 60 }) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const fin = new Date(base.getTime() + dias * 86400000);

  for (let d = new Date(base); d <= fin; d = new Date(d.getTime() + 86400000)) {
    const dow = d.getDay();
    if (!diasSemana.includes(dow)) continue;

    for (let h = horaInicio; h < horaFin; h++) {
      const start = new Date(d);
      start.setHours(h, 0, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      await crearSiNoExiste(clienteId, start, end);
    }
  }
}

async function generarSabados({ clienteId, horas = [20, 22], semanas = 12 }) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // ir al próximo sábado
  const day = hoy.getDay();
  const delta = (6 - day + 7) % 7;
  let sab = new Date(hoy.getTime() + delta * 86400000);

  for (let w = 0; w < semanas; w++) {
    for (const h of horas) {
      const start = new Date(sab);
      start.setHours(h, 0, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      await crearSiNoExiste(clienteId, start, end);
    }
    sab = new Date(sab.getTime() + 7 * 86400000);
  }
}

export async function seedVitaliciosRestaurar() {
  const rsId = await upsertCliente({ nombre: "RS", alias: "rs", vitalicio: true });
  const ppwId = await upsertCliente({ nombre: "PPW", alias: "ppw", vitalicio: true });

  await generarRangoHoras({ clienteId: rsId, diasSemana: [1, 2, 3, 4, 5], horaInicio: 15, horaFin: 18, dias: 60 });
  await generarRangoHoras({ clienteId: ppwId, diasSemana: [1, 2, 3, 4, 5], horaInicio: 21, horaFin: 24, dias: 60 });
}

export async function seedPremierSabado() {
  const premId = await upsertCliente({ nombre: "Premier", alias: "premier", vitalicio: true });
  await generarSabados({ clienteId: premId, horas: [20, 22], semanas: 12 });
}
