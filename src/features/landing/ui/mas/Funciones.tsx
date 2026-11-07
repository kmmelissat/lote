import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { contenedor, Mini } from "../comun";
import { Aparece, ApareceGrupo, ApareceItem } from "./Aparece";
import { Sticker } from "./piezasLanding";

const t = textos.landing;

type Bloque = { clave: ClaveBloque; color: string; span: string };
type ClaveBloque = "estado" | "vitrina" | "modos" | "balance" | "ganancia" | "pedidos" | "asistente" | "importar" | "foto" | "descubrir" | "mostrador";

// Lo que ven tus clientes
const TIENDA: Bloque[] = [
  { clave: "vitrina", color: "bg-rosa", span: "md:col-span-2" },
  { clave: "modos", color: "bg-limon", span: "md:col-span-2" },
  { clave: "descubrir", color: "bg-crema", span: "md:col-span-2" },
];

// Lo que ves vos
const CUENTAS: Bloque[] = [
  { clave: "estado", color: "bg-crema", span: "md:col-span-3" },
  { clave: "balance", color: "bg-limon", span: "md:col-span-3" },
  { clave: "ganancia", color: "bg-celeste", span: "md:col-span-2" },
  { clave: "pedidos", color: "bg-rosa-palido", span: "md:col-span-2" },
  { clave: "asistente", color: "bg-mango", span: "md:col-span-2" },
  { clave: "importar", color: "bg-celeste-palido", span: "md:col-span-2" },
  { clave: "foto", color: "bg-rosa-palido", span: "md:col-span-2" },
  { clave: "mostrador", color: "bg-crema", span: "md:col-span-2" },
];

/** Recorte chiquito adentro de cada tarjeta, para que no sean solo título y párrafo. */
function Recorte({ de }: { de: ClaveBloque }) {
  const f = t.funciones;
  if (de === "estado") {
    return (
      <dl className="mt-auto grid grid-cols-3 gap-2">
        {f.estado.contadores.map(([n, etiqueta]) => (
          <div key={etiqueta} className="flex flex-col items-center rounded-2xl border border-teal-oscuro bg-celeste-palido py-2">
            <dd className="text-2xl font-extrabold leading-none tabular-nums">{n}</dd>
            <dt className="mt-1 text-[11px] font-bold text-texto-2">{etiqueta}</dt>
          </div>
        ))}
      </dl>
    );
  }
  if (de === "vitrina") {
    return (
      <div className="mt-auto flex items-end gap-3">
        <Mini src="/landing/chaqueta.webp" />
        <Mini src="/landing/disco.webp" />
        <Mini src="/landing/llaveros.webp" />
      </div>
    );
  }
  if (de === "modos") {
    return (
      <ul className="mt-auto flex flex-wrap gap-2">
        {f.modos.opciones.map((o, i) => (
          <li key={o} className={`rounded-full border border-teal-oscuro px-4 py-1.5 text-sm font-extrabold shadow-dura-chica ${["bg-mango", "bg-white", "bg-celeste"][i]}`}>
            {o}
          </li>
        ))}
      </ul>
    );
  }
  if (de === "balance") {
    return (
      <dl className="mt-auto flex flex-col gap-1.5 rounded-2xl border border-teal-oscuro bg-white p-3 text-sm font-bold">
        {f.balance.filas.map(([nombre, valor]) => (
          <div key={nombre} className="flex justify-between gap-2">
            <dt>{nombre}</dt>
            <dd className="tabular-nums">{valor}</dd>
          </div>
        ))}
        <div className="mt-1 flex justify-between gap-2 border-t border-teal-oscuro pt-2 text-base font-extrabold">
          <dt>{f.balance.total[0]}</dt>
          <dd className="tabular-nums">{f.balance.total[1]}</dd>
        </div>
      </dl>
    );
  }
  if (de === "mostrador") {
    return (
      <div className="mt-auto flex flex-col gap-1 rounded-2xl border border-teal-oscuro bg-white p-3 text-sm font-bold">
        {f.mostrador.lineas.map(([nombre, valor]) => (
          <div key={nombre} className="flex justify-between gap-2">
            <span>{nombre}</span>
            <span className="tabular-nums">{valor}</span>
          </div>
        ))}
        <div className="mt-1 flex items-center justify-between gap-2 border-t border-teal-oscuro pt-2 font-extrabold">
          <span>{f.mostrador.total}</span>
          <span className="rounded-full border border-teal-oscuro bg-mango px-3 py-0.5">{f.mostrador.cobrar}</span>
        </div>
      </div>
    );
  }
  if (de === "ganancia") {
    return (
      <div className="mt-auto flex items-end justify-between gap-2">
        <span className="text-[40px] font-extrabold leading-none tracking-tight">{f.ganancia.valor}</span>
        <Mini src="/landing/ganancia.webp" className="size-14" />
      </div>
    );
  }
  if (de === "asistente") {
    return (
      <div className="relative mt-auto flex flex-col gap-1.5 pr-10">
        <p className="max-w-[90%] self-end rounded-2xl rounded-br-md bg-teal px-3 py-1.5 text-sm font-bold text-white">{f.asistente.tu}</p>
        <p className="rounded-2xl rounded-bl-md bg-white px-3 py-1.5 text-sm font-bold">{f.asistente.lote}</p>
        <Sticker src="/landing/chat.webp" className="-right-1 -top-7 w-12 rotate-12" />
      </div>
    );
  }
  if (de === "foto") {
    return (
      <div className="mt-auto flex items-center gap-3">
        <Mini src="/landing/chaqueta.webp" />
        <Icon nombre="flecha" className="size-5 shrink-0 -rotate-90 text-teal-oscuro" />
        <ul className="min-w-0 flex-1">
          {f.foto.campos.map((c) => (
            <li key={c} className="truncate text-sm font-bold">
              {c}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (de === "descubrir") {
    return (
      <figure className="mt-auto rotate-1 bg-white p-3 shadow-[3px_3px_0_0_rgba(0,56,68,0.25)]">
        <blockquote className="text-sm font-semibold leading-snug">«{f.descubrir.cita}»</blockquote>
        <figcaption className="mt-1 text-xs font-bold">{f.descubrir.quien}</figcaption>
      </figure>
    );
  }
  return null;
}

function GrupoFunciones({ titulo, intro, bloques, desde = 0 }: { titulo: string; intro: string; bloques: Bloque[]; desde?: number }) {
  const f = t.funciones;
  return (
    <div className="flex flex-col gap-6">
      <Aparece className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h3 className="text-[30px] font-extrabold leading-tight tracking-tight text-teal-oscuro md:text-[38px]">{titulo}</h3>
        <p className="text-[17px] font-medium text-teal-oscuro/75">{intro}</p>
      </Aparece>
      <ApareceGrupo className="grid grid-cols-1 gap-6 md:grid-cols-6">
        {bloques.map((b, n) => {
          const x = f[b.clave] as { titulo: string; texto: string };
          return (
            <ApareceItem
              key={b.clave}
              className={`flex min-h-44 flex-col gap-3 rounded-[28px] border border-teal-oscuro p-6 shadow-[6px_6px_0_0_var(--color-teal-oscuro)] md:transition-transform md:duration-200 md:hover:-translate-y-1 ${b.color} ${b.span} ${(n + desde) % 2 ? "md:hover:rotate-1" : "md:hover:-rotate-1"}`}
            >
              <h4 className="text-[26px] font-extrabold leading-[1.05] tracking-tight text-teal-oscuro">{x.titulo}</h4>
              <p className="text-[16px] font-medium leading-relaxed text-teal-oscuro/90">{x.texto}</p>
              <Recorte de={b.clave} />
            </ApareceItem>
          );
        })}
      </ApareceGrupo>
    </div>
  );
}

export function Funciones() {
  const f = t.funciones;
  return (
    <section id="funciones" className="relative scroll-mt-24 overflow-x-clip bg-white py-16 md:py-28" aria-labelledby="funciones-mas">
      <div className={`${contenedor} flex flex-col gap-14`}>
        <Aparece>
          <h2 id="funciones-mas" className="text-[40px] font-extrabold leading-[1.02] tracking-[-0.03em] text-teal-oscuro md:text-[64px]">
            {f.titulo}
          </h2>
        </Aparece>
        <GrupoFunciones titulo={f.tienda.titulo} intro={f.tienda.intro} bloques={TIENDA} />
        <GrupoFunciones titulo={f.cuentas.titulo} intro={f.cuentas.intro} bloques={CUENTAS} desde={1} />
        <Aparece>
          <p className="max-w-3xl text-[17px] font-medium leading-relaxed text-teal-oscuro/80">{f.tambien}</p>
        </Aparece>
      </div>
    </section>
  );
}
