"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirContextoLoja } from "@/lib/dal";
import { venderProdutos, EstoqueInsuficienteError } from "@/lib/estoque";
import type { Perfil } from "@/generated/prisma/client";
import {
  FecharComandaSchema,
  type FecharComandaInput,
  type FecharComandaState,
} from "@/lib/definitions";

// Garçom lança pedidos, mas quem fecha a conta (mexe com pagamento) é
// Caixa, Gerente ou Dono.
const PERFIS_QUE_FECHAM_CAIXA: Perfil[] = ["DONO", "GERENTE", "CAIXA"];

// Prazo padrão da conta a receber gerada quando parte da venda é fiada.
// Não há tela para editar o vencimento no fechamento (mantém a tela
// simples); quem quiser um prazo diferente ajusta depois em
// Financeiro > Contas a Receber.
const DIAS_PRAZO_FIADO = 30;

export async function fecharComanda(
  dados: FecharComandaInput
): Promise<FecharComandaState> {
  const contexto = await exigirContextoLoja(PERFIS_QUE_FECHAM_CAIXA);

  const validado = FecharComandaSchema.safeParse(dados);
  if (!validado.success) {
    return { erro: "Verifique os dados de pagamento e tente novamente." };
  }
  const { comandaId, pagamentos } = validado.data;

  const comanda = await db.comanda.findUnique({
    where: { id: comandaId },
    include: { itens: { where: { status: { not: "CANCELADO" } } } },
  });
  if (!comanda || comanda.lojaId !== contexto.lojaId) {
    return { erro: "Comanda inválida." };
  }
  if (comanda.status !== "ABERTA") {
    return { erro: "Esta comanda já não está mais aberta." };
  }
  if (comanda.itens.length === 0) {
    return { erro: "Não é possível fechar uma comanda sem itens." };
  }

  const total = comanda.itens.reduce(
    (soma, item) => soma + Number(item.quantidade) * Number(item.precoUnitario),
    0
  );
  const totalPago = pagamentos.reduce((soma, p) => soma + p.valor, 0);

  // Pequena tolerância para arredondamento de centavos.
  if (totalPago < total - 0.01) {
    return {
      erro: `O valor pago (R$ ${totalPago.toFixed(2)}) é menor que o total da comanda (R$ ${total.toFixed(2)}).`,
    };
  }

  const descricaoComanda =
    comanda.tipo === "MESA" ? `Mesa ${comanda.mesa}` : `Comanda #${comanda.numero}`;

  // Parte fiada da venda: precisa de um cliente vinculado (na comanda ou
  // escolhido agora) e, se o cliente tiver limite de crédito, checamos se
  // essa nova dívida cabe nele.
  const valorFiado = pagamentos
    .filter((p) => p.forma === "FIADO")
    .reduce((soma, p) => soma + p.valor, 0);

  const clienteId = validado.data.clienteId || comanda.clienteId || undefined;

  if (valorFiado > 0) {
    if (!clienteId) {
      return { erro: "Selecione o cliente para fiar esta venda." };
    }

    const cliente = await db.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente || cliente.lojaId !== contexto.lojaId || !cliente.ativo) {
      return { erro: "Cliente inválido." };
    }

    if (cliente.limiteCredito !== null) {
      const contasAbertas = await db.contaReceber.findMany({
        where: { clienteId, status: "PENDENTE" },
        select: { valor: true },
      });
      const saldoDevedor = contasAbertas.reduce(
        (soma, c) => soma + Number(c.valor),
        0
      );
      const limiteDisponivel = Number(cliente.limiteCredito) - saldoDevedor;
      if (valorFiado > limiteDisponivel) {
        return {
          erro: `Limite de crédito insuficiente para ${cliente.nome}. Disponível: R$ ${limiteDisponivel.toFixed(2)}.`,
        };
      }
    }
  }

  try {
    await db.$transaction(async (tx) => {
      // Dá baixa no estoque (produto simples desconta ele mesmo, composto
      // desconta os insumos da ficha técnica) na MESMA transação que
      // registra os pagamentos e fecha a comanda — ou tudo acontece, ou
      // nada é alterado.
      await venderProdutos(
        contexto.lojaId,
        comanda.itens.map((item) => ({
          produtoId: item.produtoId,
          quantidade: Number(item.quantidade),
        })),
        {
          criadoPorId: contexto.usuario.id,
          observacao: `Venda — ${descricaoComanda}`,
          tx,
        }
      );

      for (const pagamento of pagamentos) {
        await tx.pagamento.create({
          data: {
            comandaId,
            forma: pagamento.forma,
            valor: pagamento.valor,
          },
        });

        // FIADO não é dinheiro entrando agora — vira uma conta a receber
        // do cliente, quitada depois quando ele pagar.
        if (pagamento.forma === "FIADO" && clienteId) {
          const vencimento = new Date();
          vencimento.setDate(vencimento.getDate() + DIAS_PRAZO_FIADO);

          await tx.contaReceber.create({
            data: {
              lojaId: contexto.lojaId,
              clienteId,
              descricao: `Fiado — ${descricaoComanda}`,
              valor: pagamento.valor,
              vencimento,
              criadoPorId: contexto.usuario.id,
            },
          });
        }
      }

      await tx.comanda.update({
        where: { id: comandaId },
        data: {
          status: "FECHADA",
          fechadaEm: new Date(),
          fechadaPorId: contexto.usuario.id,
          clienteId,
        },
      });
    });
  } catch (erro) {
    if (erro instanceof EstoqueInsuficienteError) {
      return { erro: erro.message };
    }
    throw erro;
  }

  revalidatePath("/dashboard/comandas");
  revalidatePath("/dashboard/caixa");
  revalidatePath("/dashboard/clientes");
  revalidatePath("/dashboard/financeiro");
  revalidatePath(`/dashboard/comandas/${comandaId}`);
  return { sucesso: true };
}
