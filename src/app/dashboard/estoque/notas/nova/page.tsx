import type { Metadata } from "next";
import { exigirContextoLoja } from "@/lib/dal";
import { db } from "@/lib/db";
import { NotaFiscalForm } from "./nota-fiscal-form";

export const metadata: Metadata = {
  title: "Nova nota fiscal — Reserva 88",
};

export default async function NovaNotaFiscalPage() {
  const contexto = await exigirContextoLoja(["DONO", "GERENTE"]);

  const produtos = await db.produto.findMany({
    where: { lojaId: contexto.lojaId, ativo: true },
    select: { id: true, nome: true, unidadeMedida: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Nova nota fiscal de compra
        </h1>
        <p className="text-sm text-zinc-500">
          Lance manualmente ou importe o arquivo XML da NF-e do fornecedor.
          Isso atualiza o estoque automaticamente.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <NotaFiscalForm produtosDisponiveis={produtos} />
      </div>
    </div>
  );
}
