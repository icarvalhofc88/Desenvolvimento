"use client";

import { useActionState } from "react";
import type { ContaFormState } from "@/lib/definitions";

export function ContaForm({
  acao,
  textoBotao,
}: {
  acao: (
    estadoAnterior: ContaFormState,
    formData: FormData
  ) => Promise<ContaFormState>;
  textoBotao: string;
}) {
  const [state, action, pendente] = useActionState(acao, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Descrição</label>
        <input
          name="descricao"
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">
          Categoria (opcional)
        </label>
        <input
          name="categoria"
          placeholder="Ex: Aluguel, Fornecedor..."
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Valor</label>
        <input
          name="valor"
          type="number"
          step="0.01"
          min="0"
          required
          className="w-32 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">
          Vencimento
        </label>
        <input
          name="vencimento"
          type="date"
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <button
        type="submit"
        disabled={pendente}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pendente ? "Salvando..." : textoBotao}
      </button>

      {state?.erro && (
        <p className="w-full text-sm text-red-600" role="alert">
          {state.erro}
        </p>
      )}
    </form>
  );
}
