"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { textos } from "@/lib/textos";

const t = textos.mostrador.barras;

// BarcodeDetector todavía no viene en los tipos de TypeScript.
type CodigoDetectado = { rawValue: string };
type DetectorDeCodigos = { detect: (fuente: HTMLVideoElement) => Promise<CodigoDetectado[]> };
type ConstructorDetector = new (opciones?: { formats?: string[] }) => DetectorDeCodigos;

const detectorDelNavegador = (): ConstructorDetector | null =>
  typeof window !== "undefined" && "BarcodeDetector" in window
    ? (window as unknown as { BarcodeDetector: ConstructorDetector }).BarcodeDetector
    : null;

/** ¿Este navegador puede leer códigos de barras con la cámara? (Chrome y Edge sí; Safari y Firefox todavía no). */
export const camaraDisponible = (): boolean => detectorDelNavegador() !== null;

/** Lo mismo código dos veces seguidas dentro de este tiempo cuenta como una sola lectura. */
const ESPERA_MISMO_CODIGO = 2000;
const INTERVALO_LECTURA = 250;

/**
 * La cámara abierta leyendo códigos de barras. Sigue leyendo hasta que se cierra, para poder escanear varios
 * productos seguidos; cada código nuevo se avisa con `alLeer`.
 */
export function EscanerCamara({ alLeer, cerrar }: { alLeer: (codigo: string) => void; cerrar: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);
  // La función de afuera cambia en cada pintura; se guarda aparte para que la cámara no se reinicie.
  const aviso = useRef(alLeer);
  useEffect(() => {
    aviso.current = alLeer;
  });

  useEffect(() => {
    const Detector = detectorDelNavegador();
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      // Se avisa en el siguiente turno para no cambiar el estado dentro del propio efecto.
      const id = setTimeout(() => setError(true), 0);
      return () => clearTimeout(id);
    }

    let vigente = true;
    let flujo: MediaStream | null = null;
    let reloj: ReturnType<typeof setInterval> | null = null;
    const detector = new Detector();
    let ultimo = { codigo: "", en: 0 };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then(async (f) => {
        if (!vigente) {
          f.getTracks().forEach((p) => p.stop());
          return;
        }
        flujo = f;
        const el = video.current;
        if (!el) return;
        el.srcObject = f;
        await el.play();

        let leyendo = false;
        reloj = setInterval(async () => {
          if (leyendo || el.readyState < 2) return;
          leyendo = true;
          try {
            const [primero] = await detector.detect(el);
            const codigo = primero?.rawValue;
            const ahora = Date.now();
            if (codigo && (codigo !== ultimo.codigo || ahora - ultimo.en > ESPERA_MISMO_CODIGO)) {
              ultimo = { codigo, en: ahora };
              aviso.current(codigo);
            }
          } catch {
            // Un cuadro que no se pudo leer no es un error: se prueba con el siguiente.
          } finally {
            leyendo = false;
          }
        }, INTERVALO_LECTURA);
      })
      .catch(() => vigente && setError(true));

    return () => {
      vigente = false;
      if (reloj) clearInterval(reloj);
      flujo?.getTracks().forEach((p) => p.stop());
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-teal-oscuro p-3 text-white">
      <div className="flex items-start justify-between gap-3 px-1">
        <div>
          <p className="font-bold">{t.camaraTitulo}</p>
          <p className="text-sm text-white/80">{t.camaraAyuda}</p>
        </div>
      </div>
      {error ? (
        <p role="alert" className="rounded-2xl bg-white/10 p-4 text-sm">
          {t.camaraError}
        </p>
      ) : (
        <video ref={video} muted playsInline className="aspect-[4/3] w-full rounded-2xl bg-black object-cover" />
      )}
      <Button type="button" variante="secundario" onClick={cerrar}>
        {t.camaraCerrar}
      </Button>
    </div>
  );
}
