-- CreateTable
CREATE TABLE "search_histories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "resultsCount" INTEGER,
    "searchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compare_histories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modelIds" TEXT[],
    "compareType" TEXT NOT NULL DEFAULT 'products',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compare_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_histories_userId_idx" ON "search_histories"("userId");

-- CreateIndex
CREATE INDEX "search_histories_searchedAt_idx" ON "search_histories"("searchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "search_histories_userId_query_key" ON "search_histories"("userId", "query");

-- CreateIndex
CREATE INDEX "compare_histories_userId_idx" ON "compare_histories"("userId");

-- CreateIndex
CREATE INDEX "compare_histories_createdAt_idx" ON "compare_histories"("createdAt");
