"use client";

import { useActionState } from "react";
import { trocarMinhaSenha } from "@/app/actions/usuarios";

export function TrocarSenhaForm() {
  const [state, action, pendente] = useActionState(trocarMinhaSenha, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="senhaAtual" className="text-sm font-medium text-zinc-700">
          Senha atual
        </label>
        <input
          id="senhaAtual"
          name="senhaAtual"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="novaSenha" className="text-sm font-medium text-zinc-700">
          Nova senha
        </label>
        <input
          id="novaSenha"
          name="novaSenha"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirmarNovaSenha" className="text-sm font-medium text-zinc-700">
          Confirmar nova senha
        </label>
        <input
          id="confirmarNovaSenha"
          name="confirmarNovaSenha"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      {state?.erro && (
        <p className="text-sm text-red-600" role="alert">
          {state.erro}
        </p>
      )}
      {state?.sucesso && (
        <p className="text-sm text-green-700" role="status">
          Senha alterada com sucesso.
        </p>
      )}

      <button
        type="submit"
        disabled={pendente}
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pendente ? "Salvando..." : "Trocar senha"}
      </button>
    </form>
  );
}
