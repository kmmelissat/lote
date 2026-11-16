import Image from "next/image";
import Link from "next/link";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { Aparece } from "./Aparece";

const t = textos.landing;
const m = t.hero.mock;

const boton =
  "inline-flex h-14 items-center justify-center rounded-full px-8 text-base font-semibold transition-colors";

const sombra = "shadow-[0_18px_40px_-18px_rgba(1,60,71,0.3)]";
const tarjeta = `absolute z-10 rounded-[24px] bg-white p-4 ${sombra} max-md:hidden`;

function Ficha({ icono, color }: { icono: NombreIcono; color: string }) {
  return (
    <span className={`flex size-9 shrink-0 items-center justify-center rounded-[12px] text-teal-oscuro ${color}`}>
      <Icon nombre={icono} className="size-5" />
    </span>
  );
}

/** El celular con una tienda de verdad: barra del navegador, buscador, categorías, productos y carrito. */
function Celular() {
  return (
    <div className="absolute left-1/2 top-4 h-[620px] w-[272px] -translate-x-1/2 [perspective:1400px] md:h-[660px] md:w-[292px]">
      {/* Sombra en el piso */}
      <span aria-hidden="true" className="absolute -bottom-10 left-6 right-[-30px] h-10 rounded-[50%] bg-teal-oscuro/30 blur-2xl" />
      <div className="relative h-full w-full [transform-style:preserve-3d] [transform:rotateY(-16deg)_rotateX(5deg)_rotateZ(2deg)]">
      {/* Grosor del celular: una pila de capas hacia atrás */}
      <span aria-hidden="true" className="absolute inset-0 rounded-[48px] bg-[#0b2228] [transform:translateZ(-14px)_translateX(10px)]" />
      <span aria-hidden="true" className="absolute inset-0 rounded-[48px] bg-[#16383f] [transform:translateZ(-7px)_translateX(5px)]" />
      {/* Botones del costado */}
      <span aria-hidden="true" className="absolute -left-[3px] top-28 h-8 w-[3px] rounded-l bg-[#2c5560]" />
      <span aria-hidden="true" className="absolute -left-[3px] top-44 h-14 w-[3px] rounded-l bg-[#2c5560]" />
      <span aria-hidden="true" className="absolute -right-[3px] top-40 h-20 w-[3px] rounded-r bg-[#2c5560]" />
      <div className="relative h-full w-full rounded-[48px] bg-[linear-gradient(145deg,#3d6670,#0e2a30_45%,#274c56)] p-[7px] shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.18),0_50px_80px_-30px_rgba(1,60,71,0.55)]">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[41px] bg-superficie">
        <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-bold">
          <span>9:41</span>
          <span aria-hidden="true" className="h-4 w-20 rounded-full bg-teal-oscuro" />
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-4 rounded-[3px] border border-teal-oscuro p-px"><span className="block h-full w-3/4 rounded-[1px] bg-teal-oscuro" /></span>
          </span>
        </div>
        <div className="mx-4 mt-2 flex items-center gap-1.5 rounded-full bg-gris-100 px-3 py-1.5 text-[11px] font-medium text-texto-2">
          <Icon nombre="candado" className="size-3" />
          {m.direccion}
        </div>
        <div className="flex items-center gap-2.5 px-4 pt-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-ficha-rosa text-base font-extrabold">{m.inicial}</span>
          <p className="flex-1 text-[15px] font-bold leading-tight">{m.tienda}</p>
          <span className="relative flex size-9 items-center justify-center rounded-full border border-linea">
            <Icon nombre="carrito" className="size-[18px]" />
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-teal-oscuro text-[9px] font-bold text-white">2</span>
          </span>
        </div>
        <div className="mx-4 mt-3 flex h-9 items-center gap-2 rounded-full border border-linea px-3 text-xs text-texto-2">
          <Icon nombre="buscar" className="size-4" />
          {m.buscar}
        </div>
        <ul className="mt-2.5 flex gap-1.5 overflow-hidden px-4">
          {m.categorias.map((c, i) => (
            <li key={c} className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${i === 0 ? "bg-teal-oscuro text-white" : "border border-linea"}`}>
              {c}
            </li>
          ))}
        </ul>
        <ul className="mt-3 grid grid-cols-2 gap-x-2.5 gap-y-3 px-4">
          {m.productos.map((p) => (
            <li key={p.nombre} className="text-[11.5px]">
              <span className={`relative mb-1.5 block aspect-square overflow-hidden rounded-[14px] ${p.color}`}>
                {p.foto && <Image src={p.foto} alt="" fill sizes="140px" className="object-cover" />}
                <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-superficie/90">
                  <Icon nombre="corazon" className="size-3.5" />
                </span>
              </span>
              <span className="block truncate font-semibold">{p.nombre}</span>
              <span className="block font-bold">{p.precio}</span>
            </li>
          ))}
        </ul>
        <p className="absolute inset-x-4 bottom-4 flex h-11 items-center justify-center gap-2 rounded-[14px] bg-teal-oscuro text-sm font-semibold text-white shadow-lg">
          <Icon nombre="carrito" className="size-4" />
          {m.carrito}
        </p>
        {/* Reflejo en el vidrio */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.32)_0%,rgba(255,255,255,0)_32%)]" />
      </div>
      </div>
      </div>
    </div>
  );
}

export function Hero({ conSesion }: { conSesion: boolean }) {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Aurora: manchas suaves de color detrás de todo */}
      <div aria-hidden="true" className="absolute -left-24 top-16 size-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(153,225,248,0.6),transparent)]" />
      <div aria-hidden="true" className="absolute -right-20 top-0 size-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(242,158,187,0.5),transparent)]" />
      <div aria-hidden="true" className="absolute left-1/3 top-[320px] size-[480px] rounded-full bg-[radial-gradient(closest-side,rgba(207,194,245,0.65),transparent)]" />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-6 px-5 pb-20 pt-32 min-[880px]:grid-cols-[1.05fr_0.95fr] min-[880px]:px-10 min-[880px]:pt-36">
        <Aparece alCargar className="flex flex-col items-center gap-5 text-center min-[880px]:items-start min-[880px]:text-left">
          <h1 className="font-logo text-[44px] font-semibold leading-[1.1] tracking-[-0.01em] text-teal-oscuro min-[880px]:text-[72px]">
            {t.hero.tituloInicio} <span className="text-teal">{t.hero.tituloMarca}</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-texto-2 min-[880px]:text-xl">{t.hero.texto}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={conSesion ? "/inicio" : "/login"} data-cta="" className={`${boton} bg-teal-oscuro text-white hover:bg-teal`}>
              {conSesion ? t.irAlPanel : t.empezar}
            </Link>
            <a href="#como" data-cta="" className={`${boton} bg-gris-100 text-teal-oscuro hover:bg-gris-50`}>
              {t.hero.verComo}
            </a>
          </div>
        </Aparece>

        <Aparece alCargar delay={0.15} className="relative mx-auto h-[680px] w-full max-w-[480px] md:h-[720px]">
          <Celular />
          <div className={`${tarjeta} -left-6 top-40 w-56 -rotate-3 motion-safe:animate-flotar`}>
            <div className="flex items-start gap-3">
              <Ficha icono="moneda" color="bg-ficha-verde" />
              <div>
                <p className="text-xs font-medium text-texto-2">{m.ganancia.etiqueta}</p>
                <p className="text-2xl font-semibold tabular-nums tracking-tight text-teal-oscuro">{m.ganancia.monto}</p>
              </div>
            </div>
            <p className="mt-2.5 inline-block rounded-lg bg-ficha-verde px-2 py-1 text-[11px] font-semibold text-teal-oscuro">{m.ganancia.cambio}</p>
          </div>
          <div className={`${tarjeta} -right-8 top-[26rem] w-56 rotate-3 motion-safe:animate-flotar [animation-delay:-1.5s]`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-teal-oscuro">{m.pedido.titulo}</p>
              <span className="rounded-lg bg-ficha-verde px-2 py-0.5 text-xs font-semibold text-teal-oscuro">{m.pedido.estado}</span>
            </div>
            <div className="mt-3 flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-full bg-ficha-lila text-xs font-bold text-teal-oscuro">AM</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-teal-oscuro">{m.pedido.cliente}</p>
                <p className="truncate text-xs text-texto-2">{m.pedido.detalle}</p>
              </div>
              <p className="text-sm font-bold text-teal-oscuro">{m.pedido.total}</p>
            </div>
          </div>
          <div className={`${tarjeta} -right-4 top-20 flex items-center gap-3 !rounded-[20px] !px-4 !py-3`}>
            <Ficha icono="exito" color="bg-ficha-verde" />
            <div>
              <p className="text-sm font-bold leading-tight text-teal-oscuro">{m.pago.titulo}</p>
              <p className="text-xs text-texto-2">{m.pago.texto}</p>
            </div>
          </div>
        </Aparece>
      </div>
    </section>
  );
}
