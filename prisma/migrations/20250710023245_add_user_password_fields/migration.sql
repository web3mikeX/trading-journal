-- CreateTable
CREATE TABLE "CalendarEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "notes" TEXT,
    "mood" INTEGER,
    "images" TEXT,
    "dailyPnL" REAL,
    "tradesCount" INTEGER NOT NULL DEFAULT 0,
    "winningTrades" INTEGER NOT NULL DEFAULT 0,
    "losingTrades" INTEGER NOT NULL DEFAULT 0,
    "winRate" REAL,
    CONSTRAINT "CalendarEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "experience" TEXT
);
INSERT INTO "new_users" ("baseCurrency", "createdAt", "email", "emailVerified", "experience", "id", "image", "initialBalance", "name", "riskPercentage", "timezone", "tradingStyle", "updatedAt") SELECT "baseCurrency", "createdAt", "email", "emailVerified", "experience", "id", "image", "initialBalance", "name", "riskPercentage", "timezone", "tradingStyle", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CalendarEntry_userId_date_idx" ON "CalendarEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "CalendarEntry_date_idx" ON "CalendarEntry"("date");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEntry_userId_date_key" ON "CalendarEntry"("userId", "date");
