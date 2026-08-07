import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirContextoLoja } from "@/lib/dal";
import { db } from "@/lib/db";
import { atualizarProduto } from "@/app/actions/produtos";
import { ProdutoForm } from "../../produto-form";
import { montarOpcoesCategoria } from "../../categoria-opcoes";

export const metadata: Metadata = {
  title: "Editar produto — Reserva 88",
};

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contexto = await exigirContextoLoja(["DONO", "GERENTE"]);

  const produto = await db.produto.findUnique({
    where: { id },
    include: { variacoes: true, itensFichaTecnica: true },
  });

  // Barra tanto produto inexistente quanto produto de OUTRA loja.
  if (!produto || produto.lojaId !== contexto.lojaId) {
    notFound();
  }

  const [categorias, insumosDisponiveis] = await Promise.all([
    db.categoria.findMany({
      where: { lojaId: contexto.lojaId, ativo: true },
      select: { id: true, nome: true, categoriaPaiId: true },
      orderBy: { criadoEm: "asc" },
    }),
    db.produto.findMany({
      where: { lojaId: contexto.lojaId, ativo: true, NOT: { id } },
      select: { id: true, nome: true, unidadeMedida: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Editar produto
        </h1>
        <p className="text-sm text-zinc-500">{produto.nome}</p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <ProdutoForm
          categorias={montarOpcoesCategoria(categorias)}
          insumosDisponiveis={insumosDisponiveis}
          valoresIniciais={{
            nome: produto.nome,
            descricao: produto.descricao ?? "",
            categoriaId: produto.categoriaId ?? "",
            tipo: produto.tipo,
            unidadeMedida: produto.unidadeMedida,
            vendavel: produto.vendavel,
            precoVenda: produto.precoVenda ? String(produto.precoVenda) : "",
            custoUnitario: produto.custoUnitario ? String(produto.custoUnitario) : "",
            estoqueMinimo: String(produto.estoqueMinimo),
            variacoes: produto.variacoes.map((v) => ({
              nome: v.nome,
              precoVenda: String(v.precoVenda),
            })),
            itensFichaTecnica: produto.itensFichaTecnica.map((item) => ({
              insumoId: item.insumoId,
              quantidade: String(item.quantidade),
            })),
          }}
          aoSalvar={atualizarProduto.bind(null, produto.id)}
        />
      </div>
    </div>
  );
}
