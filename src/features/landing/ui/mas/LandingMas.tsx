import { Gorila } from "@/components/ui/Gorila";
import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { textos } from "@/lib/textos";
import { BotonLanding, contenedor, Globo, Mini } from "../comun";
import { Aparece, ApareceCaja, ApareceGrupo, ApareceItem } from "./Aparece";
import { HeroAnimadoMas } from "./HeroAnimadoMas";
import { LotitoMas } from "./LotitoMas";

const t = textos.landing;

// Los puntitos del fondo, como un papel de cuaderno de recortes
const PUNTOS = "bg-[radial-gradient(var(--color-teal-oscuro)_1.2px,transparent_1.3px)] [background-size:22px_22px]";

/** Un sello redondo que gira despacito. */
function Sello({ texto, className = "", color = "var(--color-mango)", clave = "a" }: { texto: string; className?: string; color?: string; clave?: string }) {
  const id = `sello-${clave}`;
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={className}>
      <g className="motion-safe:animate-girar-lento" style={{ transformOrigin: "60px 60px" }}>
        <circle cx="60" cy="60" r="58" fill={color} stroke="var(--color-teal-oscuro)" strokeWidth="2.5" />
        <path id={id} d="M60 60m-41 0a41 41 0 1 1 82 0a41 41 0 1 1 -82 0" fill="none" />
        <text fontSize="12" fontWeight="800" fill="var(--color-teal-oscuro)" letterSpacing="1.6">
          <textPath href={`#${id}`}>{`${texto} · ${texto} · `}</textPath>
        </text>
      </g>
      <text x="60" y="69" textAnchor="middle" fontSize="30" fontWeight="800" fill="var(--color-teal-oscuro)">
        $0
      </text>
    </svg>
  );
}

/** El borde ondulado entre secciones: una ola suave que se corre despacito. */
function Ola({ de, a }: { de: string; a: string }) {
  return (
    <div aria-hidden="true" className="overflow-hidden" style={{ backgroundColor: a }}>
      <svg viewBox="0 0 2880 120" preserveAspectRatio="none" className="block h-16 w-[200%] max-w-none motion-safe:animate-ola md:h-28">
        <path
          fill={de}
          d="M0 0H2880V50C2740 98 2600 98 2460 50C2320 2 2180 2 2040 50C1900 98 1760 98 1620 50C1540 22 1480 28 1440 50C1300 98 1160 98 1020 50C880 2 740 2 600 50C460 98 320 98 180 50C100 22 40 28 0 50Z"
        />
      </svg>
    </div>
  );
}

// ------------------------------------------------------------------ hero

function Hero({ conSesion }: { conSesion: boolean }) {
  return (
    <section className="relative bg-limon">
      <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden opacity-[0.08] ${PUNTOS}`} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -left-48 top-10 size-[26rem] rounded-full bg-[radial-gradient(circle,var(--color-rosa)_0%,transparent_70%)] opacity-80 blur-2xl" />
        <span className="absolute -right-56 top-6 size-[28rem] rounded-full bg-[radial-gradient(circle,var(--color-celeste)_0%,transparent_70%)] opacity-80 blur-2xl" />
        <span className="absolute -bottom-28 -left-20 size-96 rounded-full bg-[radial-gradient(circle,var(--color-teal)_0%,transparent_70%)] opacity-50 blur-2xl" />
      </div>
      {/* Primera pantalla: el hero entero, sin la cinta. El espacio de abajo es solo
          la mitad de la cinta, para que el borde quede debajo del pliegue. */}
      <div className="relative flex min-h-svh flex-col justify-center">
        <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-5 py-24 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-16 md:px-10 md:py-28">
        <Aparece alCargar className="relative flex flex-col items-start gap-7">
          <span className="-rotate-2 rounded-full border-2 border-teal-oscuro bg-celeste px-4 py-1.5 text-sm font-bold text-teal-oscuro shadow-dura-chica">
            {t.hero.etiqueta}
          </span>
          <h1 className="flex flex-col items-start gap-3 text-[40px] font-extrabold leading-[1.02] tracking-[-0.04em] text-teal-oscuro md:text-[56px]">
            <span>{t.hero.tituloInicio}</span>
            <span className="origin-left whitespace-nowrap -rotate-1 rounded-[16px] border-[3px] border-teal-oscuro bg-rosa px-3 py-1 text-[28px] text-crema shadow-[5px_5px_0_0_var(--color-teal-oscuro)] sm:text-[34px] md:text-[44px] lg:text-[48px]">
              {t.hero.tituloMarca}
            </span>
          </h1>
          <p className="max-w-lg text-[18px] font-medium leading-relaxed text-teal-oscuro md:text-[21px]">{t.hero.texto}</p>
          <div className="flex flex-wrap items-center gap-4">
            <BotonLanding href={conSesion ? "/inicio" : "/login"} variante="teal" className="!h-14 !px-8 !text-lg">
              {conSesion ? t.irAlPanel : t.empezar}
            </BotonLanding>
            <BotonLanding href="#como" variante="claro" className="!h-14 !px-7 !text-lg">
              {t.hero.verComo}
            </BotonLanding>
          </div>
          <p className="text-sm font-medium text-teal-oscuro/80">{t.hero.nota}</p>
          <Sello clave="hero" texto="GRATIS PARA EMPEZAR" color="var(--color-celeste, #8fd6f4)" className="absolute right-2 top-0 hidden size-20 rotate-12 md:block lg:-right-2 lg:-top-6 lg:size-24" />
        </Aparece>
        <Aparece alCargar delay={0.15} className="relative min-w-0">
          <HeroAnimadoMas />
          <p className="mt-3 text-center text-xs font-medium text-teal-oscuro/80">{t.hero.ejemplo}</p>
        </Aparece>
        </div>
      </div>
      <div className="h-[calc(2rem+4.5vw)]" aria-hidden="true" />
    </section>
  );
}

// ------------------------------------------------------------------ cinta de cosas

function Cinta() {
  const palabras = t.marquesina;
  const fila = (copia: number) => (
    <ul key={copia} className="flex shrink-0 items-center">
      {[...palabras, ...palabras].map((p, i) => (
        <li key={`${copia}-${i}`} className="flex items-center">
          <span className="px-6 text-[22px] font-extrabold tracking-tight text-crema md:px-8 md:text-[28px]">{p}</span>
          <Gorila className={`size-6 md:size-7 ${i % 2 ? "text-mango" : "text-rosa"}`} />
        </li>
      ))}
    </ul>
  );
  // A caballo del borde: mitad limón, mitad rosa. Sin fondo propio, para que
  // cada lado se vea del color de su sección. Debajo del encabezado (z-50).
  return (
    <div aria-hidden="true" className="relative z-20 h-0">
      <div className="absolute left-1/2 top-0 w-[150vw] -translate-x-1/2 -translate-y-1/2 -rotate-3 border-y-[3px] border-teal-oscuro bg-teal py-2.5 shadow-[4px_6px_0_0_rgba(0,56,68,0.22)] md:py-3.5">
        <div className="flex w-max animate-marquesina items-center">
          {fila(0)}
          {fila(1)}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ problema

const NOTAS = ["-rotate-2 bg-limon", "rotate-2 bg-rosa", "-rotate-1 bg-celeste"];
const TARJETAS = ["-rotate-2", "rotate-1", "-rotate-1"];

function Problema() {
  const p = t.problema;
  return (
    <section
      className="relative z-10 bg-rosa-palido pb-16 pt-28 md:pb-28 md:pt-36"
      aria-labelledby="problema-mas"
    >
      <div aria-hidden="true" className={`absolute inset-0 opacity-[0.07] ${PUNTOS}`} />
      <div className={`${contenedor} relative flex flex-col gap-14`}>
        <Aparece className="flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 id="problema-mas" className="text-[40px] font-extrabold leading-[1.02] tracking-[-0.03em] text-teal-oscuro md:text-[64px]">
              {p.titulo}
            </h2>
            <p className="text-[18px] font-medium leading-relaxed text-teal-oscuro/85">{p.intro}</p>
          </div>
          <LotitoMas nombre="calculadora" className="w-28 rotate-6 md:w-36" />
        </Aparece>
        <ApareceGrupo className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {p.items.map((i, n) => (
            <ApareceItem
              key={i.titulo}
              className={`relative flex flex-col gap-4 rounded-[28px] border-[3px] border-teal-oscuro bg-white p-6 shadow-[8px_8px_0_0_var(--color-teal-oscuro)] transition-transform duration-200 hover:rotate-0 hover:-translate-y-1 ${TARJETAS[n]}`}
            >
              <span className="absolute -top-6 right-5 rotate-6 rounded-2xl border-[3px] border-teal-oscuro bg-mango px-4 py-1 text-[34px] font-extrabold leading-tight text-teal-oscuro shadow-dura-chica">
                {i.dato}
              </span>
              <h3 className="mt-6 text-[24px] font-extrabold leading-tight text-teal-oscuro">{i.titulo}</h3>
              <p className="text-[17px] leading-relaxed text-teal-oscuro/85">{i.texto}</p>
              <figure className={`mt-auto p-4 shadow-[4px_4px_0_0_rgba(0,56,68,0.25)] ${NOTAS[n]}`}>
                <blockquote className="text-[17px] font-semibold leading-snug">«{i.cita}»</blockquote>
                <figcaption className="mt-2 text-sm font-bold">{i.quien}</figcaption>
              </figure>
            </ApareceItem>
          ))}
        </ApareceGrupo>
        <Aparece>
          <Nombres />
        </Aparece>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ pasos

const GIRO_PASO = ["-rotate-2", "rotate-1", "-rotate-1"] as const;
const FONDO_PASO = ["bg-celeste", "bg-rosa", "bg-limon"] as const;

function Sticker({ src, className }: { src: string; className?: string }) {
  return (
    <span className={`pointer-events-none absolute ${className ?? ""}`}>
      <Mini src={src} className="aspect-square w-full" />
    </span>
  );
}

function MockPaso({ n }: { n: 0 | 1 | 2 }) {
  const p = t.como.pasos;
  if (n === 0) {
    const s = p[0];
    return (
      <div className="relative flex flex-col gap-3 rounded-[20px] border-[3px] border-teal-oscuro bg-white p-4 pt-6">
        <Sticker src="/landing/chat.webp" className="-top-5 left-3 w-12 -rotate-12" />
        <p className="max-w-[92%] self-end rounded-2xl rounded-br-md bg-teal px-3 py-2 text-sm font-bold text-white">{s.chat}</p>
        <Icon nombre="flecha" className="size-5 self-center text-teal-oscuro" />
        <div className="flex items-center gap-3 rounded-2xl border-2 border-teal-oscuro bg-crema p-3">
          <Mini src="/landing/chaqueta.webp" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-extrabold">{s.ficha.nombre}</span>
            <span className="text-sm text-texto-2">
              {s.ficha.precio} · {s.ficha.costo}
            </span>
          </span>
          <StatusChip estado="disponible" />
        </div>
      </div>
    );
  }
  if (n === 1) {
    const s = p[1];
    return (
      <div className="flex flex-col gap-3 rounded-[20px] border-[3px] border-teal-oscuro bg-white p-4">
        <p className="truncate rounded-full border-2 border-teal-oscuro bg-celeste-palido px-4 py-2 text-sm font-bold">{s.enlace}</p>
        <div className="flex items-center gap-3 rounded-2xl border-2 border-teal-oscuro bg-crema p-3">
          <Mini src="/landing/disco.webp" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-extrabold">CD Michael Jackson</span>
            <span className="text-sm text-texto-2">$33.50</span>
          </span>
          <span className="rounded-full border-2 border-teal-oscuro bg-mango px-3 py-1 text-sm font-extrabold">{s.boton}</span>
        </div>
      </div>
    );
  }
  const s = p[2];
  return (
    <div className="relative flex flex-col gap-4 rounded-[20px] border-[3px] border-teal-oscuro bg-white p-4 pt-6">
      <Sticker src="/landing/ganancia.webp" className="-top-5 right-3 w-12 rotate-12" />
      <div className="flex items-center justify-between">
        <span className="font-extrabold">{s.pedido}</span>
        <span className="rounded-full border-2 border-teal-oscuro bg-limon px-3 py-0.5 text-sm font-extrabold">{s.ganancia}</span>
      </div>
      <ol className="flex items-center">
        {s.pasos.map((nombre, i) => (
          <li key={nombre} className="flex flex-1 flex-col items-center gap-1 text-center text-sm last:flex-none">
            <div className="flex w-full items-center">
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro ${i < 2 ? "bg-teal text-white" : "bg-white"}`}>
                {i < 2 && <Icon nombre="check" className="size-4" />}
              </span>
              {i < s.pasos.length - 1 && <span className="h-0.5 flex-1 bg-teal-oscuro" />}
            </div>
            <span className="font-bold">{nombre}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Pasos() {
  const c = t.como;
  return (
    <section id="como" className="relative scroll-mt-24 overflow-x-hidden bg-celeste-palido py-16 md:py-28" aria-labelledby="como-mas">
      <div className={`${contenedor} relative flex flex-col gap-12`}>
        <Aparece className="flex items-end justify-between gap-4">
          <h2 id="como-mas" className="text-[40px] font-extrabold leading-[1.02] tracking-[-0.03em] text-teal-oscuro md:text-[64px]">
            {c.titulo}
          </h2>
          <LotitoMas nombre="saluda" className="hidden w-24 rotate-6 md:block md:w-28" />
        </Aparece>
        <ApareceGrupo as="ol" className="relative grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          <svg aria-hidden="true" viewBox="0 0 1000 60" preserveAspectRatio="none" className="absolute left-[10%] top-6 hidden h-10 w-[64%] md:block">
            <path
              d="M0 30 C 120 -12, 260 72, 500 30 S 860 -12, 1000 30"
              fill="none"
              stroke="var(--color-teal-oscuro)"
              strokeWidth="3"
              strokeDasharray="2 12"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {c.pasos.map((p, n) => (
            <ApareceItem key={p.titulo} className={`relative flex flex-col gap-4 rounded-[28px] border-[3px] border-teal-oscuro p-5 shadow-[6px_6px_0_0_var(--color-teal-oscuro)] ${FONDO_PASO[n]} ${GIRO_PASO[n]}`}>
              <span className="flex size-12 items-center justify-center rounded-full border-[3px] border-teal-oscuro bg-mango text-xl font-extrabold text-teal-oscuro shadow-dura-chica">
                {n + 1}
              </span>
              <h3 className="text-[24px] font-extrabold leading-tight text-teal-oscuro">{p.titulo}</h3>
              <p className="text-[16px] font-medium leading-relaxed text-teal-oscuro/85">{p.texto}</p>
              <div className="mt-auto" aria-hidden="true">
                <MockPaso n={n as 0 | 1 | 2} />
              </div>
            </ApareceItem>
          ))}
        </ApareceGrupo>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ funciones

const BLOQUES = [
  { clave: "estado", color: "bg-teal-fondo", span: "md:col-span-3" },
  { clave: "vitrina", color: "bg-rosa", span: "md:col-span-3" },
  { clave: "ganancia", color: "bg-limon", span: "md:col-span-2" },
  { clave: "pedidos", color: "bg-celeste", span: "md:col-span-2" },
  { clave: "asistente", color: "bg-mango", span: "md:col-span-2" },
  { clave: "importar", color: "bg-white", span: "md:col-span-2" },
  { clave: "foto", color: "bg-rosa-palido", span: "md:col-span-2" },
  { clave: "descubrir", color: "bg-teal-fondo", span: "md:col-span-2" },
] as const;

/** Recorte chiquito adentro de cada tarjeta, para que no sean solo título y párrafo. */
function Recorte({ de }: { de: (typeof BLOQUES)[number]["clave"] }) {
  const f = t.funciones;
  if (de === "estado") {
    return (
      <dl className="mt-auto grid grid-cols-3 gap-2">
        {f.estado.contadores.map(([n, etiqueta]) => (
          <div key={etiqueta} className="flex flex-col items-center rounded-2xl border-2 border-teal-oscuro bg-white py-2">
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

function Funciones() {
  const f = t.funciones;
  return (
    <section id="funciones" className="relative scroll-mt-24 overflow-x-hidden bg-white py-16 md:py-28" aria-labelledby="funciones-mas">
      <div className={`${contenedor} flex flex-col gap-12`}>
        <Aparece>
          <h2 id="funciones-mas" className="text-[40px] font-extrabold leading-[1.02] tracking-[-0.03em] text-teal-oscuro md:text-[64px]">
            {f.titulo}
          </h2>
        </Aparece>
        <ApareceGrupo className="grid grid-cols-1 gap-6 md:grid-cols-6">
          {BLOQUES.map((b, n) => {
            const x = f[b.clave] as { titulo: string; texto: string };
            return (
              <ApareceItem
                key={b.clave}
                className={`flex min-h-44 flex-col gap-3 rounded-[28px] border-[3px] border-teal-oscuro p-6 shadow-[6px_6px_0_0_var(--color-teal-oscuro)] transition-transform duration-200 hover:-translate-y-1 ${b.color} ${b.span} ${n % 2 ? "hover:rotate-1" : "hover:-rotate-1"}`}
              >
                <h3 className="text-[26px] font-extrabold leading-[1.05] tracking-tight text-teal-oscuro">{x.titulo}</h3>
                <p className="text-[16px] font-medium leading-relaxed text-teal-oscuro/90">{x.texto}</p>
                <Recorte de={b.clave} />
              </ApareceItem>
            );
          })}
        </ApareceGrupo>
        <Aparece>
          <p className="max-w-3xl text-[17px] font-medium leading-relaxed text-teal-oscuro/80">{f.tambien}</p>
        </Aparece>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ marketplace (para quien compra)

function Buscar() {
  const b = t.buscar;
  return (
    <section id="marketplace" className="relative scroll-mt-24 overflow-x-hidden bg-mango py-16 md:py-28" aria-labelledby="buscar-mas">
      <div aria-hidden="true" className={`pointer-events-none absolute inset-0 opacity-[0.08] ${PUNTOS}`} />
      <div className={`${contenedor} relative grid grid-cols-1 items-center gap-12 md:grid-cols-[1.2fr_0.8fr]`}>
        <Aparece className="flex flex-col items-start gap-6">
          <span className="-rotate-2 rounded-full border-2 border-teal-oscuro bg-white px-4 py-1.5 text-sm font-bold text-teal-oscuro shadow-dura-chica">
            {b.etiqueta}
          </span>
          <h2 id="buscar-mas" className="text-[40px] font-extrabold leading-[1.02] tracking-[-0.03em] text-teal-oscuro md:text-[64px]">
            {b.titulo}
          </h2>
          <p className="max-w-xl text-[18px] font-medium leading-relaxed text-teal-oscuro/85">{b.texto}</p>
          <form
            action="/marketplace"
            role="search"
            className="flex w-full max-w-xl flex-col gap-3 rounded-[28px] border-[3px] border-teal-oscuro bg-white p-3 shadow-[6px_6px_0_0_var(--color-teal-oscuro)] md:p-4"
          >
            <label className="flex h-14 items-center gap-3 rounded-full border-2 border-teal-oscuro bg-crema px-4">
              <Icon nombre="buscar" className="size-5 shrink-0 text-teal-oscuro/70" />
              <span className="sr-only">{b.productos}</span>
              <input
                type="search"
                name="q"
                placeholder={b.placeholder}
                className="h-full min-w-0 flex-1 bg-transparent text-base font-medium text-teal-oscuro outline-none placeholder:text-teal-oscuro/50 md:text-lg"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border-2 border-teal-oscuro bg-limon px-5 text-base font-bold text-teal-oscuro shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none sm:flex-none"
              >
                <Icon nombre="buscar" className="size-4" />
                {b.productos}
              </button>
              <button
                type="submit"
                name="vista"
                value="tiendas"
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border-2 border-teal-oscuro bg-celeste px-5 text-base font-bold text-teal-oscuro shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none sm:flex-none"
              >
                <Icon nombre="tienda" className="size-4" />
                {b.tiendas}
              </button>
            </div>
          </form>
          <BotonLanding href="/marketplace" variante="claro" className="!h-14 !px-8 !text-lg">
            {b.ir}
          </BotonLanding>
        </Aparece>
        <Aparece delay={0.12} className="relative hidden md:block" aria-hidden="true">
          <div className="relative mx-auto flex w-72 flex-col gap-4">
            <div className="-rotate-3 rounded-[28px] border-[3px] border-teal-oscuro bg-white p-4 shadow-[8px_8px_0_0_var(--color-teal-oscuro)]">
              <div className="flex items-center gap-3">
                <Mini src="/landing/chaqueta.webp" />
                <span className="min-w-0">
                  <span className="block truncate font-extrabold">Chaqueta negra M</span>
                  <span className="text-sm text-texto-2">$25.00 · Velvet Cases</span>
                </span>
              </div>
            </div>
            <div className="ml-8 rotate-2 rounded-[28px] border-[3px] border-teal-oscuro bg-white p-4 shadow-[8px_8px_0_0_var(--color-teal-oscuro)]">
              <div className="flex items-center gap-3">
                <Mini src="/landing/disco.webp" />
                <span className="min-w-0">
                  <span className="block truncate font-extrabold">CD Michael Jackson</span>
                  <span className="text-sm text-texto-2">$33.50 · MG Vinyls</span>
                </span>
              </div>
            </div>
            <div className="-ml-2 -rotate-2 rounded-[28px] border-[3px] border-teal-oscuro bg-limon p-4 shadow-[8px_8px_0_0_var(--color-teal-oscuro)]">
              <div className="flex items-center gap-3">
                <Mini src="/landing/llaveros.webp" />
                <span className="min-w-0">
                  <span className="block truncate font-extrabold">Llaveros</span>
                  <span className="text-sm text-texto-2">$3.00 · Ternuritos</span>
                </span>
              </div>
            </div>
          </div>
          <LotitoMas nombre="asoma" className="absolute -bottom-4 -right-2 w-32 rotate-6 md:w-40" />
        </Aparece>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ cierre

function Cierre({ conSesion }: { conSesion: boolean }) {
  return (
    <section className="relative overflow-x-hidden bg-teal-oscuro py-16 text-white md:py-28" aria-labelledby="cierre-mas">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[radial-gradient(var(--color-limon)_1.2px,transparent_1.3px)] [background-size:22px_22px]"
      />
      <div className={`${contenedor} relative grid grid-cols-1 items-center gap-10 md:grid-cols-[1.15fr_0.85fr] md:gap-8`}>
        <Aparece className="relative z-10 flex flex-col items-start gap-7">
          <h2 id="cierre-mas" className="flex flex-col items-start gap-3 text-[40px] font-extrabold leading-[1.02] tracking-[-0.04em] md:text-[56px]">
            <span>Dejá de prometer</span>
            <span className="origin-left -rotate-1 rounded-[16px] border-[3px] border-limon bg-limon px-3 py-1 text-[28px] text-teal-oscuro shadow-[5px_5px_0_0_var(--color-mango)] sm:text-[34px] md:text-[44px] lg:text-[48px]">
              lo que ya vendiste
            </span>
          </h2>
          <p className="max-w-lg text-[18px] font-medium leading-relaxed text-white/90 md:text-[21px]">{t.cierre.texto}</p>
          <div className="flex flex-wrap items-center gap-5">
            <BotonLanding href={conSesion ? "/inicio" : "/login"} enOscuro className="!h-14 !px-8 !text-lg">
              {conSesion ? t.irAlPanel : t.empezar}
            </BotonLanding>
            <Sello clave="cierre" texto="GRATIS PARA EMPEZAR" className="size-20 rotate-12 md:size-24" />
          </div>
        </Aparece>
        <Aparece delay={0.12} className="relative mx-auto flex h-52 w-full max-w-sm items-end justify-center md:h-72">
          <Mini src="/landing/chaqueta.webp" className="absolute left-6 top-2 aspect-square w-16 -rotate-12 md:w-20" />
          <Mini src="/landing/disco.webp" className="absolute right-4 top-8 aspect-square w-14 rotate-12 md:w-16" />
          <LotitoMas nombre="thumbsup" className="relative z-10 w-48 animate-asomar md:w-72" />
        </Aparece>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ nombres (las que entrevistamos)

const ETIQUETAS = ["-rotate-2 bg-limon", "rotate-2 bg-rosa", "-rotate-1 bg-celeste", "rotate-1 bg-mango", "-rotate-2 bg-white"];

function Nombres() {
  return (
    <div className="flex flex-col items-start gap-3" aria-label={t.hero.fuente}>
      <p className="flex items-center gap-2 text-[16px] font-extrabold text-teal-oscuro">
        <LotitoMas nombre="saluda" className="w-12 shrink-0" />
        {t.hero.fuente}
      </p>
      <ul className="flex flex-wrap gap-3">
        {t.hero.emprendimientos.map((e, i) => (
          <li
            key={e}
            className={`rounded-full border-[3px] border-teal-oscuro px-5 py-1.5 text-[16px] font-extrabold text-teal-oscuro shadow-[3px_3px_0_0_var(--color-teal-oscuro)] ${ETIQUETAS[i]}`}
          >
            {e}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ------------------------------------------------------------------ principios

const PRINCIPIO = [
  { fondo: "bg-limon", nota: "bg-white", monito: "thumbsup" as const, giro: "-rotate-2" },
  { fondo: "bg-rosa", nota: "bg-limon", monito: "celular" as const, giro: "rotate-1" },
  { fondo: "bg-celeste", nota: "bg-white", monito: "calculadora" as const, giro: "-rotate-1" },
];

function Principios() {
  const p = t.principios;
  return (
    <section className="relative overflow-x-hidden bg-crema py-16 md:py-28" aria-labelledby="principios-mas">
      <div className={`${contenedor} relative flex flex-col gap-14`}>
        <Aparece className="flex max-w-2xl flex-col gap-3">
          <h2 id="principios-mas" className="text-[40px] font-extrabold leading-[1.02] tracking-[-0.03em] text-teal-oscuro md:text-[64px]">
            {p.titulo}
          </h2>
          <p className="text-[18px] font-medium leading-relaxed text-teal-oscuro/85">{p.intro}</p>
        </Aparece>
        <ApareceGrupo className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {p.items.map((i, n) => (
            <ApareceItem
              key={i.titulo}
              className={`relative flex flex-col gap-4 rounded-[28px] border-[3px] border-teal-oscuro p-6 pb-16 shadow-[8px_8px_0_0_var(--color-teal-oscuro)] ${PRINCIPIO[n].fondo} ${PRINCIPIO[n].giro}`}
            >
              <span className="text-[56px] font-extrabold leading-none tracking-tighter text-teal-oscuro/25">{String(n + 1).padStart(2, "0")}</span>
              <h3 className="-mt-2 text-[26px] font-extrabold leading-tight text-teal-oscuro">{i.titulo}</h3>
              <p className="text-[17px] leading-relaxed text-teal-oscuro/85">{i.texto}</p>
              <figure className={`mt-auto p-4 shadow-[4px_4px_0_0_rgba(0,56,68,0.25)] ${n % 2 ? "rotate-2" : "-rotate-2"} ${PRINCIPIO[n].nota}`}>
                <blockquote className="text-[16px] font-semibold leading-snug">«{i.cita}»</blockquote>
                <figcaption className="mt-2 text-sm font-bold">{i.quien}</figcaption>
              </figure>
              <LotitoMas nombre={PRINCIPIO[n].monito} className="absolute -bottom-4 right-3 w-20 md:w-28" />
            </ApareceItem>
          ))}
        </ApareceGrupo>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ precios

function Precios({ conSesion }: { conSesion: boolean }) {
  const p = t.precios;
  return (
    <section id="precios" className="relative scroll-mt-24 overflow-x-hidden bg-limon py-16 md:py-28" aria-labelledby="precios-mas">
      <div className={`${contenedor} relative flex flex-col gap-14`}>
        <Aparece className="flex max-w-2xl flex-col gap-3">
          <h2 id="precios-mas" className="text-[40px] font-extrabold leading-[1.02] tracking-[-0.03em] text-teal-oscuro md:text-[64px]">
            {p.titulo}
          </h2>
          <p className="text-[18px] font-medium leading-relaxed text-teal-oscuro/85">{p.intro}</p>
        </Aparece>
        <ApareceGrupo as="div" className="grid grid-cols-1 items-stretch gap-10 md:grid-cols-2">
          <ApareceCaja as="article" className="relative flex flex-col gap-6 rounded-[32px] border-[3px] border-teal-oscuro bg-white p-8 pb-20 shadow-[10px_10px_0_0_var(--color-teal-oscuro)] md:-rotate-1">
            <span className="absolute -top-5 left-6 -rotate-3 rounded-full border-[3px] border-teal-oscuro bg-mango px-4 py-1 text-sm font-extrabold text-teal-oscuro shadow-dura-chica">
              {p.recomendado}
            </span>
            <p className="mt-4 font-extrabold text-teal-oscuro">{p.gratis.nombre}</p>
            <p className="text-[88px] font-extrabold leading-none tracking-tighter text-teal-oscuro">{p.gratis.precio}</p>
            <p className="text-[17px] font-medium leading-relaxed text-teal-oscuro/85">{p.gratis.texto}</p>
            <ul className="flex flex-col gap-2.5">
              {p.gratis.lista.map((l) => (
                <li key={l} className="flex gap-2.5 text-[17px] font-medium">
                  <Icon nombre="check" className="mt-0.5 size-5 shrink-0 text-teal" strokeWidth={2.5} />
                  {l}
                </li>
              ))}
            </ul>
            <p className="text-sm font-medium text-teal-oscuro/70">{p.gratis.nota}</p>
            <BotonLanding href={conSesion ? "/inicio" : "/login"} className="mt-auto !h-14 !px-8 !text-lg">
              {conSesion ? t.irAlPanel : t.empezar}
            </BotonLanding>
            <LotitoMas nombre="thumbsup" className="absolute -bottom-3 right-4 w-20 md:w-28" />
          </ApareceCaja>
          <ApareceCaja as="article" className="relative flex flex-col gap-6 rounded-[32px] border-[3px] border-dashed border-teal-oscuro bg-crema p-8 md:rotate-1">
            <span className="absolute -top-5 left-6 rotate-2 rounded-full border-[3px] border-teal-oscuro bg-white px-4 py-1 text-sm font-extrabold text-teal-oscuro shadow-dura-chica">
              {p.proximamente}
            </span>
            <p className="mt-4 font-extrabold text-teal-oscuro">{p.pago.nombre}</p>
            <p className="text-[40px] font-extrabold leading-tight tracking-tight text-teal-oscuro">{p.pago.precio}</p>
            <p className="text-[17px] font-medium leading-relaxed text-teal-oscuro/85">{p.pago.texto}</p>
            <ul className="flex flex-col gap-2.5">
              {p.pago.lista.map((l) => (
                <li key={l} className="flex gap-2.5 text-[17px] font-medium">
                  <Icon nombre="check" className="mt-0.5 size-5 shrink-0 text-teal" strokeWidth={2.5} />
                  {l}
                </li>
              ))}
            </ul>
            <p className="mt-auto text-sm font-medium text-teal-oscuro/70">{p.pago.nota}</p>
          </ApareceCaja>
        </ApareceGrupo>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ preguntas

function Preguntas() {
  const p = t.preguntas;
  return (
    <section id="preguntas" className="relative scroll-mt-24 overflow-x-hidden bg-celeste-palido py-16 md:py-28" aria-labelledby="preguntas-mas">
      <div className={`${contenedor} grid grid-cols-1 gap-12 md:grid-cols-[1fr_1.4fr] md:gap-16`}>
        <Aparece className="flex flex-col gap-4 md:sticky md:top-24 md:self-start">
          <h2 id="preguntas-mas" className="text-[40px] font-extrabold leading-[1.02] tracking-[-0.03em] text-teal-oscuro md:text-[64px]">
            {p.titulo}
          </h2>
          <p className="text-[18px] font-medium leading-relaxed text-teal-oscuro/85">{p.intro}</p>
          <div className="hidden items-end gap-2 md:flex">
            <LotitoMas nombre="saluda" className="w-32 -rotate-6 md:w-40" />
            <Globo className="rotate-2">Si no está acá, preguntame.</Globo>
          </div>
        </Aparece>
        <ApareceGrupo as="div" className="flex flex-col gap-4">
          {p.items.map((i, n) => (
            <ApareceCaja key={i.p}>
              <details
                className={`group rounded-[24px] border-[3px] border-teal-oscuro bg-white px-5 py-1 shadow-[4px_4px_0_0_var(--color-teal-oscuro)] open:bg-limon ${n % 2 ? "rotate-1" : "-rotate-1"}`}
              >
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 text-[18px] font-extrabold text-teal-oscuro [&::-webkit-details-marker]:hidden">
                  {i.p}
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-[3px] border-teal-oscuro bg-mango transition-transform duration-200 group-open:rotate-45">
                    <Icon nombre="mas" className="size-4" strokeWidth={2.5} />
                  </span>
                </summary>
                <p className="pb-5 text-[17px] font-medium leading-relaxed text-teal-oscuro/85">{i.r}</p>
              </details>
            </ApareceCaja>
          ))}
        </ApareceGrupo>
      </div>
    </section>
  );
}

export const LandingMas = { Hero, Cinta, Problema, Pasos, Funciones, Buscar, Principios, Precios, Preguntas, Cierre, Ola };
