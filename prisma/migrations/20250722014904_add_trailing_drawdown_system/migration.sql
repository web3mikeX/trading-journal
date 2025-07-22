-- CreateTable
CREATE TABLE "DailyAccountSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "endOfDayBalance" REAL NOT NULL,
    "accountHigh" REAL NOT NULL,
    "calculatedMLL" REAL NOT NULL,
    "netPnLToDate" REAL NOT NULL,
    "dailyPnL" REAL NOT NULL,
    "tradesCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "DailyAccountSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
    "initialBalance" REAL NOT NULL DEFAULT 10000,
    "riskPercentage" REAL NOT NULL DEFAULT 2,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "tradingStyle" TEXT,
    "experience" TEXT,
    "accountBalance" REAL,
    "dailyLossLimit" REAL,
    "maxLossLimit" REAL,
    "profitTarget" REAL,
    "accountStartDate" DATETIME,
    "brokerSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "accountType" TEXT NOT NULL DEFAULT 'CUSTOM',
    "startingBalance" REAL,
    "currentAccountHigh" REAL,
    "trailingDrawdownAmount" REAL,
    "isLiveFunded" BOOLEAN NOT NULL DEFAULT false,
    "firstPayoutReceived" BOOLEAN NOT NULL DEFAULT false,
    "lastEodCalculation" DATETIME
);
INSERT INTO "new_users" ("accountBalance", "accountStartDate", "autoSyncEnabled", "baseCurrency", "brokerSyncEnabled", "createdAt", "dailyLossLimit", "email", "emailVerified", "experience", "id", "image", "initialBalance", "isEmailVerified", "maxLossLimit", "name", "password", "profitTarget", "riskPercentage", "timezone", "tradingStyle", "updatedAt") SELECT "accountBalance", "accountStartDate", "autoSyncEnabled", "baseCurrency", "brokerSyncEnabled", "createdAt", "dailyLossLimit", "email", "emailVerified", "experience", "id", "image", "initialBalance", "isEmailVerified", "maxLossLimit", "name", "password", "profitTarget", "riskPercentage", "timezone", "tradingStyle", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "DailyAccountSnapshot_userId_date_idx" ON "DailyAccountSnapshot"("userId", "date");

-- CreateIndex
CREATE INDEX "DailyAccountSnapshot_date_idx" ON "DailyAccountSnapshot"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAccountSnapshot_userId_date_key" ON "DailyAccountSnapshot"("userId", "date");
