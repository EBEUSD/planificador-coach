import { useEffect, useRef, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import es from "date-fns/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { listarClientes } from "../servicios/clientes.dexie";
import {
  listarSesiones,
  crearSesion,
  eliminarSesion,
  actualizarSesion,
  marcarTomada,
} from "../servicios/sesiones.dexie";

import ModalAsignarSesion from "./ModalAsignarSesion";
import ModalAccionEvento from "./ModalAccionEvento";
import s from "../estilos/Calendario.module.css";

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
  const [events, setEvents] = useState([]);
  const [openAsignar, setOpenAsignar] = useState(false);
  const [slotSel, setSlotSel] = useState(null);
  const [opcionesAsignar, setOpcionesAsignar] = useState([]);
  const [openAccion, setOpenAccion] = useState(false);
  const [eventoActivo, setEventoActivo] = useState(null);
  const calWrapRef = useRef(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [cs, ses] = await Promise.all([listarClientes(), listarSesiones()]);
    setClientes(cs);
    const byId = new Map(cs.map((c) => [Number(c.id), c]));
    const evSes = ses.map((x) => {
      const c = byId.get(Number(x.clienteId));
      const title = (c?.alias || c?.nombre || "Sesión")
        .toString()
        .toUpperCase();
      return {
        id: x.id,
        title,
        start: new Date(x.inicioUtc),
        end: new Date(x.finUtc),
        meta: { ...x },
      };
    });
    setEvents(evSes);
  };

  const abrirAsignar = async (start, end) => {
    setSlotSel({ start, end });
    const opciones = clientes.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      alias: c.alias,
      restantes: Number(c.disponibles || 0),
      tieneVitalicio: Boolean(c.vitalicio),
    }));
    const filtradas = opciones.filter(
      (o) => o.tieneVitalicio || o.restantes > 0
    );
    setOpcionesAsignar(
      filtradas.sort((a, b) => {
        const avA = a.tieneVitalicio ? Infinity : a.restantes;
        const avB = b.tieneVitalicio ? Infinity : b.restantes;
        return avB - avA;
      })
    );
    setOpenAsignar(true);
  };

  const onSelectSlot = ({ start, end }) => {
    const inicio = new Date(start);
    const fin = new Date(inicio.getTime() + 60 * 60 * 1000);
    abrirAsignar(inicio, fin);
  };

  const onSelectEvent = (ev) => {
    setEventoActivo(ev);
    setOpenAccion(true);
  };

  const eventPropGetter = (event) => {
    const estado = event?.meta?.estado;
    if (estado === "tomada") {
      return {
        style: {
          backgroundColor: "#1b7f4d",
          border: "1px solid #32a466",
          color: "#fff",
        },
      };
    }
    if (estado === "cancelada") {
      return {
        style: {
          backgroundColor: "#3a3a3a",
          border: "1px solid #555",
          color: "#ddd",
        },
      };
    }
    return {
      style: {
        backgroundColor: "#1e72ff",
        border: "1px solid #4e90ff",
        color: "#fff",
      },
    };
  };

  const handleAsignarACliente = async (cliente) => {
    if (!slotSel) return;
    await crearSesion({
      clienteId: cliente.id,
      inicioUtc: slotSel.start,
      finUtc: slotSel.end,
      nota: "",
    });
    setOpenAsignar(false);
    setSlotSel(null);
    await loadAll();
  };

  const handleTomar = async () => {
    if (!eventoActivo) return;
    await marcarTomada(eventoActivo.meta.id);
    setOpenAccion(false);
    setEventoActivo(null);
    await loadAll();
  };

  const handleBorrar = async () => {
    if (!eventoActivo) return;
    await eliminarSesion(eventoActivo.meta.id);
    setOpenAccion(false);
    setEventoActivo(null);
    await loadAll();
  };

  const handleNota = async (nota) => {
    if (!eventoActivo) return;
    await actualizarSesion(eventoActivo.meta.id, { nota });
    setOpenAccion(false);
    setEventoActivo(null);
    await loadAll();
  };

  return (
    <div ref={calWrapRef} className={s.wrap}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="week"
        views={["month", "week", "day", "agenda"]}
        step={60}
        timeslots={1}
        selectable
        onSelectSlot={onSelectSlot}
        onSelectEvent={onSelectEvent}
        eventPropGetter={eventPropGetter}
        style={{ height: "calc(100vh - 120px)" }}
        culture="es"
        longPressThreshold={35}
      />

      <ModalAsignarSesion
        open={openAsignar}
        slot={slotSel}
        opciones={opcionesAsignar}
        onAsignar={handleAsignarACliente}
        onClose={() => {
          setOpenAsignar(false);
          setSlotSel(null);
        }}
      />

      <ModalAccionEvento
        open={openAccion}
        evento={eventoActivo}
        onClose={() => {
          setOpenAccion(false);
          setEventoActivo(null);
        }}
        onTomar={handleTomar}
        onBorrar={handleBorrar}
        onNota={handleNota}
      />
    </div>
  );
}
