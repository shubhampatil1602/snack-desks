-- AlterTable
ALTER TABLE "order_window" ADD COLUMN     "winnerUserId" TEXT;

-- AddForeignKey
ALTER TABLE "order_window" ADD CONSTRAINT "order_window_winnerUserId_fkey" FOREIGN KEY ("winnerUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
