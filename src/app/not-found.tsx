import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { textos } from "@/lib/textos";

const t = textos.errores;

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center bg-crema px-4 py-10">
      <EmptyState
        monito="asoma"
        titulo={t.noEncontradaTitulo}
        texto={t.noEncontradaTexto}
        accion={
          <ButtonLink href="/" variante="mango">
            {t.inicio}
          </ButtonLink>
        }
      />
    </main>
  );
}
