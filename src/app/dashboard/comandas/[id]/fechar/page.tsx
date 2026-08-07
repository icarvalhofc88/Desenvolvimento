import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { exigirContextoLoja } from "@/lib/dal";
import { db } from "@/lib/db";
import { FecharComandaForm } from "./fechar-comanda-form";

export const metadata: Metadata = {
  title: "Fechar comanda — Reserva 88",
};

export default async function FecharComandaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contexto = await exigirContextoLoja(["DONO", "GERENTE", "CAIXA"]);

  const comanda = await db.comanda.findUnique({
    where: { id },
    include: {
      itens: {
        where: { status: { not: "CANCELADO" } },
        include: { produto: { select: { nome: true } }, variacao: { select: { nome: true } } },
      },
      cliente: { select: { id: true, nome: true } },
    },
  });

  if (!comanda || comanda.lojaId !== contexto.lojaId) {
    notFound();
  }

  if (comanda.status === "FECHADA") {
    redirect(`/dashboard/comandas/${id}/ticket`);
  }
  if (comanda.status !== "ABERTA") {
    redirect("/dashboard/comandas");
  }

  const total = comanda.itens.reduce(
    (soma, item) => soma + Number(item.quantidade) * Number(item.precoUnitario),
    0
  );

  const clientes = await db.cliente.findMany({
    where: { lojaId: contexto.lojaId, ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Fechar {comanda.tipo === "MESA" ? `Mesa ${comanda.mesa}` : `Comanda #${comanda.numero}`}
        </h1>
        <p className="text-sm text-zinc-500">
          Confira os itens e escolha a forma de pagamento.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <ul className="mb-3 flex flex-col gap-1 text-sm">
          {comanda.itens.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>
                {Number(item.quantidade)}x {item.produto.nome}
                {item.variacao && ` (${item.variacao.nome})`}
              </span>
              <span>
                {(Number(item.quantidade) * Number(item.precoUnitario)).toLocaleString(
                  "pt-BR",
                  { style: "currency", currency: "BRL" }
                )}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-zinc-200 pt-2 text-sm font-semibold text-zinc-900">
          <span>Total</span>
          <span>{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-900">Pagamento</h2>
        <FecharComandaForm
          comandaId={comanda.id}
          total={total}
          clientes={clientes}
          clienteIdInicial={comanda.cliente?.id}
        />
      </div>
    </div>
  );
}
