import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirContextoLoja } from "@/lib/dal";
import { db } from "@/lib/db";
import { RedefinirSenhaForm } from "./redefinir-senha-form";

export const metadata: Metadata = {
  title: "Redefinir senha — Reserva 88",
};

export default async function RedefinirSenhaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contexto = await exigirContextoLoja(["DONO", "GERENTE"]);

  const usuario = await db.usuario.findUnique({ where: { id } });
  if (!usuario || usuario.lojaId !== contexto.lojaId) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Redefinir senha
        </h1>
        <p className="text-sm text-zinc-500">
          {usuario.nome} — {usuario.email}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <RedefinirSenhaForm usuarioId={usuario.id} />
      </div>
    </div>
  );
}
