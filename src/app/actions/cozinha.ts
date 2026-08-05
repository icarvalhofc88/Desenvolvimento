"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirContextoLoja } from "@/lib/dal";
import type { Perfil, StatusItemComanda } from "@/generated/prisma/client";

// Quem pode ver o painel da cozinha ou a comanda também pode avançar ou
// desfazer o status dos itens que aparecem ali — não há separação rígida
// de responsabilidade entre cozinha/sala, porque em negócios pequenos a
// mesma pessoa costuma acumular funções.
const TODOS_PERFIS_OPERACIONAIS: Perfil[] = [
  "DONO",
  "GERENTE",
  "CAIXA",
  "GARCOM",
  "COZINHA",
];

const ORDEM_STATUS: StatusItemComanda[] = [
  "PENDENTE",
  "EM_PREPARO",
  "PRONTO",
  "ENTREGUE",
];

export async function avancarStatusItem(itemId: string): Promise<void> {
  const contexto = await exigirContextoLoja(TODOS_PERFIS_OPERACIONAIS);

  const item = await db.itemComanda.findUnique({
    where: { id: itemId },
    include: { comanda: true },
  });
  if (!item || item.comanda.lojaId !== contexto.lojaId) return;
  if (item.comanda.status !== "ABERTA") return;

  const indiceAtual = ORDEM_STATUS.indexOf(item.status);
  if (indiceAtual === -1 || indiceAtual === ORDEM_STATUS.length - 1) return;

  await db.itemComanda.update({
    where: { id: itemId },
    data: { status: ORDEM_STATUS[indiceAtual + 1] },
  });

  revalidatePath("/dashboard/cozinha");
  revalidatePath(`/dashboard/comandas/${item.comandaId}`);
}

export async function retrocederStatusItem(itemId: string): Promise<void> {
  const contexto = await exigirContextoLoja(TODOS_PERFIS_OPERACIONAIS);

  const item = await db.itemComanda.findUnique({
    where: { id: itemId },
    include: { comanda: true },
  });
  if (!item || item.comanda.lojaId !== contexto.lojaId) return;
  if (item.comanda.status !== "ABERTA") return;

  const indiceAtual = ORDEM_STATUS.indexOf(item.status);
  if (indiceAtual <= 0) return;

  await db.itemComanda.update({
    where: { id: itemId },
    data: { status: ORDEM_STATUS[indiceAtual - 1] },
  });

  revalidatePath("/dashboard/cozinha");
  revalidatePath(`/dashboard/comandas/${item.comandaId}`);
}
