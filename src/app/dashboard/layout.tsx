import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { obterContexto } from "@/lib/dal";
import { logout } from "@/app/actions/auth";
import { sairModoSuporte } from "@/app/actions/lojas";

const NOME_PERFIL: Record<string, string> = {
  ADMIN_GERAL: "Admin Geral",
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
  const contexto = await obterContexto();

  if (!contexto) {
    redirect("/login");
  }

  if (!contexto.lojaId) {
    redirect("/admin/lojas");
  }

  const loja = await db.loja.findUnique({
    where: { id: contexto.lojaId },
    select: { nomeFantasia: true },
  });

  const podeGerenciarUsuarios =
    contexto.perfilEfetivo === "DONO" || contexto.perfilEfetivo === "GERENTE";

  const podeOperarComandas = [
    "DONO",
    "GERENTE",
    "CAIXA",
    "GARCOM",
  ].includes(contexto.perfilEfetivo);

  const podeVerPainelCozinha = ["DONO", "GERENTE", "COZINHA"].includes(
    contexto.perfilEfetivo
  );

  const podeVerCaixa = ["DONO", "GERENTE", "CAIXA"].includes(
    contexto.perfilEfetivo
  );

  return (
    <div className="flex flex-1 flex-col">
      {contexto.modoSuporte && (
        <div className="print:hidden flex items-center justify-between bg-amber-100 px-6 py-2 text-sm text-amber-900">
          <span>
            Modo suporte: você está operando dentro de{" "}
            <strong>{loja?.nomeFantasia}</strong> como Admin Geral.
          </span>
          <form action={sairModoSuporte}>
            <button type="submit" className="underline hover:no-underline">
              Sair do modo suporte
            </button>
          </form>
        </div>
      )}

      <header className="print:hidden flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
        <nav className="flex items-center gap-4">
          <Link href="/dashboard" className="font-semibold text-zinc-900">
            {loja?.nomeFantasia ?? "Reserva 88"}
          </Link>
          {podeOperarComandas && (
            <Link
              href="/dashboard/comandas"
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              Comandas
            </Link>
          )}
          {podeVerPainelCozinha && (
            <Link
              href="/dashboard/cozinha"
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              Cozinha
            </Link>
          )}
          {podeVerCaixa && (
            <Link
              href="/dashboard/caixa"
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              Caixa
            </Link>
          )}
          {podeGerenciarUsuarios && (
            <>
              <Link
                href="/dashboard/produtos"
                className="text-sm text-zinc-600 hover:text-zinc-900"
              >
                Produtos
              </Link>
              <Link
                href="/dashboard/estoque"
                className="text-sm text-zinc-600 hover:text-zinc-900"
              >
                Estoque
              </Link>
              <Link
                href="/dashboard/usuarios"
                className="text-sm text-zinc-600 hover:text-zinc-900"
              >
                Usuários
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-600">
            {contexto.usuario.nome}{" "}
            <span className="text-zinc-400">
              ({NOME_PERFIL[contexto.perfilEfetivo] ?? contexto.perfilEfetivo})
            </span>
          </span>
          {!contexto.modoSuporte && (
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Sair
              </button>
            </form>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col bg-zinc-50 p-6">{children}</main>
    </div>
  );
}
