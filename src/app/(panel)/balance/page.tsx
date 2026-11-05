import { redirect } from "next/navigation";

/** «Balance» a secas lleva a su primera pestaña. El menú apunta acá para que siga marcado en las dos. */
export default function Page() {
  redirect("/balance/resumen");
}
