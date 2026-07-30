import type { Metadata } from "next";
import Link from "next/link";
import { exigirContextoLoja } from "@/lib/dal";
import { db } from "@/lib/db";
import { alternarAtivoProduto } from "@/app/actions/produtos";

export const metadata: Metadata = {
  title: "Produtos — Reserva 88",
};

const NOME_TIPO: Record<string, string> = {
  SIMPLES: "Simples",
  COMPOSTO: "Composto (ficha técnica)",
};

function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ProdutosPage() {
  const contexto = await exigirContextoLoja(["DONO", "GERENTE"]);

  const produtos = await db.produto.findMany({
    where: { lojaId: contexto.lojaId },
    orderBy: { nome: "asc" },
    include: {
      categoria: { select: { nome: true } },
      variacoes: { select: { id: true, precoVenda: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Produtos</h1>
          <p className="text-sm text-zinc-500">
            Cadastre produtos, variações e fichas técnicas.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/produtos/categorias"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-white"
          >
            Categorias
          </Link>
          <Link
            href="/dashboard/produtos/novo"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Novo produto
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">Categoria</th>
              <th className="px-4 py-2 font-medium">Tipo</th>
              <th className="px-4 py-2 font-medium">Preço</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((produto) => (
              <tr key={produto.id} className="border-b border-zinc-100">
                <td className="px-4 py-2 text-zinc-900">
                  {produto.nome}
                  {!produto.vendavel && (
                    <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                      Só insumo
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-zinc-600">
                  {produto.categoria?.nome ?? "—"}
                </td>
                <td className="px-4 py-2 text-zinc-600">
                  {NOME_TIPO[produto.tipo] ?? produto.tipo}
                </td>
                <td className="px-4 py-2 text-zinc-600">
                  {produto.variacoes.length > 0
                    ? `${produto.variacoes.length} variações`
                    : produto.precoVenda
                      ? formatarPreco(Number(produto.precoVenda))
                      : "—"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={
                      produto.ativo
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                        : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500"
                    }
                  >
                    {produto.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/dashboard/produtos/${produto.id}/editar`}
                      className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
                    >
                      Editar
                    </Link>
                    <form action={alternarAtivoProduto.bind(null, produto.id)}>
                      <button
                        type="submit"
                        className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
                      >
                        {produto.ativo ? "Desativar" : "Ativar"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {produtos.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-zinc-400" colSpan={6}>
                  Nenhum produto cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
