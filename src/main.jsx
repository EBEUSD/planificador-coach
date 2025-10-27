import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./estilos/globals.css";
import { seedBloquesVitalicios } from "./servicios/seedBloques";
import { db } from "./servicios/db.dexie";

function Root() {
  useEffect(() => {
    const k = "seed-bloques-v1";
    if (!localStorage.getItem(k)) {
      seedBloquesVitalicios().then(() => localStorage.setItem(k, "1"));
    }
    const m = "migr-ppw-2359";
    if (!localStorage.getItem(m)) {
      (async () => {
        const rows = await db.bloques
          .where({ etiqueta: "PPW (vitalicio)" })
          .toArray();
        for (const r of rows) {
          if (r.horaFin === "24:00")
            await db.bloques.update(r.id, { horaFin: "23:59" });
        }
        localStorage.setItem(m, "1");
      })();
    }
  }, []);
  return <App />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
