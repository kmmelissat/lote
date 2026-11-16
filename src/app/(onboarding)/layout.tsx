import type { Metadata } from "next";

// Crear el negocio no tiene nada que indexar. Es una pantalla completa y sin el panel de marca de entrar: la persona ya está adentro.
export const metadata: Metadata = { robots: { index: false, follow: true } };

// El escritorio de la dueña: pantalla completa: a la izquierda Punch, a la derecha el formulario
export default function OnboardingLayout({ children }: LayoutProps<"/">) {
  return <div className="min-h-dvh overflow-clip bg-superficie">{children}</div>;
}
