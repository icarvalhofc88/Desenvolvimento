"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirContextoLoja } from "@/lib/dal";
import type { Perfil } from "@/generated/prisma/client";
import {
  ClienteFormSchema,
  type ClienteFormState,
} from "@/lib/definitions";

// Qualquer um que opera comanda pode cadastrar um cliente novo na hora
// (ex: um cliente pedindo fiado pela primeira vez). Editar dados sensíveis
// (limite de crédito, desativar) fica só com Dono/Gerente.
const PERFIS_QUE_CADASTRAM_CLIENTE: Perfil[] = [
  "DONO",
  "GERENTE",
  "CAIXA",
  "GARCOM",
];
const PERFIS_QUE_GERENCIAM_CLIENTE: Perfil[] = ["DONO", "GERENTE"];

export async function criarCliente(
  _estadoAnterior: ClienteFormState,
  formData: FormData
): Promise<ClienteFormState> {
  const contexto = await exigirContextoLoja(PERFIS_QUE_CADASTRAM_CLIENTE);

  const validado = ClienteFormSchema.safeParse({
    nome: formData.get("nome"),
    telefone: formData.get("telefone") || undefined,
    cpfCnpj: formData.get("cpfCnpj") || undefined,
    observacao: formData.get("observacao") || undefined,
    limiteCredito: formData.get("limiteCredito") || undefined,
  });
  if (!validado.success) {
    return { erro: "Verifique os campos e tente novamente." };
  }

  // Só Dono/Gerente definem limite de crédito na hora do cadastro — um
  // garçom cadastrando um cliente novo não define isso sozinho.
  const podeDefinirLimite = PERFIS_QUE_GERENCIAM_CLIENTE.includes(
    contexto.perfilEfetivo
  );

  await db.cliente.create({
    data: {
      lojaId: contexto.lojaId,
      nome: validado.data.nome,
      telefone: validado.data.telefone,
      cpfCnpj: validado.data.cpfCnpj,
      observacao: validado.data.observacao,
      limiteCredito: podeDefinirLimite ? validado.data.limiteCredito : undefined,
    },
  });

  revalidatePath("/dashboard/clientes");
  return { sucesso: true };
}

export async function editarCliente(
  clienteId: string,
  _estadoAnterior: ClienteFormState,
  formData: FormData
): Promise<ClienteFormState> {
  const contexto = await exigirContextoLoja(PERFIS_QUE_GERENCIAM_CLIENTE);

  const cliente = await db.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente || cliente.lojaId !== contexto.lojaId) {
    return { erro: "Cliente não encontrado." };
  }

  const validado = ClienteFormSchema.safeParse({
    nome: formData.get("nome"),
    telefone: formData.get("telefone") || undefined,
    cpfCnpj: formData.get("cpfCnpj") || undefined,
    observacao: formData.get("observacao") || undefined,
    limiteCredito: formData.get("limiteCredito") || undefined,
  });
  if (!validado.success) {
    return { erro: "Verifique os campos e tente novamente." };
  }

  await db.cliente.update({
    where: { id: clienteId },
    data: {
      nome: validado.data.nome,
      telefone: validado.data.telefone,
      cpfCnpj: validado.data.cpfCnpj,
      observacao: validado.data.observacao,
      limiteCredito: validado.data.limiteCredito,
    },
  });

  revalidatePath("/dashboard/clientes");
  revalidatePath(`/dashboard/clientes/${clienteId}`);
  return { sucesso: true };
}

export async function alternarAtivoCliente(clienteId: string): Promise<void> {
  const contexto = await exigirContextoLoja(PERFIS_QUE_GERENCIAM_CLIENTE);

  const cliente = await db.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente || cliente.lojaId !== contexto.lojaId) {
    return;
  }

  await db.cliente.update({
    where: { id: clienteId },
    data: { ativo: !cliente.ativo },
  });

  revalidatePath("/dashboard/clientes");
}

// Associa (ou remove) um cliente à comanda — usado antes de fechar no
// fiado, mas pode ser feito em qualquer venda para manter histórico.
export async function definirClienteComanda(
  comandaId: string,
  formData: FormData
): Promise<void> {
  const contexto = await exigirContextoLoja(PERFIS_QUE_CADASTRAM_CLIENTE);

  const comanda = await db.comanda.findUnique({ where: { id: comandaId } });
  if (!comanda || comanda.lojaId !== contexto.lojaId || comanda.status !== "ABERTA") {
    return;
  }

  const clienteId = (formData.get("clienteId") as string) || null;
  if (clienteId) {
    const cliente = await db.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente || cliente.lojaId !== contexto.lojaId) {
      return;
    }
  }

  await db.comanda.update({
    where: { id: comandaId },
    data: { clienteId },
  });

  revalidatePath(`/dashboard/comandas/${comandaId}`);
  revalidatePath(`/dashboard/comandas/${comandaId}/fechar`);
}
