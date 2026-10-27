import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.inicio.titulo };

export default function InicioPage() {
  return (
    <>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{textos.inicio.titulo}</h1>
        <Link
          href="/ajustes"
          aria-label={textos.nav.ajustes}
          className="flex size-11 items-center justify-center rounded-full bg-teal-fondo text-teal-oscuro"
        >
          <Icon nombre="ajustes" />
        </Link>
      </header>
      <EmptyState
        titulo={textos.inicio.vacioTitulo}
        texto={textos.inicio.vacioTexto}
        accion={
          <ButtonLink href="/nuevo">{textos.inicio.vacioAccion}</ButtonLink>
        }
      />
    </>
  );
}
