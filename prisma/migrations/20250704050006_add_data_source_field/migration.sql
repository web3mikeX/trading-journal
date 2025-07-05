-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "strategy" TEXT,
    "setup" TEXT,
    "market" TEXT NOT NULL DEFAULT 'STOCK',
    "entryDate" DATETIME NOT NULL,
    "entryPrice" REAL NOT NULL,
    "quantity" REAL NOT NULL,
    "entryFees" REAL NOT NULL DEFAULT 0,
    "exitDate" DATETIME,
    "exitPrice" REAL,
    "exitFees" REAL NOT NULL DEFAULT 0,
    "stopLoss" REAL,
    "takeProfit" REAL,
    "riskAmount" REAL,
    "grossPnL" REAL,
    "netPnL" REAL,
    "commission" REAL NOT NULL DEFAULT 0,
    "swap" REAL NOT NULL DEFAULT 0,
    "returnPercent" REAL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "screenshots" TEXT,
    "dataSource" TEXT NOT NULL DEFAULT 'manual',
    CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Trade" ("commission", "createdAt", "entryDate", "entryFees", "entryPrice", "exitDate", "exitFees", "exitPrice", "grossPnL", "id", "market", "netPnL", "notes", "quantity", "returnPercent", "riskAmount", "screenshots", "setup", "side", "status", "stopLoss", "strategy", "swap", "symbol", "takeProfit", "updatedAt", "userId") SELECT "commission", "createdAt", "entryDate", "entryFees", "entryPrice", "exitDate", "exitFees", "exitPrice", "grossPnL", "id", "market", "netPnL", "notes", "quantity", "returnPercent", "riskAmount", "screenshots", "setup", "side", "status", "stopLoss", "strategy", "swap", "symbol", "takeProfit", "updatedAt", "userId" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
CREATE INDEX "Trade_userId_entryDate_idx" ON "Trade"("userId", "entryDate");
CREATE INDEX "Trade_userId_symbol_idx" ON "Trade"("userId", "symbol");
CREATE INDEX "Trade_userId_status_idx" ON "Trade"("userId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
