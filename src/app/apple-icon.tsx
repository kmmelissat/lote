import { ImageResponse } from "next/og";
import { COLOR, gorilaOg } from "@/lib/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// El ícono al guardar Lote en la pantalla de inicio del iPhone: el gorila sobre limón, como el logo sticker.
// iOS redondea las esquinas solo.
export default async function AppleIcon() {
  const gorila = await gorilaOg();
  return new ImageResponse(
    (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: COLOR.limon }}>
        <img src={gorila} width={120} height={120} alt="" />
      </div>
    ),
    size,
  );
}
