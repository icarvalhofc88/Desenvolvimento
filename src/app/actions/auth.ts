"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { criarSessao, encerrarSessao } from "@/lib/session";
import { LoginFormSchema, type LoginFormState } from "@/lib/definitions";

// Ação chamada pelo formulário de login. Roda inteiramente no servidor,
// então a senha digitada nunca fica exposta no código do navegador.
export async function login(
  _estadoAnterior: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const validado = LoginFormSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });

  if (!validado.success) {
    return { erro: "Informe um e-mail e senha válidos." };
  }

  const { email, senha } = validado.data;

  // Por segurança, a mensagem de erro é sempre a mesma tanto para
  // "e-mail não existe" quanto para "senha errada" — isso evita que
  // alguém descubra quais e-mails estão cadastrados só tentando logar.
  const mensagemErroGenerica = "E-mail ou senha inválidos.";

  const usuario = await db.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.ativo) {
    return { erro: mensagemErroGenerica };
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaCorreta) {
    return { erro: mensagemErroGenerica };
  }

  await criarSessao({
    usuarioId: usuario.id,
    nome: usuario.nome,
    perfil: usuario.perfil,
  });

  // O Admin Geral não pertence a nenhuma loja: a "página inicial" dele é a
  // lista de lojas, não o painel operacional.
  redirect(usuario.perfil === "ADMIN_GERAL" ? "/admin/lojas" : "/dashboard");
}

export async function logout() {
  await encerrarSessao();
  redirect("/login");
}
