import { nombreBase } from "@/domain";
import { colorDeMarca } from "@/features/catalog/marca";
import { listarProductosPublicos, obtenerNegocioPublico, obtenerProductoPublico } from "@/features/catalog/repositorio";
import { formatearDolares } from "@/lib/formato";
import { COLOR, fotoOg, gorilaOg, imagenOg, LogoOg, StickerOg, TAMANO_OG, VaciaOg } from "@/lib/og";
import { urlSitio } from "@/lib/sitio";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";

const t = textos.vitrina.seo;

export const alt = t.ogAltProducto;
export const size = TAMANO_OG;
export const contentType = "image/jpeg";
// Se vuelve a dibujar cada hora: precio y stock cambian
export const revalidate = 3600;

const dominio = urlSitio.replace(/^https?:\/\//, "");

/** La foto del producto pegada como sticker, con el nombre, el precio y la tienda al lado. */
export default async function Imagen({ params }: { params: Promise<{ negocio: string; codigo: string }> }) {
  const { negocio: slug, codigo } = await params;
  const supabase = createPublicClient();
  const [negocio, p, todos, gorila] = await Promise.all([
    obtenerNegocioPublico(supabase, slug),
    obtenerProductoPublico(supabase, slug, Number(codigo)),
    listarProductosPublicos(supabase, slug).catch(() => []),
    gorilaOg(),
  ]);
  if (!negocio || !p) return imagenOg(<VaciaOg gorila={gorila} />);

  // Con variantes: el rango de precios y todo lo que queda entre todas
  const familia = p.grupo ? todos.filter((o) => o.grupo === p.grupo) : [];
  const grupo = familia.length ? familia : [p];
  const bajo = Math.min(...grupo.map((o) => o.precio));
  const alto = Math.max(...grupo.map((o) => o.precio));
  const quedan = grupo.reduce((n, o) => n + o.disponibles, 0);
  const marca = colorDeMarca(negocio.color).hex;
  const [foto, logo] = await Promise.all([fotoOg(p.fotos[0], 460), fotoOg(negocio.logo, 120)]);

  return imagenOg(
      <div style={{ display: "flex", width: "100%", height: "100%", background: COLOR.crema, fontFamily: "Jakarta", color: COLOR.tealOscuro }}>
        {/* Una franja del color de la tienda: cada vitrina se ve suya */}
        <div style={{ display: "flex", position: "absolute", left: 0, top: 0, bottom: 0, width: 28, background: marca }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 560, paddingLeft: 40 }}>
          <StickerOg foto={foto} lado={460} giro={-3} gorila={gorila} sombra={COLOR.rosa} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: "56px 64px 48px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {logo ? (
               
              <img src={logo} width={56} height={56} alt="" style={{ borderRadius: 28, border: `3px solid ${COLOR.tealOscuro}` }} />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 28, background: marca, color: COLOR.blanco, fontSize: 28, fontWeight: 700 }}>
                {negocio.nombre.charAt(0).toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: 30, fontWeight: 700 }}>{negocio.nombre}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "block", fontSize: 58, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1, lineClamp: 3 }}>{nombreBase(p.nombre, p.variante)}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  background: COLOR.limon,
                  border: `4px solid ${COLOR.tealOscuro}`,
                  borderRadius: 999,
                  boxShadow: `6px 6px 0 0 ${COLOR.tealOscuro}`,
                  padding: "6px 28px",
                  transform: "rotate(-2deg)",
                }}
              >
                {bajo !== alto && <span style={{ fontSize: 26, fontWeight: 500 }}>{textos.explorar.desdeEtiqueta}</span>}
                <span style={{ fontSize: 52, fontWeight: 700 }}>{formatearDolares(bajo)}</span>
              </div>
              <span
                style={{
                  display: "flex",
                  fontSize: 24,
                  fontWeight: 700,
                  padding: "6px 18px",
                  borderRadius: 999,
                  border: `3px solid ${COLOR.tealOscuro}`,
                  background: quedan > 0 ? COLOR.blanco : COLOR.rosa,
                }}
              >
                {quedan > 0 ? (grupo.length > 1 ? t.ogOpciones(grupo.length) : t.ogDisponibles(quedan)) : t.ogAgotado}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 24, color: COLOR.texto2 }}>{`${dominio}/c/${slug}`}</span>
            <LogoOg gorila={gorila} escala={0.9} />
          </div>
        </div>
      </div>
  );
}
