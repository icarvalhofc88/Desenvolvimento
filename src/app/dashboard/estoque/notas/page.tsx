import type { Metadata } from "next";
import Link from "next/link";
import { exigirContextoLoja } from "@/lib/dal";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Notas fiscais de compra — Reserva 88",
};

const NOME_ORIGEM: Record<string, string> = {
  XML: "XML (NF-e)",
  MANUAL: "Lançamento manual",
};

function formatarMoeda(valor: number | null) {
  if (valor === null) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function NotasFiscaisPage() {
  const contexto = await exigirContextoLoja(["DONO", "GERENTE"]);

  const notas = await db.notaFiscalCompra.findMany({
    where: { lojaId: contexto.lojaId },
    orderBy: { criadoEm: "desc" },
    include: { _count: { select: { itens: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Notas fiscais de compra
          </h1>
          <p className="text-sm text-zinc-500">
            Cada nota lançada aqui atualiza automaticamente o estoque dos
            produtos comprados.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/estoque"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-white"
          >
            Voltar para estoque
          </Link>
          <Link
            href="/dashboard/estoque/notas/nova"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Nova nota fiscal
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Número</th>
              <th className="px-4 py-2 font-medium">Fornecedor</th>
              <th className="px-4 py-2 font-medium">Origem</th>
              <th className="px-4 py-2 font-medium">Itens</th>
              <th className="px-4 py-2 font-medium">Valor total</th>
              <th className="px-4 py-2 font-medium">Lançada em</th>
            </tr>
          </thead>
          <tbody>
            {notas.map((nota) => (
              <tr key={nota.id} className="border-b border-zinc-100">
                <td className="px-4 py-2 text-zinc-900">
                  {nota.numero ?? "—"}
                </td>
                <td className="px-4 py-2 text-zinc-600">
                  {nota.fornecedorNome ?? "—"}
                </td>
                <td className="px-4 py-2 text-zinc-600">
                  {NOME_ORIGEM[nota.origem] ?? nota.origem}
                </td>
                <td className="px-4 py-2 text-zinc-600">
                  {nota._count.itens}
                </td>
                <td className="px-4 py-2 text-zinc-600">
                  {formatarMoeda(
                    nota.valorTotal ? Number(nota.valorTotal) : null
                  )}
                </td>
                <td className="px-4 py-2 text-zinc-500">
                  {nota.criadoEm.toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
            {notas.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-zinc-400" colSpan={6}>
                  Nenhuma nota fiscal lançada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
