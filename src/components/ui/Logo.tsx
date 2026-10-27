import { textos } from "@/lib/textos";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-lg bg-teal text-lg font-bold text-white"
      >
        L
      </span>
      <span className="text-xl font-bold">{textos.nombre}</span>
    </span>
  );
}
