import { Nav } from "@/components/nav/Nav";

// En escritorio todo vive en un panel redondeado que flota sobre el fondo.
export default function PanelLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="md:h-dvh md:p-2">
      <div className="md:flex md:h-full md:overflow-hidden md:rounded-3xl md:bg-fondo">
        <Nav />
        <main className="w-full px-4 pb-28 pt-4 md:flex-1 md:overflow-y-auto md:px-8 md:pb-10 md:pt-8">
          <div className="mx-auto max-w-[1100px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
