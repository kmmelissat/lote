import type { ReactNode } from "react";

/** Un globo de diálogo con la voz del monito. */
export function Globo({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`relative inline-block rounded-2xl border-2 border-teal-oscuro bg-superficie px-4 py-2 text-sm font-bold text-teal-oscuro shadow-dura-chica after:absolute after:-bottom-[9px] after:left-6 after:size-4 after:rotate-45 after:border-b-2 after:border-r-2 after:border-teal-oscuro after:bg-superficie ${className}`}
    >
      {children}
    </span>
  );
}
