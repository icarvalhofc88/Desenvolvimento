-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'PIX', 'OUTRO');

-- AlterTable
ALTER TABLE "Comanda" ADD COLUMN     "fechadaPorId" TEXT;

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" TEXT NOT NULL,
    "comandaId" TEXT NOT NULL,
    "forma" "FormaPagamento" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Comanda" ADD CONSTRAINT "Comanda_fechadaPorId_fkey" FOREIGN KEY ("fechadaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "Comanda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
