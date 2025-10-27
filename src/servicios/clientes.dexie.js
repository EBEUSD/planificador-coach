import { db } from './db.dexie'

export async function crearCliente({ nombre, alias, zonaHoraria, notas = '' }) {
  return await db.clientes.add({ nombre, alias, zonaHoraria, notas, activo: true, creadoEn: new Date() })
}

export async function listarClientes() {
  return await db.clientes.toArray()
}

export async function obtenerCliente(id) {
  return await db.clientes.get(Number(id))
}
