/*
  Warnings:

  - You are about to drop the column `editsObjectTypes` on the `functions` table. All the data in the column will be lost.
  - You are about to drop the column `functionType` on the `functions` table. All the data in the column will be lost.
  - You are about to drop the column `implementation` on the `functions` table. All the data in the column will be lost.
  - You are about to drop the column `implementationType` on the `functions` table. All the data in the column will be lost.
  - You are about to drop the column `inputParameters` on the `functions` table. All the data in the column will be lost.
  - You are about to drop the column `outputDefinition` on the `functions` table. All the data in the column will be lost.
  - You are about to drop the column `permissions` on the `functions` table. All the data in the column will be lost.
  - You are about to drop the column `timeout` on the `functions` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `shared_properties` table. All the data in the column will be lost.
  - You are about to drop the column `renderHints` on the `shared_properties` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `shared_properties` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `value_types` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `value_types` table. All the data in the column will be lost.
  - You are about to drop the `compare_histories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `favorite_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_attributes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `search_histories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sms_codes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_favorite_categories` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `returnType` to the `functions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "actions" DROP CONSTRAINT "actions_objectId_fkey";

-- DropForeignKey
ALTER TABLE "favorite_items" DROP CONSTRAINT "favorite_items_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "favorite_items" DROP CONSTRAINT "favorite_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "favorite_items" DROP CONSTRAINT "favorite_items_userId_fkey";

-- DropForeignKey
ALTER TABLE "product_attributes" DROP CONSTRAINT "product_attributes_productId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "user_favorite_categories" DROP CONSTRAINT "user_favorite_categories_userId_fkey";

-- DropIndex
DROP INDEX "action_types_status_idx";

-- DropIndex
DROP INDEX "actions_createdAt_idx";

-- DropIndex
DROP INDEX "functions_functionType_idx";

-- DropIndex
DROP INDEX "functions_status_idx";

-- DropIndex
DROP INDEX "interfaces_status_idx";

-- DropIndex
DROP INDEX "link_types_status_idx";

-- DropIndex
DROP INDEX "shared_properties_status_idx";

-- AlterTable
ALTER TABLE "action_types" ALTER COLUMN "applicableObjectTypes" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "actions" ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "functions" DROP COLUMN "editsObjectTypes",
DROP COLUMN "functionType",
DROP COLUMN "implementation",
DROP COLUMN "implementationType",
DROP COLUMN "inputParameters",
DROP COLUMN "outputDefinition",
DROP COLUMN "permissions",
DROP COLUMN "timeout",
ADD COLUMN     "boundObjectTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "executionMode" TEXT NOT NULL DEFAULT 'SERVERLESS',
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'TYPESCRIPT',
ADD COLUMN     "parameters" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "performsEdits" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "returnType" JSONB NOT NULL,
ADD COLUMN     "timeoutMs" INTEGER NOT NULL DEFAULT 30000;

-- AlterTable
ALTER TABLE "object_types" ADD COLUMN     "groups" JSONB NOT NULL DEFAULT '[]',
ALTER COLUMN "primaryKeys" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "titleKeys" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "shared_properties" DROP COLUMN "createdBy",
DROP COLUMN "renderHints",
DROP COLUMN "updatedBy";

-- AlterTable
ALTER TABLE "value_types" DROP COLUMN "createdBy",
DROP COLUMN "updatedBy";

-- DropTable
DROP TABLE "compare_histories";

-- DropTable
DROP TABLE "favorite_items";

-- DropTable
DROP TABLE "product_attributes";

-- DropTable
DROP TABLE "product_categories";

-- DropTable
DROP TABLE "products";

-- DropTable
DROP TABLE "search_histories";

-- DropTable
DROP TABLE "sms_codes";

-- DropTable
DROP TABLE "user_favorite_categories";

-- CreateTable
CREATE TABLE "user_events" (
    "id" TEXT NOT NULL,
    "toolRid" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_heat_snapshots" (
    "id" TEXT NOT NULL,
    "toolRid" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "heatScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rawScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "weightedScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "decayFactor" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "trend" TEXT NOT NULL DEFAULT 'stable',
    "trendChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "previousScore" DOUBLE PRECISION,
    "level" TEXT NOT NULL DEFAULT 'FROZEN',
    "levelIcon" TEXT NOT NULL DEFAULT '❄️',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_heat_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_heat_history" (
    "id" TEXT NOT NULL,
    "toolRid" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "heatScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "trend" TEXT NOT NULL DEFAULT 'stable',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_heat_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heat_config" (
    "id" TEXT NOT NULL,
    "configKey" TEXT NOT NULL,
    "configValue" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "heat_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_ratings" (
    "id" TEXT NOT NULL,
    "toolRid" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "overallRating" INTEGER NOT NULL,
    "easeOfUseRating" INTEGER,
    "performanceRating" INTEGER,
    "valueRating" INTEGER,
    "reviewTitle" TEXT,
    "reviewContent" TEXT,
    "pros" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_ratings" (
    "id" TEXT NOT NULL,
    "toolRid" TEXT NOT NULL,
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weightedAverageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rating5Count" INTEGER NOT NULL DEFAULT 0,
    "rating4Count" INTEGER NOT NULL DEFAULT 0,
    "rating3Count" INTEGER NOT NULL DEFAULT 0,
    "rating2Count" INTEGER NOT NULL DEFAULT 0,
    "rating1Count" INTEGER NOT NULL DEFAULT 0,
    "averageEaseOfUse" DOUBLE PRECISION,
    "averagePerformance" DOUBLE PRECISION,
    "averageValue" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rating_activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "toolRid" TEXT,
    "actionType" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "isSuspicious" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rating_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_snapshots" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "perspective" TEXT NOT NULL DEFAULT 'default',
    "category" TEXT,
    "rankings" JSONB NOT NULL DEFAULT '[]',
    "totalTools" INTEGER NOT NULL DEFAULT 0,
    "avgScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weights" JSONB NOT NULL DEFAULT '{}',
    "explanation" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranking_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_ranking_history" (
    "id" TEXT NOT NULL,
    "toolRid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "perspective" TEXT NOT NULL DEFAULT 'default',
    "category" TEXT,
    "rank" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "previousRank" INTEGER,
    "rankChange" INTEGER,
    "scoreBreakdown" JSONB NOT NULL DEFAULT '{}',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_ranking_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_config" (
    "id" TEXT NOT NULL,
    "configKey" TEXT NOT NULL,
    "configValue" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anti_gaming_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "toolRid" TEXT,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "behaviors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "action" TEXT NOT NULL DEFAULT 'allow',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anti_gaming_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_events_toolRid_idx" ON "user_events"("toolRid");

-- CreateIndex
CREATE INDEX "user_events_eventType_idx" ON "user_events"("eventType");

-- CreateIndex
CREATE INDEX "user_events_createdAt_idx" ON "user_events"("createdAt");

-- CreateIndex
CREATE INDEX "user_events_toolRid_createdAt_idx" ON "user_events"("toolRid", "createdAt");

-- CreateIndex
CREATE INDEX "user_events_toolRid_eventType_createdAt_idx" ON "user_events"("toolRid", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "tool_heat_snapshots_toolRid_idx" ON "tool_heat_snapshots"("toolRid");

-- CreateIndex
CREATE INDEX "tool_heat_snapshots_period_idx" ON "tool_heat_snapshots"("period");

-- CreateIndex
CREATE INDEX "tool_heat_snapshots_heatScore_idx" ON "tool_heat_snapshots"("heatScore");

-- CreateIndex
CREATE INDEX "tool_heat_snapshots_calculatedAt_idx" ON "tool_heat_snapshots"("calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "tool_heat_snapshots_toolRid_period_key" ON "tool_heat_snapshots"("toolRid", "period");

-- CreateIndex
CREATE INDEX "tool_heat_history_toolRid_period_recordedAt_idx" ON "tool_heat_history"("toolRid", "period", "recordedAt");

-- CreateIndex
CREATE INDEX "tool_heat_history_recordedAt_idx" ON "tool_heat_history"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "heat_config_configKey_key" ON "heat_config"("configKey");

-- CreateIndex
CREATE INDEX "heat_config_configKey_idx" ON "heat_config"("configKey");

-- CreateIndex
CREATE INDEX "user_ratings_toolRid_idx" ON "user_ratings"("toolRid");

-- CreateIndex
CREATE INDEX "user_ratings_userId_idx" ON "user_ratings"("userId");

-- CreateIndex
CREATE INDEX "user_ratings_sessionId_idx" ON "user_ratings"("sessionId");

-- CreateIndex
CREATE INDEX "user_ratings_createdAt_idx" ON "user_ratings"("createdAt");

-- CreateIndex
CREATE INDEX "user_ratings_toolRid_createdAt_idx" ON "user_ratings"("toolRid", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_ratings_toolRid_userId_key" ON "user_ratings"("toolRid", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_ratings_toolRid_sessionId_key" ON "user_ratings"("toolRid", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "tool_ratings_toolRid_key" ON "tool_ratings"("toolRid");

-- CreateIndex
CREATE INDEX "tool_ratings_toolRid_idx" ON "tool_ratings"("toolRid");

-- CreateIndex
CREATE INDEX "tool_ratings_averageRating_idx" ON "tool_ratings"("averageRating");

-- CreateIndex
CREATE INDEX "rating_activity_logs_userId_createdAt_idx" ON "rating_activity_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "rating_activity_logs_sessionId_createdAt_idx" ON "rating_activity_logs"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "rating_activity_logs_ipAddress_createdAt_idx" ON "rating_activity_logs"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "rating_activity_logs_toolRid_createdAt_idx" ON "rating_activity_logs"("toolRid", "createdAt");

-- CreateIndex
CREATE INDEX "ranking_snapshots_type_idx" ON "ranking_snapshots"("type");

-- CreateIndex
CREATE INDEX "ranking_snapshots_perspective_idx" ON "ranking_snapshots"("perspective");

-- CreateIndex
CREATE INDEX "ranking_snapshots_category_idx" ON "ranking_snapshots"("category");

-- CreateIndex
CREATE INDEX "ranking_snapshots_calculatedAt_idx" ON "ranking_snapshots"("calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_snapshots_type_perspective_category_calculatedAt_key" ON "ranking_snapshots"("type", "perspective", "category", "calculatedAt");

-- CreateIndex
CREATE INDEX "tool_ranking_history_toolRid_idx" ON "tool_ranking_history"("toolRid");

-- CreateIndex
CREATE INDEX "tool_ranking_history_type_idx" ON "tool_ranking_history"("type");

-- CreateIndex
CREATE INDEX "tool_ranking_history_recordedAt_idx" ON "tool_ranking_history"("recordedAt");

-- CreateIndex
CREATE INDEX "tool_ranking_history_toolRid_type_recordedAt_idx" ON "tool_ranking_history"("toolRid", "type", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "tool_ranking_history_toolRid_type_perspective_category_reco_key" ON "tool_ranking_history"("toolRid", "type", "perspective", "category", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_config_configKey_key" ON "ranking_config"("configKey");

-- CreateIndex
CREATE INDEX "ranking_config_configKey_idx" ON "ranking_config"("configKey");

-- CreateIndex
CREATE INDEX "anti_gaming_records_userId_idx" ON "anti_gaming_records"("userId");

-- CreateIndex
CREATE INDEX "anti_gaming_records_sessionId_idx" ON "anti_gaming_records"("sessionId");

-- CreateIndex
CREATE INDEX "anti_gaming_records_ipAddress_idx" ON "anti_gaming_records"("ipAddress");

-- CreateIndex
CREATE INDEX "anti_gaming_records_riskLevel_idx" ON "anti_gaming_records"("riskLevel");

-- CreateIndex
CREATE INDEX "anti_gaming_records_createdAt_idx" ON "anti_gaming_records"("createdAt");

-- CreateIndex
CREATE INDEX "objects_dataSourceId_idx" ON "objects"("dataSourceId");
