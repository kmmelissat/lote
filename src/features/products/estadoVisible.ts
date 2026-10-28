import { pocoStock } from "@/domain";
import type { Estado } from "@/components/ui/StatusChip";
import type { Producto } from "./repositorio";

/** El estado que se dibuja en el chip: el del producto, o "poco stock" si quedan pocas de muchas. */
export const estadoVisible = (p: Producto, umbral: number): Estado =>
  pocoStock(p, umbral) ? "poco_stock" : p.estado;
