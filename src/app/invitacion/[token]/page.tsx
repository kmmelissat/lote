import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { esTokenInvitacion, verInvitacion } from "@/features/team/repositorio";
import { AceptarInvitacion } from "@/features/team/ui/AceptarInvitacion";
import { createPublicClient } from "@/lib/supabase/publico";
import { createClient } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

const t = textos.invitacion;

// El enlace es privado: no debe aparecer en buscadores.
export const metadata: Metadata = { title: t.titulo, robots: { index: false, follow: false } };

export default function InvitacionPage({ params }: PageProps<"/invitacion/[token]">) {
  return <Invitacion params={params} />;
}

async function Invitacion({ params }: Pick<PageProps<"/invitacion/[token]">, "params">) {
  await connection();
  const { token } = await params;
  const info = esTokenInvitacion(token) ? await verInvitacion(createPublicClient(), token) : null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <Logo />
      {!info ? (
        <Card className="flex flex-col gap-2 border border-borde">
          <h1 className="text-xl font-bold">{t.invalidaTitulo}</h1>
          <p className="text-texto-2">{t.invalida}</p>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">{t.invitaron(info.negocio)}</h1>
            <p className="text-texto-2">{t.comoRol(textos.perfil.roles[info.rol])}</p>
            <p className="text-sm text-texto-2">{textos.equipo.rolesAyuda[info.rol]}</p>
          </div>
          <Acceso token={token} negocio={info.negocio} />
        </>
      )}
      <Link href="/privacidad" className="inline-flex min-h-11 items-center self-start text-sm text-teal underline">
        {textos.acceso.privacidadEnlace}
      </Link>
    </main>
  );
}

async function Acceso({ token, negocio }: { token: string; negocio: string }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims.sub) return <AceptarInvitacion token={token} negocio={negocio} />;
  return (
    <div className="flex flex-col gap-2">
      <ButtonLink href={`/login?next=${encodeURIComponent(`/invitacion/${token}`)}`} className="self-start">
        {t.entrar}
      </ButtonLink>
      <p className="text-sm text-texto-2">{t.entrarAyuda}</p>
    </div>
  );
}
