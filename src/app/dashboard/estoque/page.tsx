import type { Metadata } from "next";
import Link from "next/link";
import { exigirContextoLoja } from "@/lib/dal";
import { db } from "@/lib/db";
import { AjusteEstoqueForm } from "./ajuste-estoque-form";

export const metadata: Metadata = {
  title: "Estoque — Reserva 88",
};

const NOME_UNIDADE: Record<string, string> = {
  un: "un",
  kg: "kg",
  g: "g",
  L: "L",
  ml: "ml",
  porcao: "porção",
  fatia: "fatia",
  pacote: "pacote",
  duzia: "dúzia",
};

function formatarQuantidade(valor: number, unidade: string) {
  return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${
    NOME_UNIDADE[unidade] ?? unidade
  }`;
}

export default async function EstoquePage() {
  const contexto = await exigirContextoLoja(["DONO", "GERENTE"]);

  const produtos = await db.produto.findMany({
    where: { lojaId: contexto.lojaId, ativo: true },
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      unidadeMedida: true,
      estoqueAtual: true,
      estoqueMinimo: true,
      tipo: true,
    },
  });

  const comEstoqueBaixo = produtos.filter(
    (p) => Number(p.estoqueAtual) <= Number(p.estoqueMinimo)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Estoque</h1>
          <p className="text-sm text-zinc-500">
            Acompanhe as quantidades e registre entradas e saídas.
          </p>
        </div>
        <Link
          href="/dashboard/estoque/notas"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Notas fiscais de compra
        </Link>
      </div>

      {comEstoqueBaixo.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <h2 className="mb-2 text-sm font-medium text-amber-900">
            Estoque baixo ({comEstoqueBaixo.length})
          </h2>
          <ul className="list-inside list-disc text-sm text-amber-800">
            {comEstoqueBaixo.map((p) => (
              <li key={p.id}>
                {p.nome} — {formatarQuantidade(Number(p.estoqueAtual), p.unidadeMedida)}{" "}
                (mínimo: {formatarQuantidade(Number(p.estoqueMinimo), p.unidadeMedida)})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium text-zinc-900">
          Ajuste de estoque
        </h2>
        <AjusteEstoqueForm
          produtos={produtos.map((p) => ({
            id: p.id,
            nome: p.nome,
            unidadeMedida: p.unidadeMedida,
          }))}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Produto</th>
              <th className="px-4 py-2 font-medium">Tipo</th>
              <th className="px-4 py-2 font-medium">Estoque atual</th>
              <th className="px-4 py-2 font-medium">Estoque mínimo</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((produto) => {
              const baixo =
                Number(produto.estoqueAtual) <= Number(produto.estoqueMinimo);
              return (
                <tr key={produto.id} className="border-b border-zinc-100">
                  <td className="px-4 py-2 text-zinc-900">{produto.nome}</td>
                  <td className="px-4 py-2 text-zinc-600">
                    {produto.tipo === "COMPOSTO" ? "Composto" : "Simples"}
                  </td>
                  <td
                    className={
                      baixo
                        ? "px-4 py-2 font-medium text-amber-700"
                        : "px-4 py-2 text-zinc-600"
                    }
                  >
                    {formatarQuantidade(
                      Number(produto.estoqueAtual),
                      produto.unidadeMedida
                    )}
                  </td>
                  <td className="px-4 py-2 text-zinc-500">
                    {formatarQuantidade(
                      Number(produto.estoqueMinimo),
                      produto.unidadeMedida
                    )}
                  </td>
                </tr>
              );
            })}
            {produtos.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-zinc-400" colSpan={4}>
                  Nenhum produto ativo cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
