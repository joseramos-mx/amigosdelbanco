import { redirect } from "next/navigation";
import { paseActual } from "@/lib/run/staff";

export default async function StaffRouter() {
  const pase = await paseActual();
  
  if (!pase) redirect("/run/login");

  if (pase.rol === "admin") redirect("/run/staff/admin");
  if (pase.rol === "vendedor") redirect("/run/staff/vendedor");
  if (pase.rol === "escaner") redirect("/run/staff/escaner");

  redirect("/run/login");
}
