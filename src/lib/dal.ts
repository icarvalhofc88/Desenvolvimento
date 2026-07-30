import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { lerSessao } from "@/lib/session";
import type { Perfil } from "@/generated/prisma/client";

// "DAL" = Data Access Layer: ponto único por onde passam as checagens de
// login/permissão antes de qualquer tela ou ação mexer em dados.
//
// Este sistema é multi-loja: cada loja (CNPJ) é um "inquilino" isolado.
// Toda consulta de dados de produtos/estoque/comandas/vendas/financeiro
// DEVE ser filtrada pela loja do contexto atual (contexto.lojaId).
// Esquecer esse filtro faria dados de uma loja vazarem para outra.

export type Contexto = {
  usuario: {
    id: string;
    nome: string;
    email: string;
    perfil: Perfil;
  };
  // Loja em que o usuário está operando agora. Null só para o ADMIN_GERAL
  // quando ele NÃO está em modo suporte dentro de uma loja.
  lojaId: string | null;
  // Perfil "efetivo" para fins de permissão dentro da loja atual.
  // Para usuários normais, é o próprio perfil. Para o ADMIN_GERAL em modo
  // suporte, tratamos como DONO (acesso completo àquela loja).
  perfilEfetivo: Exclude<Perfil, "ADMIN_GERAL"> | "ADMIN_GERAL";
  modoSuporte: boolean;
};

// `cache()` faz o React reaproveitar o resultado dentro da mesma
// renderização, então podemos chamar esta função várias vezes sem repetir
// a consulta ao banco.
export const obterContexto = cache(async (): Promise<Contexto | null> => {
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
      lojaId: true,
    },
  });

  if (!usuario || !usuario.ativo) return null;

  const usuarioPublico = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
  };

  if (usuario.perfil === "ADMIN_GERAL") {
    if (sessao.contextoLojaId) {
      const loja = await db.loja.findUnique({
        where: { id: sessao.contextoLojaId },
        select: { id: true },
      });
      // Se a loja foi removida enquanto o admin estava em modo suporte,
      // caímos de volta para o contexto normal de admin geral.
      if (loja) {
        return {
          usuario: usuarioPublico,
          lojaId: loja.id,
          perfilEfetivo: "DONO",
          modoSuporte: true,
        };
      }
    }

    return {
      usuario: usuarioPublico,
      lojaId: null,
      perfilEfetivo: "ADMIN_GERAL",
      modoSuporte: false,
    };
  }

  return {
    usuario: usuarioPublico,
    lojaId: usuario.lojaId,
    perfilEfetivo: usuario.perfil,
    modoSuporte: false,
  };
});

// Usado no início de páginas/ações restritas a certos perfis DENTRO de
// uma loja (ex: exigirContextoLoja(["DONO", "GERENTE"])).
export async function exigirContextoLoja(perfisPermitidos: Perfil[]) {
  const contexto = await obterContexto();

  if (!contexto) {
    redirect("/login");
  }

  if (!contexto.lojaId) {
    // ADMIN_GERAL fora de modo suporte não tem loja para operar.
    redirect("/admin/lojas");
  }

  if (!perfisPermitidos.includes(contexto.perfilEfetivo)) {
    redirect("/dashboard");
  }

  return contexto as Contexto & { lojaId: string };
}

// Usado nas páginas exclusivas do Admin Geral (gestão de lojas/licenças).
export async function exigirAdminGeral() {
  const contexto = await obterContexto();

  if (!contexto) {
    redirect("/login");
  }

  if (contexto.usuario.perfil !== "ADMIN_GERAL") {
    redirect("/dashboard");
  }

  return contexto;
}
