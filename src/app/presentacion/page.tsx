import { Deck } from "@/features/presentacion/ui/Deck";
import { LAMINAS } from "@/features/presentacion/laminas";
import { laminaDesdeUrl } from "@/features/presentacion/url";

export default async function PaginaPresentacion({ searchParams }: PageProps<"/presentacion">) {
  const { s } = await searchParams;
  return <Deck laminas={LAMINAS} inicial={laminaDesdeUrl(typeof s === "string" ? s : undefined, LAMINAS.length)} />;
}
