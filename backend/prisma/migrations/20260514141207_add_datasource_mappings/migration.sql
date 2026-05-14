-- CreateTable
CREATE TABLE "datasource_mappings" (
    "id" TEXT NOT NULL,
    "rid" TEXT,
    "objectTypeId" TEXT NOT NULL,
    "apiName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "datasourceType" TEXT NOT NULL DEFAULT 'PRISMA_MODEL',
    "sourceIdentifier" TEXT NOT NULL,
    "schemaName" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "propertyMappings" JSONB NOT NULL DEFAULT '{}',
    "supportsWrites" BOOLEAN NOT NULL DEFAULT true,
    "syncConfig" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "datasource_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "datasource_mappings_rid_key" ON "datasource_mappings"("rid");

-- CreateIndex
CREATE INDEX "datasource_mappings_objectTypeId_idx" ON "datasource_mappings"("objectTypeId");

-- CreateIndex
CREATE INDEX "datasource_mappings_apiName_idx" ON "datasource_mappings"("apiName");

-- CreateIndex
CREATE INDEX "datasource_mappings_datasourceType_idx" ON "datasource_mappings"("datasourceType");

-- CreateIndex
CREATE INDEX "datasource_mappings_sourceIdentifier_idx" ON "datasource_mappings"("sourceIdentifier");

-- CreateIndex
CREATE INDEX "datasource_mappings_status_idx" ON "datasource_mappings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "datasource_mappings_objectTypeId_apiName_key" ON "datasource_mappings"("objectTypeId", "apiName");

-- AddForeignKey
ALTER TABLE "datasource_mappings" ADD CONSTRAINT "datasource_mappings_objectTypeId_fkey" FOREIGN KEY ("objectTypeId") REFERENCES "object_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
