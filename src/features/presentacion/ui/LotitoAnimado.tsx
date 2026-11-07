"use client";

import { motion, useReducedMotion } from "motion/react";
import { LotitoMas, type PoseLotito } from "@/components/ui/LotitoMas";
import { EASE } from "../animacion";

/** Cada Lotito reacciona distinto según la lámina. Con reduced-motion solo aparece (opacidad). */
export type Personalidad = "portada" | "problema" | "demo" | "cierre";

const RESORTE = { type: "spring", stiffness: 180, damping: 14 } as const;

export function LotitoAnimado({ nombre, personalidad, className = "" }: { nombre: PoseLotito; personalidad: Personalidad; className?: string }) {
  const reducido = useReducedMotion();
  const dibujo = <LotitoMas nombre={nombre} className="w-full" />;

  if (reducido) {
    return (
      <motion.div className={className} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.2 }}>
        {dibujo}
      </motion.div>
    );
  }

  switch (personalidad) {
    // Cae con un rebote y saluda con la mano.
    case "portada":
      return (
        <motion.div className={className} initial={{ y: 90, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ ...RESORTE, delay: 0.5 }}>
          <motion.div style={{ transformOrigin: "50% 100%" }} animate={{ rotate: [0, -7, 6, -6, 4, 0] }} transition={{ delay: 1.2, duration: 1.4, ease: "easeInOut" }}>
            {dibujo}
          </motion.div>
        </motion.div>
      );

    // Se asoma por el borde derecho y se inclina hacia las burbujas, como leyendo lo que dicen.
    case "problema":
      return (
        <motion.div className={className} initial={{ x: "70%", rotate: 10, opacity: 0 }} animate={{ x: "22%", rotate: -4, opacity: 1 }} transition={{ ...RESORTE, delay: 1.1 }}>
          <motion.div
            style={{ transformOrigin: "50% 100%" }}
            animate={{ rotate: [0, -9, 0, -9, 0] }}
            transition={{ delay: 2.3, duration: 1.6, ease: "easeInOut" }}
          >
            {dibujo}
          </motion.div>
        </motion.div>
      );

    // Sube con el celular y de vez en cuando hace "tap".
    case "demo":
      return (
        <motion.div className={className} initial={{ y: 70, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...RESORTE, delay: 0.3 }}>
          <motion.div
            style={{ transformOrigin: "50% 100%" }}
            animate={{ scale: [1, 1, 1.06, 1, 1], rotate: [0, 0, -3, 0, 0] }}
            transition={{ delay: 1.5, duration: 3.2, ease: "easeInOut", repeat: Infinity }}
          >
            {dibujo}
          </motion.div>
        </motion.div>
      );

    // Entra por el lado y se despide agitando la mano varias veces.
    case "cierre":
      return (
        <motion.div className={className} initial={{ x: 140, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ ...RESORTE, delay: 0.6 }}>
          <motion.div
            style={{ transformOrigin: "30% 100%" }}
            animate={{ rotate: [0, 10, -5, 10, -5, 10, 0] }}
            transition={{ delay: 1.4, duration: 1.8, ease: EASE }}
          >
            {dibujo}
          </motion.div>
        </motion.div>
      );
  }
}
