-- Buyer KYC + Dataroom v2 per-document policies

-- Enums
DO $$ BEGIN
  CREATE TYPE "BuyerKycStatus" AS ENUM ('UNVERIFIED', 'SUBMITTED', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DataRoomDocumentVisibility" AS ENUM ('ALL', 'OWNER_ONLY', 'NDA_ONLY', 'TRANSACTION_ONLY', 'CUSTOM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- DataRoomDocument: add policy columns
ALTER TABLE "DataRoomDocument"
  ADD COLUMN IF NOT EXISTS "visibility" "DataRoomDocumentVisibility" NOT NULL DEFAULT 'NDA_ONLY',
  ADD COLUMN IF NOT EXISTS "downloadBlocked" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "watermarkRequired" BOOLEAN NOT NULL DEFAULT FALSE;

-- DataRoomDocumentGrant: per-document allow list for CUSTOM visibility
CREATE TABLE IF NOT EXISTS "DataRoomDocumentGrant" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "documentId" TEXT NOT NULL,
  "userId" TEXT,
  "email" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DataRoomDocumentGrant_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "DataRoomDocument" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "DataRoomDocumentGrant_documentId_idx" ON "DataRoomDocumentGrant" ("documentId");
CREATE INDEX IF NOT EXISTS "DataRoomDocumentGrant_userId_idx" ON "DataRoomDocumentGrant" ("userId");
CREATE INDEX IF NOT EXISTS "DataRoomDocumentGrant_email_idx" ON "DataRoomDocumentGrant" ("email");

DO $$ BEGIN
  ALTER TABLE "DataRoomDocumentGrant"
    ADD CONSTRAINT "DataRoomDocumentGrant_documentId_userId_key" UNIQUE ("documentId", "userId");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DataRoomDocumentGrant"
    ADD CONSTRAINT "DataRoomDocumentGrant_documentId_email_key" UNIQUE ("documentId", "email");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- BuyerKycVerification
CREATE TABLE IF NOT EXISTS "BuyerKycVerification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "status" "BuyerKycStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "submittedAt" TIMESTAMP,
  "reviewedAt" TIMESTAMP,
  "reviewedBy" TEXT,
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  CONSTRAINT "BuyerKycVerification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "BuyerKycVerification_status_idx" ON "BuyerKycVerification" ("status");
CREATE INDEX IF NOT EXISTS "BuyerKycVerification_submittedAt_idx" ON "BuyerKycVerification" ("submittedAt");
CREATE INDEX IF NOT EXISTS "BuyerKycVerification_reviewedAt_idx" ON "BuyerKycVerification" ("reviewedAt");

-- BuyerKycDocument
CREATE TABLE IF NOT EXISTS "BuyerKycDocument" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "verificationId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL,
  "s3Key" TEXT NOT NULL,
  "s3Bucket" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BuyerKycDocument_verificationId_fkey"
    FOREIGN KEY ("verificationId") REFERENCES "BuyerKycVerification" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "BuyerKycDocument_verificationId_idx" ON "BuyerKycDocument" ("verificationId");
CREATE INDEX IF NOT EXISTS "BuyerKycDocument_kind_idx" ON "BuyerKycDocument" ("kind");


