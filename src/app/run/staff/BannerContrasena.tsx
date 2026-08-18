"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BannerContrasena({ requiereCambio }: { requiereCambio: boolean }) {
  const pathname = usePathname();

  // Si no requiere cambio o ya estamos en la página de cambio de contraseña, no mostrar el banner
  if (!requiereCambio || pathname === "/run/staff/perfil/contrasena") {
    return null;
  }

  return (
    <div className="bg-run-amber px-4 py-3 text-black">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">
          Por seguridad, necesitas cambiar tu contraseña temporal para continuar.
        </p>
        <Link
          href="/run/staff/perfil/contrasena"
          className="rounded-md bg-black px-4 py-2 text-xs uppercase tracking-wide text-run-amber transition-opacity hover:opacity-85"
        >
          Cambiar contraseña
        </Link>
      </div>
    </div>
  );
}
