"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fecharComanda } from "@/app/actions/caixa";
import type { FecharComandaInput } from "@/lib/definitions";

const FORMAS: { valor: string; rotulo: string }[] = [
  { valor: "DINHEIRO", rotulo: "Dinheiro" },
  { valor: "CARTAO_DEBITO", rotulo: "Cartão de débito" },
  { valor: "CARTAO_CREDITO", rotulo: "Cartão de crédito" },
  { valor: "PIX", rotulo: "PIX" },
  { valor: "OUTRO", rotulo: "Outro" },
];

type PagamentoLinha = { forma: string; valor: string };

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function FecharComandaForm({
  comandaId,
  total,
}: {
  comandaId: string;
  total: number;
}) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [erro, setErro] = useState<string | undefined>();
  const [pagamentos, setPagamentos] = useState<PagamentoLinha[]>([
    { forma: "DINHEIRO", valor: total.toFixed(2) },
  ]);

  const totalPago = useMemo(
    () => pagamentos.reduce((soma, p) => soma + (Number(p.valor) || 0), 0),
    [pagamentos]
  );
  const diferenca = totalPago - total;

  function adicionarPagamento() {
    setPagamentos((atual) => [...atual, { forma: "DINHEIRO", valor: "" }]);
  }

  function removerPagamento(indice: number) {
    setPagamentos((atual) => atual.filter((_, i) => i !== indice));
  }

  function atualizarPagamento(indice: number, campo: keyof PagamentoLinha, valor: string) {
    setPagamentos((atual) =>
      atual.map((p, i) => (i === indice ? { ...p, [campo]: valor } : p))
    );
  }

  function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(undefined);

    iniciarTransicao(async () => {
      const resultado = await fecharComanda({
        comandaId,
        pagamentos: pagamentos.map((p) => ({
          forma: p.forma as FecharComandaInput["pagamentos"][number]["forma"],
          valor: Number(p.valor),
        })),
      });

      if (resultado?.erro) {
        setErro(resultado.erro);
        return;
      }

      router.push(`/dashboard/comandas/${comandaId}/ticket`);
    });
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4">
      {pagamentos.map((pagamento, indice) => (
        <div key={indice} className="flex items-center gap-2">
          <select
            value={pagamento.forma}
            onChange={(e) => atualizarPagamento(indice, "forma", e.target.value)}
            className="flex-1 rounded-md border border-zinc-300 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            {FORMAS.map((f) => (
              <option key={f.valor} value={f.valor}>
                {f.rotulo}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            min="0"
            value={pagamento.valor}
            onChange={(e) => atualizarPagamento(indice, "valor", e.target.value)}
            className="w-32 rounded-md border border-zinc-300 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          {pagamentos.length > 1 && (
            <button
              type="button"
              onClick={() => removerPagamento(indice)}
              className="text-xs text-red-600 underline hover:text-red-800"
            >
              Remover
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={adicionarPagamento}
        className="w-fit text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
      >
        + Dividir em outra forma de pagamento
      </button>

      <div className="rounded-md bg-zinc-50 p-3 text-sm">
        <div className="flex justify-between">
          <span>Total da comanda</span>
          <span className="font-medium">{formatarMoeda(total)}</span>
        </div>
        <div className="flex justify-between">
          <span>Total pago</span>
          <span className="font-medium">{formatarMoeda(totalPago)}</span>
        </div>
        <div className="flex justify-between">
          <span>{diferenca >= 0 ? "Troco" : "Faltam"}</span>
          <span className="font-medium">
            {formatarMoeda(Math.abs(diferenca))}
          </span>
        </div>
      </div>

      {erro && (
        <p className="text-sm text-red-600" role="alert">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={pendente || totalPago < total}
        className="rounded-md bg-zinc-900 px-4 py-3 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pendente ? "Fechando..." : "Confirmar fechamento"}
      </button>
    </form>
  );
}
