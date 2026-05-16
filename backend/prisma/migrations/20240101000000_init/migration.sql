-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "occupation" TEXT NOT NULL,
    "annualIncome" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "familySize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scheme" (
    "id" TEXT NOT NULL,
    "schemeName" TEXT NOT NULL,
    "description" TEXT,
    "benefits" TEXT,
    "eligibilityRules" JSONB NOT NULL,
    "applicationUrl" TEXT,
    "requiredDocuments" TEXT,
    "schemeType" TEXT NOT NULL,
    "state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scheme_pkey" PRIMARY KEY ("id")
);

--  
