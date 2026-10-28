import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ConfirmarProvider } from "@/components/ui/Confirmar";
import { ToastProvider } from "@/components/ui/Toast";
import { textos } from "@/lib/textos";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: { default: textos.nombre, template: `%s · ${textos.nombre}` },
  description: textos.descripcion,
};

export const viewport: Viewport = {
  themeColor: "#003844",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ToastProvider>
          <ConfirmarProvider>{children}</ConfirmarProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
