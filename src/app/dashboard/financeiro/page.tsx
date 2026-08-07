import type { Metadata } from "next";
import Link from "next/link";
import { exigirContextoLoja } from "@/lib/dal";
import { db } from "@/lib/db";
import {
  marcarContaPagarPaga,
  marcarContaReceberRecebida,
} from "@/app/actions/financeiro";

export const metadata: Metadata = {
  title: "Financeiro — Reserva 88",
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function primeiroDiaDoMes(): string {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

function hojeString(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string }>;
}) {
  const contexto = await exigirContextoLoja(["DONO", "GERENTE"]);
  const { de, ate } = await searchParams;

  const inicio = de ? new Date(`${de}T00:00:00`) : new Date(`${primeiroDiaDoMes()}T00:00:00`);
  const fim = ate ? new Date(`${ate}T23:59:59`) : new Date(`${hojeString()}T23:59:59`);

  const [
    pagamentosPeriodo,
    pagamentosFiadoPeriodo,
    contasPagarPagas,
    contasReceberRecebidas,
    itensVendidos,
  ] = await Promise.all([
      // FIADO não conta como venda em caixa — não é dinheiro que entrou
      // agora, é uma dívida do cliente (vira Conta a Receber separada).
      db.pagamento.findMany({
        where: {
          criadoEm: { gte: inicio, lte: fim },
          forma: { not: "FIADO" },
          comanda: { lojaId: contexto.lojaId },
        },
        select: { valor: true },
      }),
      db.pagamento.findMany({
        where: {
          criadoEm: { gte: inicio, lte: fim },
          forma: "FIADO",
          comanda: { lojaId: contexto.lojaId },
        },
        select: { valor: true },
      }),
      db.contaPagar.findMany({
        where: {
          lojaId: contexto.lojaId,
          status: "QUITADA",
          pagoEm: { gte: inicio, lte: fim },
        },
        select: { valor: true },
      }),
      db.contaReceber.findMany({
        where: {
          lojaId: contexto.lojaId,
          status: "QUITADA",
          recebidoEm: { gte: inicio, lte: fim },
        },
        select: { valor: true },
      }),
      db.itemComanda.findMany({
        where: {
          status: { not: "CANCELADO" },
          comanda: {
            lojaId: contexto.lojaId,
            status: "FECHADA",
            fechadaEm: { gte: inicio, lte: fim },
          },
        },
        select: {
          quantidade: true,
          precoUnitario: true,
          produto: { select: { custoUnitario: true } },
        },
      }),
    ]);

  const totalVendas = pagamentosPeriodo.reduce((s, p) => s + Number(p.valor), 0);
  const totalFiado = pagamentosFiadoPeriodo.reduce((s, p) => s + Number(p.valor), 0);
  const totalRecebido = contasReceberRecebidas.reduce((s, c) => s + Number(c.valor), 0);
  const totalPago = contasPagarPagas.reduce((s, c) => s + Number(c.valor), 0);
  const entradas = totalVendas + totalRecebido;
  const saldo = entradas - totalPago;

  let lucroBruto = 0;
  let itensSemCusto = 0;
  for (const item of itensVendidos) {
    const qtd = Number(item.quantidade);
    const preco = Number(item.precoUnitario);
    if (item.produto.custoUnitario !== null) {
      lucroBruto += (preco - Number(item.produto.custoUnitario)) * qtd;
    } else {
      itensSemCusto += 1;
    }
  }

  const [contasPagarPendentes, contasReceberPendentes] = await Promise.all([
    db.contaPagar.findMany({
      where: { lojaId: contexto.lojaId, status: "PENDENTE" },
      orderBy: { vencimento: "asc" },
      take: 5,
    }),
    db.contaReceber.findMany({
      where: { lojaId: contexto.lojaId, status: "PENDENTE" },
      orderBy: { vencimento: "asc" },
      take: 5,
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Financeiro</h1>
          <p className="text-sm text-zinc-500">Fluxo de caixa do período.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/financeiro/contas-pagar"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-white"
          >
            Contas a pagar
          </Link>
          <Link
            href="/dashboard/financeiro/contas-receber"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-white"
          >
            Contas a receber
          </Link>
        </div>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">De</label>
          <input
            type="date"
            name="de"
            defaultValue={de ?? primeiroDiaDoMes()}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Até</label>
          <input
            type="date"
            name="ate"
            defaultValue={ate ?? hojeString()}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Aplicar período
        </button>
      </form>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Vendas (Caixa)</p>
          <p className="text-lg font-semibold text-zinc-900">
            {formatarMoeda(totalVendas)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Vendido fiado</p>
          <p className="text-lg font-semibold text-zinc-900">
            {formatarMoeda(totalFiado)}
          </p>
          <p className="text-[10px] text-zinc-400">não conta como caixa</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Contas recebidas</p>
          <p className="text-lg font-semibold text-zinc-900">
            {formatarMoeda(totalRecebido)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Contas pagas</p>
          <p className="text-lg font-semibold text-zinc-900">
            {formatarMoeda(totalPago)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Saldo do período</p>
          <p
            className={
              saldo >= 0
                ? "text-lg font-semibold text-green-700"
                : "text-lg font-semibold text-red-700"
            }
          >
            {formatarMoeda(saldo)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className="text-xs text-zinc-500">Lucro bruto estimado das vendas</p>
        <p className="text-lg font-semibold text-zinc-900">
          {formatarMoeda(lucroBruto)}
        </p>
        {itensSemCusto > 0 && (
          <p className="mt-1 text-xs text-amber-700">
            {itensSemCusto} item(ns) vendido(s) sem custo cadastrado não entraram
            nesta conta. Cadastre o &quot;custo unitário&quot; do produto para
            incluir.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-medium text-zinc-900">
            Contas a pagar pendentes
          </h2>
          {contasPagarPendentes.length === 0 ? (
            <p className="text-sm text-zinc-400">Nenhuma pendência.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {contasPagarPendentes.map((conta) => (
                <li
                  key={conta.id}
                  className="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                >
                  <span>
                    {conta.descricao} — {formatarMoeda(Number(conta.valor))}
                    <span className="ml-1 text-xs text-zinc-400">
                      vence {conta.vencimento.toLocaleDateString("pt-BR")}
                    </span>
                  </span>
                  <form action={marcarContaPagarPaga.bind(null, conta.id)}>
                    <button
                      type="submit"
                      className="text-xs font-medium text-green-700 underline hover:text-green-900"
                    >
                      Marcar paga
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-medium text-zinc-900">
            Contas a receber pendentes
          </h2>
          {contasReceberPendentes.length === 0 ? (
            <p className="text-sm text-zinc-400">Nenhuma pendência.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {contasReceberPendentes.map((conta) => (
                <li
                  key={conta.id}
                  className="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                >
                  <span>
                    {conta.descricao} — {formatarMoeda(Number(conta.valor))}
                    <span className="ml-1 text-xs text-zinc-400">
                      vence {conta.vencimento.toLocaleDateString("pt-BR")}
                    </span>
                  </span>
                  <form action={marcarContaReceberRecebida.bind(null, conta.id)}>
                    <button
                      type="submit"
                      className="text-xs font-medium text-green-700 underline hover:text-green-900"
                    >
                      Marcar recebida
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
