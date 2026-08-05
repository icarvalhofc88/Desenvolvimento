import type { Metadata } from "next";
import { exigirContextoLoja } from "@/lib/dal";
import { NovaComandaForm } from "./nova-comanda-form";

export const metadata: Metadata = {
  title: "Nova comanda — Reserva 88",
};

export default async function NovaComandaPage() {
  await exigirContextoLoja(["DONO", "GERENTE", "CAIXA", "GARCOM"]);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Nova comanda</h1>
        <p className="text-sm text-zinc-500">
          Escolha se é uma mesa ou uma comanda avulsa.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <NovaComandaForm />
      </div>
    </div>
  );
}
