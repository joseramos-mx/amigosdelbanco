"use client";

type Props = {
    abierto: boolean;
    titulo: string;
    mensaje: string;
    textoConfirmar?: string;
    textoCancelar?: string;
    peligroso?: boolean;
    cargando?: boolean;
    onConfirmar: () => void;
    onCancelar: () => void;
};

export default function ConfirmDialog({
    abierto,
    titulo,
    mensaje,
    textoConfirmar = "Confirmar",
    textoCancelar = "Cancelar",
    peligroso = false,
    cargando = false,
    onConfirmar,
    onCancelar,
}: Props) {
    if (!abierto) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            onClick={onCancelar}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                className="w-full max-w-sm rounded-2xl border border-white/10 bg-run-card p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="font-schabo text-2xl uppercase leading-none text-white">
                    {titulo}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/50">{mensaje}</p>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancelar}
                        disabled={cargando}
                        className="rounded-md border border-white/15 px-4 py-2 text-sm uppercase tracking-wide text-white/70 transition-colors hover:border-white/30 disabled:opacity-50"
                    >
                        {textoCancelar}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirmar}
                        disabled={cargando}
                        className={`rounded-md px-4 py-2 text-sm uppercase tracking-wide transition-opacity hover:opacity-85 disabled:opacity-50 ${peligroso ? "bg-red-500 text-white" : "bg-run-amber text-black"
                            }`}
                    >
                        {cargando ? "…" : textoConfirmar}
                    </button>
                </div>
            </div>
        </div>
    );
}