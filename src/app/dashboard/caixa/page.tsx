import type { Metadata } from "next";
import Link from "next/link";
import { exigirContextoLoja } from "@/lib/dal";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Caixa — Reserva 88",
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function CaixaPage() {
  const contexto = await exigirContextoLoja(["DONO", "GERENTE", "CAIXA"]);

  const comandasAbertas = await db.comanda.findMany({
    where: { lojaId: contexto.lojaId, status: "ABERTA" },
    orderBy: { abertaEm: "asc" },
    include: {
      itens: {
        where: { status: { not: "CANCELADO" } },
        select: { quantidade: true, precoUnitario: true },
      },
    },
  });

  const vendasFechadas = await db.comanda.findMany({
    where: { lojaId: contexto.lojaId, status: "FECHADA" },
    orderBy: { fechadaEm: "desc" },
    take: 50,
    include: {
      itens: {
        where: { status: { not: "CANCELADO" } },
        select: { quantidade: true, precoUnitario: true },
      },
    },
  });

  function total(itens: { quantidade: unknown; precoUnitario: unknown }[]) {
    return itens.reduce(
      (soma, item) => soma + Number(item.quantidade) * Number(item.precoUnitario),
      0
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Caixa</h1>
        <p className="text-sm text-zinc-500">
          Feche comandas abertas e consulte as últimas vendas.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-900">
          Comandas abertas para fechar
        </h2>
        {comandasAbertas.length === 0 ? (
          <p className="text-sm text-zinc-400">Nenhuma comanda aberta agora.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Comanda</th>
                  <th className="px-4 py-2 font-medium">Total</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {comandasAbertas.map((comanda) => (
                  <tr key={comanda.id} className="border-b border-zinc-100">
                    <td className="px-4 py-2 text-zinc-900">
                      {comanda.tipo === "MESA"
                        ? `Mesa ${comanda.mesa}`
                        : `Comanda #${comanda.numero}`}
                    </td>
                    <td className="px-4 py-2 text-zinc-600">
                      {formatarMoeda(total(comanda.itens))}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/dashboard/comandas/${comanda.id}/fechar`}
                        className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                      >
                        Fechar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-900">
          Últimas vendas
        </h2>
        {vendasFechadas.length === 0 ? (
          <p className="text-sm text-zinc-400">Nenhuma venda fechada ainda.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Comanda</th>
                  <th className="px-4 py-2 font-medium">Total</th>
                  <th className="px-4 py-2 font-medium">Fechada em</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {vendasFechadas.map((comanda) => (
                  <tr key={comanda.id} className="border-b border-zinc-100">
                    <td className="px-4 py-2 text-zinc-900">
                      {comanda.tipo === "MESA"
                        ? `Mesa ${comanda.mesa}`
                        : `Comanda #${comanda.numero}`}
                    </td>
                    <td className="px-4 py-2 text-zinc-600">
                      {formatarMoeda(total(comanda.itens))}
                    </td>
                    <td className="px-4 py-2 text-zinc-500">
                      {comanda.fechadaEm?.toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/dashboard/comandas/${comanda.id}/ticket`}
                        className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
                      >
                        Ver ticket
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
