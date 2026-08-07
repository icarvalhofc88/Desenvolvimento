-- AlterEnum
ALTER TYPE "FormaPagamento" ADD VALUE 'FIADO';

-- AlterTable
ALTER TABLE "Comanda" ADD COLUMN     "clienteId" TEXT;

-- AlterTable
ALTER TABLE "ContaReceber" ADD COLUMN     "clienteId" TEXT;

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "cpfCnpj" TEXT,
    "observacao" TEXT,
    "limiteCredito" DECIMAL(10,2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Comanda" ADD CONSTRAINT "Comanda_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaReceber" ADD CONSTRAINT "ContaReceber_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
