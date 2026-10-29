import { COLOR, gorilaOg, imagenOg, LogoOg, TAMANO_OG } from "@/lib/og";
import { textos } from "@/lib/textos";

export const alt = textos.landing.titulo;
export const size = TAMANO_OG;
export const contentType = "image/jpeg";

// La imagen que se ve al compartir el enlace: crema, borde y sombra duros, el logo sticker y el título de la landing.
export default async function Imagen() {
  const t = textos.landing.hero;
  const gorila = await gorilaOg();
  return imagenOg(
    <div style={{ display: "flex", width: "100%", height: "100%", background: COLOR.crema, padding: 48, fontFamily: "Jakarta" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: COLOR.blanco,
          border: `6px solid ${COLOR.tealOscuro}`,
          borderRadius: 40,
          boxShadow: `14px 14px 0 0 ${COLOR.tealOscuro}`,
          padding: 56,
        }}
      >
        <LogoOg gorila={gorila} escala={1.3} />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: 84, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, color: COLOR.tealOscuro }}>
            <span style={{ marginRight: 20 }}>{t.tituloInicio}</span>
            <span style={{ backgroundImage: `linear-gradient(transparent 58%, ${COLOR.limon} 58%)` }}>{t.tituloMarca}</span>
          </div>
          <div style={{ fontSize: 32, color: COLOR.texto2 }}>{t.etiqueta}</div>
        </div>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            background: COLOR.mango,
            border: `4px solid ${COLOR.tealOscuro}`,
            borderRadius: 999,
            boxShadow: `5px 5px 0 0 ${COLOR.tealOscuro}`,
            padding: "10px 32px",
            fontSize: 30,
            fontWeight: 700,
            color: COLOR.tealOscuro,
          }}
        >
          {t.nota}
        </div>
      </div>
    </div>,
  );
}
