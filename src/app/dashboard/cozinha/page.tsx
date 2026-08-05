import type { Metadata } from "next";
import { exigirContextoLoja } from "@/lib/dal";
import { db } from "@/lib/db";
import { avancarStatusItem, retrocederStatusItem } from "@/app/actions/cozinha";
import { AutoAtualizar } from "./auto-atualizar";

export const metadata: Metadata = {
  title: "Painel da cozinha — Reserva 88",
};

const NOME_STATUS: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_PREPARO: "Em preparo",
  PRONTO: "Pronto",
};

const COR_STATUS: Record<string, string> = {
  PENDENTE: "bg-zinc-100 text-zinc-700",
  EM_PREPARO: "bg-amber-100 text-amber-800",
  PRONTO: "bg-green-100 text-green-700",
};

const ACAO_AVANCAR: Record<string, string> = {
  PENDENTE: "Iniciar preparo",
  EM_PREPARO: "Marcar pronto",
  PRONTO: "Marcar entregue",
};

export default async function PainelCozinhaPage() {
  const contexto = await exigirContextoLoja(["DONO", "GERENTE", "COZINHA"]);

  const comandas = await db.comanda.findMany({
    where: {
      lojaId: contexto.lojaId,
      status: "ABERTA",
      itens: { some: { status: { in: ["PENDENTE", "EM_PREPARO", "PRONTO"] } } },
    },
    orderBy: { abertaEm: "asc" },
    include: {
      itens: {
        where: { status: { in: ["PENDENTE", "EM_PREPARO", "PRONTO"] } },
        orderBy: { criadoEm: "asc" },
        include: {
          produto: { select: { nome: true } },
          variacao: { select: { nome: true } },
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <AutoAtualizar />
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Painel da cozinha
        </h1>
        <p className="text-sm text-zinc-500">
          Atualiza sozinho a cada poucos segundos.
        </p>
      </div>

      {comandas.length === 0 && (
        <p className="text-sm text-zinc-400">
          Nenhum pedido pendente no momento.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {comandas.map((comanda) => (
          <div
            key={comanda.id}
            className="rounded-lg border border-zinc-200 bg-white p-4"
          >
            <h2 className="mb-3 font-semibold text-zinc-900">
              {comanda.tipo === "MESA"
                ? `Mesa ${comanda.mesa}`
                : `Comanda #${comanda.numero}`}
            </h2>
            <ul className="flex flex-col gap-3">
              {comanda.itens.map((item) => (
                <li
                  key={item.id}
                  className="rounded-md border border-zinc-100 p-3"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-zinc-900">
                      {Number(item.quantidade)}x {item.produto.nome}
                      {item.variacao && ` (${item.variacao.nome})`}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${COR_STATUS[item.status]}`}
                    >
                      {NOME_STATUS[item.status]}
                    </span>
                  </div>
                  {item.observacao && (
                    <p className="mb-2 text-xs text-zinc-500">
                      {item.observacao}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <form action={avancarStatusItem.bind(null, item.id)}>
                      <button
                        type="submit"
                        className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                      >
                        {ACAO_AVANCAR[item.status]}
                      </button>
                    </form>
                    {item.status !== "PENDENTE" && (
                      <form action={retrocederStatusItem.bind(null, item.id)}>
                        <button
                          type="submit"
                          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50"
                        >
                          Desfazer
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
