import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// Este script cria a primeira conta de acesso (perfil DONO), usada para
// entrar no sistema pela primeira vez. Depois disso, novos usuários são
// criados pela própria tela de "Usuários" dentro do sistema.
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
      perfil: "DONO",
    },
  });

  console.log(`Usuário dono criado: ${email}`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
