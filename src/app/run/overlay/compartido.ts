/** Nombre a mostrar. `privado` => "Marina G." */
export function nombreVisible(nombre: string | null, privado = false): string {
  const limpio = (nombre ?? "").trim().replace(/\s+/g, " ");
  if (!limpio) return "Donador anónimo";
  if (!privado) return limpio;
  const [primero, segundo] = limpio.split(" ");
  return segundo ? `${primero} ${segundo[0].toUpperCase()}.` : primero;
}

/** "hace 5 minutos", "hace 1 hora", "hace 3 días"… */
export function hace(iso: string, ahoraMs: number): string {
  const seg = Math.max(0, Math.floor((ahoraMs - Date.parse(iso)) / 1000));
  if (seg < 45) return "hace un momento";
  const min = Math.round(seg / 60);
  if (min < 60) return `hace ${min} ${min === 1 ? "minuto" : "minutos"}`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} ${h === 1 ? "hora" : "horas"}`;
  const d = Math.round(h / 24);
  if (d < 30) return `hace ${d} ${d === 1 ? "día" : "días"}`;
  const m = Math.round(d / 30);
  if (m < 12) return `hace ${m} ${m === 1 ? "mes" : "meses"}`;
  const a = Math.round(m / 12);
  return `hace ${a} ${a === 1 ? "año" : "años"}`;
}
