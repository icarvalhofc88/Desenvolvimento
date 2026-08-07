"use client";

import { useActionState } from "react";
import type { ClienteFormState } from "@/lib/definitions";

export type ClienteFormValores = {
  nome: string;
  telefone: string;
  cpfCnpj: string;
  observacao: string;
  limiteCredito: string;
};

export function ClienteForm({
  acao,
  valoresIniciais,
  podeDefinirLimite,
  textoBotao,
}: {
  acao: (
    estadoAnterior: ClienteFormState,
    formData: FormData
  ) => Promise<ClienteFormState>;
  valoresIniciais?: ClienteFormValores;
  podeDefinirLimite: boolean;
  textoBotao: string;
}) {
  const [state, action, pendente] = useActionState(acao, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="cliente-nome" className="text-sm font-medium text-zinc-700">
            Nome
          </label>
          <input
            id="cliente-nome"
            name="nome"
            defaultValue={valoresIniciais?.nome}
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="cliente-telefone" className="text-sm font-medium text-zinc-700">
            Telefone (opcional)
          </label>
          <input
            id="cliente-telefone"
            name="telefone"
            defaultValue={valoresIniciais?.telefone}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="cliente-cpfcnpj" className="text-sm font-medium text-zinc-700">
            CPF/CNPJ (opcional)
          </label>
          <input
            id="cliente-cpfcnpj"
            name="cpfCnpj"
            defaultValue={valoresIniciais?.cpfCnpj}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        {podeDefinirLimite && (
          <div className="flex flex-col gap-1">
            <label htmlFor="cliente-limite" className="text-sm font-medium text-zinc-700">
              Limite de crédito para fiado (opcional)
            </label>
            <input
              id="cliente-limite"
              name="limiteCredito"
              type="number"
              step="0.01"
              min="0"
              defaultValue={valoresIniciais?.limiteCredito}
              placeholder="Sem limite"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        )}

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="cliente-observacao" className="text-sm font-medium text-zinc-700">
            Observação (opcional)
          </label>
          <textarea
            id="cliente-observacao"
            name="observacao"
            defaultValue={valoresIniciais?.observacao}
            rows={2}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
      </div>

      {state?.erro && (
        <p className="text-sm text-red-600" role="alert">
          {state.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={pendente}
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pendente ? "Salvando..." : textoBotao}
      </button>
    </form>
  );
}
