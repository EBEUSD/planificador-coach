import { useEffect, useMemo, useState } from "react";

const QUICK = [
  "America/Argentina/Buenos_Aires",
  "America/Hermosillo",
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "America/Santiago",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Madrid",
  "UTC",
];

function allTimezones() {
  try {
    if (typeof Intl.supportedValuesOf === "function")
      return Intl.supportedValuesOf("timeZone");
  } catch {}
  return QUICK;
}

const SYNONYMS = {
  hermosillo: "America/Hermosillo",
  mexico: "America/Mexico_City",
  cdmx: "America/Mexico_City",
  "buenos aires": "America/Argentina/Buenos_Aires",
  ba: "America/Argentina/Buenos_Aires",
};

export default function TimezoneSelect({ value, onChange, id = "tz" }) {
  const [q, setQ] = useState(value || "");
  const detected = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "";
    }
  }, []);
  const ALL = useMemo(() => {
    const set = new Set([
      ...(detected ? [detected] : []),
      ...allTimezones(),
      ...QUICK,
    ]);
    return Array.from(set);
  }, [detected]);

  const options = useMemo(() => {
    const query = q.toLowerCase().trim();
    const alias = SYNONYMS[query];
    const base = alias ? [alias, ...ALL] : ALL;
    return base.filter((z) => z.toLowerCase().includes(query)).slice(0, 200);
  }, [q, ALL]);

  useEffect(() => {
    setQ(value || "");
  }, [value]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        className="tz-input"
        list={`${id}-list`}
        value={q}
        onChange={(e) => {
          const v = e.target.value;
          setQ(v);
          const norm = SYNONYMS[v.toLowerCase().trim()] || v;
          onChange?.(norm);
        }}
        placeholder="Buscar zona (ej. Hermosillo, México)"
        style={{
          width: "100%",
          background: "#17171a",
          color: "#e8e8e8",
          border: "1px solid #2a2a2e",
          borderRadius: "10px",
          padding: "10px 12px",
        }}
      />
      <datalist id={`${id}-list`}>
        {options.map((z) => (
          <option key={z} value={z} />
        ))}
      </datalist>
    </div>
  );
}
