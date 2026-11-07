import Image from "next/image";
import type { CSSProperties } from "react";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { textos } from "@/lib/textos";

const m = textos.landing.hero.mock;

const css = (vars: Record<string, string>) => vars as CSSProperties;

// Diámetros de los anillos, en `cqw` (ancho del propio dibujo): más juntos en escritorio.
const ANILLOS = [
  { m: 60, d: 30, retraso: "0s", vuelta: "7s" },
  { m: 86, d: 44, retraso: "0.6s", vuelta: "10s" },
  { m: 112, d: 58, retraso: "1.2s", vuelta: "13s" },
  { m: 140, d: 72, retraso: "1.8s", vuelta: "16s" },
];

// Puntitos de colores y estrellas que flotan por el fondo (posición en %, color y tamaño).
const CONFETI = [
  { x: 20, y: 52, c: "bg-rosa" },
  { x: 80, y: 48, c: "bg-limon", g: true },
  { x: 12, y: 80, c: "bg-mango" },
  { x: 88, y: 74, c: "bg-celeste" },
  { x: 30, y: 90, c: "bg-limon" },
  { x: 70, y: 92, c: "bg-rosa", g: true },
  { x: 8, y: 60, c: "bg-celeste", g: true },
  { x: 92, y: 56, c: "bg-mango" },
  { x: 50, y: 44, c: "bg-rosa" },
];
const ESTRELLAS = [
  { x: 14, y: 50 },
  { x: 84, y: 46 },
  { x: 24, y: 88 },
  { x: 76, y: 84 },
  { x: 6, y: 72 },
  { x: 94, y: 68 },
];

const TARJETA =
  "absolute z-[4] rounded-[1.4em] border border-teal-oscuro bg-white p-[0.8em_1em] text-[length:var(--fs)] leading-[1.25] text-teal-oscuro shadow-[4px_4px_0_0_var(--color-teal-oscuro)]";

function Foto({ clave, className }: { clave: string; className: string }) {
  return <Image src={`/landing/${clave}.webp`} alt="" width={220} height={220} sizes="160px" className={className} />;
}

/**
 * El hero explica el producto de un vistazo: un celular con una tienda real en el centro y, alrededor, tarjetitas con una
 * idea cada una (cobro, enlace, pedido, ganancia). Detrás, anillos finos con un destello y confeti.
 * Todo mide en `cqw` (ancho del propio dibujo), así que escala igual en celular y en escritorio.
 * Es de ejemplo y decorativo: va oculto a lectores de pantalla. El movimiento se apaga con "reducir movimiento".
 */
export function HeroEscena() {
  const primero = m.productos[0];
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-[1/1.12] w-full max-w-[520px] text-teal-oscuro [--fs:max(11px,3cqw)] [--pfs:max(10px,2.7cqw)] [container-type:inline-size] min-[880px]:aspect-[1.9/1] min-[880px]:max-w-[1040px] min-[880px]:[--fs:max(13px,1.4cqw)] min-[880px]:[--pfs:max(11px,1.18cqw)]"
    >
      {/* Los anillos viven en una caja más grande que el dibujo y se desvanecen hacia los bordes: así no se cortan en seco */}
      <div className="absolute -inset-x-[12%] -top-[35%] bottom-[-10%] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_64%,#000_55%,transparent_100%)]">
        {ANILLOS.map((a) => (
          <span
            key={a.m}
            className="anillo [aspect-ratio:1] [width:calc(var(--m)*1cqw)] min-[880px]:[width:calc(var(--d)*1cqw)]"
            style={css({ "--m": String(a.m), "--d": String(a.d), "--retraso": a.retraso, "--vuelta": a.vuelta })}
          />
        ))}
      </div>
      {CONFETI.map((p, i) => (
        <span
          key={i}
          className={`confeti absolute rounded-full border border-teal-oscuro ${p.c} ${p.g ? "size-[2.2cqw] min-[880px]:size-[1.1cqw]" : "size-[1.6cqw] min-[880px]:size-[0.9cqw]"}`}
          style={css({ left: `${p.x}%`, top: `${p.y}%`, "--retraso": `${(i % 3) * 1.2}s` })}
        />
      ))}
      {ESTRELLAS.map((p, i) => (
        <span
          key={i}
          className="estrella absolute z-[2] text-[3cqw] leading-none text-white [text-shadow:0_0_0.8cqw_rgb(255_255_255/0.9),0_0_2cqw_var(--color-celeste)]"
          style={css({ left: `${p.x}%`, top: `${p.y}%`, "--retraso": `${[0, 0.5, 1, 1.6, 0.2, 2][i]}s` })}
        >
          ✦
        </span>
      ))}

      {/* Un iPhone: marco de titanio, botones, isla dinámica, brillo y barra de inicio. Se dibuja en `u` (1 % del ancho del celular). */}
      <div className="iphone top-[7%] z-[3] min-[880px]:top-[10%]">
        <i className="iphone-boton left-[calc(var(--u)*-1)] top-[17%] h-[4%]" />
        <i className="iphone-boton left-[calc(var(--u)*-1)] top-[25%] h-[8%]" />
        <i className="iphone-boton left-[calc(var(--u)*-1)] top-[35%] h-[8%]" />
        <i className="iphone-boton right-[calc(var(--u)*-1)] top-[29%] h-[13%] [background:linear-gradient(270deg,#6d7276,#c3c6c8)]" />
        <div className="iphone-cuerpo">
          <div className="iphone-pantalla">
            <div className="relative h-full overflow-hidden rounded-[calc(var(--u)*11.3)] bg-white text-teal-oscuro">
              <span className="isla" />
              <div className="flex h-[calc(var(--u)*13)] items-end justify-between px-[calc(var(--u)*9)] pb-[calc(var(--u)*1.6)] text-[0.85em] font-bold">
                <span>9:41</span>
                <span className="flex items-center gap-[0.35em]">
                  <svg viewBox="0 0 18 12" className="h-[0.8em]" fill="currentColor">
                    <rect x="0" y="8" width="3" height="4" rx="0.8" />
                    <rect x="5" y="5.5" width="3" height="6.5" rx="0.8" />
                    <rect x="10" y="3" width="3" height="9" rx="0.8" />
                    <rect x="15" y="0" width="3" height="12" rx="0.8" />
                  </svg>
                  <svg viewBox="0 0 16 12" className="h-[0.8em]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                    <path d="M1.2 4.2a9.5 9.5 0 0 1 13.6 0M3.6 6.9a6 6 0 0 1 8.8 0" />
                    <circle cx="8" cy="10" r="1.2" fill="currentColor" stroke="none" />
                  </svg>
                  <svg viewBox="0 0 27 12" className="h-[0.8em]" fill="none">
                    <rect x="0.5" y="0.5" width="22" height="11" rx="3.3" stroke="currentColor" opacity="0.45" />
                    <rect x="2" y="2" width="19" height="8" rx="2" fill="currentColor" />
                    <path d="M24.2 4v4c.8-.3 1.4-1 1.4-2s-.6-1.7-1.4-2Z" fill="currentColor" opacity="0.5" />
                  </svg>
                </span>
              </div>
              <div className="toldo-celular" />
              <div className="flex items-center gap-[0.7em] px-[1em] pt-[1.1em]">
                <span className="grid size-[3em] shrink-0 place-items-center rounded-[0.8em] border border-teal-oscuro bg-mango text-[1.3em] font-extrabold">M</span>
                <div className="min-w-0">
                  <b className="block text-[1.25em] leading-tight">{m.tienda}</b>
                  <span className="block text-[0.85em] text-texto-2">{m.envio}</span>
                </div>
              </div>
              <p className="mx-[1em] mt-[0.8em] rounded-full bg-[#25d366] py-[0.55em] text-center text-[0.95em] font-bold">{m.pedir}</p>
              <p className="mx-[1em] mt-[0.7em] rounded-[0.8em] bg-[#eef2f3] px-[0.8em] py-[0.55em] text-[0.9em] text-borde-control">{m.buscar}</p>
              <div className="grid grid-cols-2 gap-[0.7em] px-[1em] pt-[0.8em]">
                {m.productos.map((p) => (
                  <div key={p.clave} className="rounded-[1em] border border-teal-oscuro p-[0.35em]">
                    <Foto clave={p.clave} className="aspect-square w-full rounded-[0.7em] object-cover" />
                    <b className="mt-[0.35em] block truncate px-[0.2em] text-[0.82em]">{p.nombre}</b>
                    <span className="block px-[0.2em] pb-[0.15em] text-[0.95em] font-extrabold text-teal">{p.precio}</span>
                  </div>
                ))}
              </div>
              <span className="indicador-inicio" />
              <span className="brillo-pantalla" />
            </div>
          </div>
        </div>
      </div>
      <LotitoMas
        nombre="asoma"
        className="absolute left-1/2 top-[-6%] z-[5] ml-[-9.5%] w-[19%] animate-flotar [--giro:0deg] min-[880px]:top-[2%] min-[880px]:ml-[-4.5%] min-[880px]:w-[9%]"
      />

      {/* Una idea por tarjeta */}
      <div className={`${TARJETA} left-[1%] top-[7%] flex w-[60%] -rotate-[2.5deg] items-center gap-[0.7em] rounded-full p-[0.55em_1.1em_0.55em_0.6em] min-[880px]:left-[1%] min-[880px]:top-[4%] min-[880px]:w-[25%]`}>
        <span className="inline-grid size-[2.4em] shrink-0 place-items-center rounded-full border border-teal-oscuro bg-teal font-extrabold text-white">L</span>
        <div>
          <b className="block font-extrabold">{m.venta.titulo}</b>
          <small className="block text-[0.86em] opacity-70">{m.venta.texto}</small>
        </div>
      </div>

      <div className={`${TARJETA} left-0 top-[36%] w-[27%] -rotate-[4deg] p-[0.35em] min-[880px]:left-[0%] min-[880px]:top-[50%] min-[880px]:w-[14%]`}>
        <Foto clave={primero.clave} className="block aspect-square w-full rounded-[0.9em] object-cover" />
        <span className="absolute bottom-[0.7em] left-[0.7em] rounded-[0.6em] border border-teal-oscuro bg-crema px-[0.6em] font-extrabold">{primero.precio}</span>
      </div>

      <p className={`${TARJETA} left-[10%] top-[33%] hidden -rotate-[1.5deg] rounded-[1em] !border-0 bg-limon p-[0.5em_0.9em] font-semibold !shadow-none min-[880px]:block`}>
        {m.pregunta} <span className="ml-[0.4em] text-[0.86em] opacity-70">10:23 ✓✓</span>
      </p>

      <div className={`${TARJETA} left-[12%] top-[72%] hidden w-[24%] rotate-[1.5deg] min-[880px]:block`}>
        <b className="block font-extrabold">{m.pedido.titulo}</b>
        <span className="my-[0.6em] block h-[0.5em] overflow-hidden rounded-full bg-teal-oscuro/15">
          <i className="block h-full w-2/3 rounded-full bg-teal" />
        </span>
        <small className="block text-[0.86em] opacity-70">{m.pedido.estado}</small>
      </div>

      <div className={`${TARJETA} right-[1%] top-[27%] w-[42%] rotate-2 min-[880px]:right-[1%] min-[880px]:top-[6%] min-[880px]:w-[24%]`}>
        <span className="mb-[0.5em] grid size-[2.6em] place-items-center rounded-[0.8em] border border-teal-oscuro bg-limon">
          <svg viewBox="0 0 24 24" className="size-[1.3em]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
            <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
          </svg>
        </span>
        <b className="block font-extrabold">{m.enlace.titulo}</b>
        {m.enlace.antes}
        <mark className="bg-[linear-gradient(transparent_60%,var(--color-limon)_60%)] text-inherit">{m.enlace.resalte}</mark>
        {m.enlace.despues}
      </div>

      <div className={`${TARJETA} right-[3%] top-[58%] w-[33%] -rotate-2 min-[880px]:right-[2%] min-[880px]:top-[48%] min-[880px]:w-[15%]`}>
        <small className="block text-[0.86em] opacity-70">{m.ganancia.etiqueta}</small>
        <b className="mt-[0.15em] block text-[2.3em] font-extrabold leading-[1.05] tracking-tight tabular-nums">{m.ganancia.monto}</b>
      </div>

      <p
        className={`${TARJETA} left-[4%] top-[68%] flex rotate-2 items-center gap-[0.5em] rounded-full bg-mango p-[0.7em_1.3em] text-[length:calc(var(--fs)*1.12)] font-extrabold min-[880px]:left-auto min-[880px]:right-[15%] min-[880px]:top-[74%]`}
      >
        {m.comprar} →
      </p>
    </div>
  );
}
