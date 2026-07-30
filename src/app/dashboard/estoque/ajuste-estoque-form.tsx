"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ajustarEstoque } from "@/app/actions/estoque";

const TIPOS = [
  { valor: "ENTRADA_AJUSTE", rotulo: "Entrada (correção para mais)" },
  { valor: "SAIDA_AJUSTE", rotulo: "Saída (correção para menos)" },
  { valor: "SAIDA_PERDA", rotulo: "Perda / quebra / validade vencida" },
] as const;

export function AjusteEstoqueForm({
  produtos,
}: {
  produtos: { id: string; nome: string; unidadeMedida: string }[];
}) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [erro, setErro] = useState<string | undefined>();
  const [sucesso, setSucesso] = useState(false);

  const [produtoId, setProdutoId] = useState(produtos[0]?.id ?? "");
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]["valor"]>(
    "ENTRADA_AJUSTE"
  );
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");

  function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(undefined);
    setSucesso(false);

    iniciarTransicao(async () => {
      const resultado = await ajustarEstoque({
        produtoId,
        tipo,
        quantidade: Number(quantidade),
        observacao: observacao || undefined,
      });

      if (resultado?.erro) {
        setErro(resultado.erro);
        return;
      }

      setSucesso(true);
      setQuantidade("");
      setObservacao("");
      router.refresh();
    });
  }

  if (produtos.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Cadastre produtos primeiro para poder ajustar o estoque deles.
      </p>
    );
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Produto</label>
        <select
          value={produtoId}
          onChange={(e) => setProdutoId(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          {produtos.map((produto) => (
            <option key={produto.id} value={produto.id}>
              {produto.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Tipo</label>
        <select
          value={tipo}
          onChange={(e) =>
            setTipo(e.target.value as (typeof TIPOS)[number]["valor"])
          }
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          {TIPOS.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.rotulo}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">
          Quantidade
        </label>
        <input
          type="number"
          step="0.001"
          min="0"
          required
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          className="w-32 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">
          Motivo (opcional)
        </label>
        <input
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <button
        type="submit"
        disabled={pendente}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pendente ? "Salvando..." : "Registrar ajuste"}
      </button>

      {erro && (
        <p className="w-full text-sm text-red-600" role="alert">
          {erro}
        </p>
      )}
      {sucesso && (
        <p className="w-full text-sm text-green-700" role="status">
          Ajuste registrado.
        </p>
      )}
    </form>
  );
}
