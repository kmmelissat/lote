import { explorarProductos } from "@/features/catalog/explorar";
import { COLOR, fotoOg, gorilaOg, imagenOg, LogoOg, StickerOg, TAMANO_OG } from "@/lib/og";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";

const t = textos.vitrina.seo;

export const alt = t.ogAltExplorar;
export const size = TAMANO_OG;
export const contentType = "image/jpeg";
export const revalidate = 3600;

const COLLAGE = [
  { left: 0, top: 30, giro: -6 },
  { left: 200, top: 0, giro: 5 },
  { left: 90, top: 230, giro: -2 },
];

/** Explorar: el mismo encabezado de la página (teal, "te encante" subrayado) con productos reales de distintas tiendas. */
export default async function Imagen() {
  const [productos, gorila] = await Promise.all([
    explorarProductos(createPublicClient(), { limite: 12, desde: 0, orden: "recientes" })
      .then((r) => r.productos)
      .catch(() => []),
    gorilaOg(),
  ]);
  // Uno por tienda, para que se note que son varias
  const unoPorTienda = productos.filter((p, i, todos) => p.foto && todos.findIndex((o) => o.tiendaSlug === p.tiendaSlug) === i);
  const elegidos = (unoPorTienda.length >= COLLAGE.length ? unoPorTienda : productos.filter((p) => p.foto)).slice(0, COLLAGE.length);
  const fotos = await Promise.all(elegidos.map((p) => fotoOg(p.foto, 260)));

  return imagenOg(
    <div style={{ display: "flex", width: "100%", height: "100%", background: COLOR.crema, padding: 40, fontFamily: "Jakarta" }}>
      <div
        style={{
          display: "flex",
          flex: 1,
          background: COLOR.teal,
          border: `5px solid ${COLOR.tealOscuro}`,
          borderRadius: 40,
          boxShadow: `14px 14px 0 0 ${COLOR.rosa}`,
          padding: "56px 0 48px 60px",
          color: COLOR.crema,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <LogoOg gorila={gorila} escala={1.1} />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 50, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 }}>
              <span style={{ whiteSpace: "nowrap" }}>{t.ogExplorarTitulo}</span>
              {/* El subrayado limón, debajo de las letras como en el encabezado del Marketplace */}
              <span style={{ display: "flex", alignSelf: "flex-start", paddingBottom: 10, backgroundImage: `linear-gradient(transparent 86%, ${COLOR.limon} 86%, ${COLOR.limon} 100%)`, whiteSpace: "nowrap" }}>
                {t.ogExplorarDestacado}
              </span>
            </div>
            <span style={{ fontSize: 30, color: COLOR.crema, opacity: 0.9 }}>{t.ogExplorarTexto}</span>
          </div>
        </div>
        {fotos.length > 0 && (
          <div style={{ display: "flex", position: "relative", width: 470, marginRight: 30 }}>
            {fotos.map((foto, i) => (
              <div key={i} style={{ display: "flex", position: "absolute", left: COLLAGE[i].left, top: COLLAGE[i].top }}>
                <StickerOg foto={foto} lado={230} giro={COLLAGE[i].giro} gorila={gorila} sombra={COLOR.tealOscuro} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
  );
}
