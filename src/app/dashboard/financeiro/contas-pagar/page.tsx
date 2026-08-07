import type { Metadata } from "next";
import Link from "next/link";
import { exigirContextoLoja } from "@/lib/dal";
import { db } from "@/lib/db";
import {
  criarContaPagar,
  marcarContaPagarPaga,
  estornarContaPagar,
  cancelarContaPagar,
} from "@/app/actions/financeiro";
import { ContaForm } from "../conta-form";

export const metadata: Metadata = {
  title: "Contas a pagar — Reserva 88",
};

const NOME_STATUS: Record<string, string> = {
  PENDENTE: "Pendente",
  QUITADA: "Paga",
  CANCELADA: "Cancelada",
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ContasPagarPage() {
  const contexto = await exigirContextoLoja(["DONO", "GERENTE"]);

  const contas = await db.contaPagar.findMany({
    where: { lojaId: contexto.lojaId },
    orderBy: { vencimento: "asc" },
  });

  const hoje = new Date();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Contas a pagar
          </h1>
          <p className="text-sm text-zinc-500">
            Despesas da loja: fornecedores, aluguel, contas, etc.
          </p>
        </div>
        <Link
          href="/dashboard/financeiro"
          className="text-sm text-zinc-600 underline hover:text-zinc-900"
        >
          Voltar para o financeiro
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium text-zinc-900">Nova conta</h2>
        <ContaForm acao={criarContaPagar} textoBotao="Adicionar" />
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Descrição</th>
              <th className="px-4 py-2 font-medium">Categoria</th>
              <th className="px-4 py-2 font-medium">Valor</th>
              <th className="px-4 py-2 font-medium">Vencimento</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {contas.map((conta) => {
              const atrasada =
                conta.status === "PENDENTE" && conta.vencimento < hoje;
              return (
                <tr key={conta.id} className="border-b border-zinc-100">
                  <td className="px-4 py-2 text-zinc-900">{conta.descricao}</td>
                  <td className="px-4 py-2 text-zinc-600">
                    {conta.categoria ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-zinc-600">
                    {formatarMoeda(Number(conta.valor))}
                  </td>
                  <td className="px-4 py-2 text-zinc-600">
                    {conta.vencimento.toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        conta.status === "QUITADA"
                          ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                          : conta.status === "CANCELADA"
                            ? "rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500"
                            : atrasada
                              ? "rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700"
                              : "rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800"
                      }
                    >
                      {atrasada ? "Atrasada" : NOME_STATUS[conta.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-3">
                      {conta.status === "PENDENTE" && (
                        <>
                          <form action={marcarContaPagarPaga.bind(null, conta.id)}>
                            <button
                              type="submit"
                              className="text-xs font-medium text-green-700 underline hover:text-green-900"
                            >
                              Marcar paga
                            </button>
                          </form>
                          <form action={cancelarContaPagar.bind(null, conta.id)}>
                            <button
                              type="submit"
                              className="text-xs font-medium text-red-600 underline hover:text-red-800"
                            >
                              Cancelar
                            </button>
                          </form>
                        </>
                      )}
                      {conta.status === "QUITADA" && (
                        <form action={estornarContaPagar.bind(null, conta.id)}>
                          <button
                            type="submit"
                            className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
                          >
                            Desfazer
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {contas.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-zinc-400" colSpan={6}>
                  Nenhuma conta cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
