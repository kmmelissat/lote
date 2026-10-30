export const CLAVE_VISTA = "lote_menu_vista";
export const EVENTO_VISTA = "lote-menu-vista";
export const VISTAS = ["isla", "pildoras", "faja", "lista"] as const;
export type VistaMenu = (typeof VISTAS)[number];

const LEGADO: Record<string, VistaMenu> = {
  crema: "isla",
  teal: "pildoras",
  papel: "faja",
  compacta: "lista",
};

export const suscribirVista = (aviso: () => void) => {
  window.addEventListener("storage", aviso);
  window.addEventListener(EVENTO_VISTA, aviso);
  return () => {
    window.removeEventListener("storage", aviso);
    window.removeEventListener(EVENTO_VISTA, aviso);
  };
};

export const vistaMenu = (): VistaMenu => {
  try {
    const v = localStorage.getItem(CLAVE_VISTA);
    if (v && (VISTAS as readonly string[]).includes(v)) return v as VistaMenu;
    if (v && v in LEGADO) return LEGADO[v];
  } catch {}
  return "isla";
};

export function guardarVista(v: VistaMenu) {
  try {
    localStorage.setItem(CLAVE_VISTA, v);
  } catch {}
  window.dispatchEvent(new Event(EVENTO_VISTA));
}

/** El marco: si flota, si es redondo, si es una columna. El ancho cerrado lo pone Nav. */
export const marcoDeVista: Record<VistaMenu, string> = {
  isla: "top-3 m-3 h-[calc(100dvh-1.5rem)] gap-3 rounded-3xl border-2 border-teal-oscuro bg-crema p-3 shadow-dura-chica",
  pildoras: "top-3 m-3 h-[calc(100dvh-1.5rem)] gap-2 rounded-[2.75rem] border-2 border-teal-oscuro bg-superficie p-2.5 shadow-dura-chica",
  faja: "top-0 m-0 h-full gap-3 rounded-none border-0 border-r-2 border-teal-oscuro bg-teal-fondo p-4 shadow-none",
  lista: "top-0 m-0 h-full gap-4 rounded-none border-0 bg-transparent py-5 pl-3 pr-2 shadow-none",
};

export const anchoDeVista: Record<VistaMenu, { abierto: string; cerrado: string }> = {
  isla: { abierto: "w-64", cerrado: "w-[4.75rem]" },
  pildoras: { abierto: "w-60", cerrado: "w-20" },
  faja: { abierto: "w-60", cerrado: "w-[4.5rem]" },
  lista: { abierto: "w-52", cerrado: "w-16" },
};

export const itemMenu = {
  base: "group/item relative flex min-h-11 items-center gap-3 px-3 text-base transition-colors duration-150 group-data-[cerrado]:justify-center group-data-[vista=isla]:rounded-xl group-data-[vista=pildoras]:rounded-full group-data-[vista=faja]:rounded-lg group-data-[vista=lista]:rounded-none group-data-[vista=lista]:px-1",
  activa:
    "font-bold text-teal-oscuro group-data-[vista=isla]:bg-teal-fondo group-data-[vista=pildoras]:bg-teal-fondo group-data-[vista=pildoras]:ring-2 group-data-[vista=pildoras]:ring-teal-oscuro group-data-[vista=faja]:bg-superficie group-data-[vista=lista]:border-l-4 group-data-[vista=lista]:border-rosa group-data-[vista=lista]:pl-2",
  inactiva:
    "font-medium text-texto-2 hover:text-teal-oscuro group-data-[vista=isla]:hover:bg-white/70 group-data-[vista=pildoras]:hover:bg-teal-fondo group-data-[vista=faja]:hover:bg-white/50",
};
