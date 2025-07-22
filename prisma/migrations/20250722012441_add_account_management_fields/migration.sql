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
    "autoSyncEnabled" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_users" ("baseCurrency", "createdAt", "email", "emailVerified", "experience", "id", "image", "initialBalance", "isEmailVerified", "name", "password", "riskPercentage", "timezone", "tradingStyle", "updatedAt") SELECT "baseCurrency", "createdAt", "email", "emailVerified", "experience", "id", "image", "initialBalance", "isEmailVerified", "name", "password", "riskPercentage", "timezone", "tradingStyle", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
