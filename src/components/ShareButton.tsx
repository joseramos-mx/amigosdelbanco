"use client";

import { useState } from "react";
import { ShareNetwork, Check } from "@phosphor-icons/react";

const SHARE_TITLE = "Banco de Alimentos Durango";
const SHARE_TEXT =
  "Apoya al Banco de Alimentos de Durango. Cada peso se convierte en despensas para quienes más lo necesitan.";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.origin : "";

    // Native share on supported mobile browsers — opens the OS share sheet
    // (WhatsApp, Instagram, Mail, etc.).
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url });
        return;
      } catch {
        // User dismissed the share sheet — fall through to clipboard.
      }
    }

    // Desktop / unsupported fallback: copy to clipboard with brief feedback.
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Permission denied or insecure context — leave the user with nothing
      // to do; in practice both APIs require https or localhost.
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1e3a1e] py-3 text-sm font-bold text-brand-lime transition-opacity hover:opacity-90"
    >
      {copied ? (
        <>
          <Check size={16} weight="bold" />
          ¡Enlace copiado!
        </>
      ) : (
        <>
          <ShareNetwork size={16} weight="bold" />
          Compartir
        </>
      )}
    </button>
  );
}
