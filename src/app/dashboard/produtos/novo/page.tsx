import type { Metadata } from "next";
import { exigirContextoLoja } from "@/lib/dal";
import { db } from "@/lib/db";
import { criarProduto } from "@/app/actions/produtos";
import { ProdutoForm } from "../produto-form";
import { montarOpcoesCategoria } from "../categoria-opcoes";

export const metadata: Metadata = {
  title: "Novo produto — Reserva 88",
};

export default async function NovoProdutoPage() {
  const contexto = await exigirContextoLoja(["DONO", "GERENTE"]);

  const [categorias, insumosDisponiveis] = await Promise.all([
    db.categoria.findMany({
      where: { lojaId: contexto.lojaId, ativo: true },
      select: { id: true, nome: true, categoriaPaiId: true },
      orderBy: { criadoEm: "asc" },
    }),
    db.produto.findMany({
      where: { lojaId: contexto.lojaId, ativo: true },
      select: { id: true, nome: true, unidadeMedida: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Novo produto</h1>
        <p className="text-sm text-zinc-500">
          Cadastre um produto, com variações e/ou ficha técnica se precisar.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <ProdutoForm
          categorias={montarOpcoesCategoria(categorias)}
          insumosDisponiveis={insumosDisponiveis}
          aoSalvar={criarProduto}
        />
      </div>
    </div>
  );
}
