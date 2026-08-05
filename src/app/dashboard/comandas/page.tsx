import type { Metadata } from "next";
import Link from "next/link";
import { exigirContextoLoja } from "@/lib/dal";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Comandas — Reserva 88",
};

export default async function ComandasPage() {
  const contexto = await exigirContextoLoja([
    "DONO",
    "GERENTE",
    "CAIXA",
    "GARCOM",
  ]);

  const comandas = await db.comanda.findMany({
    where: { lojaId: contexto.lojaId, status: "ABERTA" },
    orderBy: { abertaEm: "asc" },
    include: {
      itens: {
        where: { status: { not: "CANCELADO" } },
        select: { quantidade: true, precoUnitario: true },
      },
    },
  });

  const mesas = comandas.filter((c) => c.tipo === "MESA");
  const avulsas = comandas.filter((c) => c.tipo === "AVULSA");

  function total(comanda: (typeof comandas)[number]) {
    return comanda.itens.reduce(
      (soma, item) => soma + Number(item.quantidade) * Number(item.precoUnitario),
      0
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Comandas</h1>
          <p className="text-sm text-zinc-500">
            Mesas e comandas avulsas em aberto agora.
          </p>
        </div>
        <Link
          href="/dashboard/comandas/nova"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          + Nova comanda
        </Link>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-900">Mesas</h2>
        {mesas.length === 0 ? (
          <p className="text-sm text-zinc-400">Nenhuma mesa aberta agora.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {mesas.map((comanda) => (
              <Link
                key={comanda.id}
                href={`/dashboard/comandas/${comanda.id}`}
                className="rounded-lg border border-zinc-200 bg-white p-4 text-center hover:border-zinc-400"
              >
                <div className="text-lg font-semibold text-zinc-900">
                  Mesa {comanda.mesa}
                </div>
                <div className="text-xs text-zinc-500">
                  {comanda.itens.length} itens · R${" "}
                  {total(comanda).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-900">
          Comandas avulsas
        </h2>
        {avulsas.length === 0 ? (
          <p className="text-sm text-zinc-400">
            Nenhuma comanda avulsa aberta agora.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {avulsas.map((comanda) => (
              <Link
                key={comanda.id}
                href={`/dashboard/comandas/${comanda.id}`}
                className="rounded-lg border border-zinc-200 bg-white p-4 text-center hover:border-zinc-400"
              >
                <div className="text-lg font-semibold text-zinc-900">
                  Comanda #{comanda.numero}
                </div>
                <div className="text-xs text-zinc-500">
                  {comanda.itens.length} itens · R${" "}
                  {total(comanda).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
