import { redirect } from "next/navigation";

// La versión más ya es la landing de "/".
export default function LandingMasPage() {
  redirect("/");
}
