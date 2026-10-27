-- Fotos de producto. Bucket público (la vitrina las muestra sin sesión).
-- Ruta: <negocio_id>/<archivo>. Solo dueña y administradora suben o borran, y solo en su negocio.
-- No hay política de select a propósito: el bucket público sirve los archivos sin listarlos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

drop policy if exists foto_producto_subir on storage.objects;
create policy foto_producto_subir on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'productos'
    and public.puede_gestionar(
      case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
        then ((storage.foldername(name))[1])::uuid end
    )
  );

drop policy if exists foto_producto_borrar on storage.objects;
create policy foto_producto_borrar on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'productos'
    and public.puede_gestionar(
      case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
        then ((storage.foldername(name))[1])::uuid end
    )
  );
