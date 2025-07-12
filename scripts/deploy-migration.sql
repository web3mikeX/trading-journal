-- Production Migration: Add Duplicate Detection Fields
-- Run this on your PostgreSQL database before deploying

-- Add duplicate detection fields to existing Trade table
ALTER TABLE "Trade" ADD COLUMN IF NOT EXISTS "tradeHash" TEXT;
ALTER TABLE "Trade" ADD COLUMN IF NOT EXISTS "isDuplicate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Trade" ADD COLUMN IF NOT EXISTS "originalTradeId" TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "Trade_userId_tradeHash_idx" ON "Trade"("userId", "tradeHash");

-- Create unique constraint to prevent exact duplicates
-- Note: This will fail if there are existing duplicate hashes
-- You may need to clean up duplicates first
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE "Trade" ADD CONSTRAINT "Trade_userId_tradeHash_key" UNIQUE ("userId", "tradeHash");
    EXCEPTION
        WHEN duplicate_table THEN
            -- Constraint already exists, skip
            RAISE NOTICE 'Unique constraint already exists';
    END;
END $$;

-- Update existing trades with NULL hashes (optional)
-- This will generate hashes for existing trades to prevent conflicts
-- Comment out if you want to keep existing trades without hashes

/*
UPDATE "Trade" 
SET "tradeHash" = NULL 
WHERE "tradeHash" IS NULL;
*/

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Trade' 
AND column_name IN ('tradeHash', 'isDuplicate', 'originalTradeId')
ORDER BY column_name;