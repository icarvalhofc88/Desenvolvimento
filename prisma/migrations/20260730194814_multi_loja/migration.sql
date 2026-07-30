-- CreateEnum
CREATE TYPE "StatusLoja" AS ENUM ('TESTE', 'ATIVA', 'SUSPENSA');

-- AlterEnum
ALTER TYPE "Perfil" ADD VALUE 'ADMIN_GERAL';

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "lojaId" TEXT;

-- CreateTable
CREATE TABLE "Loja" (
    "id" TEXT NOT NULL,
    "nomeFantasia" TEXT NOT NULL,
    "razaoSocial" TEXT,
    "cnpj" TEXT NOT NULL,
    "status" "StatusLoja" NOT NULL DEFAULT 'TESTE',
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Loja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogAcessoSuporte" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "iniciadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "encerradoEm" TIMESTAMP(3),

    CONSTRAINT "LogAcessoSuporte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Loja_cnpj_key" ON "Loja"("cnpj");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogAcessoSuporte" ADD CONSTRAINT "LogAcessoSuporte_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogAcessoSuporte" ADD CONSTRAINT "LogAcessoSuporte_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
