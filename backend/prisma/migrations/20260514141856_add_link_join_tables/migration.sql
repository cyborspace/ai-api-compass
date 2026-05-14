-- CreateTable
CREATE TABLE "link_tool_suitable_for" (
    "id" TEXT NOT NULL,
    "sourceObjectId" TEXT NOT NULL,
    "targetObjectId" TEXT NOT NULL,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "link_tool_suitable_for_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link_tool_competitor_of" (
    "id" TEXT NOT NULL,
    "sourceObjectId" TEXT NOT NULL,
    "targetObjectId" TEXT NOT NULL,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "link_tool_competitor_of_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "link_tool_suitable_for_sourceObjectId_idx" ON "link_tool_suitable_for"("sourceObjectId");

-- CreateIndex
CREATE INDEX "link_tool_suitable_for_targetObjectId_idx" ON "link_tool_suitable_for"("targetObjectId");

-- CreateIndex
CREATE UNIQUE INDEX "link_tool_suitable_for_sourceObjectId_targetObjectId_key" ON "link_tool_suitable_for"("sourceObjectId", "targetObjectId");

-- CreateIndex
CREATE INDEX "link_tool_competitor_of_sourceObjectId_idx" ON "link_tool_competitor_of"("sourceObjectId");

-- CreateIndex
CREATE INDEX "link_tool_competitor_of_targetObjectId_idx" ON "link_tool_competitor_of"("targetObjectId");

-- CreateIndex
CREATE UNIQUE INDEX "link_tool_competitor_of_sourceObjectId_targetObjectId_key" ON "link_tool_competitor_of"("sourceObjectId", "targetObjectId");
