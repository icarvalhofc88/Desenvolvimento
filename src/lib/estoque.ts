import "server-only";
import { db } from "@/lib/db";
import type { Prisma, TipoMovimentoEstoque } from "@/generated/prisma/client";

const TIPOS_ENTRADA: TipoMovimentoEstoque[] = [
  "ENTRADA_COMPRA",
  "ENTRADA_AJUSTE",
];

export class EstoqueInsuficienteError extends Error {
  constructor(
    public produtoNome: string,
    public disponivel: number,
    public solicitado: number
  ) {
    super(
      `Estoque insuficiente de "${produtoNome}": disponível ${disponivel}, solicitado ${solicitado}.`
    );
    this.name = "EstoqueInsuficienteError";
  }
}

// Aplica um movimento de estoque (soma ou subtrai do produto) dentro de
// uma transação já aberta, para garantir que o saldo do produto e o
// registro do movimento nunca fiquem "descasados" um do outro.
export async function registrarMovimento(
  tx: Prisma.TransactionClient,
  dados: {
    lojaId: string;
    produtoId: string;
    tipo: TipoMovimentoEstoque;
    quantidade: number;
    observacao?: string;
    criadoPorId?: string;
    itemNotaFiscalId?: string;
  }
) {
  const ehEntrada = TIPOS_ENTRADA.includes(dados.tipo);
  const delta = ehEntrada ? dados.quantidade : -dados.quantidade;

  const produto = await tx.produto.findUniqueOrThrow({
    where: { id: dados.produtoId },
  });

  const novoEstoque = Number(produto.estoqueAtual) + delta;
  if (novoEstoque < 0) {
    throw new EstoqueInsuficienteError(
      produto.nome,
      Number(produto.estoqueAtual),
      dados.quantidade
    );
  }

  await tx.produto.update({
    where: { id: dados.produtoId },
    data: { estoqueAtual: novoEstoque },
  });

  await tx.movimentoEstoque.create({
    data: {
      lojaId: dados.lojaId,
      produtoId: dados.produtoId,
      tipo: dados.tipo,
      quantidade: dados.quantidade,
      observacao: dados.observacao,
      criadoPorId: dados.criadoPorId,
      itemNotaFiscalId: dados.itemNotaFiscalId,
    },
  });
}

// Dá baixa no estoque referente à venda de produtos. Usada pelo módulo de
// Caixa/PDV (ainda não construído): quando uma venda é fechada, ele chama
// esta função com os itens vendidos.
//
// - Produto SIMPLES: desconta o próprio produto.
// - Produto COMPOSTO: desconta cada insumo da ficha técnica, multiplicado
//   pela quantidade vendida (ex: vender 2 sanduíches desconta o dobro de
//   pão e presunto da receita).
//
// Tudo roda em uma única transação: ou a venda inteira dá baixa com
// sucesso, ou nada é alterado (evita estoque "pela metade").
export async function venderProdutos(
  lojaId: string,
  itensVendidos: { produtoId: string; quantidade: number }[],
  opcoes?: { criadoPorId?: string; observacao?: string }
) {
  return db.$transaction(async (tx) => {
    for (const item of itensVendidos) {
      const produto = await tx.produto.findUnique({
        where: { id: item.produtoId },
        include: { itensFichaTecnica: true },
      });

      if (!produto || produto.lojaId !== lojaId) {
        throw new Error("Produto inválido para venda.");
      }

      if (produto.tipo === "SIMPLES") {
        await registrarMovimento(tx, {
          lojaId,
          produtoId: produto.id,
          tipo: "SAIDA_VENDA",
          quantidade: item.quantidade,
          observacao: opcoes?.observacao,
          criadoPorId: opcoes?.criadoPorId,
        });
      } else {
        for (const ingrediente of produto.itensFichaTecnica) {
          await registrarMovimento(tx, {
            lojaId,
            produtoId: ingrediente.insumoId,
            tipo: "SAIDA_VENDA",
            quantidade: Number(ingrediente.quantidade) * item.quantidade,
            observacao:
              opcoes?.observacao ?? `Usado na venda de "${produto.nome}"`,
            criadoPorId: opcoes?.criadoPorId,
          });
        }
      }
    }
  });
}
