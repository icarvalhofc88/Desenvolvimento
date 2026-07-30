import type { Metadata } from "next";
import { exigirContextoLoja } from "@/lib/dal";
import { db } from "@/lib/db";
import { alternarAtivoUsuario } from "@/app/actions/usuarios";
import { PERFIS } from "@/lib/definitions";
import { NovoUsuarioForm } from "./novo-usuario-form";

export const metadata: Metadata = {
  title: "Usuários — Empório Reserva 88",
};

const NOME_PERFIL: Record<string, string> = {
  DONO: "Dono",
  GERENTE: "Gerente",
  CAIXA: "Caixa",
  GARCOM: "Garçom",
  COZINHA: "Cozinha",
};

export default async function UsuariosPage() {
  // Checagem "de verdade": mesmo que alguém tente acessar esta URL direto,
  // sem passar pelos links da tela, esta linha barra quem não for
  // dono/gerente — e garante que só vemos usuários da loja atual.
  const contexto = await exigirContextoLoja(["DONO", "GERENTE"]);

  const usuarios = await db.usuario.findMany({
    where: { lojaId: contexto.lojaId },
    orderBy: { criadoEm: "asc" },
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
    },
  });

  // Gerente não pode criar contas de dono/gerente — só o próprio dono.
  const perfisDisponiveis =
    contexto.perfilEfetivo === "DONO"
      ? PERFIS
      : PERFIS.filter((p) => p !== "DONO" && p !== "GERENTE");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Usuários</h1>
        <p className="text-sm text-zinc-500">
          Cadastre funcionários e controle quem pode acessar o sistema.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium text-zinc-900">
          Novo usuário
        </h2>
        <NovoUsuarioForm perfisDisponiveis={perfisDisponiveis} />
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">E-mail</th>
              <th className="px-4 py-2 font-medium">Perfil</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className="border-b border-zinc-100">
                <td className="px-4 py-2 text-zinc-900">{usuario.nome}</td>
                <td className="px-4 py-2 text-zinc-600">{usuario.email}</td>
                <td className="px-4 py-2 text-zinc-600">
                  {NOME_PERFIL[usuario.perfil] ?? usuario.perfil}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={
                      usuario.ativo
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                        : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500"
                    }
                  >
                    {usuario.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  {usuario.id !== contexto.usuario.id && (
                    <form action={alternarAtivoUsuario.bind(null, usuario.id)}>
                      <button
                        type="submit"
                        className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
                      >
                        {usuario.ativo ? "Desativar" : "Ativar"}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
