import { agruparPorSemana, DIAS_MINIMOS_PARA_DIARIO, type DiaDeDinero } from "@/domain";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.gestion.grafico;

/** "2026-11-02" → "2": el día del mes basta como etiqueta del eje. */
const diaDelMes = (fecha: string) => String(Number(fecha.slice(8, 10)));
const diaCompleto = (fecha: string) => new Date(`${fecha}T12:00:00Z`).toLocaleDateString("es-SV", { day: "numeric", month: "short", timeZone: "UTC" });

/**
 * Lo que entró y salió cada día, en barras de a dos (teal entra, rosa sale). Va sin ejes: arriba dice cuál fue el día más alto,
 * cada día se nombra al pasar el mouse o con el lector de pantalla, y la tabla escondida trae los mismos números.
 */
export function GraficoEntraSale({ dias: diarios, titulo }: { dias: DiaDeDinero[]; titulo: string }) {
  // Con pocos días con movimiento se agrupa por semana: un mes con una barra y veintisiete vacías no dice nada
  const activos = diarios.filter((d) => d.entra > 0 || d.sale > 0).length;
  const porSemana = diarios.length > 7 && activos < DIAS_MINIMOS_PARA_DIARIO;
  const dias = porSemana ? agruparPorSemana(diarios) : diarios;
  const maximo = Math.max(0, ...dias.flatMap((d) => [d.entra, d.sale]));
  const hayDatos = maximo > 0;
  const entro = dias.reduce((s, d) => s + d.entra, 0);
  const salio = dias.reduce((s, d) => s + d.sale, 0);
  // Con muchos días no caben todos los números: se rotulan algunos
  const cada = porSemana ? 1 : dias.length > 14 ? 7 : dias.length > 7 ? 2 : 1;

  return (
    <figure className="flex flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-superficie p-4 md:p-5" aria-label={titulo}>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-bold">{titulo}</span>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-3 rounded-sm bg-teal" />
            {t.entro} <strong className="tabular-nums">{formatearDolares(entro)}</strong>
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-3 rounded-sm bg-rosa" />
            {t.salio} <strong className="tabular-nums">{formatearDolares(salio)}</strong>
          </li>
        </ul>
      </figcaption>

      {hayDatos ? (
        <>
          <div className="flex h-36 items-end gap-[3px] border-b-2 border-teal-oscuro/30 md:h-44" aria-hidden="true">
            {dias.map((d) => (
              <div key={d.fecha} title={porSemana ? t.semana(diaCompleto(d.fecha), formatearDolares(d.entra), formatearDolares(d.sale)) : t.dia(diaCompleto(d.fecha), formatearDolares(d.entra), formatearDolares(d.sale))} className="flex h-full min-w-0 flex-1 items-end justify-center gap-px">
                <span className="w-full max-w-3 rounded-t-[3px] bg-teal" style={{ height: `${(d.entra / maximo) * 100}%` }} />
                <span className="w-full max-w-3 rounded-t-[3px] bg-rosa" style={{ height: `${(d.sale / maximo) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="flex gap-[3px] text-xs text-texto-2" aria-hidden="true">
            {dias.map((d, i) => (
              <span key={d.fecha} className="min-w-0 flex-1 text-center tabular-nums">
                {i % cada === 0 ? (porSemana ? diaCompleto(d.fecha) : diaDelMes(d.fecha)) : ""}
              </span>
            ))}
          </div>
          <table className="sr-only">
            <caption>{titulo}</caption>
            <thead>
              <tr>
                <th scope="col">{t.fecha}</th>
                <th scope="col">{t.entro}</th>
                <th scope="col">{t.salio}</th>
              </tr>
            </thead>
            <tbody>
              {dias.map((d) => (
                <tr key={d.fecha}>
                  <th scope="row">{diaCompleto(d.fecha)}</th>
                  <td>{formatearDolares(d.entra)}</td>
                  <td>{formatearDolares(d.sale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p className="py-6 text-center text-texto-2">{t.vacio}</p>
      )}
    </figure>
  );
}
