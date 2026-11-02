"use client";

import { useEffect, useRef, useState, useTransition, type Dispatch, type SetStateAction } from "react";
import { categoriaPorTexto } from "@/features/catalog/rubros";
import { sugerirFicha, type FichaSugerida } from "../actions/nuevo";
import { estadoVacio, opcionNueva, type EstadoEditor } from "../editorVariantes";
import { leerDetalles, type Detalle } from "../infoExtra";
import type { EstadoLotito } from "./CartelLotito";

type CampoLotito = Extract<keyof FichaSugerida, "nombre" | "categoria" | "marca" | "descripcion">;
const ORDEN_LOTITO: CampoLotito[] = [
  "nombre",
  "categoria",
  "marca",
  "descripcion",
];
/** Lo que tarda Lotito en "escribir" cada campo, para que se sienta que va llenando uno por uno */
const PAUSA_MS = 380;

type Valores = Record<string, string>;

/** Lotito lee la primera foto y llena lo que está vacío. También abre y cierra los bloques opcionales. */
export function useFichaLotito({
  fotoInicial,
  v,
  variantesIniciales,
  nombre,
  setNombre,
  categoria,
  setCategoria,
  marca,
  setMarca,
  descripcion,
  setDescripcion,
  condicion,
  setCondicion,
  detalles,
  setDetalles,
  editor,
  setEditor,
  setTipo,
  setRutas,
}: {
  fotoInicial: string | null;
  v: Valores;
  variantesIniciales: object | null;
  nombre: string;
  setNombre: (s: string) => void;
  categoria: string;
  setCategoria: (s: string) => void;
  marca: string;
  setMarca: (s: string) => void;
  descripcion: string;
  setDescripcion: (s: string) => void;
  condicion: "nuevo" | "usado";
  setCondicion: (c: "nuevo" | "usado") => void;
  detalles: Detalle[];
  setDetalles: Dispatch<SetStateAction<Detalle[]>>;
  editor: EstadoEditor;
  setEditor: Dispatch<SetStateAction<EstadoEditor>>;
  setTipo: (tipo: "simple" | "variantes") => void;
  setRutas: (rutas: string[]) => void;
}) {
  // Cuáles bloques opcionales están abiertos (los que Lotito llena se abren solos, para que se vea qué revisar)
  // Al editar (o repetir un producto) los bloques que ya tienen datos arrancan abiertos
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>(() => {
    const hay = (k: string) => Boolean(v[k]?.trim());
    return {
      costos: hay("precio_anterior") || hay("envio") || hay("importacion") || hay("mano_obra") || hay("otro"),
      masInfo: hay("marca") || v.condicion === "usado" || hay("estado_detalle") || leerDetalles(v.detalles).length > 0,
    };
  });
  // Lo que Lotito llenó además de los campos de texto, para poder deshacerlo
  const [extrasLotito, setExtrasLotito] = useState({ variantes: false, detalles: false, condicion: false });

  // Lotito: lo que llenó, qué está haciendo y cuál foto ya leyó
  const [deLotito, setDeLotito] = useState<Set<CampoLotito>>(new Set());
  const [estadoLotito, setEstadoLotito] = useState<EstadoLotito>("quieto");
  const [escribiendo, setEscribiendo] = useState<Set<CampoLotito>>(new Set());
  const [, empezarLectura] = useTransition();
  // Al editar, la foto que ya tiene no se vuelve a leer: Lotito solo mira las que se agregan
  const leida = useRef<string | null>(fotoInicial);
  const temporizadores = useRef<number[]>([]);
  useEffect(() => () => temporizadores.current.forEach(clearTimeout), []);

  const setters: Record<CampoLotito, (s: string) => void> = {
    nombre: setNombre,
    categoria: setCategoria,
    marca: setMarca,
    descripcion: setDescripcion,
  };
  const actuales: Record<CampoLotito, string> = {
    nombre,
    categoria,
    marca,
    descripcion,
  };

  // Lotito no pisa lo que escribió la persona: solo llena campos vacíos o los que él mismo había llenado.
  function aplicar(visto: FichaSugerida) {
    // Lo que Lotito vio se pasa a la categoría del catálogo que más se parece; si no dice nada, queda vacío
    const f = { ...visto, categoria: categoriaPorTexto(visto.categoria)?.nombre ?? null };
    const llenar = ORDEN_LOTITO.filter(
      (c) => f[c] && (!actuales[c].trim() || deLotito.has(c)),
    );
    setEscribiendo(new Set(llenar));
    llenar.forEach((campo, i) => {
      temporizadores.current.push(
        window.setTimeout(
          () => {
            setters[campo](f[campo] as string);
            setDeLotito((d) => new Set(d).add(campo));
            setEscribiendo((s) => {
              const n = new Set(s);
              n.delete(campo);
              return n;
            });
            if (i === llenar.length - 1) setEstadoLotito("listo");
          },
          PAUSA_MS * (i + 1),
        ),
      );
    });
    if (!llenar.length) setEstadoLotito("listo");

    // Lo demás que vio: condición, detalles y, si hay varias versiones, las variantes. Nunca pisa lo que ya puso la persona.
    const extras = { variantes: false, detalles: false, condicion: false };
    if (visto.condicion && (condicion === "nuevo" || extrasLotito.condicion)) {
      setCondicion(visto.condicion);
      extras.condicion = visto.condicion === "usado";
    }
    if (visto.detalles.length && (!detalles.length || extrasLotito.detalles)) {
      setDetalles(visto.detalles);
      extras.detalles = true;
    }
    // Las arma si todavía no hay valores escritos (esté en la pestaña que esté) o si las había puesto él mismo
    const sinValores = editor.opciones.every((o) => !o.valores.length);
    if (visto.opciones.length && !variantesIniciales && (sinValores || extrasLotito.variantes)) {
      setEditor((ed) => ({ ...ed, opciones: visto.opciones.map((o) => opcionNueva(o.nombre, o.valores)) }));
      setTipo("variantes");
      extras.variantes = true;
    }
    setExtrasLotito(extras);

    // Todo lo que Lotito llenó se abre: así se ve de una vez qué hay que revisar
    const llenoMasInfo = Boolean(f.marca && (!marca.trim() || deLotito.has("marca"))) || extras.detalles || extras.condicion;
    setAbiertos((a) => ({ ...a, ...(extras.variantes ? { variantes: true } : {}), ...(llenoMasInfo ? { masInfo: true } : {}) }));
  }

  // Apenas hay una foto nueva arranca solo: un solo gesto, sin botón de "analizar".
  function leerFoto(ruta: string) {
    leida.current = ruta;
    setEstadoLotito("leyendo");
    setEscribiendo(new Set(ORDEN_LOTITO.filter((c) => !actuales[c].trim())));
    empezarLectura(async () => {
      const r = await sugerirFicha(ruta);
      if ("ficha" in r) aplicar(r.ficha);
      else {
        setEscribiendo(new Set());
        setEstadoLotito(r.error === "sin_ia" ? "sin_ia" : "borrosa");
      }
    });
  }

  function cambiarFotos(nuevas: string[]) {
    setRutas(nuevas);
    if (nuevas[0] && nuevas[0] !== leida.current) leerFoto(nuevas[0]);
  }

  const editar = (campo: CampoLotito) => (valor: string) => {
    setters[campo](valor);
    if (deLotito.has(campo))
      setDeLotito((d) => {
        const n = new Set(d);
        n.delete(campo);
        return n;
      });
  };

  function deshacerLotito() {
    temporizadores.current.forEach(clearTimeout);
    deLotito.forEach((c) => setters[c](""));
    setDeLotito(new Set());
    if (extrasLotito.condicion) setCondicion("nuevo");
    if (extrasLotito.detalles) setDetalles([]);
    if (extrasLotito.variantes) {
      setTipo("simple");
      setEditor((ed) => ({ ...ed, opciones: estadoVacio().opciones }));
    }
    setExtrasLotito({ variantes: false, detalles: false, condicion: false });
    setEscribiendo(new Set());
    setEstadoLotito("quieto");
  }

  const brillo = (c: CampoLotito) => escribiendo.has(c);
  const hayLotito = deLotito.size > 0 || extrasLotito.variantes || extrasLotito.detalles || extrasLotito.condicion;

  // Los bloques opcionales vienen cerrados; la persona los abre. Si tienen un error, o Lotito llenó algo ahí, se abren solos.
  const estaAbierto = (id: string, defecto = false, forzar = false) => forzar || (abiertos[id] ?? defecto);
  const alternar = (id: string, defecto = false, forzar = false) => setAbiertos((a) => ({ ...a, [id]: !estaAbierto(id, defecto, forzar) }));

  return { deLotito, estadoLotito, extrasLotito, hayLotito, brillo, cambiarFotos, editar, deshacerLotito, estaAbierto, alternar };
}
