"use client";

import { useActionState } from "react";
import { criarUsuario } from "@/app/actions/usuarios";

const NOME_PERFIL: Record<string, string> = {
  DONO: "Dono",
  GERENTE: "Gerente",
  CAIXA: "Caixa",
  GARCOM: "Garçom",
  COZINHA: "Cozinha",
};

export function NovoUsuarioForm({
  perfisDisponiveis,
}: {
  perfisDisponiveis: readonly string[];
}) {
  const [state, action, pendente] = useActionState(criarUsuario, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="nome" className="text-sm font-medium text-zinc-700">
            Nome
          </label>
          <input
            id="nome"
            name="nome"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          {state?.erros?.nome && (
            <p className="text-xs text-red-600">{state.erros.nome[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="email"
            className="text-sm font-medium text-zinc-700"
          >
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          {state?.erros?.email && (
            <p className="text-xs text-red-600">{state.erros.email[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="senha"
            className="text-sm font-medium text-zinc-700"
          >
            Senha provisória
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          {state?.erros?.senha && (
            <p className="text-xs text-red-600">{state.erros.senha[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="perfil"
            className="text-sm font-medium text-zinc-700"
          >
            Perfil de acesso
          </label>
          <select
            id="perfil"
            name="perfil"
            required
            defaultValue=""
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="" disabled>
              Selecione...
            </option>
            {perfisDisponiveis.map((perfil) => (
              <option key={perfil} value={perfil}>
                {NOME_PERFIL[perfil] ?? perfil}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state?.erro && (
        <p className="text-sm text-red-600" role="alert">
          {state.erro}
        </p>
      )}
      {state?.sucesso && (
        <p className="text-sm text-green-700" role="status">
          Usuário criado com sucesso.
        </p>
      )}

      <button
        type="submit"
        disabled={pendente}
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pendente ? "Criando..." : "Criar usuário"}
      </button>
    </form>
  );
}
