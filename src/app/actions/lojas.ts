"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { exigirAdminGeral, obterContexto } from "@/lib/dal";
import { definirContextoLoja } from "@/lib/session";
import { apenasNumeros } from "@/lib/cnpj";
import {
  NovaLojaFormSchema,
  STATUS_LOJA,
  type NovaLojaFormState,
} from "@/lib/definitions";

// Só o Admin Geral cadastra novas lojas (CNPJs clientes da plataforma).
// Cria a loja e, junto, o primeiro usuário (Dono) daquela loja.
export async function criarLoja(
  _estadoAnterior: NovaLojaFormState,
  formData: FormData
): Promise<NovaLojaFormState> {
  await exigirAdminGeral();

  const validado = NovaLojaFormSchema.safeParse({
    nomeFantasia: formData.get("nomeFantasia"),
    razaoSocial: formData.get("razaoSocial") || undefined,
    cnpj: formData.get("cnpj"),
    nomeDono: formData.get("nomeDono"),
    emailDono: formData.get("emailDono"),
    senhaDono: formData.get("senhaDono"),
  });

  if (!validado.success) {
    return { erros: validado.error.flatten().fieldErrors };
  }

  const { nomeFantasia, razaoSocial, cnpj, nomeDono, emailDono, senhaDono } =
    validado.data;
  const cnpjNumeros = apenasNumeros(cnpj);

  const cnpjJaExiste = await db.loja.findUnique({
    where: { cnpj: cnpjNumeros },
  });
  if (cnpjJaExiste) {
    return { erros: { cnpj: ["Já existe uma loja com este CNPJ."] } };
  }

  const emailJaExiste = await db.usuario.findUnique({
    where: { email: emailDono },
  });
  if (emailJaExiste) {
    return { erros: { emailDono: ["Já existe um usuário com este e-mail."] } };
  }

  const senhaHash = await bcrypt.hash(senhaDono, 10);

  await db.loja.create({
    data: {
      nomeFantasia,
      razaoSocial,
      cnpj: cnpjNumeros,
      status: "TESTE",
      usuarios: {
        create: {
          nome: nomeDono,
          email: emailDono,
          senhaHash,
          perfil: "DONO",
        },
      },
    },
  });

  revalidatePath("/admin/lojas");
  return { sucesso: true };
}

export async function atualizarStatusLoja(lojaId: string, formData: FormData) {
  await exigirAdminGeral();

  const status = formData.get("status");
  if (typeof status !== "string" || !STATUS_LOJA.includes(status as (typeof STATUS_LOJA)[number])) {
    return;
  }

  await db.loja.update({
    where: { id: lojaId },
    data: { status: status as (typeof STATUS_LOJA)[number] },
  });

  revalidatePath("/admin/lojas");
}

// Admin Geral "entra" na loja para dar suporte. Fica registrado no log de
// auditoria (quem, qual loja, quando) e, enquanto durar, ele age como Dono
// daquela loja específica.
export async function entrarModoSuporte(lojaId: string) {
  const contexto = await exigirAdminGeral();

  const loja = await db.loja.findUnique({ where: { id: lojaId } });
  if (!loja) {
    return;
  }

  await db.logAcessoSuporte.create({
    data: {
      adminId: contexto.usuario.id,
      lojaId,
    },
  });

  await definirContextoLoja(lojaId);
  redirect("/dashboard");
}

export async function sairModoSuporte() {
  const contexto = await obterContexto();

  if (contexto?.modoSuporte && contexto.lojaId) {
    await db.logAcessoSuporte.updateMany({
      where: {
        adminId: contexto.usuario.id,
        lojaId: contexto.lojaId,
        encerradoEm: null,
      },
      data: { encerradoEm: new Date() },
    });
  }

  await definirContextoLoja(undefined);
  redirect("/admin/lojas");
}
