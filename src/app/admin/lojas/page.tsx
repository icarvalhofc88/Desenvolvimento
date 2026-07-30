import type { Metadata } from "next";
import { exigirAdminGeral } from "@/lib/dal";
import { db } from "@/lib/db";
import { formatarCnpj } from "@/lib/cnpj";
import {
  atualizarStatusLoja,
  entrarModoSuporte,
  sairModoSuporte,
} from "@/app/actions/lojas";
import { STATUS_LOJA } from "@/lib/definitions";
import { NovaLojaForm } from "./nova-loja-form";

export const metadata: Metadata = {
  title: "Lojas — Admin Geral",
};

const NOME_STATUS: Record<string, string> = {
  TESTE: "Período de teste",
  ATIVA: "Ativa",
  SUSPENSA: "Suspensa",
};

export default async function LojasPage() {
  const contexto = await exigirAdminGeral();

  const lojas = await db.loja.findMany({
    orderBy: { criadaEm: "asc" },
    include: {
      usuarios: {
        where: { perfil: "DONO" },
        select: { nome: true, email: true },
        take: 1,
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Lojas</h1>
          <p className="text-sm text-zinc-500">
            Cadastre e gerencie as lojas (CNPJs) que usam a plataforma.
          </p>
        </div>

        {contexto.modoSuporte && (
          <form action={sairModoSuporte}>
            <button
              type="submit"
              className="rounded-md border border-amber-400 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
            >
              Sair do modo suporte
            </button>
          </form>
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium text-zinc-900">Nova loja</h2>
        <NovaLojaForm />
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Loja</th>
              <th className="px-4 py-2 font-medium">CNPJ</th>
              <th className="px-4 py-2 font-medium">Dono</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {lojas.map((loja) => (
              <tr key={loja.id} className="border-b border-zinc-100 align-top">
                <td className="px-4 py-2 text-zinc-900">{loja.nomeFantasia}</td>
                <td className="px-4 py-2 text-zinc-600">
                  {formatarCnpj(loja.cnpj)}
                </td>
                <td className="px-4 py-2 text-zinc-600">
                  {loja.usuarios[0]?.nome ?? "—"}
                  {loja.usuarios[0] && (
                    <div className="text-xs text-zinc-400">
                      {loja.usuarios[0].email}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2">
                  <form
                    action={atualizarStatusLoja.bind(null, loja.id)}
                    className="flex items-center gap-2"
                  >
                    <select
                      name="status"
                      defaultValue={loja.status}
                      className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
                    >
                      {STATUS_LOJA.map((status) => (
                        <option key={status} value={status}>
                          {NOME_STATUS[status]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
                    >
                      Salvar
                    </button>
                  </form>
                </td>
                <td className="px-4 py-2 text-right">
                  <form action={entrarModoSuporte.bind(null, loja.id)}>
                    <button
                      type="submit"
                      className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
                    >
                      Entrar (suporte)
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
