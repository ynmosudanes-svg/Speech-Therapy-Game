CREATE TABLE "ImageLibrary" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "category" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageLibrary_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ImageLibrary_url_key" ON "ImageLibrary"("url");
CREATE INDEX "ImageLibrary_category_idx" ON "ImageLibrary"("category");
CREATE INDEX "ImageLibrary_createdAt_idx" ON "ImageLibrary"("createdAt");
