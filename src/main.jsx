import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./estilos/globals.css";
import { seedBloquesVitalicios } from "./servicios/seedBloques";
import { db } from "./servicios/db.dexie";

function Root() {
  useEffect(() => {
    (async () => {
      try {
        const seedKey = "seed-bloques-v4";
        if (!localStorage.getItem(seedKey)) {
          await seedBloquesVitalicios();
          localStorage.setItem(seedKey, "1");
        }

        const migKey = "migr-vitalicios-v4";
        if (!localStorage.getItem(migKey)) {
          // Marcar RS y PPW como vitalicios (por alias y por nombre como fallback)
          await db.clientes
            .where("alias")
            .anyOf(["rs", "ppw"])
            .modify((c) => {
              c.vitalicio = true;
            });

          await db.clientes
            .where("nombre")
            .anyOf(["RS", "ppw", "PPW"])
            .modify((c) => {
              c.vitalicio = true;
            });

          // Ajuste de bloques con horaFin "24:00" -> "23:59" para PPW
          const rows = await db.bloques
            .where({ etiqueta: "PPW (vitalicio)" })
            .toArray();

          for (const r of rows) {
            if (r.horaFin === "24:00") {
              await db.bloques.update(r.id, { horaFin: "23:59" });
            }
          }

          localStorage.setItem(migKey, "1");
        }
      } catch (err) {
        console.error("Init error:", err);
      }
    })();
  }, []);

  return <App />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
