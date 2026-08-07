"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirContextoLoja } from "@/lib/dal";
import type { Perfil } from "@/generated/prisma/client";
import {
  ContaFormSchema,
  type ContaFormInput,
  type ContaFormState,
} from "@/lib/definitions";

const PERFIS_FINANCEIRO: Perfil[] = ["DONO", "GERENTE"];

function revalidarFinanceiro() {
  revalidatePath("/dashboard/financeiro");
  revalidatePath("/dashboard/financeiro/contas-pagar");
  revalidatePath("/dashboard/financeiro/contas-receber");
}

function lerContaFormData(formData: FormData): ContaFormInput {
  return {
    descricao: formData.get("descricao") as string,
    categoria: (formData.get("categoria") as string) || undefined,
    valor: formData.get("valor") as unknown as number,
    vencimento: formData.get("vencimento") as string,
  };
}

export async function criarContaPagar(
  _estadoAnterior: ContaFormState,
  formData: FormData
): Promise<ContaFormState> {
  const contexto = await exigirContextoLoja(PERFIS_FINANCEIRO);

  const validado = ContaFormSchema.safeParse(lerContaFormData(formData));
  if (!validado.success) {
    return { erro: "Verifique os campos e tente novamente." };
  }
  const { descricao, categoria, valor, vencimento } = validado.data;

  await db.contaPagar.create({
    data: {
      lojaId: contexto.lojaId,
      descricao,
      categoria,
      valor,
      vencimento: new Date(vencimento),
      criadoPorId: contexto.usuario.id,
    },
  });

  revalidarFinanceiro();
  return { sucesso: true };
}

export async function criarContaReceber(
  _estadoAnterior: ContaFormState,
  formData: FormData
): Promise<ContaFormState> {
  const contexto = await exigirContextoLoja(PERFIS_FINANCEIRO);

  const validado = ContaFormSchema.safeParse(lerContaFormData(formData));
  if (!validado.success) {
    return { erro: "Verifique os campos e tente novamente." };
  }
  const { descricao, categoria, valor, vencimento } = validado.data;

  await db.contaReceber.create({
    data: {
      lojaId: contexto.lojaId,
      descricao,
      categoria,
      valor,
      vencimento: new Date(vencimento),
      criadoPorId: contexto.usuario.id,
    },
  });

  revalidarFinanceiro();
  return { sucesso: true };
}

export async function marcarContaPagarPaga(id: string): Promise<void> {
  const contexto = await exigirContextoLoja(PERFIS_FINANCEIRO);
  const conta = await db.contaPagar.findUnique({ where: { id } });
  if (!conta || conta.lojaId !== contexto.lojaId || conta.status !== "PENDENTE") {
    return;
  }
  await db.contaPagar.update({
    where: { id },
    data: { status: "QUITADA", pagoEm: new Date() },
  });
  revalidarFinanceiro();
}

export async function marcarContaReceberRecebida(id: string): Promise<void> {
  const contexto = await exigirContextoLoja(PERFIS_FINANCEIRO);
  const conta = await db.contaReceber.findUnique({ where: { id } });
  if (!conta || conta.lojaId !== contexto.lojaId || conta.status !== "PENDENTE") {
    return;
  }
  await db.contaReceber.update({
    where: { id },
    data: { status: "QUITADA", recebidoEm: new Date() },
  });
  revalidarFinanceiro();
}

// "Desfazer" — volta uma conta já quitada para pendente, caso alguém
// tenha clicado errado.
export async function estornarContaPagar(id: string): Promise<void> {
  const contexto = await exigirContextoLoja(PERFIS_FINANCEIRO);
  const conta = await db.contaPagar.findUnique({ where: { id } });
  if (!conta || conta.lojaId !== contexto.lojaId || conta.status !== "QUITADA") {
    return;
  }
  await db.contaPagar.update({
    where: { id },
    data: { status: "PENDENTE", pagoEm: null },
  });
  revalidarFinanceiro();
}

export async function estornarContaReceber(id: string): Promise<void> {
  const contexto = await exigirContextoLoja(PERFIS_FINANCEIRO);
  const conta = await db.contaReceber.findUnique({ where: { id } });
  if (!conta || conta.lojaId !== contexto.lojaId || conta.status !== "QUITADA") {
    return;
  }
  await db.contaReceber.update({
    where: { id },
    data: { status: "PENDENTE", recebidoEm: null },
  });
  revalidarFinanceiro();
}

// Cancela um lançamento feito por engano — só permitido antes de ser
// quitado (depois disso, a conta fica no histórico como registro).
export async function cancelarContaPagar(id: string): Promise<void> {
  const contexto = await exigirContextoLoja(PERFIS_FINANCEIRO);
  const conta = await db.contaPagar.findUnique({ where: { id } });
  if (!conta || conta.lojaId !== contexto.lojaId || conta.status !== "PENDENTE") {
    return;
  }
  await db.contaPagar.update({ where: { id }, data: { status: "CANCELADA" } });
  revalidarFinanceiro();
}

export async function cancelarContaReceber(id: string): Promise<void> {
  const contexto = await exigirContextoLoja(PERFIS_FINANCEIRO);
  const conta = await db.contaReceber.findUnique({ where: { id } });
  if (!conta || conta.lojaId !== contexto.lojaId || conta.status !== "PENDENTE") {
    return;
  }
  await db.contaReceber.update({ where: { id }, data: { status: "CANCELADA" } });
  revalidarFinanceiro();
}
