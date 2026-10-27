import Link from "next/link";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { textos } from "@/lib/textos";

const boton =
  "flex size-11 items-center justify-center rounded-xl bg-superficie text-teal-oscuro hover:bg-teal-fondo";

function BotonIcono({ icono, etiqueta }: { icono: NombreIcono; etiqueta: string }) {
  return (
    <button type="button" aria-label={etiqueta} className={boton}>
      <Icon nombre={icono} className="size-5" />
    </button>
  );
}

function Perfil() {
  return (
    <Link
      href="/ajustes"
      aria-label={textos.nav.perfil}
      className="flex min-h-11 items-center gap-3 rounded-xl bg-superficie p-1 hover:bg-teal-fondo md:pr-3"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-teal-fondo text-teal">
        <Icon nombre="usuario" className="size-5" />
      </span>
      <span className="hidden flex-col leading-tight md:flex">
        <span className="text-sm font-medium">{textos.perfil.nombre}</span>
        <span className="text-xs text-texto-2">{textos.perfil.detalle}</span>
      </span>
      <Icon nombre="flecha" className="hidden size-4 text-texto-2 md:block" />
    </Link>
  );
}

export function PageHeader({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion: string;
}) {
  const acciones = (
    <div className="flex items-center gap-2">
      <BotonIcono icono="buscar" etiqueta={textos.nav.buscar} />
      <BotonIcono icono="campana" etiqueta={textos.nav.avisos} />
      <Perfil />
    </div>
  );
  return (
    <header className="mb-6">
      {/* Móvil: logo y acciones arriba; en escritorio el logo está en el menú lateral */}
      <div className="mb-4 flex items-center justify-between md:hidden">
        <Link href="/inicio" aria-label={textos.nombre}>
          <Logo />
        </Link>
        {acciones}
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{titulo}</h1>
          <p className="mt-1 text-texto-2">{descripcion}</p>
        </div>
        <div className="hidden md:block">{acciones}</div>
      </div>
    </header>
  );
}
