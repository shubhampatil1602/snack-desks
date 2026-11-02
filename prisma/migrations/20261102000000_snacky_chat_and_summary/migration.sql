-- CreateTable
CREATE TABLE "snacky_chat" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "snacky_chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snacky_summary" (
    "organizationId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "summary" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "snacky_summary_pkey" PRIMARY KEY ("organizationId","period")
);

-- CreateIndex
CREATE INDEX "snacky_chat_userId_organizationId_createdAt_idx" ON "snacky_chat"("userId", "organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "snacky_chat" ADD CONSTRAINT "snacky_chat_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snacky_chat" ADD CONSTRAINT "snacky_chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snacky_summary" ADD CONSTRAINT "snacky_summary_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

