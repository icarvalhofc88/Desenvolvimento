"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  criarNotaFiscalManual,
  confirmarImportacaoNotaFiscalXml,
  interpretarNotaFiscalXml,
} from "@/app/actions/estoque";

type Produto = { id: string; nome: string; unidadeMedida: string };
type ItemLinha = {
  produtoId: string;
  descricaoOriginal: string;
  quantidade: string;
  valorUnitario: string;
};

function paraDataInput(data: Date | string | null): string {
  if (!data) return "";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

// Sugestão simples: tenta casar a descrição do item do XML com o nome de
// um produto já cadastrado (ignorando maiúsculas/minúsculas). Se não achar
// nada parecido, deixa em branco para o usuário escolher manualmente.
function sugerirProduto(descricao: string, produtos: Produto[]): string {
  const alvo = descricao.trim().toLowerCase();
  const encontrado = produtos.find(
    (p) =>
      alvo.includes(p.nome.toLowerCase()) ||
      p.nome.toLowerCase().includes(alvo)
  );
  return encontrado?.id ?? "";
}

export function NotaFiscalForm({
  produtosDisponiveis,
}: {
  produtosDisponiveis: Produto[];
}) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [erro, setErro] = useState<string | undefined>();

  const [modo, setModo] = useState<"manual" | "xml">("manual");
  const [xmlAnalisado, setXmlAnalisado] = useState(false);
  const [nomeArquivo, setNomeArquivo] = useState<string | undefined>();

  const [numero, setNumero] = useState("");
  const [fornecedorNome, setFornecedorNome] = useState("");
  const [fornecedorCnpj, setFornecedorCnpj] = useState("");
  const [dataEmissao, setDataEmissao] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [chaveAcesso, setChaveAcesso] = useState<string | undefined>();
  const [itens, setItens] = useState<ItemLinha[]>([]);

  function adicionarItem() {
    setItens((atual) => [
      ...atual,
      {
        produtoId: produtosDisponiveis[0]?.id ?? "",
        descricaoOriginal: "",
        quantidade: "",
        valorUnitario: "",
      },
    ]);
  }

  function removerItem(indice: number) {
    setItens((atual) => atual.filter((_, i) => i !== indice));
  }

  function atualizarItem(indice: number, campo: keyof ItemLinha, valor: string) {
    setItens((atual) =>
      atual.map((item, i) => (i === indice ? { ...item, [campo]: valor } : item))
    );
  }

  function trocarModo(novoModo: "manual" | "xml") {
    setModo(novoModo);
    setErro(undefined);
    setXmlAnalisado(false);
    setNomeArquivo(undefined);
    setNumero("");
    setFornecedorNome("");
    setFornecedorCnpj("");
    setDataEmissao("");
    setValorTotal("");
    setChaveAcesso(undefined);
    setItens([]);
  }

  async function aoEscolherArquivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;

    setErro(undefined);
    setNomeArquivo(arquivo.name);
    const texto = await arquivo.text();

    iniciarTransicao(async () => {
      const resultado = await interpretarNotaFiscalXml(texto);
      if (resultado.erro || !resultado.dados) {
        setErro(resultado.erro ?? "Não foi possível ler o arquivo.");
        setXmlAnalisado(false);
        return;
      }

      const dados = resultado.dados;
      setNumero(dados.numero ?? "");
      setFornecedorNome(dados.fornecedorNome ?? "");
      setFornecedorCnpj(dados.fornecedorCnpj ?? "");
      setDataEmissao(paraDataInput(dados.dataEmissao));
      setValorTotal(dados.valorTotal !== null ? String(dados.valorTotal) : "");
      setChaveAcesso(dados.chaveAcesso ?? undefined);
      setItens(
        dados.itens.map((item) => ({
          produtoId: sugerirProduto(item.descricao, produtosDisponiveis),
          descricaoOriginal: item.descricao,
          quantidade: String(item.quantidade),
          valorUnitario: String(item.valorUnitario),
        }))
      );
      setXmlAnalisado(true);
    });
  }

  function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(undefined);

    const payload = {
      numero: numero || undefined,
      fornecedorNome: fornecedorNome || undefined,
      fornecedorCnpj: fornecedorCnpj || undefined,
      dataEmissao: dataEmissao || undefined,
      itens: itens.map((item) => ({
        produtoId: item.produtoId,
        descricaoOriginal: item.descricaoOriginal || undefined,
        quantidade: Number(item.quantidade),
        valorUnitario:
          item.valorUnitario === "" ? undefined : Number(item.valorUnitario),
      })),
    };

    iniciarTransicao(async () => {
      const resultado =
        modo === "manual"
          ? await criarNotaFiscalManual(payload)
          : await confirmarImportacaoNotaFiscalXml({
              ...payload,
              chaveAcesso,
              valorTotal: valorTotal === "" ? undefined : Number(valorTotal),
            });

      if (resultado?.erro) {
        setErro(resultado.erro);
        return;
      }

      router.push("/dashboard/estoque/notas");
      router.refresh();
    });
  }

  const podeEnviar =
    itens.length > 0 &&
    itens.every((item) => item.produtoId && item.quantidade !== "") &&
    (modo === "manual" || xmlAnalisado);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => trocarModo("manual")}
          className={
            modo === "manual"
              ? "rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
              : "rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700"
          }
        >
          Lançar manualmente
        </button>
        <button
          type="button"
          onClick={() => trocarModo("xml")}
          className={
            modo === "xml"
              ? "rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
              : "rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700"
          }
        >
          Importar XML (NF-e)
        </button>
      </div>

      {modo === "xml" && (
        <div className="rounded-lg border border-zinc-200 p-4">
          <label className="mb-2 block text-sm font-medium text-zinc-700">
            Arquivo XML da nota fiscal
          </label>
          <input type="file" accept=".xml" onChange={aoEscolherArquivo} />
          {nomeArquivo && (
            <p className="mt-2 text-xs text-zinc-500">
              Arquivo: {nomeArquivo}
              {xmlAnalisado && " — lido com sucesso, confira os dados abaixo."}
            </p>
          )}
        </div>
      )}

      {(modo === "manual" || xmlAnalisado) && (
        <form onSubmit={aoEnviar} className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700">
                Número da nota
              </label>
              <input
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700">
                Data de emissão
              </label>
              <input
                type="date"
                value={dataEmissao}
                onChange={(e) => setDataEmissao(e.target.value)}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700">
                Fornecedor
              </label>
              <input
                value={fornecedorNome}
                onChange={(e) => setFornecedorNome(e.target.value)}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700">
                CNPJ do fornecedor
              </label>
              <input
                value={fornecedorCnpj}
                onChange={(e) => setFornecedorCnpj(e.target.value)}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-900">
                Itens da nota
              </h3>
              {modo === "manual" && (
                <button
                  type="button"
                  onClick={adicionarItem}
                  className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
                >
                  + Adicionar item
                </button>
              )}
            </div>

            {modo === "xml" && (
              <p className="mb-3 text-xs text-zinc-500">
                Confira o produto sugerido para cada item — troque se
                necessário antes de confirmar.
              </p>
            )}

            {itens.map((item, indice) => (
              <div key={indice} className="mb-2 flex items-center gap-2">
                {modo === "xml" && (
                  <span className="w-40 truncate text-xs text-zinc-500">
                    {item.descricaoOriginal}
                  </span>
                )}
                <select
                  value={item.produtoId}
                  onChange={(e) =>
                    atualizarItem(indice, "produtoId", e.target.value)
                  }
                  className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="">Selecione o produto...</option>
                  {produtosDisponiveis.map((produto) => (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome}
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
                    atualizarItem(indice, "quantidade", e.target.value)
                  }
                  className="w-28 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="Valor unitário"
                  value={item.valorUnitario}
                  onChange={(e) =>
                    atualizarItem(indice, "valorUnitario", e.target.value)
                  }
                  className="w-32 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                {modo === "manual" && (
                  <button
                    type="button"
                    onClick={() => removerItem(indice)}
                    className="text-xs text-red-600 underline hover:text-red-800"
                  >
                    Remover
                  </button>
                )}
              </div>
            ))}

            {itens.length === 0 && (
              <p className="text-xs text-zinc-400">
                Nenhum item adicionado ainda.
              </p>
            )}
          </div>

          {erro && (
            <p className="text-sm text-red-600" role="alert">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={pendente || !podeEnviar}
            className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {pendente
              ? "Salvando..."
              : modo === "xml"
                ? "Confirmar importação"
                : "Salvar nota fiscal"}
          </button>
        </form>
      )}

      {erro && modo === "xml" && !xmlAnalisado && (
        <p className="text-sm text-red-600" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}
