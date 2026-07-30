"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirPerfil } from "@/lib/dal";
import {
  NovoUsuarioFormSchema,
  type NovoUsuarioFormState,
} from "@/lib/definitions";

// Só DONO e GERENTE podem cadastrar novos funcionários.
export async function criarUsuario(
  _estadoAnterior: NovoUsuarioFormState,
  formData: FormData
): Promise<NovoUsuarioFormState> {
  const usuarioAtual = await exigirPerfil(["DONO", "GERENTE"]);

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
    usuarioAtual.perfil === "GERENTE" &&
    (perfil === "DONO" || perfil === "GERENTE")
  ) {
    return { erro: "Apenas o dono pode criar contas de dono ou gerente." };
  }

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
      criadoPorId: usuarioAtual.id,
    },
  });

  revalidatePath("/dashboard/usuarios");
  return { sucesso: true };
}

// Ativa/desativa o acesso de um funcionário (em vez de excluir o cadastro,
// o que preservaria o histórico de vendas/comandas ligado a ele).
export async function alternarAtivoUsuario(usuarioId: string): Promise<void> {
  const usuarioAtual = await exigirPerfil(["DONO", "GERENTE"]);

  // A tela só mostra este botão para os outros usuários, mas confirmamos
  // aqui de novo por segurança (defesa em profundidade).
  if (usuarioId === usuarioAtual.id) {
    return;
  }

  const usuario = await db.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) {
    return;
  }

  await db.usuario.update({
    where: { id: usuarioId },
    data: { ativo: !usuario.ativo },
  });

  revalidatePath("/dashboard/usuarios");
}
