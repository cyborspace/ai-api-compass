/*
  Warnings:

  - You are about to drop the column `searchVector` on the `object_properties` table. All the data in the column will be lost.
  - Made the column `prop_status` on table `object_properties` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prop_currency` on table `object_properties` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prop_isPopular` on table `object_properties` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prop_isFeatured` on table `object_properties` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prop_isVerified` on table `object_properties` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prop_isOpenSource` on table `object_properties` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prop_isChineseNative` on table `object_properties` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prop_viewCount` on table `object_properties` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prop_favoriteCount` on table `object_properties` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prop_compareCount` on table `object_properties` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prop_averageRating` on table `object_properties` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prop_reviewCount` on table `object_properties` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "object_properties_createdAt_idx";

-- DropIndex
DROP INDEX "object_properties_favoriteCount_idx";

-- DropIndex
DROP INDEX "object_properties_rating_idx";

-- DropIndex
DROP INDEX "object_properties_reviewCount_idx";

-- DropIndex
DROP INDEX "object_properties_searchVector_idx";

-- DropIndex
DROP INDEX "object_properties_viewCount_idx";

-- DropIndex
DROP INDEX "objects_properties_gin_idx";

-- AlterTable
ALTER TABLE "object_properties" DROP COLUMN "searchVector",
ALTER COLUMN "prop_status" SET NOT NULL,
ALTER COLUMN "prop_currency" SET NOT NULL,
ALTER COLUMN "prop_isPopular" SET NOT NULL,
ALTER COLUMN "prop_isFeatured" SET NOT NULL,
ALTER COLUMN "prop_isVerified" SET NOT NULL,
ALTER COLUMN "prop_isOpenSource" SET NOT NULL,
ALTER COLUMN "prop_isChineseNative" SET NOT NULL,
ALTER COLUMN "prop_viewCount" SET NOT NULL,
ALTER COLUMN "prop_favoriteCount" SET NOT NULL,
ALTER COLUMN "prop_compareCount" SET NOT NULL,
ALTER COLUMN "prop_averageRating" SET NOT NULL,
ALTER COLUMN "prop_reviewCount" SET NOT NULL;

-- CreateIndex
CREATE INDEX "object_properties_prop_viewCount_idx" ON "object_properties"("prop_viewCount");

-- CreateIndex
CREATE INDEX "object_properties_prop_favoriteCount_idx" ON "object_properties"("prop_favoriteCount");

-- CreateIndex
CREATE INDEX "object_properties_prop_averageRating_idx" ON "object_properties"("prop_averageRating");

-- CreateIndex
CREATE INDEX "object_properties_prop_reviewCount_idx" ON "object_properties"("prop_reviewCount");

-- CreateIndex
CREATE INDEX "object_properties_prop_createdAt_idx" ON "object_properties"("prop_createdAt");

-- AddForeignKey
ALTER TABLE "object_properties" ADD CONSTRAINT "object_properties_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "object_properties_developer_idx" RENAME TO "object_properties_prop_developer_idx";

-- RenameIndex
ALTER INDEX "object_properties_name_idx" RENAME TO "object_properties_prop_name_idx";

-- RenameIndex
ALTER INDEX "object_properties_pricingType_idx" RENAME TO "object_properties_prop_pricingType_idx";

-- RenameIndex
ALTER INDEX "object_properties_slug_idx" RENAME TO "object_properties_prop_slug_idx";

-- RenameIndex
ALTER INDEX "object_properties_status_idx" RENAME TO "object_properties_prop_status_idx";

-- RenameIndex
ALTER INDEX "object_properties_type_featured_idx" RENAME TO "object_properties_objectTypeId_prop_isFeatured_idx";

-- RenameIndex
ALTER INDEX "object_properties_type_popular_idx" RENAME TO "object_properties_objectTypeId_prop_isPopular_idx";

-- RenameIndex
ALTER INDEX "object_properties_type_status_idx" RENAME TO "object_properties_objectTypeId_prop_status_idx";
