import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// Este script cria a primeira conta de acesso: o ADMIN_GERAL, dono da
// plataforma. Essa conta não pertence a nenhuma loja — ela cadastra as
// lojas (CNPJs clientes) pela tela /admin/lojas, e cada loja tem seus
// próprios usuários (Dono, Gerente, etc), criados a partir dali.
async function main() {
  const email = process.env.ADMIN_EMAIL;
  const senha = process.env.ADMIN_SENHA;
  const nome = process.env.ADMIN_NOME ?? "Administrador";

  if (!email || !senha) {
    throw new Error(
      "Defina ADMIN_EMAIL e ADMIN_SENHA no arquivo .env antes de rodar o seed."
    );
  }

  const existente = await db.usuario.findUnique({ where: { email } });
  if (existente) {
    console.log(`Usuário ${email} já existe, nada a fazer.`);
    return;
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  await db.usuario.create({
    data: {
      nome,
      email,
      senhaHash,
      perfil: "ADMIN_GERAL",
    },
  });

  console.log(`Usuário Admin Geral criado: ${email}`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
