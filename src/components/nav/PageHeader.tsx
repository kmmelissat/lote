export function PageHeader({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion: string;
}) {
  return (
    <header className="mb-4">
      <h1 className="text-2xl font-bold">{titulo}</h1>
      <p className="text-texto-2">{descripcion}</p>
    </header>
  );
}
