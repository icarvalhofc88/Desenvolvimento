import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirContextoLoja } from "@/lib/dal";
import { db } from "@/lib/db";
import { cancelarItemComanda, cancelarComanda } from "@/app/actions/comandas";
import { avancarStatusItem } from "@/app/actions/cozinha";
import { AdicionarItemForm } from "./adicionar-item-form";

export const metadata: Metadata = {
  title: "Comanda — Reserva 88",
};

const NOME_STATUS_ITEM: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_PREPARO: "Em preparo",
  PRONTO: "Pronto",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

const NOME_STATUS_COMANDA: Record<string, string> = {
  ABERTA: "Aberta",
  FECHADA: "Fechada",
  CANCELADA: "Cancelada",
};

export default async function ComandaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contexto = await exigirContextoLoja([
    "DONO",
    "GERENTE",
    "CAIXA",
    "GARCOM",
  ]);

  const comanda = await db.comanda.findUnique({
    where: { id },
    include: {
      itens: {
        orderBy: { criadoEm: "asc" },
        include: { produto: { select: { nome: true } }, variacao: { select: { nome: true } } },
      },
    },
  });

  if (!comanda || comanda.lojaId !== contexto.lojaId) {
    notFound();
  }

  const produtos = await db.produto.findMany({
    where: {
      lojaId: contexto.lojaId,
      ativo: true,
      vendavel: true,
    },
    orderBy: { nome: "asc" },
    include: { variacoes: { where: { ativo: true } } },
  });

  const itensAtivos = comanda.itens.filter((item) => item.status !== "CANCELADO");
  const total = itensAtivos.reduce(
    (soma, item) => soma + Number(item.quantidade) * Number(item.precoUnitario),
    0
  );

  const aberta = comanda.status === "ABERTA";
  const podeFecharCaixa = ["DONO", "GERENTE", "CAIXA"].includes(
    contexto.perfilEfetivo
  );

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            {comanda.tipo === "MESA" ? `Mesa ${comanda.mesa}` : `Comanda #${comanda.numero}`}
          </h1>
          <p className="text-sm text-zinc-500">
            Status: {NOME_STATUS_COMANDA[comanda.status]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {aberta && podeFecharCaixa && itensAtivos.length > 0 && (
            <Link
              href={`/dashboard/comandas/${comanda.id}/fechar`}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
            >
              Fechar comanda
            </Link>
          )}
          {comanda.status === "FECHADA" && (
            <Link
              href={`/dashboard/comandas/${comanda.id}/ticket`}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
            >
              Ver ticket
            </Link>
          )}
          {aberta && (
            <form action={cancelarComanda.bind(null, comanda.id)}>
              <button
                type="submit"
                className="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
              >
                Cancelar comanda
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">Item</th>
              <th className="px-3 py-2 font-medium">Qtd</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {comanda.itens.map((item) => (
              <tr key={item.id} className="border-b border-zinc-100">
                <td className="px-3 py-2 text-zinc-900">
                  {item.produto.nome}
                  {item.variacao && ` (${item.variacao.nome})`}
                  {item.observacao && (
                    <div className="text-xs text-zinc-500">{item.observacao}</div>
                  )}
                </td>
                <td className="px-3 py-2 text-zinc-600">
                  {Number(item.quantidade)}
                </td>
                <td className="px-3 py-2 text-zinc-600">
                  {NOME_STATUS_ITEM[item.status]}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-3">
                    {aberta && item.status === "PRONTO" && (
                      <form action={avancarStatusItem.bind(null, item.id)}>
                        <button
                          type="submit"
                          className="text-xs font-medium text-green-700 underline hover:text-green-900"
                        >
                          Marcar entregue
                        </button>
                      </form>
                    )}
                    {aberta && item.status !== "CANCELADO" && (
                      <form action={cancelarItemComanda.bind(null, item.id)}>
                        <button
                          type="submit"
                          className="text-xs font-medium text-red-600 underline hover:text-red-800"
                        >
                          Remover
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {comanda.itens.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-zinc-400" colSpan={4}>
                  Nenhum item lançado ainda.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-zinc-200">
              <td className="px-3 py-2 font-medium text-zinc-900" colSpan={2}>
                Total
              </td>
              <td className="px-3 py-2 font-medium text-zinc-900" colSpan={2}>
                R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {aberta && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-medium text-zinc-900">
            Lançar item
          </h2>
          <AdicionarItemForm
            comandaId={comanda.id}
            produtos={produtos.map((p) => ({
              id: p.id,
              nome: p.nome,
              precoVenda: p.precoVenda ? Number(p.precoVenda) : null,
              variacoes: p.variacoes.map((v) => ({
                id: v.id,
                nome: v.nome,
                precoVenda: Number(v.precoVenda),
              })),
            }))}
          />
        </div>
      )}
    </div>
  );
}
