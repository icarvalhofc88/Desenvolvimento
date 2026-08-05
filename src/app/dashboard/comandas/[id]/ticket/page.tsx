import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { exigirContextoLoja } from "@/lib/dal";
import { db } from "@/lib/db";
import { PrintButton } from "./print-button";

export const metadata: Metadata = {
  title: "Ticket — Reserva 88",
};

const NOME_FORMA_PAGAMENTO: Record<string, string> = {
  DINHEIRO: "Dinheiro",
  CARTAO_DEBITO: "Cartão de débito",
  CARTAO_CREDITO: "Cartão de crédito",
  PIX: "PIX",
  OUTRO: "Outro",
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function TicketPage({
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
      pagamentos: true,
    },
  });

  if (!comanda || comanda.lojaId !== contexto.lojaId) {
    notFound();
  }

  if (comanda.status === "ABERTA") {
    redirect(`/dashboard/comandas/${id}/fechar`);
  }
  if (comanda.status !== "FECHADA") {
    redirect("/dashboard/comandas");
  }

  const loja = await db.loja.findUnique({
    where: { id: contexto.lojaId },
    select: { nomeFantasia: true, cnpj: true },
  });

  const total = comanda.itens.reduce(
    (soma, item) => soma + Number(item.quantidade) * Number(item.precoUnitario),
    0
  );
  const totalPago = comanda.pagamentos.reduce((soma, p) => soma + Number(p.valor), 0);
  const troco = totalPago - total;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <div className="print:hidden flex items-center justify-between">
        <Link
          href="/dashboard/comandas"
          className="text-sm text-zinc-600 underline hover:text-zinc-900"
        >
          Voltar para comandas
        </Link>
        <PrintButton />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 font-mono text-sm">
        <div className="mb-3 text-center">
          <p className="font-semibold">{loja?.nomeFantasia}</p>
          {loja?.cnpj && <p className="text-xs text-zinc-500">CNPJ {loja.cnpj}</p>}
        </div>

        <div className="mb-3 border-t border-dashed border-zinc-300 pt-2 text-xs text-zinc-600">
          <p>
            {comanda.tipo === "MESA" ? `Mesa ${comanda.mesa}` : `Comanda #${comanda.numero}`}
          </p>
          <p>
            {comanda.fechadaEm?.toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
        </div>

        <ul className="mb-3 flex flex-col gap-1 border-t border-dashed border-zinc-300 pt-2">
          {comanda.itens.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span>
                {Number(item.quantidade)}x {item.produto.nome}
                {item.variacao && ` (${item.variacao.nome})`}
              </span>
              <span>
                {formatarMoeda(Number(item.quantidade) * Number(item.precoUnitario))}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex justify-between border-t border-dashed border-zinc-300 pt-2 font-semibold">
          <span>Total</span>
          <span>{formatarMoeda(total)}</span>
        </div>

        <div className="mt-2 flex flex-col gap-1 border-t border-dashed border-zinc-300 pt-2 text-xs">
          {comanda.pagamentos.map((pagamento) => (
            <div key={pagamento.id} className="flex justify-between">
              <span>{NOME_FORMA_PAGAMENTO[pagamento.forma] ?? pagamento.forma}</span>
              <span>{formatarMoeda(Number(pagamento.valor))}</span>
            </div>
          ))}
          {troco > 0.01 && (
            <div className="flex justify-between">
              <span>Troco</span>
              <span>{formatarMoeda(troco)}</span>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-[10px] text-zinc-400">
          Documento sem valor fiscal — comprovante interno de controle.
        </p>
      </div>
    </div>
  );
}
