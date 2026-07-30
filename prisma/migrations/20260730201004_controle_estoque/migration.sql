-- CreateEnum
CREATE TYPE "TipoMovimentoEstoque" AS ENUM ('ENTRADA_COMPRA', 'ENTRADA_AJUSTE', 'SAIDA_VENDA', 'SAIDA_AJUSTE', 'SAIDA_PERDA');

-- CreateEnum
CREATE TYPE "OrigemNotaFiscal" AS ENUM ('XML', 'MANUAL');

-- AlterTable
ALTER TABLE "Produto" ADD COLUMN     "estoqueAtual" DECIMAL(12,3) NOT NULL DEFAULT 0,
ADD COLUMN     "estoqueMinimo" DECIMAL(12,3) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "MovimentoEstoque" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "tipo" "TipoMovimentoEstoque" NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoPorId" TEXT,
    "itemNotaFiscalId" TEXT,

    CONSTRAINT "MovimentoEstoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaFiscalCompra" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "numero" TEXT,
    "fornecedorNome" TEXT,
    "fornecedorCnpj" TEXT,
    "dataEmissao" TIMESTAMP(3),
    "valorTotal" DECIMAL(12,2),
    "origem" "OrigemNotaFiscal" NOT NULL,
    "chaveAcesso" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoPorId" TEXT,

    CONSTRAINT "NotaFiscalCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemNotaFiscalCompra" (
    "id" TEXT NOT NULL,
    "notaFiscalId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "descricaoOriginal" TEXT NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL,
    "valorUnitario" DECIMAL(12,4),
    "valorTotal" DECIMAL(12,2),

    CONSTRAINT "ItemNotaFiscalCompra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MovimentoEstoque_itemNotaFiscalId_key" ON "MovimentoEstoque"("itemNotaFiscalId");

-- CreateIndex
CREATE UNIQUE INDEX "NotaFiscalCompra_chaveAcesso_key" ON "NotaFiscalCompra"("chaveAcesso");

-- AddForeignKey
ALTER TABLE "MovimentoEstoque" ADD CONSTRAINT "MovimentoEstoque_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoEstoque" ADD CONSTRAINT "MovimentoEstoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoEstoque" ADD CONSTRAINT "MovimentoEstoque_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoEstoque" ADD CONSTRAINT "MovimentoEstoque_itemNotaFiscalId_fkey" FOREIGN KEY ("itemNotaFiscalId") REFERENCES "ItemNotaFiscalCompra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaFiscalCompra" ADD CONSTRAINT "NotaFiscalCompra_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaFiscalCompra" ADD CONSTRAINT "NotaFiscalCompra_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemNotaFiscalCompra" ADD CONSTRAINT "ItemNotaFiscalCompra_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "NotaFiscalCompra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemNotaFiscalCompra" ADD CONSTRAINT "ItemNotaFiscalCompra_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
