-- AlterTable
ALTER TABLE "Game"
ADD COLUMN "gameCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Game_gameCode_key" ON "Game"("gameCode");
