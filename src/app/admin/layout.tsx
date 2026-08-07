import Link from "next/link";
import { exigirAdminGeral } from "@/lib/dal";
import { logout } from "@/app/actions/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const contexto = await exigirAdminGeral();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6 py-3">
        <nav className="flex items-center gap-4">
          <Link href="/admin/lojas" className="font-semibold text-white">
            Reserva 88 — Admin Geral
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/perfil" className="text-sm text-zinc-300 hover:text-white">
            {contexto.usuario.nome}
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-zinc-600 px-3 py-1 text-sm text-zinc-200 hover:bg-zinc-800"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="flex flex-1 flex-col bg-zinc-50 p-6">{children}</main>
    </div>
  );
}
