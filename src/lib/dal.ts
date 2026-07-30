import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { lerSessao } from "@/lib/session";
import type { Perfil } from "@/generated/prisma/client";

// "DAL" = Data Access Layer: ponto único por onde passam as checagens de
// login/permissão antes de qualquer tela ou ação mexer em dados. Mantendo
// tudo centralizado aqui, fica mais fácil garantir que nenhuma tela
// "esqueça" de checar se o usuário pode acessá-la.
//
// `cache()` faz o React reaproveitar o resultado dentro da mesma renderização,
// então podemos chamar esta função várias vezes sem repetir a consulta.
export const verificarSessao = cache(async () => {
  const sessao = await lerSessao();
  if (!sessao?.usuarioId) {
    redirect("/login");
  }
  return sessao;
});

// Busca os dados atuais do usuário logado direto no banco (garante que,
// se o usuário foi desativado depois do login, ele perde o acesso).
export const obterUsuarioAtual = cache(async () => {
  const sessao = await lerSessao();
  if (!sessao?.usuarioId) return null;

  const usuario = await db.usuario.findUnique({
    where: { id: sessao.usuarioId },
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
    },
  });

  if (!usuario || !usuario.ativo) return null;

  return usuario;
});

// Usado no início de páginas/ações restritas a certos perfis.
// Ex: exigirPerfil(["DONO", "GERENTE"])
export async function exigirPerfil(perfisPermitidos: Perfil[]) {
  const usuario = await obterUsuarioAtual();

  if (!usuario) {
    redirect("/login");
  }

  if (!perfisPermitidos.includes(usuario.perfil)) {
    redirect("/dashboard");
  }

  return usuario;
}
