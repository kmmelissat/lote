"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { Gorila } from "@/components/ui/Gorila";
import { estiloBoton } from "@/components/ui/Button";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import { textos } from "@/lib/textos";
import { EASE, grupo } from "../animacion";
import type { Lamina as DatosLamina, Contenido, Hito, Marca, TonoLamina } from "../laminas";
import { Fondo } from "./Fondo";
import { LotitoAnimado } from "./LotitoAnimado";
import { Aparecer, Barra, Contador, Etiqueta, Lista, MensajePorPartes, Pieza, Puntos, Tarjeta, Titulo } from "./piezas";

// Fondo y texto de cada tono, con los tokens de Lote (todos con contraste alto contra teal-oscuro).
const TONOS: Record<TonoLamina, string> = {
  crema: "bg-crema text-teal-oscuro",
  limon: "bg-limon text-teal-oscuro",
  rosa: "bg-rosa-palido text-teal-oscuro",
  celeste: "bg-celeste-palido text-teal-oscuro",
  menta: "bg-teal-fondo text-teal-oscuro",
  teal: "bg-teal-oscuro text-perla",
};

const CHIPS = ["bg-white", "bg-limon", "bg-rosa-palido", "bg-celeste-palido", "bg-teal-fondo"] as const;
const GIROS = [-2, 1.5, -1, 2, -1.5] as const;
const ICONOS_ESTAMPA: readonly NombreIcono[] = ["check", "ayuda", "intercambio"];
const CONFETI = ["bg-mango", "bg-rosa", "bg-limon", "bg-celeste", "bg-menta", "bg-coral"] as const;

const ESTILO_MARCA: Record<Marca, string> = {
  "en la app": "bg-menta",
  manual: "bg-limon",
  planeado: "border-dashed bg-white/60",
  "en prueba": "bg-celeste-palido",
};

/** Sello que dice si algo ya está en la app, se hace a mano, está planeado o en prueba. */
const SelloMarca = ({ marca }: { marca: Marca }) => (
  <span className={`inline-block self-start rounded-full border border-teal-oscuro px-2 py-0.5 text-xs font-bold uppercase tracking-wide md:px-[0.7em] md:text-[1.1em] ${ESTILO_MARCA[marca]}`}>{marca}</span>
);

/** Un chip pegado a mano: color y giro según su lugar en la lista. */
const Chip = ({ children, i }: { children: string; i: number }) => (
  <Pieza como="li" className={`list-none rounded-full border border-teal-oscuro px-3 py-1 text-sm font-bold md:px-[0.9em] md:text-[1.4em] ${CHIPS[i % CHIPS.length]}`}>
    <span className="inline-block" style={{ rotate: `${GIROS[i % GIROS.length]}deg` }}>
      {children}
    </span>
  </Pieza>
);

/** Tres puntitos que rebotan: "está escribiendo…" justo antes de que llegue cada burbuja. */
function Escribiendo({ retraso, derecha }: { retraso: number; derecha: boolean }) {
  const reducido = useReducedMotion();
  if (reducido) return null;
  return (
    <motion.span
      aria-hidden="true"
      className={`absolute bottom-0 flex gap-1 rounded-full border border-teal-oscuro bg-white px-3 py-2 shadow-dura-chica md:gap-[0.3em] md:px-[0.9em] md:py-[0.6em] ${derecha ? "right-0" : "left-0"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ delay: retraso - 0.6, duration: 0.6, times: [0, 0.15, 0.85, 1] }}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-2 rounded-full bg-teal-oscuro md:size-[0.6em]"
          animate={{ y: [0, -4, 0] }}
          transition={{ delay: retraso - 0.6 + i * 0.1, duration: 0.4, repeat: 1 }}
        />
      ))}
    </motion.span>
  );
}

/** Línea de tiempo: la línea se dibuja y cada hito aparece cuando la línea lo alcanza. En móvil va en columna. */
function LineaDeTiempo({ titulo, hitos }: { titulo: string; hitos: readonly Hito[] }) {
  const reducido = useReducedMotion();
  const inicio = 0.9;
  return (
    <Pieza className="flex flex-col gap-3 md:gap-[0.8em]">
      <Etiqueta indice={2}>{titulo}</Etiqueta>
      <ol className="relative grid gap-3 md:grid-cols-4 md:gap-[1em]">
        <motion.span
          aria-hidden="true"
          className="absolute left-[1.1em] right-[1.1em] top-[1.05em] hidden h-[0.3em] origin-left rounded-full bg-teal-oscuro md:block"
          initial={reducido ? { opacity: 0 } : { scaleX: 0 }}
          animate={reducido ? { opacity: 1 } : { scaleX: 1 }}
          transition={{ delay: inicio, duration: reducido ? 0.2 : 0.3 * hitos.length, ease: "linear" }}
        />
        {hitos.map((h, i) => (
          <li key={h.cuando} className="relative flex items-start gap-3 md:flex-col md:gap-[0.6em]">
            <motion.span
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-teal-oscuro bg-mango font-logo text-sm font-semibold text-teal-oscuro shadow-dura-chica md:size-[2.2em] md:text-[1.4em]"
              initial={reducido ? { opacity: 0 } : { scale: 0 }}
              animate={reducido ? { opacity: 1 } : { scale: 1 }}
              transition={{ delay: inicio + i * 0.3, type: reducido ? "tween" : "spring", stiffness: 380, damping: 14, duration: 0.2 }}
            >
              {i + 1}
            </motion.span>
            <motion.span
              className="flex flex-col"
              initial={{ opacity: 0, y: reducido ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: inicio + i * 0.3 + 0.1, duration: 0.35, ease: EASE }}
            >
              <span className="text-sm font-bold text-rosa-texto md:text-[1.3em]">{h.cuando}</span>
              <span className="text-base font-bold leading-snug md:text-[1.6em]">{h.que}</span>
              {h.marca && <SelloMarca marca={h.marca} />}
            </motion.span>
          </li>
        ))}
      </ol>
    </Pieza>
  );
}

/** Ondas que salen de Lotito, como un toque en la pantalla. */
function Pulso() {
  const reducido = useReducedMotion();
  if (reducido) return null;
  return (
    <>
      {[0, 1.2].map((retraso) => (
        <motion.span
          key={retraso}
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 -ml-[45%] -mt-[45%] aspect-square w-[90%] rounded-full border-2 border-mango"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1.25, opacity: [0, 0.7, 0] }}
          transition={{ delay: 1 + retraso, duration: 2.4, ease: "easeOut", repeat: Infinity }}
        />
      ))}
    </>
  );
}

/** El sello de feria "EN VIVO": gira despacito, con un punto rojo que late. */
function SelloEnVivo() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className="absolute -right-2 top-0 size-24 md:-right-[1em] md:-top-[1em] md:size-[10em]">
      <g className="motion-safe:animate-girar-lento" style={{ transformOrigin: "60px 60px" }}>
        <circle cx="60" cy="60" r="58" fill="var(--color-rosa)" stroke="var(--color-teal-oscuro)" strokeWidth="2" />
        <path id="sello-en-vivo" d="M60 60m-40 0a40 40 0 1 1 80 0a40 40 0 1 1 -80 0" fill="none" />
        <text fontSize="13" fontWeight="800" fill="var(--color-teal-oscuro)" letterSpacing="1.5">
          <textPath href="#sello-en-vivo">EN VIVO · EN VIVO · EN VIVO ·</textPath>
        </text>
      </g>
      <circle cx="60" cy="60" r="9" fill="var(--color-error)" stroke="var(--color-teal-oscuro)" strokeWidth="2" className="motion-safe:animate-bote" style={{ transformOrigin: "60px 60px" }} />
    </svg>
  );
}

/** Confeti de la marca que salta desde Lotito cuando se despide. */
function Confeti() {
  const reducido = useReducedMotion();
  if (reducido) return null;
  return (
    <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/3">
      {Array.from({ length: 16 }, (_, i) => {
        const angulo = (i / 16) * Math.PI * 2 + (i % 2) * 0.2;
        const radio = 150 + (i % 3) * 60;
        return (
          <motion.span
            key={i}
            className={`absolute size-2.5 border border-teal-oscuro md:size-[0.9em] ${CONFETI[i % CONFETI.length]} ${i % 3 === 0 ? "rounded-full" : "rounded-sm"}`}
            initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
            animate={{ x: Math.cos(angulo) * radio, y: Math.sin(angulo) * radio + 40, opacity: [0, 1, 1, 0], rotate: 240 + i * 30 }}
            transition={{ delay: 1.5, duration: 1.4, ease: "easeOut", times: [0, 0.1, 0.7, 1] }}
          />
        );
      })}
    </span>
  );
}

// Todos los diseños comparten el título como h1; el resto del contenido depende del tipo.
function Cuerpo({ lamina }: { lamina: DatosLamina }) {
  const c: Contenido = lamina.contenido;
  const titulo = <Titulo>{lamina.titulo}</Titulo>;

  switch (c.tipo) {
    case "portada": {
      // Inspirada en el hero de la landing (pastilla, titular con la marca en rosa, celular con la tienda y tarjetitas), pero hecha para la lámina.
      const h = textos.landing.hero;
      const tarjeta = "absolute rounded-2xl border border-teal-oscuro bg-white px-3 py-2 text-sm font-bold leading-tight shadow-dura md:px-[0.8em] md:py-[0.5em] md:text-[1.35em]";
      return (
        <div className="flex flex-col gap-8 md:grid md:grid-cols-[1.15fr_1fr] md:items-center md:gap-[3em]">
          <div className="flex flex-col items-start gap-4 md:gap-[1.1em]">
            <Pieza className="-rotate-2 rounded-full border border-teal-oscuro bg-celeste px-4 py-1.5 text-sm font-bold shadow-dura-chica md:px-[1em] md:py-[0.3em] md:text-[1.4em]">
              {c.curso}
            </Pieza>
            <Pieza className="inline-flex -rotate-2 items-center gap-2 self-start rounded-3xl border border-teal-oscuro bg-limon py-1 pl-3 pr-5 shadow-dura md:gap-[0.2em] md:py-[0.1em] md:pl-[0.4em] md:pr-[0.6em]">
              <Gorila className="size-14 shrink-0 md:size-[6em]" />
              <Titulo className="md:!text-[8em]">{lamina.titulo}</Titulo>
            </Pieza>
            <Pieza como="p" className="flex flex-col items-start gap-2 text-3xl font-extrabold leading-[1.05] tracking-[-0.04em] md:gap-[0.25em] md:text-[3.4em]">
              <span>{h.tituloInicio}</span>
              <span className="-rotate-1 whitespace-nowrap rounded-2xl border border-teal-oscuro bg-rosa px-3 py-0.5 text-2xl text-crema shadow-[5px_5px_0_0_var(--color-teal-oscuro)] md:px-[0.3em] md:text-[0.82em]">
                {h.tituloMarca}
              </span>
            </Pieza>
            <ul className="flex flex-wrap gap-2 md:gap-[0.6em]" aria-label="Equipo">
              {c.equipo.map((nombre, i) => (
                <Chip key={nombre} i={i}>
                  {nombre}
                </Chip>
              ))}
            </ul>
          </div>
          {/* Un celular con la tienda, Lotito encima y tarjetitas pegadas alrededor */}
          <Pieza className="relative mx-auto w-56 md:w-[19em]" >
            <div aria-hidden="true" className="absolute -inset-[18%] rounded-full border-2 border-dashed border-teal-oscuro/25 motion-safe:animate-girar-lento" />
            <div aria-hidden="true" className="relative rotate-3 rounded-[2.2rem] border-[3px] border-teal-oscuro bg-white p-3 shadow-dura md:rounded-[2.2em] md:border-[0.2em] md:p-[0.9em]">
              <div className="flex items-center gap-2 md:gap-[0.6em]">
                <span className="grid size-8 place-items-center rounded-lg border border-teal-oscuro bg-mango font-extrabold md:size-[2.2em] md:rounded-[0.6em] md:text-[1.3em]">M</span>
                <b className="text-sm md:text-[1.3em]">{h.mock.tienda}</b>
              </div>
              <p className="mt-2 rounded-full bg-[#25d366] py-1 text-center text-xs font-bold md:mt-[0.6em] md:py-[0.35em] md:text-[1em]">{h.mock.pedir}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 md:mt-[0.6em] md:gap-[0.5em]">
                {h.mock.productos.map((p) => (
                  <div key={p.clave} className="rounded-xl border border-teal-oscuro p-1 md:rounded-[0.8em] md:p-[0.3em]">
                    <Image src={`/landing/${p.clave}.webp`} alt="" width={220} height={220} sizes="160px" className="aspect-square w-full rounded-lg object-cover md:rounded-[0.6em]" />
                    <span className="block px-1 text-xs font-extrabold text-teal md:text-[1em]">{p.precio}</span>
                  </div>
                ))}
              </div>
            </div>
            <LotitoAnimado nombre={c.lotito} personalidad="portada" className="absolute -right-8 -top-14 w-24 md:-right-[3em] md:-top-[4.5em] md:w-[9em]" />
            <Pieza className={`${tarjeta} -left-10 top-10 -rotate-3 bg-limon motion-safe:animate-flotar md:-left-[4em] md:top-[3em]`}>
              {h.mock.venta.titulo}
            </Pieza>
            <Pieza className={`${tarjeta} -right-8 top-1/2 rotate-2 motion-safe:animate-balancea md:-right-[3.5em]`}>
              <span className="block text-xs font-medium opacity-70 md:text-[0.8em]">{h.mock.ganancia.etiqueta}</span>
              {h.mock.ganancia.monto}
            </Pieza>
            <Pieza className={`${tarjeta} -left-6 bottom-6 -rotate-2 bg-mango motion-safe:animate-balancea md:-left-[3em] md:bottom-[2em]`}>
              {h.mock.enlace.titulo}
            </Pieza>
          </Pieza>
        </div>
      );
    }

    case "citas": {
      // Cada cita llega como un mensaje de chat, una tras otra (y el dato al final)
      const PASO = 1.1;
      const primera = 0.9;
      return (
        <>
          <div className="flex flex-col gap-6 md:gap-[2em]">
            {titulo}
            <div className="flex flex-col gap-4 md:gap-[1.4em]">
              {c.citas.map((cita, i) => {
                const cuando = primera + i * PASO;
                const derecha = i % 2 === 1;
                return (
                  <div key={cita.autor} className={`relative max-w-[92%] md:max-w-[68%] ${derecha ? "self-end" : "self-start"}`}>
                    <Escribiendo retraso={cuando} derecha={derecha} />
                    <Aparecer retraso={cuando} origen={derecha ? "derecha" : "izquierda"} className={`flex flex-col gap-1 md:gap-[0.4em] ${derecha ? "items-end" : ""}`}>
                      <Etiqueta indice={i}>{cita.autor}</Etiqueta>
                      <blockquote
                        className={`rounded-3xl border border-teal-oscuro p-4 font-logo text-xl font-semibold leading-snug shadow-dura md:p-[1em] md:text-[2.4em] ${derecha ? "rounded-br-md bg-celeste-palido" : "rounded-bl-md bg-superficie"}`}
                      >
                        “{cita.texto}”
                      </blockquote>
                    </Aparecer>
                  </div>
                );
              })}
            </div>
            <Aparecer retraso={primera + c.citas.length * PASO} className="flex items-center gap-3 md:gap-[0.8em]">
              <span className="font-logo text-4xl font-semibold md:text-[4em]">{c.dato.cifra}</span>
              <span className="text-lg font-bold md:text-[1.9em]">{c.dato.texto}</span>
            </Aparecer>
          </div>
          <LotitoAnimado nombre={c.lotito} personalidad="problema" className="absolute bottom-0 right-0 hidden w-[17em] md:block" />
        </>
      );
    }

    case "bloques":
      if (c.disposicion === "estampas") {
        return (
          <div className="flex flex-col gap-6 md:gap-[2em]">
            {titulo}
            <div className="grid gap-4 md:grid-cols-3 md:gap-[1.8em]">
              {c.bloques.map((b, i) => (
                <Tarjeta key={b.etiqueta} giro={GIROS[i]} className="relative">
                  <span className="absolute -right-2 -top-3 flex size-9 items-center justify-center rounded-full border border-teal-oscuro bg-mango md:-right-[0.6em] md:-top-[0.8em] md:size-[2.6em]">
                    <Icon nombre={ICONOS_ESTAMPA[i]} className="size-5 md:size-[1.5em]" />
                  </span>
                  <Etiqueta indice={i}>{b.etiqueta}</Etiqueta>
                  {b.items && <Lista items={b.items} />}
                </Tarjeta>
              ))}
            </div>
          </div>
        );
      }
      if (c.disposicion === "cuadricula") {
        return (
          <div className="flex flex-col gap-5 md:gap-[1.6em]">
            {titulo}
            <div className="grid gap-3 md:grid-cols-4 md:gap-[1.2em]">
              {c.bloques.map((b, i) => (
                <Tarjeta key={b.etiqueta} giro={GIROS[i % GIROS.length] / 2}>
                  <Etiqueta indice={i}>{b.etiqueta}</Etiqueta>
                  {b.items && <Lista items={b.items} />}
                </Tarjeta>
              ))}
            </div>
          </div>
        );
      }
      // Boletos: el que paga es el más grande y lleno; el gratis, liso; el que queda afuera, punteado
      return (
        <div className="flex flex-col gap-6 md:gap-[2em]">
          {titulo}
          <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr] md:items-stretch md:gap-[1.6em]">
            {c.bloques.map((b, i) => (
              <Tarjeta
                key={b.etiqueta}
                giro={i === 1 ? 1 : i === 0 ? -1 : 0}
                fondo={i === 0 ? "bg-mango" : i === 1 ? "bg-white" : "bg-white/50"}
                marco={i === 2 ? "border-dashed" : "border-solid shadow-dura"}
                className={`relative justify-center ${i === 0 ? "md:p-[2em]" : ""}`}
              >
                {i === 0 && <Monito nombre="moneda" className="absolute -right-3 -top-5 w-14 rotate-12 text-teal-oscuro md:-right-[0.6em] md:-top-[1em] md:w-[5em]" />}
                <Etiqueta indice={i === 0 ? 1 : i}>{b.etiqueta}</Etiqueta>
                <p className={`font-bold leading-snug ${i === 0 ? "text-xl md:text-[2.3em]" : "text-lg md:text-[1.8em]"}`}>{b.texto}</p>
                <p className="text-base md:text-[1.5em]">{b.ejemplo}</p>
              </Tarjeta>
            ))}
          </div>
        </div>
      );

    case "funciones":
      return (
        <div className="flex flex-col gap-5 md:gap-[1.6em]">
          {titulo}
          <Pieza className="-rotate-1 self-start rounded-2xl border border-teal-oscuro bg-mango px-4 py-2 text-lg font-bold leading-snug shadow-dura md:px-[1em] md:py-[0.5em] md:text-[2em]">
            {c.pregunta}
          </Pieza>
          <ul className="grid gap-3 md:grid-cols-3 md:gap-[1.2em]">
            {c.funciones.map((f, i) => (
              <li key={f.nombre} className="contents">
                <Tarjeta giro={GIROS[i % GIROS.length] / 2}>
                  <p className="text-base font-bold leading-snug md:text-[1.75em]">{f.nombre}</p>
                  <Puntos respaldo={f.respaldo} retraso={0.9 + i * 0.12} />
                </Tarjeta>
              </li>
            ))}
          </ul>
        </div>
      );

    case "demo":
      return (
        <div className="flex flex-col items-center gap-6 text-center md:gap-[2em]">
          <div className="relative">
            <Pulso />
            <LotitoAnimado nombre={c.lotito} personalidad="demo" className="relative w-44 md:w-[20em]" />
            <SelloEnVivo />
          </div>
          <Titulo className="md:!text-[6em]">{lamina.titulo}</Titulo>
          <Pieza className="flex flex-wrap justify-center gap-3">
            {c.enlaces.map((e, i) => (
              <a key={e.href} href={e.href} target="_blank" rel="noopener noreferrer" className={estiloBoton(i === 0 ? "mango" : "secundario")}>
                {e.etiqueta}
                <span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
            ))}
          </Pieza>
        </div>
      );

    case "posicionamiento":
      return (
        <div className="flex flex-col gap-5 md:gap-[1.6em]">
          {titulo}
          <div className="grid gap-5 md:grid-cols-[1fr_1.15fr] md:gap-[2em]">
            <div className="flex flex-col gap-4 md:gap-[1.2em]">
              {c.bloques.map((b, i) =>
                b.items ? (
                  <Pieza key={b.etiqueta} className="flex flex-col gap-2 md:gap-[0.6em]">
                    <Etiqueta indice={i}>{b.etiqueta}</Etiqueta>
                    <ul className="flex flex-wrap gap-2 md:gap-[0.6em]">
                      {b.items.map((item, k) => (
                        <Chip key={item} i={k}>
                          {item}
                        </Chip>
                      ))}
                    </ul>
                  </Pieza>
                ) : (
                  <Pieza key={b.etiqueta} className="flex flex-col gap-2 md:gap-[0.5em]">
                    <Etiqueta indice={i}>{b.etiqueta}</Etiqueta>
                    <p className="text-base font-bold leading-snug md:text-[1.6em]">{b.texto}</p>
                  </Pieza>
                ),
              )}
            </div>
            <Pieza className="rotate-1 self-center rounded-2xl border border-teal-oscuro bg-teal-oscuro p-5 text-perla shadow-dura md:p-[1.5em]">
              <MensajePorPartes mensaje={c.mensaje} resaltar={c.resaltar} retraso={1.5} className="font-logo text-xl font-semibold leading-snug md:text-[2.6em]" />
            </Pieza>
          </div>
        </div>
      );

    case "bloquesHitos":
      return (
        <div className="flex flex-col gap-5 md:gap-[1.6em]">
          {titulo}
          <div className={`grid gap-4 md:gap-[1.6em] ${c.bloques.length > 2 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            {c.bloques.map((b, i) => (
              <Tarjeta key={b.etiqueta} giro={i % 2 ? 1 : -1}>
                <Etiqueta indice={i}>{b.etiqueta}</Etiqueta>
                {b.marca && <SelloMarca marca={b.marca} />}
                {b.texto && <p className="text-lg font-bold leading-snug md:text-[1.9em]">{b.texto}</p>}
                {b.items && (
                  <ul className="flex flex-wrap gap-2 md:gap-[0.6em]">
                    {b.items.map((item, k) => (
                      <Chip key={item} i={k + i}>
                        {item}
                      </Chip>
                    ))}
                  </ul>
                )}
              </Tarjeta>
            ))}
          </div>
          <LineaDeTiempo titulo={c.hitosTitulo} hitos={c.hitos} />
        </div>
      );

    case "metricas":
      return (
        <div className="flex flex-col gap-5 md:gap-[1.6em]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:gap-x-[1.2em]">
            {titulo}
            <Pieza className="flex -rotate-3">
              <Etiqueta>{c.piloto}</Etiqueta>
            </Pieza>
          </div>
          <Pieza className="text-base font-bold md:text-[1.5em]">{c.medicion}</Pieza>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-[1.2em]">
            {c.metricas.map((m, i) => (
              <li key={m.nombre} className="contents">
                <Tarjeta>
                  <span className="font-logo text-4xl font-semibold leading-none md:text-[4.6em]">
                    <Contador valor={m.valor} retraso={0.8 + i * 0.12} />
                  </span>
                  <Barra fraccion={Number.parseFloat(m.valor) / 100} retraso={0.8 + i * 0.12} />
                  <span className="text-base font-bold leading-snug md:text-[1.6em]">{m.nombre}</span>
                  <span className="text-sm text-texto-2 md:text-[1.35em]">{m.detalle}</span>
                  <span className="text-xs font-bold md:text-[1.1em]">{m.medicion}</span>
                </Tarjeta>
              </li>
            ))}
          </ul>
          <Pieza className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-teal-oscuro bg-teal-oscuro px-5 py-3 text-perla shadow-dura md:flex-nowrap md:gap-x-[1.2em] md:px-[1.4em] md:py-[0.9em]">
            <span className="text-sm font-bold uppercase tracking-wide md:text-[1.2em]">{c.economia.etiqueta}</span>
            <span className="font-logo text-3xl font-semibold md:text-[3em]">
              <Contador valor={c.economia.valor} retraso={1.4} />
            </span>
            <Barra
              fraccion={Number.parseFloat(c.economia.valor) / c.economia.meta}
              retraso={1.4}
              pista="bg-white/20 !border-perla"
              relleno="bg-mango"
              className="min-w-24 flex-1"
            />
            <span className="text-sm font-bold md:text-[1.4em]">meta {c.economia.meta}</span>
            <span className="text-base font-bold md:text-[1.6em]">{c.economia.nota}</span>
          </Pieza>
        </div>
      );

    case "cierre":
      return (
        <div className="flex flex-col gap-6 md:grid md:grid-cols-[3fr_2fr] md:items-center md:gap-[3em]">
          <div className="flex flex-col gap-5 md:gap-[1.6em]">
            <Titulo className="md:!text-[7em]">{lamina.titulo}</Titulo>
            <Pieza como="p" className="font-logo text-xl font-semibold leading-snug md:text-[2.4em]">{c.mensaje}</Pieza>
            <Pieza className="flex">
              <a href={c.enlace.href} target="_blank" rel="noopener noreferrer" className={estiloBoton("mango")}>
                {c.enlace.etiqueta}
                <span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
            </Pieza>
          </div>
          <div className="relative">
            <Confeti />
            <LotitoAnimado nombre={c.lotito} personalidad="cierre" className="w-40 self-center md:w-full md:max-w-[24em]" />
          </div>
        </div>
      );
  }
}

/** Una lámina. En móvil el contenido corre hacia abajo si no cabe; en escritorio 1em = 1% del ancho del escenario. */
export function Lamina({ lamina }: { lamina: DatosLamina }) {
  const a = lamina.ayudante;
  return (
    <section aria-roledescription="lámina" className={`relative size-full overflow-hidden md:text-[1cqw] ${TONOS[lamina.tono]}`}>
      <Fondo id={lamina.id} tono={lamina.tono} />
      <motion.div
        initial="oculto"
        animate="visible"
        variants={grupo}
        className="relative z-10 flex size-full flex-col overflow-y-auto p-5 md:justify-center md:overflow-hidden md:p-[4.5em]"
      >
        <Cuerpo lamina={lamina} />
        {a && (
          <LotitoAnimado
            nombre={a.pose}
            personalidad={a.reaccion}
            className={`absolute bottom-0 hidden w-[9em] md:block ${a.lado === "derecha" ? "right-[5%]" : "left-[5%]"}`}
          />
        )}
      </motion.div>
    </section>
  );
}
