"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;
const vista = { once: true, amount: 0.1 };
const entrada = { opacity: 0, y: 18 };
const visible = { opacity: 1, y: 0 };

function cn(...partes: (string | undefined)[]) {
  return partes.filter(Boolean).join(" ");
}

const grupo = {
  oculto: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const pieza = {
  oculto: entrada,
  visible: { ...visible, transition: { duration: 0.5, ease } },
};

const piezaQuieta = {
  oculto: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

/** Un bloque que entra al scrollear (o al cargar, en el hero). */
export function Aparece({
  children,
  className,
  delay = 0,
  alCargar = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  alCargar?: boolean;
}) {
  const reducido = useReducedMotion();
  // El hero no puede ir a opacity 0 en el HTML: en el celular se veía una pantalla vacía
  // hasta que hidrataba Motion. CSS anima en el primer paint, sin esperar JS.
  if (alCargar) {
    return (
      <div className={`${className ?? ""} animate-entra`} style={delay ? { animationDelay: `${delay}s` } : undefined}>
        {children}
      </div>
    );
  }
  const inicio = reducido ? { opacity: 0 } : entrada;
  const paso = { duration: reducido ? 0.2 : 0.5, delay, ease };
  return (
    <motion.div className={cn(className, "aparece")} initial={inicio} whileInView={visible} viewport={vista} transition={paso}>
      {children}
    </motion.div>
  );
}

/** Lista (o grupo) que saca a sus hijos en cadena cuando entra el bloque, no cada tarjeta por su cuenta. */
export function ApareceGrupo({
  children,
  className,
  as = "ul",
}: {
  children: ReactNode;
  className?: string;
  as?: "ul" | "ol" | "div";
}) {
  const Comp = as === "ol" ? motion.ol : as === "div" ? motion.div : motion.ul;
  return (
    <Comp className={className} initial="oculto" whileInView="visible" viewport={vista} variants={grupo}>
      {children}
    </Comp>
  );
}

export function ApareceItem({ children, className }: { children: ReactNode; className?: string; delay?: number }) {
  const reducido = useReducedMotion();
  return (
    <motion.li className={cn(className, "aparece")} variants={reducido ? piezaQuieta : pieza}>
      {children}
    </motion.li>
  );
}

export function ApareceCaja({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "article";
}) {
  const reducido = useReducedMotion();
  const Comp = as === "article" ? motion.article : motion.div;
  return (
    <Comp className={cn(className, "aparece")} variants={reducido ? piezaQuieta : pieza}>
      {children}
    </Comp>
  );
}
