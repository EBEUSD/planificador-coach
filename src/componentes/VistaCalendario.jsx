import { useEffect, useMemo, useState, useCallback } from "react";
import estilos from "../estilos/Calendario.module.css";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import ModalSesion from "./ModalSesion";
import { listarClientes } from "../servicios/clientes.dexie";
import { listarSesionesCliente } from "../servicios/sesiones.dexie";
import { expandirBloquesEnRango } from "../servicios/recurrencia.dexie";
import { agregarExcepcion } from "../servicios/excepciones.dexie";

const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function VistaCalendario() {
  const [clientes, setClientes] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [slot, setSlot] = useState(null);
  const [rango, setRango] = useState({ ini: null, fin: null });

  const cargar = useCallback(async (ini, fin) => {
    const cs = await listarClientes();
    setClientes(cs);
    const evs = [];
    for (const c of cs) {
      const ss = await listarSesionesCliente(c.id);
      ss.forEach((s) =>
        evs.push({
          id: s.id,
          title: c.nombre,
          start: new Date(s.inicioUtc),
          end: new Date(s.finUtc),
        })
      );
    }
    const bloq = await expandirBloquesEnRango(ini, fin);
    setEventos([...evs, ...bloq]);
  }, []);

  useEffect(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = new Date(start);
    end.setDate(end.getDate() + 41);
    setRango({ ini: start, fin: end });
    cargar(start, end);
  }, [cargar]);

  const onCreada = (ev) => setEventos((prev) => [...prev, ev]);

  function onRangeChange(r) {
    let ini, fin;
    if (r.start && r.end) {
      ini = r.start;
      fin = r.end;
    } else if (Array.isArray(r)) {
      ini = r[0];
      fin = r[r.length - 1];
    } else {
      const now = new Date();
      ini = startOfWeek(now, { weekStartsOn: 1 });
      fin = new Date(ini);
      fin.setDate(fin.getDate() + 41);
    }
    setRango({ ini, fin });
    cargar(ini, fin);
  }

  async function onSelectEvent(ev) {
    if (ev.meta && ev.meta.tipo === "bloque") {
      const ok = confirm("¿Eliminar esta hora de este bloque para esta fecha?");
      if (!ok) return;
      await agregarExcepcion({
        bloqueId: ev.meta.bloqueId,
        fechaISO: ev.meta.fechaISO,
        desdeMin: ev.meta.desdeMin,
        hastaMin: ev.meta.hastaMin,
      });
      const bloq = await expandirBloquesEnRango(rango.ini, rango.fin);
      const base = eventos.filter((x) => !(x.meta && x.meta.tipo === "bloque"));
      setEventos([...base, ...bloq]);
    }
  }

  return (
    <div className={estilos.wrapper}>
      <Calendar
        culture="es"
        localizer={localizer}
        events={eventos}
        defaultView="week"
        step={60}
        timeslots={1}
        selectable
        onSelectSlot={(info) => {
          setSlot(info);
          setAbierto(true);
        }}
        onRangeChange={onRangeChange}
        onSelectEvent={onSelectEvent}
        style={{ height: "calc(100vh - 220px)" }}
      />
      {abierto && (
        <ModalSesion
          slot={slot}
          clientes={clientes}
          onClose={() => setAbierto(false)}
          onCreada={onCreada}
        />
      )}
    </div>
  );
}
