import { ImageResponse } from "next/og";
import { textos } from "@/lib/textos";

export const alt = textos.landing.titulo;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// La imagen que se ve al compartir el enlace: crema, borde y sombra duros, y el título de la landing.
export default function Imagen() {
  const t = textos.landing.hero;
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#fff7e8", padding: 48 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            background: "#ffffff",
            border: "6px solid #003844",
            borderRadius: 40,
            boxShadow: "14px 14px 0 0 #003844",
            padding: 56,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", width: 56, height: 56, borderRadius: 28, background: "#f194b4", border: "4px solid #003844" }} />
            <div style={{ fontSize: 44, fontWeight: 700, color: "#003844" }}>{textos.nombre}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", flexWrap: "wrap", fontSize: 86, fontWeight: 700, lineHeight: 1.05, color: "#003844" }}>
              <span style={{ marginRight: 20 }}>{t.tituloInicio}</span>
              <span style={{ background: "#ffe27a", padding: "0 12px" }}>{t.tituloMarca}</span>
            </div>
            <div style={{ fontSize: 32, color: "#4a6b73" }}>{t.etiqueta}</div>
          </div>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              background: "#ff9a2e",
              border: "4px solid #003844",
              borderRadius: 999,
              padding: "10px 32px",
              fontSize: 30,
              fontWeight: 700,
              color: "#003844",
            }}
          >
            {t.nota}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
