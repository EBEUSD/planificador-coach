import { db } from "./db.dexie";

export async function crearCliente(data) {
  return db.clientes.add({
    nombre: data.nombre || "",
    alias: data.alias || "",
    tz: data.tz || "America/Argentina/Buenos_Aires",
    disponibles: Number(data.disponibles ?? 0),
    reservadas: Number(data.reservadas ?? 0),
    usadas: Number(data.usadas ?? 0),
    vitalicio: Boolean(data.vitalicio ?? false),
  });
}

export async function borrarCliente(id) {
  return db.clientes.delete(Number(id));
}

export async function listarClientes() {
  return db.clientes.orderBy("nombre").toArray();
}

export async function contarClientes() {
  return db.clientes.count();
}

export async function obtenerCliente(id) {
  return db.clientes.get(Number(id));
}
