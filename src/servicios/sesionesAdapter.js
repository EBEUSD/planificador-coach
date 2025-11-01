import { useEffect, useState } from "react";
import { db } from "./db.dexie";

function mapSesionesToEvents(sesiones, clientes) {
  const titleById = new Map(
    clientes.map((c) => [c.id, (c.alias || c.nombre || "Sesión").toUpperCase()])
  );
  return sesiones.map((s) => ({
    id: s.id,
    title: titleById.get(s.clienteId) || "SESIÓN",
    start: new Date(s.inicioUtc),
    end: new Date(s.finUtc),
  }));
}

export async function cargarEventosCalendario() {
  const [sesiones, clientes] = await Promise.all([
    db.sesiones.toArray(),
    db.clientes.toArray(),
  ]);
  return mapSesionesToEvents(sesiones, clientes);
}

export function useEventosCalendario() {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    (async () => {
      setEvents(await cargarEventosCalendario());
    })();
  }, []);
  return events;
}
