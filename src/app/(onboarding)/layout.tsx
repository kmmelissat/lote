import type { Metadata } from "next";

// Crear el negocio no tiene nada que indexar. Es una pantalla completa y sin el panel de marca de entrar: la persona ya está adentro.
export const metadata: Metadata = { robots: { index: false, follow: true } };

// El escritorio de la dueña: crema con puntitos, y encima la hoja del cuaderno
export default function OnboardingLayout({ children }: LayoutProps<"/">) {
  return <div className="min-h-dvh overflow-x-clip bg-crema bg-[radial-gradient(var(--color-teal-oscuro)_1px,transparent_1.5px)] bg-[length:22px_22px]">{children}</div>;
}
