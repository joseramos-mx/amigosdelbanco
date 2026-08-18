"use client";

export default function InfoDialog({
    abierto,
    titulo,
    mensaje,
    onAceptar,
}: {
    abierto: boolean;
    titulo: string;
    mensaje: string;
    onAceptar: () => void;
}) {
    if (!abierto) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            onClick={onAceptar}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                className="w-full max-w-sm rounded-2xl border border-white/10 bg-run-card p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="font-schabo text-2xl uppercase leading-none text-white">{titulo}</h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/50">{mensaje}</p>
                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        onClick={onAceptar}
                        className="rounded-md bg-run-amber px-5 py-2 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85"
                    >
                        Aceptar
                    </button>
                </div>
            </div>
        </div>
    );
}