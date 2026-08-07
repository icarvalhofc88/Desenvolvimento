import type { Metadata } from "next";
import Link from "next/link";
import { exigirContextoLoja } from "@/lib/dal";
import { db } from "@/lib/db";
import { criarCliente, alternarAtivoCliente } from "@/app/actions/clientes";
import { ClienteForm } from "./cliente-form";

export const metadata: Metadata = {
  title: "Clientes — Reserva 88",
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ClientesPage() {
  const contexto = await exigirContextoLoja([
    "DONO",
    "GERENTE",
    "CAIXA",
    "GARCOM",
  ]);

  const podeGerenciar =
    contexto.perfilEfetivo === "DONO" || contexto.perfilEfetivo === "GERENTE";

  const clientes = await db.cliente.findMany({
    where: { lojaId: contexto.lojaId },
    orderBy: { nome: "asc" },
    include: {
      contasReceber: {
        where: { status: "PENDENTE" },
        select: { valor: true },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Clientes</h1>
        <p className="text-sm text-zinc-500">
          Cadastro de clientes e controle de fiado (crediário).
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium text-zinc-900">Novo cliente</h2>
        <ClienteForm
          acao={criarCliente}
          podeDefinirLimite={podeGerenciar}
          textoBotao="Cadastrar"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">Telefone</th>
              <th className="px-4 py-2 font-medium">Saldo devedor</th>
              <th className="px-4 py-2 font-medium">Limite</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => {
              const saldoDevedor = cliente.contasReceber.reduce(
                (soma, c) => soma + Number(c.valor),
                0
              );
              return (
                <tr key={cliente.id} className="border-b border-zinc-100">
                  <td className="px-4 py-2 text-zinc-900">
                    <Link
                      href={`/dashboard/clientes/${cliente.id}`}
                      className="underline hover:text-zinc-600"
                    >
                      {cliente.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-zinc-600">
                    {cliente.telefone ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-zinc-600">
                    {saldoDevedor > 0 ? (
                      <span className="font-medium text-amber-700">
                        {formatarMoeda(saldoDevedor)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2 text-zinc-600">
                    {cliente.limiteCredito !== null
                      ? formatarMoeda(Number(cliente.limiteCredito))
                      : "Sem limite"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        cliente.ativo
                          ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                          : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500"
                      }
                    >
                      {cliente.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-3">
                      {podeGerenciar && (
                        <>
                          <Link
                            href={`/dashboard/clientes/${cliente.id}`}
                            className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
                          >
                            Editar
                          </Link>
                          <form action={alternarAtivoCliente.bind(null, cliente.id)}>
                            <button
                              type="submit"
                              className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
                            >
                              {cliente.ativo ? "Desativar" : "Ativar"}
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {clientes.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-zinc-400" colSpan={6}>
                  Nenhum cliente cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
