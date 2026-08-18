import { logoutAction } from "./logoutAction";

export default function BotonSalir() {
  return (
    <form action={logoutAction}>
      <button 
        type="submit"
        className="rounded bg-run-amber px-4 py-2 font-geist-mono text-[10px] uppercase tracking-widest text-black transition hover:opacity-90"
      >
        Cerrar Sesión
      </button>
    </form>
  );
}
