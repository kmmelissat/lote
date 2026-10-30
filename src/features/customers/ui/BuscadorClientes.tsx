"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CampoBusqueda } from "@/components/ui/CampoBusqueda";
import { textos } from "@/lib/textos";

const t = textos.clientes;

/** Misma píldora que en productos: filtra al escribir, sin recargar a lo bruto. */
export function BuscadorClientes({ texto, soloConSaldo }: { texto: string; soloConSaldo: boolean }) {
  const router = useRouter();
  const [valor, setValor] = useState(texto);
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setValor(texto);
  }, [texto]);

  useEffect(() => () => window.clearTimeout(espera.current), []);

  function ir(nuevo: string) {
    const q = new URLSearchParams();
    if (nuevo.trim()) q.set("q", nuevo);
    if (soloConSaldo) q.set("saldo", "1");
    const cadena = q.toString();
    router.replace(cadena ? `/clientes?${cadena}` : "/clientes", { scroll: false });
  }

  return (
    <CampoBusqueda
      className="min-w-48 md:max-w-md"
      role="searchbox"
      aria-label={t.buscar}
      placeholder={t.placeholder}
      value={valor}
      maxLength={80}
      onChange={(e) => {
        const q = e.target.value.slice(0, 80);
        setValor(q);
        window.clearTimeout(espera.current);
        espera.current = setTimeout(() => ir(q), 200);
      }}
    />
  );
}
