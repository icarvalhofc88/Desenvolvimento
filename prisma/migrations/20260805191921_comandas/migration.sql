-- CreateEnum
CREATE TYPE "TipoComanda" AS ENUM ('MESA', 'AVULSA');

-- CreateEnum
CREATE TYPE "StatusComanda" AS ENUM ('ABERTA', 'FECHADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusItemComanda" AS ENUM ('PENDENTE', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO');

-- CreateTable
CREATE TABLE "Comanda" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "tipo" "TipoComanda" NOT NULL,
    "mesa" TEXT,
    "status" "StatusComanda" NOT NULL DEFAULT 'ABERTA',
    "abertaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechadaEm" TIMESTAMP(3),
    "abertaPorId" TEXT,

    CONSTRAINT "Comanda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemComanda" (
    "id" TEXT NOT NULL,
    "comandaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "variacaoId" TEXT,
    "quantidade" DECIMAL(10,3) NOT NULL,
    "precoUnitario" DECIMAL(10,2) NOT NULL,
    "observacao" TEXT,
    "status" "StatusItemComanda" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoPorId" TEXT,

    CONSTRAINT "ItemComanda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Comanda_lojaId_numero_key" ON "Comanda"("lojaId", "numero");

-- AddForeignKey
ALTER TABLE "Comanda" ADD CONSTRAINT "Comanda_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comanda" ADD CONSTRAINT "Comanda_abertaPorId_fkey" FOREIGN KEY ("abertaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemComanda" ADD CONSTRAINT "ItemComanda_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "Comanda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemComanda" ADD CONSTRAINT "ItemComanda_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemComanda" ADD CONSTRAINT "ItemComanda_variacaoId_fkey" FOREIGN KEY ("variacaoId") REFERENCES "Variacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemComanda" ADD CONSTRAINT "ItemComanda_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
