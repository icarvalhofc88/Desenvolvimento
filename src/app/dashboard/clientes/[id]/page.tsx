import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirContextoLoja } from "@/lib/dal";
import { db } from "@/lib/db";
import { editarCliente } from "@/app/actions/clientes";
import { marcarContaReceberRecebida } from "@/app/actions/financeiro";
import { ClienteForm } from "../cliente-form";

export const metadata: Metadata = {
  title: "Cliente — Reserva 88",
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contexto = await exigirContextoLoja([
    "DONO",
    "GERENTE",
    "CAIXA",
    "GARCOM",
  ]);

  const podeGerenciar =
    contexto.perfilEfetivo === "DONO" || contexto.perfilEfetivo === "GERENTE";

  const cliente = await db.cliente.findUnique({
    where: { id },
    include: {
      contasReceber: { orderBy: { vencimento: "asc" } },
      comandas: {
        orderBy: { abertaEm: "desc" },
        take: 10,
        select: {
          id: true,
          tipo: true,
          mesa: true,
          numero: true,
          status: true,
          abertaEm: true,
        },
      },
    },
  });

  if (!cliente || cliente.lojaId !== contexto.lojaId) {
    notFound();
  }

  const contasPendentes = cliente.contasReceber.filter(
    (c) => c.status === "PENDENTE"
  );
  const saldoDevedor = contasPendentes.reduce(
    (soma, c) => soma + Number(c.valor),
    0
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            {cliente.nome}
          </h1>
          <p className="text-sm text-zinc-500">
            Saldo devedor: {" "}
            <span
              className={
                saldoDevedor > 0
                  ? "font-medium text-amber-700"
                  : "font-medium text-zinc-700"
              }
            >
              {formatarMoeda(saldoDevedor)}
            </span>
            {cliente.limiteCredito !== null && (
              <>
                {" "}— Limite: {formatarMoeda(Number(cliente.limiteCredito))}
              </>
            )}
          </p>
        </div>
        <Link
          href="/dashboard/clientes"
          className="text-sm text-zinc-600 underline hover:text-zinc-900"
        >
          Voltar
        </Link>
      </div>

      {podeGerenciar && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-medium text-zinc-900">
            Editar dados
          </h2>
          <ClienteForm
            acao={editarCliente.bind(null, cliente.id)}
            podeDefinirLimite={podeGerenciar}
            valoresIniciais={{
              nome: cliente.nome,
              telefone: cliente.telefone ?? "",
              cpfCnpj: cliente.cpfCnpj ?? "",
              observacao: cliente.observacao ?? "",
              limiteCredito:
                cliente.limiteCredito !== null
                  ? String(cliente.limiteCredito)
                  : "",
            }}
            textoBotao="Salvar alterações"
          />
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-900">
          Contas de fiado
        </h2>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-4 py-2 font-medium">Descrição</th>
                <th className="px-4 py-2 font-medium">Valor</th>
                <th className="px-4 py-2 font-medium">Vencimento</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {cliente.contasReceber.map((conta) => (
                <tr key={conta.id} className="border-b border-zinc-100">
                  <td className="px-4 py-2 text-zinc-900">{conta.descricao}</td>
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
                            : "rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800"
                      }
                    >
                      {conta.status === "QUITADA"
                        ? "Recebida"
                        : conta.status === "CANCELADA"
                          ? "Cancelada"
                          : "Pendente"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {podeGerenciar && conta.status === "PENDENTE" && (
                      <form action={marcarContaReceberRecebida.bind(null, conta.id)}>
                        <button
                          type="submit"
                          className="text-xs font-medium text-green-700 underline hover:text-green-900"
                        >
                          Marcar recebida
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {cliente.contasReceber.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-zinc-400" colSpan={5}>
                    Nenhuma conta de fiado para este cliente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-900">
          Últimas comandas
        </h2>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-4 py-2 font-medium">Comanda</th>
                <th className="px-4 py-2 font-medium">Data</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {cliente.comandas.map((comanda) => (
                <tr key={comanda.id} className="border-b border-zinc-100">
                  <td className="px-4 py-2 text-zinc-900">
                    {comanda.tipo === "MESA"
                      ? `Mesa ${comanda.mesa}`
                      : `Comanda #${comanda.numero}`}
                  </td>
                  <td className="px-4 py-2 text-zinc-600">
                    {comanda.abertaEm.toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-2 text-zinc-600">{comanda.status}</td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/dashboard/comandas/${comanda.id}`}
                      className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
              {cliente.comandas.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-zinc-400" colSpan={4}>
                    Nenhuma comanda vinculada a este cliente ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
