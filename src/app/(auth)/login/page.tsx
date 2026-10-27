import type { Metadata } from "next";
import { Suspense } from "react";
import { textos } from "@/lib/textos";
import { LoginForm } from "@/features/auth/ui/LoginForm";

export const metadata: Metadata = { title: textos.acceso.titulo };

export default function LoginPage() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{textos.acceso.titulo}</h1>
        <p className="text-texto-2">{textos.acceso.descripcion}</p>
      </div>
      {/* useSearchParams necesita su Suspense con Cache Components */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
