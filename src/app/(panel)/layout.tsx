import { Nav } from "@/components/nav/Nav";

export default function PanelLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-[1100px] px-4 pb-28 pt-6 md:pb-10 md:pl-[17rem] md:pr-8">
        {children}
      </main>
    </>
  );
}
