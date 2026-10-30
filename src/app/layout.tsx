import type { Metadata, Viewport } from "next";
import { Fredoka, Plus_Jakarta_Sans } from "next/font/google";
import { IosGuard } from "@/components/IosGuard";
import { ConfirmarProvider } from "@/components/ui/Confirmar";
import { ToastProvider } from "@/components/ui/Toast";
import { urlSitio } from "@/lib/sitio";
import { textos } from "@/lib/textos";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// Solo para la palabra del logo: gruesa y redondeada, como un sticker
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(urlSitio),
  title: { default: textos.nombre, template: `%s · ${textos.nombre}` },
  description: textos.descripcion,
  applicationName: textos.nombre,
  openGraph: { siteName: textos.nombre, locale: "es_SV", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#003844",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${jakarta.variable} ${fredoka.variable} h-full antialiased`}>
      <body className="min-h-full">
        <IosGuard />
        <ToastProvider>
          <ConfirmarProvider>{children}</ConfirmarProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
