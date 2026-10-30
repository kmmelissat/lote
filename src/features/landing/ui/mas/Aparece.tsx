"use client";

import { motion, useReducedMotion } from "motion/react";
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;
const vista = { once: true, amount: 0.2, margin: "0px 0px -48px 0px" } as const;

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
  const inicio = reducido ? { opacity: 0 } : { opacity: 0, y: 40, rotate: -2, scale: 0.97 };
  const fin = { opacity: 1, y: 0, rotate: 0, scale: 1 };
  const paso = { duration: reducido ? 0.25 : 0.65, delay, ease };
  return (
    <motion.div
      className={className}
      initial={inicio}
      animate={alCargar ? fin : undefined}
      whileInView={alCargar ? undefined : fin}
      viewport={alCargar ? undefined : vista}
      transition={paso}
    >
      {children}
    </motion.div>
  );
}

/** Lista (o grupo) que saca a sus hijos en cadena. */
export function ApareceGrupo({
  children,
  className,
  as = "ul",
}: {
  children: ReactNode;
  className?: string;
  as?: "ul" | "ol" | "div";
}) {
  const Comp = as === "ol" ? "ol" : as === "div" ? "div" : "ul";
  return (
    <Comp className={className}>
      {(() => {
        let n = 0;
        return Children.map(children, (child) => {
          if (!isValidElement(child)) return child;
          if (child.type !== ApareceItem && child.type !== ApareceCaja) return child;
          return cloneElement(child as ReactElement<{ delay?: number }>, { delay: n++ * 0.1 });
        });
      })()}
    </Comp>
  );
}

export function ApareceItem({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reducido = useReducedMotion();
  return (
    <motion.li
      className={className}
      initial={reducido ? { opacity: 0 } : { opacity: 0, y: 44, rotate: -2, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      viewport={vista}
      transition={{ duration: reducido ? 0.25 : 0.6, delay, ease }}
    >
      {children}
    </motion.li>
  );
}

export function ApareceCaja({
  children,
  className,
  delay = 0,
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
    <Comp
      className={className}
      initial={reducido ? { opacity: 0 } : { opacity: 0, y: 44, rotate: -2, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      viewport={vista}
      transition={{ duration: reducido ? 0.25 : 0.6, delay, ease }}
    >
      {children}
    </Comp>
  );
}
