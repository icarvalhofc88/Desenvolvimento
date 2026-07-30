"use client";

import { useActionState } from "react";
import { criarCategoria } from "@/app/actions/produtos";

type CategoriaOpcao = {
  id: string;
  nomeExibicao: string;
};

export function NovaCategoriaForm({
  categorias,
}: {
  categorias: CategoriaOpcao[];
}) {
  const [state, action, pendente] = useActionState(criarCategoria, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">
          Nome da categoria
        </label>
        <input
          name="nome"
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">
          Categoria pai (opcional)
        </label>
        <select
          name="categoriaPaiId"
          defaultValue=""
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          <option value="">Nenhuma (categoria principal)</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nomeExibicao}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={pendente}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pendente ? "Criando..." : "Criar categoria"}
      </button>

      {state?.erro && (
        <p className="w-full text-sm text-red-600" role="alert">
          {state.erro}
        </p>
      )}
    </form>
  );
}
