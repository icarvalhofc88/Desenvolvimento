"use client";

import { useActionState } from "react";
import { criarLoja } from "@/app/actions/lojas";

export function NovaLojaForm() {
  const [state, action, pendente] = useActionState(criarLoja, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">
            Nome fantasia da loja
          </label>
          <input
            name="nomeFantasia"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          {state?.erros?.nomeFantasia && (
            <p className="text-xs text-red-600">
              {state.erros.nomeFantasia[0]}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">
            Razão social (opcional)
          </label>
          <input
            name="razaoSocial"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">CNPJ</label>
          <input
            name="cnpj"
            required
            placeholder="00.000.000/0000-00"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          {state?.erros?.cnpj && (
            <p className="text-xs text-red-600">{state.erros.cnpj[0]}</p>
          )}
        </div>

        <div />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">
            Nome do responsável (Dono)
          </label>
          <input
            name="nomeDono"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          {state?.erros?.nomeDono && (
            <p className="text-xs text-red-600">{state.erros.nomeDono[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">
            E-mail do responsável
          </label>
          <input
            name="emailDono"
            type="email"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          {state?.erros?.emailDono && (
            <p className="text-xs text-red-600">{state.erros.emailDono[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">
            Senha provisória
          </label>
          <input
            name="senhaDono"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          {state?.erros?.senhaDono && (
            <p className="text-xs text-red-600">{state.erros.senhaDono[0]}</p>
          )}
        </div>
      </div>

      {state?.erro && (
        <p className="text-sm text-red-600" role="alert">
          {state.erro}
        </p>
      )}
      {state?.sucesso && (
        <p className="text-sm text-green-700" role="status">
          Loja criada com sucesso.
        </p>
      )}

      <button
        type="submit"
        disabled={pendente}
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pendente ? "Criando..." : "Criar loja"}
      </button>
    </form>
  );
}
