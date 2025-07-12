-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "duplicateChecksum" TEXT,
ADD COLUMN     "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalTradeId" TEXT,
ADD COLUMN     "tradeHash" TEXT;

-- CreateIndex
CREATE INDEX "Trade_tradeHash_idx" ON "Trade"("tradeHash");

-- CreateIndex
CREATE INDEX "Trade_userId_symbol_entryDate_idx" ON "Trade"("userId", "symbol", "entryDate");

-- CreateIndex
CREATE UNIQUE INDEX "Trade_unique_trade_combo_key" ON "Trade"("userId", "symbol", "entryDate", "entryPrice", "quantity", "side");