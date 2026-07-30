"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ProdutoFormInput, ProdutoFormState } from "@/lib/definitions";

type Opcao = { id: string; nomeExibicao: string };
type Insumo = { id: string; nome: string; unidadeMedida: string };

type VariacaoLinha = { nome: string; precoVenda: string };
type ItemFichaLinha = { insumoId: string; quantidade: string };

export type ProdutoFormValores = {
  nome: string;
  descricao: string;
  categoriaId: string;
  tipo: "SIMPLES" | "COMPOSTO";
  unidadeMedida: string;
  vendavel: boolean;
  precoVenda: string;
  estoqueMinimo: string;
  variacoes: VariacaoLinha[];
  itensFichaTecnica: ItemFichaLinha[];
};

const UNIDADES: { valor: string; rotulo: string }[] = [
  { valor: "un", rotulo: "Unidade" },
  { valor: "kg", rotulo: "Quilograma (kg)" },
  { valor: "g", rotulo: "Grama (g)" },
  { valor: "L", rotulo: "Litro (L)" },
  { valor: "ml", rotulo: "Mililitro (ml)" },
  { valor: "porcao", rotulo: "Porção" },
  { valor: "fatia", rotulo: "Fatia" },
  { valor: "pacote", rotulo: "Pacote" },
  { valor: "duzia", rotulo: "Dúzia" },
];

export function ProdutoForm({
  categorias,
  insumosDisponiveis,
  valoresIniciais,
  aoSalvar,
}: {
  categorias: Opcao[];
  insumosDisponiveis: Insumo[];
  valoresIniciais?: ProdutoFormValores;
  aoSalvar: (dados: ProdutoFormInput) => Promise<ProdutoFormState>;
}) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [erro, setErro] = useState<string | undefined>();

  const [nome, setNome] = useState(valoresIniciais?.nome ?? "");
  const [descricao, setDescricao] = useState(valoresIniciais?.descricao ?? "");
  const [categoriaId, setCategoriaId] = useState(
    valoresIniciais?.categoriaId ?? ""
  );
  const [tipo, setTipo] = useState<"SIMPLES" | "COMPOSTO">(
    valoresIniciais?.tipo ?? "SIMPLES"
  );
  const [unidadeMedida, setUnidadeMedida] = useState(
    valoresIniciais?.unidadeMedida ?? "un"
  );
  const [vendavel, setVendavel] = useState(valoresIniciais?.vendavel ?? true);
  const [precoVenda, setPrecoVenda] = useState(
    valoresIniciais?.precoVenda ?? ""
  );
  const [estoqueMinimo, setEstoqueMinimo] = useState(
    valoresIniciais?.estoqueMinimo ?? "0"
  );
  const [variacoes, setVariacoes] = useState<VariacaoLinha[]>(
    valoresIniciais?.variacoes ?? []
  );
  const [itensFichaTecnica, setItensFichaTecnica] = useState<ItemFichaLinha[]>(
    valoresIniciais?.itensFichaTecnica ?? []
  );

  function adicionarVariacao() {
    setVariacoes((atual) => [...atual, { nome: "", precoVenda: "" }]);
  }

  function removerVariacao(indice: number) {
    setVariacoes((atual) => atual.filter((_, i) => i !== indice));
  }

  function adicionarItemFicha() {
    setItensFichaTecnica((atual) => [
      ...atual,
      { insumoId: insumosDisponiveis[0]?.id ?? "", quantidade: "" },
    ]);
  }

  function removerItemFicha(indice: number) {
    setItensFichaTecnica((atual) => atual.filter((_, i) => i !== indice));
  }

  function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(undefined);

    const payload: ProdutoFormInput = {
      nome,
      descricao: descricao || undefined,
      categoriaId: categoriaId || undefined,
      tipo,
      unidadeMedida: unidadeMedida as ProdutoFormInput["unidadeMedida"],
      vendavel,
      precoVenda: precoVenda === "" ? undefined : Number(precoVenda),
      estoqueMinimo: estoqueMinimo === "" ? 0 : Number(estoqueMinimo),
      variacoes: variacoes.map((v) => ({
        nome: v.nome,
        precoVenda: Number(v.precoVenda),
      })),
      itensFichaTecnica: itensFichaTecnica.map((item) => ({
        insumoId: item.insumoId,
        quantidade: Number(item.quantidade),
      })),
    };

    iniciarTransicao(async () => {
      const resultado = await aoSalvar(payload);
      if (resultado?.erro) {
        setErro(resultado.erro);
        return;
      }
      router.push("/dashboard/produtos");
      router.refresh();
    });
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="produto-nome" className="text-sm font-medium text-zinc-700">Nome</label>
          <input
            id="produto-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="produto-categoria" className="text-sm font-medium text-zinc-700">
            Categoria
          </label>
          <select
            id="produto-categoria"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="">Sem categoria</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nomeExibicao}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="produto-descricao" className="text-sm font-medium text-zinc-700">
            Descrição (opcional)
          </label>
          <textarea
            id="produto-descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={2}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="produto-tipo" className="text-sm font-medium text-zinc-700">Tipo</label>
          <select
            id="produto-tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "SIMPLES" | "COMPOSTO")}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="SIMPLES">Simples</option>
            <option value="COMPOSTO">Composto (tem ficha técnica)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="produto-unidade" className="text-sm font-medium text-zinc-700">
            Unidade de medida
          </label>
          <select
            id="produto-unidade"
            value={unidadeMedida}
            onChange={(e) => setUnidadeMedida(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            {UNIDADES.map((u) => (
              <option key={u.valor} value={u.valor}>
                {u.rotulo}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="produto-estoque-minimo" className="text-sm font-medium text-zinc-700">
            Estoque mínimo (para alerta)
          </label>
          <input
            id="produto-estoque-minimo"
            type="number"
            step="0.001"
            min="0"
            value={estoqueMinimo}
            onChange={(e) => setEstoqueMinimo(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="vendavel"
            type="checkbox"
            checked={vendavel}
            onChange={(e) => setVendavel(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="vendavel" className="text-sm text-zinc-700">
            Aparece à venda (desmarque se for só um insumo interno)
          </label>
        </div>

        {variacoes.length === 0 && (
          <div className="flex flex-col gap-1">
            <label htmlFor="produto-preco" className="text-sm font-medium text-zinc-700">
              Preço de venda
            </label>
            <input
              id="produto-preco"
              type="number"
              step="0.01"
              min="0"
              value={precoVenda}
              onChange={(e) => setPrecoVenda(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-900">
            Variações (opcional)
          </h3>
          <button
            type="button"
            onClick={adicionarVariacao}
            className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
          >
            + Adicionar variação
          </button>
        </div>
        <p className="mb-3 text-xs text-zinc-500">
          Ex: &quot;Pequeno&quot;, &quot;Grande&quot;, &quot;Sabor morango&quot;
          — cada uma com seu próprio preço. Se houver variações, o preço base
          acima não é usado.
        </p>
        {variacoes.map((variacao, indice) => (
          <div key={indice} className="mb-2 flex items-center gap-2">
            <input
              placeholder="Nome da variação"
              value={variacao.nome}
              onChange={(e) =>
                setVariacoes((atual) =>
                  atual.map((v, i) =>
                    i === indice ? { ...v, nome: e.target.value } : v
                  )
                )
              }
              className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Preço"
              value={variacao.precoVenda}
              onChange={(e) =>
                setVariacoes((atual) =>
                  atual.map((v, i) =>
                    i === indice ? { ...v, precoVenda: e.target.value } : v
                  )
                )
              }
              className="w-32 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            <button
              type="button"
              onClick={() => removerVariacao(indice)}
              className="text-xs text-red-600 underline hover:text-red-800"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      {tipo === "COMPOSTO" && (
        <div className="rounded-lg border border-zinc-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-900">
              Ficha técnica (ingredientes)
            </h3>
            <button
              type="button"
              onClick={adicionarItemFicha}
              disabled={insumosDisponiveis.length === 0}
              className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900 disabled:opacity-50"
            >
              + Adicionar ingrediente
            </button>
          </div>
          {insumosDisponiveis.length === 0 && (
            <p className="text-xs text-zinc-500">
              Cadastre outros produtos primeiro para poder usá-los como
              ingredientes aqui.
            </p>
          )}
          {itensFichaTecnica.map((item, indice) => (
            <div key={indice} className="mb-2 flex items-center gap-2">
              <select
                value={item.insumoId}
                onChange={(e) =>
                  setItensFichaTecnica((atual) =>
                    atual.map((it, i) =>
                      i === indice ? { ...it, insumoId: e.target.value } : it
                    )
                  )
                }
                className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                {insumosDisponiveis.map((insumo) => (
                  <option key={insumo.id} value={insumo.id}>
                    {insumo.nome}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.001"
                min="0"
                placeholder="Quantidade"
                value={item.quantidade}
                onChange={(e) =>
                  setItensFichaTecnica((atual) =>
                    atual.map((it, i) =>
                      i === indice
                        ? { ...it, quantidade: e.target.value }
                        : it
                    )
                  )
                }
                className="w-32 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
              <button
                type="button"
                onClick={() => removerItemFicha(indice)}
                className="text-xs text-red-600 underline hover:text-red-800"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}

      {erro && (
        <p className="text-sm text-red-600" role="alert">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={pendente}
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pendente ? "Salvando..." : "Salvar produto"}
      </button>
    </form>
  );
}
