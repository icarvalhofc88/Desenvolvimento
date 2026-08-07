import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obterContexto } from "@/lib/dal";
import { logout } from "@/app/actions/auth";
import { TrocarSenhaForm } from "./trocar-senha-form";

export const metadata: Metadata = {
  title: "Minha conta — Reserva 88",
};

export default async function PerfilPage() {
  const contexto = await obterContexto();
  if (!contexto) {
    redirect("/login");
  }

  const linkVoltar = contexto.lojaId ? "/dashboard" : "/admin/lojas";

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
        <Link href={linkVoltar} className="text-sm text-zinc-600 underline hover:text-zinc-900">
          Voltar
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Sair
          </button>
        </form>
      </header>

      <main className="flex flex-1 flex-col bg-zinc-50 p-6">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Minha conta</h1>
            <p className="text-sm text-zinc-500">
              {contexto.usuario.nome} — {contexto.usuario.email}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-medium text-zinc-900">
              Trocar senha
            </h2>
            <TrocarSenhaForm />
          </div>
        </div>
      </main>
    </div>
  );
}
