"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { abrirComanda } from "@/app/actions/comandas";

export function NovaComandaForm() {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [erro, setErro] = useState<string | undefined>();
  const [tipo, setTipo] = useState<"MESA" | "AVULSA">("MESA");
  const [mesa, setMesa] = useState("");

  function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(undefined);

    iniciarTransicao(async () => {
      const resultado = await abrirComanda({
        tipo,
        mesa: tipo === "MESA" ? mesa : undefined,
      });

      if (resultado?.erro || !resultado?.comandaId) {
        setErro(resultado?.erro ?? "Não foi possível abrir a comanda.");
        return;
      }

      router.push(`/dashboard/comandas/${resultado.comandaId}`);
    });
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTipo("MESA")}
          className={
            tipo === "MESA"
              ? "flex-1 rounded-md bg-zinc-900 px-4 py-3 text-sm font-medium text-white"
              : "flex-1 rounded-md border border-zinc-300 px-4 py-3 text-sm text-zinc-700"
          }
        >
          Mesa
        </button>
        <button
          type="button"
          onClick={() => setTipo("AVULSA")}
          className={
            tipo === "AVULSA"
              ? "flex-1 rounded-md bg-zinc-900 px-4 py-3 text-sm font-medium text-white"
              : "flex-1 rounded-md border border-zinc-300 px-4 py-3 text-sm text-zinc-700"
          }
        >
          Avulsa
        </button>
      </div>

      {tipo === "MESA" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="mesa" className="text-sm font-medium text-zinc-700">
            Número/identificação da mesa
          </label>
          <input
            id="mesa"
            value={mesa}
            onChange={(e) => setMesa(e.target.value)}
            required
            autoFocus
            inputMode="text"
            className="rounded-md border border-zinc-300 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
      )}

      {tipo === "AVULSA" && (
        <p className="text-sm text-zinc-500">
          Um número de comanda será gerado automaticamente.
        </p>
      )}

      {erro && (
        <p className="text-sm text-red-600" role="alert">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={pendente}
        className="rounded-md bg-zinc-900 px-4 py-3 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pendente ? "Abrindo..." : "Abrir comanda"}
      </button>
    </form>
  );
}
