import type { Metadata } from "next";
import Link from "next/link";
import { exigirContextoLoja } from "@/lib/dal";
import { db } from "@/lib/db";
import { alternarAtivoCategoria } from "@/app/actions/produtos";
import {
  montarArvoreCategorias,
  montarOpcoesCategoria,
  type CategoriaComFilhos,
} from "../categoria-opcoes";
import { NovaCategoriaForm } from "./nova-categoria-form";

export const metadata: Metadata = {
  title: "Categorias — Reserva 88",
};

type CategoriaLinha = { id: string; nome: string; ativo: boolean; categoriaPaiId: string | null };

function LinhaCategoria({
  categoria,
  profundidade,
}: {
  categoria: CategoriaComFilhos<CategoriaLinha>;
  profundidade: number;
}) {
  return (
    <>
      <tr className="border-b border-zinc-100">
        <td
          className="px-4 py-2 text-zinc-900"
          style={{ paddingLeft: `${1 + profundidade * 1.5}rem` }}
        >
          {profundidade > 0 && "— "}
          {categoria.nome}
        </td>
        <td className="px-4 py-2">
          <span
            className={
              categoria.ativo
                ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500"
            }
          >
            {categoria.ativo ? "Ativa" : "Inativa"}
          </span>
        </td>
        <td className="px-4 py-2 text-right">
          <form action={alternarAtivoCategoria.bind(null, categoria.id)}>
            <button
              type="submit"
              className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
            >
              {categoria.ativo ? "Desativar" : "Ativar"}
            </button>
          </form>
        </td>
      </tr>
      {categoria.filhos.map((filho) => (
        <LinhaCategoria
          key={filho.id}
          categoria={filho}
          profundidade={profundidade + 1}
        />
      ))}
    </>
  );
}

export default async function CategoriasPage() {
  const contexto = await exigirContextoLoja(["DONO", "GERENTE"]);

  const categorias = await db.categoria.findMany({
    where: { lojaId: contexto.lojaId },
    orderBy: { criadoEm: "asc" },
    select: { id: true, nome: true, ativo: true, categoriaPaiId: true },
  });

  const arvore = montarArvoreCategorias(categorias);
  const opcoesParaSelect = montarOpcoesCategoria(categorias);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Categorias</h1>
          <p className="text-sm text-zinc-500">
            Organize os produtos em categorias e subcategorias.
          </p>
        </div>
        <Link
          href="/dashboard/produtos"
          className="text-sm text-zinc-600 underline hover:text-zinc-900"
        >
          Voltar para produtos
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium text-zinc-900">
          Nova categoria
        </h2>
        <NovaCategoriaForm categorias={opcoesParaSelect} />
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Categoria</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {arvore.map((categoria) => (
              <LinhaCategoria
                key={categoria.id}
                categoria={categoria}
                profundidade={0}
              />
            ))}
            {arvore.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-zinc-400" colSpan={3}>
                  Nenhuma categoria cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
