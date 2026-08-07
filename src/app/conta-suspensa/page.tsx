import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { obterContexto } from "@/lib/dal";
import { logout } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Loja suspensa — Reserva 88",
};

export default async function ContaSuspensaPage() {
  const contexto = await obterContexto();
  if (!contexto) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-zinc-900">
          Acesso suspenso
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          O acesso desta loja está temporariamente suspenso. Fale com o
          suporte para regularizar a situação.
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}
