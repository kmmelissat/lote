import { EnlacePunch } from "@/components/ui/BotonesPunch";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";

const t = textos.productos.form.varios;

/** Para quien tiene muchos productos: en vez de cargarlos de uno en uno, varias fotos a la vez o un Excel o CSV. Va en el encabezado. */
export function AccionesCargarVarios() {
  return (
    <div className="flex flex-wrap justify-end gap-2" role="group" aria-label={t.titulo}>
      <EnlacePunch href="/productos/lote">
        <Icon nombre="camara" className="size-4" />
        {t.fotos}
      </EnlacePunch>
      <EnlacePunch href="/productos/importar">
        <Icon nombre="hoja" className="size-4" />
        {t.importar}
      </EnlacePunch>
    </div>
  );
}
