import { agruparParaVitrina } from "@/features/catalog/agruparVitrina";
import { colorDeMarca } from "@/features/catalog/marca";
import { listarProductosPublicos, obtenerNegocioPublico } from "@/features/catalog/repositorio";
import { COLOR, fotoOg, gorilaOg, imagenOg, LogoOg, StickerOg, TAMANO_OG, VaciaOg } from "@/lib/og";
import { urlSitio } from "@/lib/sitio";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";

const t = textos.vitrina.seo;

export const alt = t.ogAltTienda;
export const size = TAMANO_OG;
export const contentType = "image/jpeg";
export const revalidate = 3600;

const dominio = urlSitio.replace(/^https?:\/\//, "");

// Dónde va y cuánto se tuerce cada foto del collage
const COLLAGE = [
  { left: 0, top: 40, giro: -6, lado: 260 },
  { left: 210, top: 0, giro: 4, lado: 240 },
  { left: 120, top: 250, giro: -2, lado: 250 },
];
// Con una sola foto, va sola y más grande
const SOLA = { left: 70, top: 40, giro: -4, lado: 380 };

/** La tienda: su logo, su nombre y su frase, con tres de sus productos pegados como stickers. */
export default async function Imagen({ params }: { params: Promise<{ negocio: string }> }) {
  const { negocio: slug } = await params;
  const supabase = createPublicClient();
  const [negocio, lista, gorila] = await Promise.all([
    obtenerNegocioPublico(supabase, slug),
    listarProductosPublicos(supabase, slug).catch(() => []),
    gorilaOg(),
  ]);
  if (!negocio) return imagenOg(<VaciaOg gorila={gorila} />);

  // Una foto por producto (no tres colores de la misma funda), primero lo que tiene unidades
  const productos = agruparParaVitrina(lista);
  const conFoto = productos.filter((p) => p.fotos[0]).sort((a, b) => Number(b.disponibles > 0) - Number(a.disponibles > 0));
  const marca = colorDeMarca(negocio.color).hex;
  const [logo, ...fotos] = await Promise.all([fotoOg(negocio.logo, 200), ...conFoto.slice(0, COLLAGE.length).map((p) => fotoOg(p.fotos[0], 280))]);

  return imagenOg(
    <div style={{ display: "flex", width: "100%", height: "100%", background: COLOR.crema, fontFamily: "Jakarta", color: COLOR.tealOscuro }}>
      <div style={{ display: "flex", position: "absolute", left: 0, right: 0, top: 0, height: 28, background: marca }} />

      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: "72px 32px 48px 72px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {logo ? (
             
            <img src={logo} width={120} height={120} alt="" style={{ borderRadius: 32, border: `5px solid ${COLOR.tealOscuro}`, boxShadow: `6px 6px 0 0 ${COLOR.tealOscuro}` }} />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 120,
                height: 120,
                borderRadius: 32,
                background: marca,
                border: `5px solid ${COLOR.tealOscuro}`,
                color: COLOR.blanco,
                fontSize: 64,
                fontWeight: 700,
              }}
            >
              {negocio.nombre.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ display: "block", fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1, lineClamp: 2 }}>{negocio.nombre}</div>
          {negocio.descripcion && <div style={{ display: "block", fontSize: 30, lineHeight: 1.3, color: COLOR.texto2, lineClamp: 2 }}>{negocio.descripcion}</div>}
          {productos.length > 0 && (
            <span
              style={{
                display: "flex",
                alignSelf: "flex-start",
                fontSize: 26,
                fontWeight: 700,
                padding: "6px 20px",
                borderRadius: 999,
                border: `3px solid ${COLOR.tealOscuro}`,
                background: COLOR.limon,
                transform: "rotate(-2deg)",
              }}
            >
              {t.ogProductos(productos.length)}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <LogoOg gorila={gorila} escala={0.9} />
          <span style={{ fontSize: 22, color: COLOR.texto2, whiteSpace: "nowrap" }}>{`${dominio}/c/${slug}`}</span>
        </div>
      </div>

      {fotos.length > 0 && (
        <div style={{ display: "flex", position: "relative", width: 520, marginTop: 80, marginRight: 40 }}>
          {fotos.map((foto, i) => {
            const lugar = fotos.length === 1 ? SOLA : COLLAGE[i];
            return (
              <div key={i} style={{ display: "flex", position: "absolute", left: lugar.left, top: lugar.top }}>
                <StickerOg foto={foto} lado={lugar.lado} giro={lugar.giro} gorila={gorila} sombra={i === 1 || fotos.length === 1 ? COLOR.rosa : COLOR.tealOscuro} />
              </div>
            );
          })}
        </div>
      )}
    </div>,
  );
}
