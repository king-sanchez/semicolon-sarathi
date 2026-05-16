-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add new columns to Scheme table for hybrid retrieval
ALTER TABLE "Scheme" ADD COLUMN "ministry" TEXT;
ALTER TABLE "Scheme" ADD COLUMN "occupation" TEXT;
ALTER TABLE "Scheme" ADD COLUMN "category" TEXT;
ALTER TABLE "Scheme" ADD COLUMN "minAge" INTEGER;
ALTER TABLE "Scheme" ADD COLUMN "maxAge" INTEGER;
ALTER TABLE "Scheme" ADD COLUMN "maxIncome" INTEGER;
ALTER TABLE "Scheme" ADD COLUMN "embedding" vector(768);
ALTER TABLE "Scheme" ADD COLUMN "embeddingModel" TEXT;

-- Create indexes for SQL filtering
CREATE INDEX "Scheme_state_idx" ON "Scheme"("state");
CREATE INDEX "Scheme_occupation_idx" ON "Scheme"("occupation");
CREATE INDEX "Scheme_category_idx" ON "Scheme"("category");
CREATE INDEX "Scheme_minAge_idx" ON "Scheme"("minAge");
CREATE INDEX "Scheme_maxIncome_idx" ON "Scheme"("maxIncome");

-- Create SchemeEmbedding table
CREATE TABLE "SchemeEmbedding" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "embedding" vector(768) NOT NULL,
    "embeddingModel" TEXT NOT NULL,
    "textContent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchemeEmbedding_pkey" PRIMARY KEY ("id")
);

-- Create unique index on schemeId
CREATE UNIQUE INDEX "SchemeEmbedding_schemeId_key" ON "SchemeEmbedding"("schemeId");

-- Create index for schemeId lookup
CREATE INDEX "SchemeEmbedding_schemeId_idx" ON "SchemeEmbedding"("schemeId");

-- Create index for vector similarity search on Scheme table
CREATE INDEX ON "Scheme" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create index for vector similarity search on SchemeEmbedding table
CREATE INDEX ON "SchemeEmbedding" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

--  
