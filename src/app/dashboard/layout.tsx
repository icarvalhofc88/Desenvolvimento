import Link from "next/link";
import { redirect } from "next/navigation";
import { obterUsuarioAtual } from "@/lib/dal";
import { logout } from "@/app/actions/auth";

const NOME_PERFIL: Record<string, string> = {
  DONO: "Dono",
  GERENTE: "Gerente",
  CAIXA: "Caixa",
  GARCOM: "Garçom",
  COZINHA: "Cozinha",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await obterUsuarioAtual();

  if (!usuario) {
    redirect("/login");
  }

  const podeGerenciarUsuarios =
    usuario.perfil === "DONO" || usuario.perfil === "GERENTE";

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
        <nav className="flex items-center gap-4">
          <Link href="/dashboard" className="font-semibold text-zinc-900">
            Reserva 88
          </Link>
          {podeGerenciarUsuarios && (
            <Link
              href="/dashboard/usuarios"
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              Usuários
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-600">
            {usuario.nome}{" "}
            <span className="text-zinc-400">
              ({NOME_PERFIL[usuario.perfil] ?? usuario.perfil})
            </span>
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-50"
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
