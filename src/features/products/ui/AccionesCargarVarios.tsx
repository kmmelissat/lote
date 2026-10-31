import { ButtonLink } from "@/components/ui/Button";
import { textos } from "@/lib/textos";

const t = textos.productos.form.varios;

/** Para quien tiene muchos productos: en vez de cargarlos de uno en uno, varias fotos a la vez o un Excel o CSV. Va en el encabezado. */
export function AccionesCargarVarios() {
  return (
    <div className="flex flex-wrap justify-end gap-2" role="group" aria-label={t.titulo}>
      <ButtonLink href="/productos/lote" variante="suave" tamano="chico" icono="camara">
        {t.fotos}
      </ButtonLink>
      <ButtonLink href="/productos/importar" variante="suave" tamano="chico" icono="hoja">
        {t.importar}
      </ButtonLink>
    </div>
  );
}
