"use client";

import { motion } from "motion/react";
import { estiloBoton } from "@/components/ui/Button";
import { grupo } from "../animacion";
import type { Lamina as DatosLamina, Contenido, TonoLamina } from "../laminas";
import { Fondo } from "./Fondo";
import { LotitoAnimado } from "./LotitoAnimado";
import { Aparecer, Contador, Etiqueta, MensajePorPartes, Pieza, Tarjeta, TarjetaBloque, Texto, Titulo } from "./piezas";

// Fondo y texto de cada tono, con los tokens de Lote (todos con contraste alto contra teal-oscuro).
const TONOS: Record<TonoLamina, string> = {
  crema: "bg-crema text-teal-oscuro",
  limon: "bg-limon text-teal-oscuro",
  rosa: "bg-rosa-palido text-teal-oscuro",
  celeste: "bg-celeste-palido text-teal-oscuro",
  menta: "bg-teal-fondo text-teal-oscuro",
  teal: "bg-teal-oscuro text-perla",
};

// Todos los diseños comparten el título como h1; el resto del contenido depende del tipo.
function Cuerpo({ lamina }: { lamina: DatosLamina }) {
  const c: Contenido = lamina.contenido;
  const titulo = <Titulo>{lamina.titulo}</Titulo>;

  switch (c.tipo) {
    case "portada":
      return (
        <div className="flex flex-col gap-6 md:grid md:grid-cols-[3fr_2fr] md:items-center md:gap-[3em]">
          <div className="flex flex-col gap-4 md:gap-[1.4em]">
            <Titulo className="md:!text-[9em]">{lamina.titulo}</Titulo>
            <Texto className="font-bold">{c.subtitulo}</Texto>
            <Pieza como="ul" className="flex flex-wrap gap-2 md:gap-[0.6em]">
              {c.equipo.map((nombre) => (
                <li key={nombre} className="rounded-full border border-teal-oscuro bg-white px-3 py-1 text-sm font-bold md:px-[0.9em] md:text-[1.4em]">
                  {nombre}
                </li>
              ))}
            </Pieza>
            <Pieza como="p" className="text-sm text-texto-2 md:text-[1.4em]">{c.curso}</Pieza>
          </div>
          <LotitoAnimado nombre={c.lotito} personalidad="portada" className="w-40 self-center md:w-full md:max-w-[26em]" />
        </div>
      );

    case "citas": {
      // Cada cita llega como un mensaje de chat, una tras otra (y el dato al final)
      const PASO = 0.9;
      const primera = 0.6;
      return (
        <>
          <div className="flex flex-col gap-6 md:gap-[2em]">
            {titulo}
            <div className="flex flex-col gap-4 md:gap-[1.4em]">
              {c.citas.map((cita, i) => (
                <Aparecer key={cita.autor} retraso={primera + i * PASO} origen={i % 2 ? "derecha" : "izquierda"} className={`flex max-w-[92%] flex-col gap-1 md:max-w-[68%] md:gap-[0.4em] ${i % 2 ? "self-end items-end" : "self-start"}`}>
                  <Etiqueta indice={i}>{cita.autor}</Etiqueta>
                  <blockquote
                    className={`rounded-3xl border border-teal-oscuro p-4 font-logo text-xl font-semibold leading-snug shadow-dura md:p-[1em] md:text-[2.4em] ${i % 2 ? "rounded-br-md bg-celeste-palido" : "rounded-bl-md bg-superficie"}`}
                  >
                    “{cita.texto}”
                  </blockquote>
                </Aparecer>
              ))}
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
      return (
        <div className="flex flex-col gap-6 md:gap-[2em]">
          {titulo}
          <div className="grid gap-4 md:grid-cols-3 md:gap-[1.6em]">
            {c.bloques.map((b, i) => (
              <TarjetaBloque key={b.etiqueta} bloque={b} indice={i} />
            ))}
          </div>
        </div>
      );

    case "funciones":
      return (
        <div className="flex flex-col gap-5 md:gap-[1.6em]">
          {titulo}
          <Texto className="font-bold">{c.pregunta}</Texto>
          <ul className="grid gap-3 md:grid-cols-3 md:gap-[1.2em]">
            {c.funciones.map((f, i) => (
              <li key={f.nombre} className="contents">
                <Tarjeta>
                  <p className="text-base font-bold leading-snug md:text-[1.75em]">{f.nombre}</p>
                  <Etiqueta indice={i}>{f.respaldo}</Etiqueta>
                </Tarjeta>
              </li>
            ))}
          </ul>
        </div>
      );

    case "demo":
      return (
        <div className="flex flex-col items-center gap-6 text-center md:gap-[2em]">
          <LotitoAnimado nombre={c.lotito} personalidad="demo" className="w-44 md:w-[20em]" />
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
          <div className="grid gap-4 md:grid-cols-[1.1fr_1fr] md:gap-[1.6em]">
            <div className="flex flex-col gap-3 md:gap-[1em]">
              {c.bloques.map((b, i) =>
                b.items ? (
                  <Pieza key={b.etiqueta} className="flex flex-col gap-2 md:gap-[0.6em]">
                    <Etiqueta indice={i}>{b.etiqueta}</Etiqueta>
                    <ul className="flex flex-wrap gap-2 md:gap-[0.5em]">
                      {b.items.map((item) => (
                        <li key={item} className="rounded-full border border-teal-oscuro bg-white px-3 py-1 text-sm font-bold md:px-[0.9em] md:text-[1.35em]">
                          {item}
                        </li>
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
            <Pieza className="self-center rounded-2xl border border-teal-oscuro bg-teal-oscuro p-5 text-perla shadow-dura md:p-[1.4em]">
              <MensajePorPartes mensaje={c.mensaje} retraso={1.4} className="font-logo text-xl font-semibold leading-snug md:text-[2.4em]" />
            </Pieza>
          </div>
        </div>
      );

    case "bloquesHitos":
      return (
        <div className="flex flex-col gap-5 md:gap-[1.6em]">
          {titulo}
          <div className="grid gap-4 md:grid-cols-2 md:gap-[1.6em]">
            <div className="flex flex-col gap-3 md:gap-[1.2em]">
              {c.bloques.map((b, i) => (
                <TarjetaBloque key={b.etiqueta} bloque={b} indice={i} />
              ))}
            </div>
            <Tarjeta className="justify-center">
              <Etiqueta indice={2}>{c.hitosTitulo}</Etiqueta>
              <ol className="flex flex-col gap-3 md:gap-[0.9em]">
                {c.hitos.map((h) => (
                  <Pieza como="li" key={h.cuando} className="flex flex-col md:gap-[0.1em]">
                    <span className="text-sm font-bold text-rosa-texto md:text-[1.3em]">{h.cuando}</span>
                    <span className="text-base font-bold leading-snug md:text-[1.7em]">{h.que}</span>
                  </Pieza>
                ))}
              </ol>
            </Tarjeta>
          </div>
        </div>
      );

    case "metricas":
      return (
        <div className="flex flex-col gap-5 md:gap-[1.6em]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:gap-x-[1.2em]">
            {titulo}
            <Pieza className="flex">
              <Etiqueta>{c.piloto}</Etiqueta>
            </Pieza>
          </div>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-[1.2em]">
            {c.metricas.map((m, i) => (
              <li key={m.nombre} className="contents">
                <Tarjeta>
                  <span className="font-logo text-4xl font-semibold leading-none md:text-[4.6em]"><Contador valor={m.valor} retraso={0.7 + i * 0.12} /></span>
                  <span className="text-base font-bold leading-snug md:text-[1.6em]">{m.nombre}</span>
                  <span className="text-sm text-texto-2 md:text-[1.35em]">{m.detalle}</span>
                </Tarjeta>
              </li>
            ))}
          </ul>
          <Pieza className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-teal-oscuro bg-teal-oscuro px-5 py-3 text-perla shadow-dura md:gap-x-[1.2em] md:px-[1.4em] md:py-[0.9em]">
            <span className="text-sm font-bold uppercase tracking-wide md:text-[1.2em]">{c.economia.etiqueta}</span>
            <span className="font-logo text-3xl font-semibold md:text-[3em]">
              <Contador valor={c.economia.valor} retraso={1.3} />
            </span>
            <span className="text-base font-bold md:text-[1.7em]">{c.economia.nota}</span>
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
          <LotitoAnimado nombre={c.lotito} personalidad="cierre" className="w-40 self-center md:w-full md:max-w-[24em]" />
        </div>
      );
  }
}

/** Una lámina. En móvil el contenido corre hacia abajo si no cabe; en escritorio 1em = 1% del ancho del escenario. */
export function Lamina({ lamina }: { lamina: DatosLamina }) {
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
      </motion.div>
    </section>
  );
}
