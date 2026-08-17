-- CreateTable
CREATE TABLE "JournalTransaction" (
    "id" TEXT NOT NULL,
    "transactionNo" TEXT NOT NULL,
    "referenceNo" TEXT,
    "businessDomain" TEXT NOT NULL DEFAULT 'NETWORK_MARKETING',
    "sourceType" TEXT NOT NULL,
    "sourceEntityId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL DEFAULT 'POSTED',
    "description" TEXT NOT NULL,
    "metadataJson" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "JournalTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "memberId" TEXT,
    "entryType" TEXT NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "description" TEXT NOT NULL,
    "relatedEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- AlterTable PaymentRequest
ALTER TABLE "PaymentRequest" ADD COLUMN "journalEntryId" TEXT;
ALTER TABLE "PaymentRequest" ADD COLUMN "domain" TEXT NOT NULL DEFAULT 'NETWORK_MARKETING';

-- CreateIndex
CREATE UNIQUE INDEX "JournalTransaction_transactionNo_key" ON "JournalTransaction"("transactionNo");
CREATE INDEX "JournalTransaction_businessDomain_sourceType_idx" ON "JournalTransaction"("businessDomain", "sourceType");
CREATE INDEX "JournalTransaction_postedAt_idx" ON "JournalTransaction"("postedAt");
CREATE INDEX "JournalEntry_accountId_createdAt_idx" ON "JournalEntry"("accountId", "createdAt");
CREATE INDEX "JournalEntry_memberId_currency_idx" ON "JournalEntry"("memberId", "currency");

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "JournalTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinancialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "NetworkMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
