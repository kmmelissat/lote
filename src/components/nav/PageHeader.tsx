export function PageHeader({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion: string;
}) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold">{titulo}</h1>
      <p className="mt-1 text-texto-2">{descripcion}</p>
    </header>
  );
}
