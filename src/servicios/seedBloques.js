import { crearCliente, listarClientes } from "./clientes.dexie";
import { crearPlan } from "./planes.dexie";
import { crearBloque } from "./bloques.dexie";

async function ensureCliente(nombre, alias) {
  const all = await listarClientes();
  let c = all.find((x) => x.nombre === nombre);
  if (!c) {
    const id = await crearCliente({
      nombre,
      alias,
      zonaHoraria: "America/Argentina/Buenos_Aires",
      notas: "",
    });
    c = { id, nombre, alias, zonaHoraria: "America/Argentina/Buenos_Aires" };
  }
  return c;
}

export async function seedBloquesVitalicios() {
  const rs = await ensureCliente("RS", "@rs");
  const ppw = await ensureCliente("ppw", "@ppw");

  const diasHabiles = [1, 2, 3, 4, 5];
  const sabado = [6];

  await crearPlan({
    clienteId: rs.id,
    etiqueta: "Vitalicio RS",
    sesionesTotales: null,
    esVitalicio: true,
  });
  await crearPlan({
    clienteId: ppw.id,
    etiqueta: "Vitalicio PPW",
    sesionesTotales: null,
    esVitalicio: true,
  });

  await crearBloque({
    clienteId: rs.id,
    etiqueta: "RS (vitalicio)",
    dias: diasHabiles,
    horaInicio: "15:00",
    horaFin: "18:00",
    zonaHoraria: "America/Argentina/Buenos_Aires",
    esVitalicio: true,
    split: "hour",
  });
  await crearBloque({
    clienteId: ppw.id,
    etiqueta: "PPW (vitalicio)",
    dias: diasHabiles,
    horaInicio: "21:00",
    horaFin: "23:59",
    zonaHoraria: "America/Argentina/Buenos_Aires",
    esVitalicio: true,
    split: "hour",
  });

  await crearBloque({
    clienteId: rs.id,
    etiqueta: "Premier",
    dias: sabado,
    horaInicio: "20:00",
    horaFin: "21:00",
    zonaHoraria: "America/Argentina/Buenos_Aires",
    split: "hour",
  });
  await crearBloque({
    clienteId: rs.id,
    etiqueta: "Premier",
    dias: sabado,
    horaInicio: "22:00",
    horaFin: "23:00",
    zonaHoraria: "America/Argentina/Buenos_Aires",
    split: "hour",
  });
}
