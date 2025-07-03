-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
    "initialBalance" REAL NOT NULL DEFAULT 10000,
    "riskPercentage" REAL NOT NULL DEFAULT 2,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "tradingStyle" TEXT,
    "experience" TEXT
);

-- CreateTable
CREATE TABLE "Trade" (
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
    CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tradeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "entryType" TEXT NOT NULL DEFAULT 'GENERAL',
    "mood" INTEGER,
    "confidence" INTEGER,
    CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JournalEntry_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "description" TEXT,
    CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TradeTag" (
    "tradeId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("tradeId", "tagId"),
    CONSTRAINT "TradeTag_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TradeTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TradingGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" REAL,
    "currentValue" REAL NOT NULL DEFAULT 0,
    "targetDate" DATETIME,
    "goalType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    CONSTRAINT "TradingGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "Trade_userId_entryDate_idx" ON "Trade"("userId", "entryDate");

-- CreateIndex
CREATE INDEX "Trade_userId_symbol_idx" ON "Trade"("userId", "symbol");

-- CreateIndex
CREATE INDEX "Trade_userId_status_idx" ON "Trade"("userId", "status");

-- CreateIndex
CREATE INDEX "JournalEntry_userId_createdAt_idx" ON "JournalEntry"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "JournalEntry_userId_entryType_idx" ON "JournalEntry"("userId", "entryType");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag"("userId", "name");

-- CreateIndex
CREATE INDEX "TradingGoal_userId_status_idx" ON "TradingGoal"("userId", "status");
