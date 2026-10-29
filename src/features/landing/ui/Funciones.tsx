import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { textos } from "@/lib/textos";
import { contenedor, Miniatura, Monito, parrafo, tarjeta, tituloSeccion } from "./comun";

const t = textos.landing.funciones;

const h3 = "text-[22px] font-bold leading-tight";

// Un bento: tarjetas de distinto tamaño y color, cada una con un pedacito de la pantalla de verdad adentro.
export function Funciones() {
  return (
    <section id="funciones" className="scroll-mt-24 bg-superficie py-12 md:py-24" aria-labelledby="funciones-titulo">
      <div className={`${contenedor} revelar flex flex-col gap-10`}>
        <h2 id="funciones-titulo" className={tituloSeccion}>
          {t.titulo}
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {/* Estado por pieza */}
          <article className={`${tarjeta} flex flex-col gap-4 bg-teal-fondo md:col-span-3 md:row-span-2`}>
            <h3 className={h3}>{t.estado.titulo}</h3>
            <p className={parrafo}>{t.estado.texto}</p>
            <dl aria-hidden="true" className="grid grid-cols-3 gap-2">
              {t.estado.contadores.map(([n, etiqueta]) => (
                <div key={etiqueta} className="flex flex-col items-center rounded-2xl border-2 border-teal-oscuro bg-superficie py-3">
                  <dd className="text-3xl font-bold leading-none tabular-nums">{n}</dd>
                  <dt className="mt-1 text-xs font-medium text-texto-2">{etiqueta}</dt>
                </div>
              ))}
            </dl>
            <p className="text-[15px] leading-snug text-texto-2">{t.estado.cuenta}</p>
            <div aria-hidden="true" className="mt-auto flex flex-col gap-3 pt-2">
              <ul className="flex flex-col gap-2 rounded-2xl border-2 border-teal-oscuro bg-superficie p-3">
                {(
                  [
                    ["camisa", "rosa", "Chaqueta negra M", "apartado"],
                    ["disco", "limon", "CD Michael Jackson", "disponible"],
                    ["llave", "teal", "Llaveros", "vendido"],
                    ["camisa", "limon", "Gorra azul", "disponible"],
                    ["disco", "rosa", "Vinilo Fleetwood Mac", "apartado"],
                  ] as const
                ).map(([icono, tono, nombre, estado]) => (
                  <li key={nombre} className="flex items-center gap-3">
                    <Miniatura icono={icono} tono={tono} className="size-10" />
                    <span className="min-w-0 flex-1 truncate font-medium">{nombre}</span>
                    <StatusChip estado={estado} />
                  </li>
                ))}
              </ul>
              <p className="flex animate-flotar items-center gap-2 self-start rounded-2xl border-2 border-teal-oscuro bg-limon px-4 py-2 text-sm font-bold [--giro:-1deg]">
                <Icon nombre="alerta" className="size-5" />
                {t.estado.aviso}
              </p>
            </div>
          </article>

          {/* Vitrina */}
          <article className={`${tarjeta} flex flex-col gap-4 bg-rosa-palido md:col-span-3`}>
            <h3 className={h3}>{t.vitrina.titulo}</h3>
            <p className={parrafo}>{t.vitrina.texto}</p>
            <div aria-hidden="true" className="overflow-hidden rounded-2xl border-2 border-teal-oscuro bg-superficie">
              <div className="flex items-center gap-1.5 border-b-2 border-teal-oscuro bg-fondo px-3 py-2">
                {["bg-rosa", "bg-limon", "bg-mango"].map((c) => (
                  <span key={c} className={`size-2.5 rounded-full ${c}`} />
                ))}
              </div>
              <ul className="grid grid-cols-3 gap-3 p-3">
                {(
                  [
                    ["camisa", "rosa", "$25.00"],
                    ["disco", "limon", "$33.50"],
                    ["llave", "teal", "$3.00"],
                  ] as const
                ).map(([icono, tono, precio]) => (
                  <li key={precio} className="flex flex-col gap-1.5">
                    <Miniatura icono={icono} tono={tono} className="aspect-square w-full" />
                    <span className="text-sm font-bold">{precio}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          {/* Ganancia */}
          <article className={`${tarjeta} flex flex-col gap-3 bg-limon md:col-span-3`}>
            <h3 className={h3}>{t.ganancia.titulo}</h3>
            <p className="text-[56px] font-bold leading-none tracking-tight tabular-nums" aria-hidden="true">
              {t.ganancia.valor}
            </p>
            <span className="self-start rounded-full border-2 border-teal-oscuro bg-superficie px-3 py-0.5 text-sm font-bold">
              {t.ganancia.margen}
            </span>
            <p className="text-[17px] leading-relaxed">{t.ganancia.texto}</p>
            <Monito nombre="moneda" className="mt-auto w-24 self-end text-teal-oscuro" />
          </article>

          {/* Foto a ficha */}
          <article className={`${tarjeta} flex flex-col gap-4 bg-rosa-palido md:col-span-4`}>
            <h3 className={h3}>{t.foto.titulo}</h3>
            <p className="text-[17px] leading-relaxed">{t.foto.texto}</p>
            <div aria-hidden="true" className="mt-auto flex items-center gap-3 pt-2">
              <Miniatura icono="camisa" tono="rosa" className="size-20 shrink-0" />
              <Icon nombre="flecha" className="size-6 shrink-0 -rotate-90" />
              <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
                {t.foto.campos.map((c) => (
                  <li key={c} className="flex items-center gap-2 rounded-xl border-2 border-teal-oscuro bg-superficie px-3 py-1 text-sm font-medium">
                    <Icon nombre="check" className="size-4 shrink-0 text-teal" />
                    <span className="truncate">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          {/* Pedidos */}
          <article className={`${tarjeta} flex flex-col gap-3 bg-superficie md:col-span-2`}>
            <h3 className={h3}>{t.pedidos.titulo}</h3>
            <ul aria-hidden="true" className="flex flex-wrap gap-2">
              {(["pendiente", "pagado", "preparando", "enviado", "entregado"] as const).map((e) => (
                <li key={e}>
                  <StatusChip estado={e} />
                </li>
              ))}
            </ul>
            <p className={parrafo}>{t.pedidos.texto}</p>
          </article>

          {/* Asistente */}
          <article className={`${tarjeta} flex flex-col gap-3 bg-teal-oscuro text-white hover:shadow-[4px_4px_0_0_var(--color-mango)] md:col-span-2`}>
            <h3 className={h3}>{t.asistente.titulo}</h3>
            <div aria-hidden="true" className="flex flex-col gap-2">
              <p className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-mango px-4 py-2 font-medium text-teal-oscuro">
                {t.asistente.tu}
              </p>
              <p className="max-w-[90%] rounded-2xl rounded-bl-md bg-white/15 px-4 py-2">{t.asistente.lote}</p>
            </div>
            <p className="text-[17px] leading-relaxed text-white/80">{t.asistente.texto}</p>
          </article>

          {/* Mostrador */}
          <article className={`${tarjeta} flex flex-col gap-4 bg-superficie md:col-span-4 md:flex-row md:items-center md:justify-between`}>
            <div className="flex max-w-sm flex-col gap-2">
              <span className="self-start rounded-full border-2 border-teal-oscuro bg-rosa-palido px-3 py-0.5 text-sm font-bold">{t.mostrador.etiqueta}</span>
              <h3 className={h3}>{t.mostrador.titulo}</h3>
              <p className={parrafo}>{t.mostrador.texto}</p>
            </div>
            <div aria-hidden="true" className="flex w-full flex-col gap-2 rounded-2xl border-2 border-dashed border-teal-oscuro/50 bg-crema p-3 md:w-60 md:shrink-0">
              {t.mostrador.lineas.map(([nombre, monto]) => (
                <p key={nombre} className="flex justify-between text-sm text-texto-2">
                  <span>{nombre}</span>
                  <span className="tabular-nums">{monto}</span>
                </p>
              ))}
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-bold tabular-nums">{t.mostrador.total}</span>
                <span className="rounded-full border-2 border-teal-oscuro bg-mango px-4 py-1 text-sm font-bold shadow-dura-chica">{t.mostrador.cobrar}</span>
              </div>
              <p className="flex items-center gap-2 self-start rounded-full bg-teal-fondo px-3 py-0.5 text-sm font-bold text-teal">
                <Icon nombre="check" className="size-4" />
                {t.mostrador.cuadra}
              </p>
            </div>
          </article>

          {/* Descubrir: Explorar y reseñas */}
          <article className={`${tarjeta} flex flex-col gap-3 bg-teal-fondo md:col-span-2`}>
            <h3 className={h3}>{t.descubrir.titulo}</h3>
            <figure aria-hidden="true" className="flex flex-col gap-1 rounded-2xl border-2 border-teal-oscuro bg-superficie p-3">
              <span className="flex gap-0.5 text-mango">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Icon key={i} nombre="estrella" className="size-4 fill-current" />
                ))}
              </span>
              <blockquote className="text-sm font-medium">{t.descubrir.cita}</blockquote>
              <figcaption className="text-xs text-texto-2">{t.descubrir.quien}</figcaption>
            </figure>
            <p className={parrafo}>{t.descubrir.texto}</p>
          </article>

          {/* Importar */}
          <article className={`${tarjeta} flex flex-col gap-4 bg-crema md:col-span-4`}>
            <div className="flex max-w-xl flex-col gap-2">
              <h3 className={h3}>{t.importar.titulo}</h3>
              <p className={parrafo}>{t.importar.texto}</p>
            </div>
            <div aria-hidden="true" className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-3">
              <span className="flex max-w-full items-center gap-2 rounded-xl border-2 border-teal-oscuro bg-superficie px-4 py-2 font-medium">
                <Icon nombre="subir" className="size-5" />
                {t.importar.archivo}
              </span>
              <Icon nombre="flecha" className="ml-4 size-6 md:ml-0 md:-rotate-90" />
              <span className="flex max-w-full items-center gap-2 rounded-xl border-2 border-teal-oscuro bg-teal px-4 py-2 font-bold text-white">
                <Icon nombre="check" className="size-5" />
                {t.importar.filas}
              </span>
            </div>
          </article>
        </div>

        <p className={parrafo}>{t.tambien}</p>
      </div>
    </section>
  );
}
