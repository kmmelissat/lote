import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-4 py-10">
      <Logo />
      {children}
    </main>
  );
}
