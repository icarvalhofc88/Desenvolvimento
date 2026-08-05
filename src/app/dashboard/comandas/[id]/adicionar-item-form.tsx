"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adicionarItemComanda } from "@/app/actions/comandas";

type Variacao = { id: string; nome: string; precoVenda: number };
type Produto = {
  id: string;
  nome: string;
  precoVenda: number | null;
  variacoes: Variacao[];
};

export function AdicionarItemForm({
  comandaId,
  produtos,
}: {
  comandaId: string;
  produtos: Produto[];
}) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [erro, setErro] = useState<string | undefined>();

  const [produtoId, setProdutoId] = useState(produtos[0]?.id ?? "");
  const [variacaoId, setVariacaoId] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [observacao, setObservacao] = useState("");

  const produtoSelecionado = useMemo(
    () => produtos.find((p) => p.id === produtoId),
    [produtoId, produtos]
  );

  function selecionarProduto(id: string) {
    setProdutoId(id);
    setVariacaoId("");
  }

  function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(undefined);

    iniciarTransicao(async () => {
      const resultado = await adicionarItemComanda({
        comandaId,
        produtoId,
        variacaoId: variacaoId || undefined,
        quantidade: Number(quantidade),
        observacao: observacao || undefined,
      });

      if (resultado?.erro) {
        setErro(resultado.erro);
        return;
      }

      setQuantidade("1");
      setObservacao("");
      router.refresh();
    });
  }

  if (produtos.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Nenhum produto disponível para venda no momento.
      </p>
    );
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-3">
      <select
        value={produtoId}
        onChange={(e) => selecionarProduto(e.target.value)}
        className="rounded-md border border-zinc-300 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-zinc-900"
      >
        {produtos.map((produto) => (
          <option key={produto.id} value={produto.id}>
            {produto.nome}
          </option>
        ))}
      </select>

      {produtoSelecionado && produtoSelecionado.variacoes.length > 0 && (
        <select
          value={variacaoId}
          onChange={(e) => setVariacaoId(e.target.value)}
          required
          className="rounded-md border border-zinc-300 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          <option value="">Selecione a variação...</option>
          {produtoSelecionado.variacoes.map((variacao) => (
            <option key={variacao.id} value={variacao.id}>
              {variacao.nome} — R${" "}
              {variacao.precoVenda.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </option>
          ))}
        </select>
      )}

      <div className="flex gap-3">
        <input
          type="number"
          step="1"
          min="1"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          className="w-24 rounded-md border border-zinc-300 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
        <input
          placeholder="Observação (ex: sem cebola)"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          className="flex-1 rounded-md border border-zinc-300 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      {erro && (
        <p className="text-sm text-red-600" role="alert">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={pendente}
        className="rounded-md bg-zinc-900 px-4 py-3 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pendente ? "Lançando..." : "Lançar item"}
      </button>
    </form>
  );
}
