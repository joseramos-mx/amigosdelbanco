import { logoutAction } from "./logoutAction";

export default function BotonSalir() {
  return (
    <form action={logoutAction}>
      <button 
        type="submit"
        className="font-geist-mono text-[10px] uppercase tracking-[0.16em] text-white/40 hover:text-red-400 transition-colors"
      >
        Cerrar Sesión
      </button>
    </form>
  );
}
