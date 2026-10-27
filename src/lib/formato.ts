import { aDolares, type Centavos } from "@/domain";

const moneda = new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" });

export const formatearDolares = (c: Centavos): string => moneda.format(aDolares(c));
