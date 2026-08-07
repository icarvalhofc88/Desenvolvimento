"use server";

import type { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirContextoLoja } from "@/lib/dal";
import { registrarMovimento, EstoqueInsuficienteError } from "@/lib/estoque";
import { interpretarXmlNfe, type NotaFiscalXmlParseada } from "@/lib/nfe";
import type { Perfil } from "@/generated/prisma/client";
import {
  AjusteEstoqueSchema,
  NotaFiscalManualSchema,
  NotaFiscalXmlConfirmacaoSchema,
  type AjusteEstoqueInput,
  type AjusteEstoqueState,
  type NotaFiscalManualInput,
  type NotaFiscalXmlConfirmacaoInput,
  type NotaFiscalFormState,
} from "@/lib/definitions";

const PERFIS_QUE_GERENCIAM_ESTOQUE: Perfil[] = ["DONO", "GERENTE"];

export async function ajustarEstoque(
  dados: AjusteEstoqueInput
): Promise<AjusteEstoqueState> {
  const contexto = await exigirContextoLoja(PERFIS_QUE_GERENCIAM_ESTOQUE);

  const validado = AjusteEstoqueSchema.safeParse(dados);
  if (!validado.success) {
    return { erro: "Verifique os campos do ajuste e tente novamente." };
  }
  const { produtoId, tipo, quantidade, observacao } = validado.data;

  const produto = await db.produto.findUnique({ where: { id: produtoId } });
  if (!produto || produto.lojaId !== contexto.lojaId) {
    return { erro: "Produto inválido." };
  }

  try {
    await db.$transaction(async (tx) => {
      await registrarMovimento(tx, {
        lojaId: contexto.lojaId,
        produtoId,
        tipo,
        quantidade,
        observacao,
        criadoPorId: contexto.usuario.id,
      });
    });
  } catch (erro) {
    if (erro instanceof EstoqueInsuficienteError) {
      return { erro: erro.message };
    }
    throw erro;
  }

  revalidatePath("/dashboard/estoque");
  return { sucesso: true };
}

async function criarNotaFiscal(
  contexto: { lojaId: string; usuario: { id: string } },
  origem: "MANUAL" | "XML",
  dados: z.infer<typeof NotaFiscalManualSchema> & {
    chaveAcesso?: string;
    valorTotal?: number;
  }
): Promise<NotaFiscalFormState> {
  const { numero, fornecedorNome, fornecedorCnpj, dataEmissao, itens } = dados;

  if (dados.chaveAcesso) {
    const jaImportada = await db.notaFiscalCompra.findUnique({
      where: { chaveAcesso: dados.chaveAcesso },
    });
    if (jaImportada) {
      return { erro: "Esta nota fiscal já foi importada anteriormente." };
    }
  }

  const idsProdutos = [...new Set(itens.map((item) => item.produtoId))];
  const produtos = await db.produto.findMany({
    where: { id: { in: idsProdutos } },
  });
  const produtosValidos = produtos.every((p) => p.lojaId === contexto.lojaId);
  if (produtos.length !== idsProdutos.length || !produtosValidos) {
    return { erro: "Um ou mais produtos selecionados são inválidos." };
  }

  try {
    await db.$transaction(async (tx) => {
      const nota = await tx.notaFiscalCompra.create({
        data: {
          lojaId: contexto.lojaId,
          numero,
          fornecedorNome,
          fornecedorCnpj,
          dataEmissao: dataEmissao ? new Date(dataEmissao) : null,
          valorTotal: dados.valorTotal,
          origem,
          chaveAcesso: dados.chaveAcesso,
          criadoPorId: contexto.usuario.id,
        },
      });

      for (const item of itens) {
        const itemCriado = await tx.itemNotaFiscalCompra.create({
          data: {
            notaFiscalId: nota.id,
            produtoId: item.produtoId,
            descricaoOriginal: item.descricaoOriginal || "",
            quantidade: item.quantidade,
            valorUnitario: item.valorUnitario,
            valorTotal:
              item.valorUnitario !== undefined
                ? item.valorUnitario * item.quantidade
                : undefined,
          },
        });

        await registrarMovimento(tx, {
          lojaId: contexto.lojaId,
          produtoId: item.produtoId,
          tipo: "ENTRADA_COMPRA",
          quantidade: item.quantidade,
          observacao: `Compra${numero ? ` — NF ${numero}` : ""}${
            fornecedorNome ? ` (${fornecedorNome})` : ""
          }`,
          criadoPorId: contexto.usuario.id,
          itemNotaFiscalId: itemCriado.id,
        });
      }
    });
  } catch (erro) {
    if (erro instanceof EstoqueInsuficienteError) {
      return { erro: erro.message };
    }
    throw erro;
  }

  revalidatePath("/dashboard/estoque");
  revalidatePath("/dashboard/estoque/notas");
  return { sucesso: true };
}

export async function criarNotaFiscalManual(
  dados: NotaFiscalManualInput
): Promise<NotaFiscalFormState> {
  const contexto = await exigirContextoLoja(PERFIS_QUE_GERENCIAM_ESTOQUE);

  const validado = NotaFiscalManualSchema.safeParse(dados);
  if (!validado.success) {
    return { erro: "Verifique os campos da nota fiscal e tente novamente." };
  }

  return criarNotaFiscal(contexto, "MANUAL", validado.data);
}

export async function confirmarImportacaoNotaFiscalXml(
  dados: NotaFiscalXmlConfirmacaoInput
): Promise<NotaFiscalFormState> {
  const contexto = await exigirContextoLoja(PERFIS_QUE_GERENCIAM_ESTOQUE);

  const validado = NotaFiscalXmlConfirmacaoSchema.safeParse(dados);
  if (!validado.success) {
    return { erro: "Verifique os campos da nota fiscal e tente novamente." };
  }

  return criarNotaFiscal(contexto, "XML", validado.data);
}

export async function interpretarNotaFiscalXml(
  xmlTexto: string
): Promise<{ erro?: string; dados?: NotaFiscalXmlParseada }> {
  await exigirContextoLoja(PERFIS_QUE_GERENCIAM_ESTOQUE);

  try {
    const dados = interpretarXmlNfe(xmlTexto);
    return { dados };
  } catch (erro) {
    if (erro instanceof Error) {
      return { erro: erro.message };
    }
    return { erro: "Não foi possível ler o arquivo XML." };
  }
}
