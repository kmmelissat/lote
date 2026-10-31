import Link from "next/link";
import { Icon, type NombreIcono } from "./Icon";
import { estiloCard } from "./Card";

/** Un número con su etiqueta. En el celular va chica, en fila; en escritorio trae la explicación y el acceso. */
export function TarjetaDato({
  etiqueta,
  valor,
  texto,
  href,
  chip,
  banda,
  icono,
  alTocar,
}: {
  etiqueta: string;
  valor: string | number;
  texto: string;
  /** Sin enlace, la tarjeta solo se lee */
  href?: string;
  /** Un aviso de "ojo": ámbar, como el chip de poco stock */
  chip?: { texto: string };
  /** El color del estado que cuenta (el del chip), como banda en el borde izquierdo */
  banda?: string;
  /** Un dibujo de lo que cuenta (una caja, un reloj): da sentido al número sin repetir la etiqueta */
  icono?: NombreIcono;
  /** Para listas que filtran sin recargar: se hace esto en vez de navegar (el enlace queda para abrirlo en otra pestaña) */
  alTocar?: () => void;
}) {
  const clase = estiloCard({
    className: `relative flex h-full flex-col gap-1 overflow-hidden p-3 pl-4 md:gap-2 md:p-5 md:pl-6 ${href ? "transition-colors hover:bg-teal-fondo/50" : ""}`,
  });
  const cuerpo = (
    <>
      {banda && <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-2 border-r border-teal-oscuro/20 ${banda}`} />}
      <div className="flex items-center justify-between gap-1">
        <h3 className="text-[11px] font-medium leading-tight text-texto-2 md:text-base md:font-normal">{etiqueta}</h3>
        {icono && (
          <span aria-hidden="true" className="hidden size-8 shrink-0 items-center justify-center rounded-full bg-fondo text-teal-oscuro md:flex">
            <Icon nombre={icono} className="size-4" />
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-1 md:gap-2">
        <p className="font-logo text-2xl font-bold md:text-3xl">{valor}</p>
        {chip && (
          <span className="rounded-full border-2 border-teal-oscuro bg-ambar px-2 py-0.5 text-[11px] font-bold text-teal-oscuro md:px-3 md:py-1 md:text-sm">
            {chip.texto}
          </span>
        )}
      </div>
      <p className="hidden text-sm text-texto-2 md:block">{texto}</p>
    </>
  );
  return href ? (
    <Link
      href={href}
      className={clase}
      onClick={
        alTocar
          ? (e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              alTocar();
            }
          : undefined
      }
    >
      {cuerpo}
    </Link>
  ) : (
    <div className={clase}>{cuerpo}</div>
  );
}
