/** Datos estructurados para los buscadores (schema.org). El `<` se escapa para que un texto no pueda cerrar la etiqueta. */
export function JsonLd({ datos }: { datos: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, "\\u003c") }} />;
}
