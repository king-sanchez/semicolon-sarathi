-- AlterTable
ALTER TABLE "User" ADD COLUMN "username" TEXT NOT NULL DEFAULT '',
ADD COLUMN "password" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

--  
