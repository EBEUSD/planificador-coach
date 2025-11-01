import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./estilos/globals.css";
import { db } from "./servicios/db.dexie";
import {
  ensureHorariosDefault,
  resetAutoHorarios,
} from "./servicios/seedHorarios";

function Root() {
  useEffect(() => {
    (async () => {
      try {
        if (typeof db.open === "function") await db.open();

        const need = [
          { nombre: "RS", alias: "rs" },
          { nombre: "PPW", alias: "ppw" },
          { nombre: "Premier", alias: "premier" },
        ];
        const all = await db.clientes.toArray();
        const norm = (s) =>
          String(s || "")
            .toLowerCase()
            .replace(/^@+/, "")
            .trim();
        for (const n of need) {
          const hit = all.find(
            (c) =>
              norm(c.alias) === n.alias || norm(c.nombre) === norm(n.nombre)
          );
          if (!hit) {
            await db.clientes.add({
              nombre: n.nombre,
              alias: n.alias,
              tz: "America/Argentina/Buenos_Aires",
              disponibles: 0,
              reservadas: 0,
              usadas: 0,
              vitalicio: true,
              createdAt: Date.now(),
            });
          }
        }

        const FIX_KEY = "ba-only-auto-seed-v4";
        if (!localStorage.getItem(FIX_KEY)) {
          await resetAutoHorarios();
          localStorage.setItem(FIX_KEY, "1");
        }

        await ensureHorariosDefault();
      } catch (err) {
        console.error("Init falló:", err);
      }
    })();
  }, []);

  return <App />;
}

createRoot(document.getElementById("root")).render(<Root />);
