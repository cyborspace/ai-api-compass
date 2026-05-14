-- CreateTable
CREATE TABLE "object_types" (
    "id" TEXT NOT NULL,
    "rid" TEXT NOT NULL,
    "apiName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "icon" TEXT,
    "color" TEXT,
    "primaryKeys" TEXT[],
    "titleKeys" TEXT[],
    "properties" JSONB NOT NULL DEFAULT '[]',
    "backingDatasources" JSONB NOT NULL DEFAULT '[]',
    "typeClasses" JSONB NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "object_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objects" (
    "id" TEXT NOT NULL,
    "objectTypeId" TEXT NOT NULL,
    "rid" TEXT,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "dataSourceId" TEXT,
    "externalId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "objects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link_types" (
    "id" TEXT NOT NULL,
    "rid" TEXT,
    "apiName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sourceObjectTypeId" TEXT NOT NULL,
    "targetObjectTypeId" TEXT NOT NULL,
    "cardinality" TEXT NOT NULL DEFAULT 'MANY_TO_MANY',
    "visibility" TEXT NOT NULL DEFAULT 'prominent',
    "foreignKeyProperty" TEXT,
    "propertyDefinitions" JSONB NOT NULL DEFAULT '[]',
    "backingDatasources" JSONB NOT NULL DEFAULT '[]',
    "typeClasses" JSONB NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "link_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "links" (
    "id" TEXT NOT NULL,
    "linkTypeId" TEXT NOT NULL,
    "sourceObjectId" TEXT NOT NULL,
    "targetObjectId" TEXT NOT NULL,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "dataSourceId" TEXT,
    "externalId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_properties" (
    "id" TEXT NOT NULL,
    "rid" TEXT,
    "apiName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "baseType" TEXT NOT NULL,
    "valueType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "renderHints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "shared_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "value_types" (
    "id" TEXT NOT NULL,
    "rid" TEXT,
    "apiName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "baseType" TEXT NOT NULL,
    "constraints" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "value_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_types" (
    "id" TEXT NOT NULL,
    "rid" TEXT,
    "apiName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "applicableObjectTypes" TEXT[],
    "parameters" JSONB NOT NULL DEFAULT '[]',
    "rules" JSONB NOT NULL DEFAULT '[]',
    "submissionCriteria" JSONB NOT NULL DEFAULT '[]',
    "sideEffects" JSONB NOT NULL DEFAULT '[]',
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "action_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL,
    "actionTypeId" TEXT NOT NULL,
    "objectId" TEXT,
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "result" JSONB,
    "error" TEXT,
    "errorDetails" JSONB,
    "changes" JSONB,
    "submittedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "executedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "functions" (
    "id" TEXT NOT NULL,
    "rid" TEXT,
    "apiName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "functionType" TEXT NOT NULL,
    "editsObjectTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "inputParameters" JSONB NOT NULL DEFAULT '{}',
    "outputDefinition" JSONB NOT NULL DEFAULT '{}',
    "implementationType" TEXT NOT NULL DEFAULT 'TYPESCRIPT',
    "implementation" JSONB NOT NULL DEFAULT '{}',
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "timeout" INTEGER NOT NULL DEFAULT 60,
    "status" TEXT NOT NULL DEFAULT 'active',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "functions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interfaces" (
    "id" TEXT NOT NULL,
    "rid" TEXT,
    "apiName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'experimental',
    "icon" TEXT,
    "color" TEXT,
    "sharedProperties" JSONB NOT NULL DEFAULT '[]',
    "interfaceLinkTypes" JSONB NOT NULL DEFAULT '[]',
    "extendedInterfaces" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "interfaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interface_implementations" (
    "id" TEXT NOT NULL,
    "interfaceId" TEXT NOT NULL,
    "objectTypeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interface_implementations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "object_types_rid_key" ON "object_types"("rid");

-- CreateIndex
CREATE UNIQUE INDEX "object_types_apiName_key" ON "object_types"("apiName");

-- CreateIndex
CREATE INDEX "object_types_apiName_idx" ON "object_types"("apiName");

-- CreateIndex
CREATE INDEX "object_types_status_idx" ON "object_types"("status");

-- CreateIndex
CREATE INDEX "objects_objectTypeId_idx" ON "objects"("objectTypeId");

-- CreateIndex
CREATE INDEX "objects_status_idx" ON "objects"("status");

-- CreateIndex
CREATE UNIQUE INDEX "objects_objectTypeId_rid_key" ON "objects"("objectTypeId", "rid");

-- CreateIndex
CREATE UNIQUE INDEX "link_types_apiName_key" ON "link_types"("apiName");

-- CreateIndex
CREATE INDEX "link_types_apiName_idx" ON "link_types"("apiName");

-- CreateIndex
CREATE INDEX "link_types_sourceObjectTypeId_idx" ON "link_types"("sourceObjectTypeId");

-- CreateIndex
CREATE INDEX "link_types_targetObjectTypeId_idx" ON "link_types"("targetObjectTypeId");

-- CreateIndex
CREATE INDEX "link_types_status_idx" ON "link_types"("status");

-- CreateIndex
CREATE INDEX "links_linkTypeId_idx" ON "links"("linkTypeId");

-- CreateIndex
CREATE INDEX "links_sourceObjectId_idx" ON "links"("sourceObjectId");

-- CreateIndex
CREATE INDEX "links_targetObjectId_idx" ON "links"("targetObjectId");

-- CreateIndex
CREATE UNIQUE INDEX "links_linkTypeId_sourceObjectId_targetObjectId_key" ON "links"("linkTypeId", "sourceObjectId", "targetObjectId");

-- CreateIndex
CREATE UNIQUE INDEX "shared_properties_apiName_key" ON "shared_properties"("apiName");

-- CreateIndex
CREATE INDEX "shared_properties_apiName_idx" ON "shared_properties"("apiName");

-- CreateIndex
CREATE INDEX "shared_properties_status_idx" ON "shared_properties"("status");

-- CreateIndex
CREATE UNIQUE INDEX "value_types_apiName_key" ON "value_types"("apiName");

-- CreateIndex
CREATE INDEX "value_types_apiName_idx" ON "value_types"("apiName");

-- CreateIndex
CREATE UNIQUE INDEX "action_types_apiName_key" ON "action_types"("apiName");

-- CreateIndex
CREATE INDEX "action_types_apiName_idx" ON "action_types"("apiName");

-- CreateIndex
CREATE INDEX "action_types_status_idx" ON "action_types"("status");

-- CreateIndex
CREATE INDEX "actions_actionTypeId_idx" ON "actions"("actionTypeId");

-- CreateIndex
CREATE INDEX "actions_objectId_idx" ON "actions"("objectId");

-- CreateIndex
CREATE INDEX "actions_status_idx" ON "actions"("status");

-- CreateIndex
CREATE INDEX "actions_createdAt_idx" ON "actions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "functions_apiName_key" ON "functions"("apiName");

-- CreateIndex
CREATE INDEX "functions_apiName_idx" ON "functions"("apiName");

-- CreateIndex
CREATE INDEX "functions_functionType_idx" ON "functions"("functionType");

-- CreateIndex
CREATE INDEX "functions_status_idx" ON "functions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "interfaces_apiName_key" ON "interfaces"("apiName");

-- CreateIndex
CREATE INDEX "interfaces_apiName_idx" ON "interfaces"("apiName");

-- CreateIndex
CREATE INDEX "interfaces_status_idx" ON "interfaces"("status");

-- CreateIndex
CREATE INDEX "interface_implementations_interfaceId_idx" ON "interface_implementations"("interfaceId");

-- CreateIndex
CREATE INDEX "interface_implementations_objectTypeId_idx" ON "interface_implementations"("objectTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "interface_implementations_interfaceId_objectTypeId_key" ON "interface_implementations"("interfaceId", "objectTypeId");

-- AddForeignKey
ALTER TABLE "objects" ADD CONSTRAINT "objects_objectTypeId_fkey" FOREIGN KEY ("objectTypeId") REFERENCES "object_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_types" ADD CONSTRAINT "link_types_sourceObjectTypeId_fkey" FOREIGN KEY ("sourceObjectTypeId") REFERENCES "object_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_types" ADD CONSTRAINT "link_types_targetObjectTypeId_fkey" FOREIGN KEY ("targetObjectTypeId") REFERENCES "object_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_sourceObjectId_fkey" FOREIGN KEY ("sourceObjectId") REFERENCES "objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_targetObjectId_fkey" FOREIGN KEY ("targetObjectId") REFERENCES "objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_linkTypeId_fkey" FOREIGN KEY ("linkTypeId") REFERENCES "link_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "objects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_actionTypeId_fkey" FOREIGN KEY ("actionTypeId") REFERENCES "action_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interface_implementations" ADD CONSTRAINT "interface_implementations_interfaceId_fkey" FOREIGN KEY ("interfaceId") REFERENCES "interfaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interface_implementations" ADD CONSTRAINT "interface_implementations_objectTypeId_fkey" FOREIGN KEY ("objectTypeId") REFERENCES "object_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
