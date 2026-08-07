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
//
// A atualização do saldo é feita com um UPDATE condicional atômico (em
// vez de ler o saldo e depois escrever um valor calculado) para não
// perder uma baixa quando duas vendas do mesmo produto acontecem ao
// mesmo tempo — sem isso, as duas poderiam ler o mesmo saldo inicial e a
// segunda escrita "por cima" apagaria o efeito da primeira.
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

  if (ehEntrada) {
    await tx.produto.update({
      where: { id: dados.produtoId },
      data: { estoqueAtual: { increment: dados.quantidade } },
    });
  } else {
    const resultado = await tx.produto.updateMany({
      where: {
        id: dados.produtoId,
        estoqueAtual: { gte: dados.quantidade },
      },
      data: { estoqueAtual: { decrement: dados.quantidade } },
    });

    if (resultado.count === 0) {
      const produto = await tx.produto.findUniqueOrThrow({
        where: { id: dados.produtoId },
      });
      throw new EstoqueInsuficienteError(
        produto.nome,
        Number(produto.estoqueAtual),
        dados.quantidade
      );
    }
  }

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

// Dá baixa no estoque referente à venda de produtos. Chamada pelo módulo
// de Caixa/PDV quando uma comanda é fechada.
//
// - Produto SIMPLES: desconta o próprio produto.
// - Produto COMPOSTO: desconta cada insumo da ficha técnica, multiplicado
//   pela quantidade vendida (ex: vender 2 sanduíches desconta o dobro de
//   pão e presunto da receita).
//
// Por padrão abre sua própria transação: ou a venda inteira dá baixa com
// sucesso, ou nada é alterado (evita estoque "pela metade"). Se já existe
// uma transação em andamento (ex: o fechamento da comanda, que também
// registra os pagamentos), passe-a em `opcoes.tx` para tudo acontecer
// atomicamente junto.
export async function venderProdutos(
  lojaId: string,
  itensVendidos: { produtoId: string; quantidade: number }[],
  opcoes?: {
    criadoPorId?: string;
    observacao?: string;
    tx?: Prisma.TransactionClient;
  }
) {
  const executar = async (tx: Prisma.TransactionClient) => {
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
  };

  if (opcoes?.tx) {
    return executar(opcoes.tx);
  }
  return db.$transaction(executar);
}
