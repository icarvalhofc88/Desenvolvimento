"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirContextoLoja, obterContexto } from "@/lib/dal";
import {
  NovoUsuarioFormSchema,
  TrocarSenhaSchema,
  RedefinirSenhaSchema,
  type NovoUsuarioFormState,
  type TrocarSenhaState,
  type RedefinirSenhaState,
} from "@/lib/definitions";

// Só DONO e GERENTE podem cadastrar novos funcionários — sempre dentro da
// loja em que estão operando no momento (contexto.lojaId).
export async function criarUsuario(
  _estadoAnterior: NovoUsuarioFormState,
  formData: FormData
): Promise<NovoUsuarioFormState> {
  const contexto = await exigirContextoLoja(["DONO", "GERENTE"]);

  const validado = NovoUsuarioFormSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    perfil: formData.get("perfil"),
  });

  if (!validado.success) {
    return { erros: validado.error.flatten().fieldErrors };
  }

  const { nome, email, senha, perfil } = validado.data;

  // Um GERENTE não pode criar outro DONO ou GERENTE — só o próprio DONO pode.
  if (
    contexto.perfilEfetivo === "GERENTE" &&
    (perfil === "DONO" || perfil === "GERENTE")
  ) {
    return { erro: "Apenas o dono pode criar contas de dono ou gerente." };
  }

  // E-mail é único em toda a plataforma, não só dentro da loja.
  const jaExiste = await db.usuario.findUnique({ where: { email } });
  if (jaExiste) {
    return { erros: { email: ["Já existe um usuário com este e-mail."] } };
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  await db.usuario.create({
    data: {
      nome,
      email,
      senhaHash,
      perfil,
      lojaId: contexto.lojaId,
      criadoPorId: contexto.usuario.id,
    },
  });

  revalidatePath("/dashboard/usuarios");
  return { sucesso: true };
}

// Ativa/desativa o acesso de um funcionário (em vez de excluir o cadastro,
// o que preservaria o histórico de vendas/comandas ligado a ele).
export async function alternarAtivoUsuario(usuarioId: string): Promise<void> {
  const contexto = await exigirContextoLoja(["DONO", "GERENTE"]);

  // A tela só mostra este botão para os outros usuários, mas confirmamos
  // aqui de novo por segurança (defesa em profundidade).
  if (usuarioId === contexto.usuario.id) {
    return;
  }

  const usuario = await db.usuario.findUnique({ where: { id: usuarioId } });

  // Garante que ninguém consegue ativar/desativar um usuário de OUTRA loja
  // adivinhando/forjando o id.
  if (!usuario || usuario.lojaId !== contexto.lojaId) {
    return;
  }

  await db.usuario.update({
    where: { id: usuarioId },
    data: { ativo: !usuario.ativo },
  });

  revalidatePath("/dashboard/usuarios");
}

// Qualquer usuário logado (de qualquer loja, ou o Admin Geral) pode trocar
// a própria senha, desde que confirme a senha atual.
export async function trocarMinhaSenha(
  _estadoAnterior: TrocarSenhaState,
  formData: FormData
): Promise<TrocarSenhaState> {
  const contexto = await obterContexto();
  if (!contexto) {
    return { erro: "Sessão expirada. Faça login novamente." };
  }

  const validado = TrocarSenhaSchema.safeParse({
    senhaAtual: formData.get("senhaAtual"),
    novaSenha: formData.get("novaSenha"),
    confirmarNovaSenha: formData.get("confirmarNovaSenha"),
  });
  if (!validado.success) {
    return {
      erro: validado.error.issues[0]?.message ?? "Verifique os campos.",
    };
  }
  const { senhaAtual, novaSenha } = validado.data;

  const usuario = await db.usuario.findUniqueOrThrow({
    where: { id: contexto.usuario.id },
  });
  const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senhaHash);
  if (!senhaCorreta) {
    return { erro: "Senha atual incorreta." };
  }

  const senhaHash = await bcrypt.hash(novaSenha, 10);
  await db.usuario.update({
    where: { id: contexto.usuario.id },
    data: { senhaHash },
  });

  return { sucesso: true };
}

// Dono/Gerente redefine a senha de OUTRO usuário da própria loja (ex: o
// funcionário esqueceu a senha). Não exige a senha atual porque quem está
// autorizado a criar/desativar contas também está autorizado a resetar o
// acesso delas.
export async function redefinirSenhaUsuario(
  usuarioId: string,
  _estadoAnterior: RedefinirSenhaState,
  formData: FormData
): Promise<RedefinirSenhaState> {
  const contexto = await exigirContextoLoja(["DONO", "GERENTE"]);

  if (usuarioId === contexto.usuario.id) {
    return {
      erro: "Para trocar sua própria senha, use a página \"Minha conta\".",
    };
  }

  const usuarioAlvo = await db.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuarioAlvo || usuarioAlvo.lojaId !== contexto.lojaId) {
    return { erro: "Usuário não encontrado." };
  }

  // Mesma regra de hierarquia usada ao criar usuários: gerente não mexe em
  // conta de dono/gerente.
  if (
    contexto.perfilEfetivo === "GERENTE" &&
    (usuarioAlvo.perfil === "DONO" || usuarioAlvo.perfil === "GERENTE")
  ) {
    return { erro: "Apenas o dono pode redefinir a senha de dono ou gerente." };
  }

  const validado = RedefinirSenhaSchema.safeParse({
    novaSenha: formData.get("novaSenha"),
  });
  if (!validado.success) {
    return { erro: "Informe uma senha com pelo menos 6 caracteres." };
  }

  const senhaHash = await bcrypt.hash(validado.data.novaSenha, 10);
  await db.usuario.update({ where: { id: usuarioId }, data: { senhaHash } });

  return { sucesso: true };
}
