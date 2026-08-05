"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { exigirContextoLoja } from "@/lib/dal";
import { Prisma, type Perfil } from "@/generated/prisma/client";
import {
  AbrirComandaSchema,
  AdicionarItemComandaSchema,
  type AbrirComandaInput,
  type AbrirComandaState,
  type AdicionarItemComandaInput,
  type ComandaActionState,
} from "@/lib/definitions";

// GARCOM e CAIXA operam comandas no dia a dia; DONO/GERENTE sempre podem.
// COZINHA só acompanha (painel da cozinha, módulo separado).
const PERFIS_QUE_OPERAM_COMANDA: Perfil[] = ["DONO", "GERENTE", "CAIXA", "GARCOM"];

export async function abrirComanda(
  dados: AbrirComandaInput
): Promise<AbrirComandaState> {
  const contexto = await exigirContextoLoja(PERFIS_QUE_OPERAM_COMANDA);

  const validado = AbrirComandaSchema.safeParse(dados);
  if (!validado.success) {
    return { erro: "Informe os dados da comanda corretamente." };
  }
  const { tipo, mesa } = validado.data;

  // Mesa já ocupada: continua na mesma comanda em vez de abrir outra.
  if (tipo === "MESA") {
    const existente = await db.comanda.findFirst({
      where: { lojaId: contexto.lojaId, tipo: "MESA", mesa, status: "ABERTA" },
    });
    if (existente) {
      return { comandaId: existente.id };
    }
  }

  // Gera o próximo número sequencial da loja. Em caso de duas aberturas
  // simultâneas colidirem no mesmo número (@@unique lojaId+numero),
  // tenta de novo algumas vezes.
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const ultima = await db.comanda.findFirst({
      where: { lojaId: contexto.lojaId },
      orderBy: { numero: "desc" },
      select: { numero: true },
    });
    const proximoNumero = (ultima?.numero ?? 0) + 1;

    try {
      const comanda = await db.comanda.create({
        data: {
          lojaId: contexto.lojaId,
          numero: proximoNumero,
          tipo,
          mesa: tipo === "MESA" ? mesa : null,
          abertaPorId: contexto.usuario.id,
        },
      });
      revalidatePath("/dashboard/comandas");
      return { comandaId: comanda.id };
    } catch (erro) {
      const colisaoDeNumero =
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === "P2002";
      if (!colisaoDeNumero || tentativa === 4) {
        throw erro;
      }
    }
  }

  return { erro: "Não foi possível abrir a comanda. Tente novamente." };
}

export async function adicionarItemComanda(
  dados: AdicionarItemComandaInput
): Promise<ComandaActionState> {
  const contexto = await exigirContextoLoja(PERFIS_QUE_OPERAM_COMANDA);

  const validado = AdicionarItemComandaSchema.safeParse(dados);
  if (!validado.success) {
    return { erro: "Verifique os dados do item e tente novamente." };
  }
  const { comandaId, produtoId, variacaoId, quantidade, observacao } =
    validado.data;

  const comanda = await db.comanda.findUnique({ where: { id: comandaId } });
  if (!comanda || comanda.lojaId !== contexto.lojaId) {
    return { erro: "Comanda inválida." };
  }
  if (comanda.status !== "ABERTA") {
    return { erro: "Esta comanda não está mais aberta." };
  }

  const produto = await db.produto.findUnique({
    where: { id: produtoId },
    include: { variacoes: true },
  });
  if (
    !produto ||
    produto.lojaId !== contexto.lojaId ||
    !produto.vendavel ||
    !produto.ativo
  ) {
    return { erro: "Produto inválido." };
  }

  let precoUnitario: number;
  if (variacaoId) {
    const variacao = produto.variacoes.find(
      (v) => v.id === variacaoId && v.ativo
    );
    if (!variacao) {
      return { erro: "Variação inválida." };
    }
    precoUnitario = Number(variacao.precoVenda);
  } else {
    if (produto.variacoes.length > 0) {
      return { erro: "Selecione uma variação para este produto." };
    }
    if (produto.precoVenda === null) {
      return { erro: "Este produto não tem preço de venda definido." };
    }
    precoUnitario = Number(produto.precoVenda);
  }

  await db.itemComanda.create({
    data: {
      comandaId,
      produtoId,
      variacaoId: variacaoId || null,
      quantidade,
      precoUnitario,
      observacao,
      criadoPorId: contexto.usuario.id,
    },
  });

  revalidatePath(`/dashboard/comandas/${comandaId}`);
  return { sucesso: true };
}

export async function cancelarItemComanda(itemId: string): Promise<void> {
  const contexto = await exigirContextoLoja(PERFIS_QUE_OPERAM_COMANDA);

  const item = await db.itemComanda.findUnique({
    where: { id: itemId },
    include: { comanda: true },
  });
  if (!item || item.comanda.lojaId !== contexto.lojaId) return;
  if (item.comanda.status !== "ABERTA") return;

  await db.itemComanda.update({
    where: { id: itemId },
    data: { status: "CANCELADO" },
  });

  revalidatePath(`/dashboard/comandas/${item.comandaId}`);
}

export async function cancelarComanda(comandaId: string): Promise<void> {
  const contexto = await exigirContextoLoja(PERFIS_QUE_OPERAM_COMANDA);

  const comanda = await db.comanda.findUnique({ where: { id: comandaId } });
  if (comanda && comanda.lojaId === contexto.lojaId && comanda.status === "ABERTA") {
    await db.comanda.update({
      where: { id: comandaId },
      data: { status: "CANCELADA", fechadaEm: new Date() },
    });
    revalidatePath("/dashboard/comandas");
  }

  redirect("/dashboard/comandas");
}
