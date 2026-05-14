-- ============================================================================
-- Migration: Property Storage Refactor
-- Description: Extract frequently-queried properties from JSON blob to 
--              structured columns with indexes (Hybrid Model)
-- Created: 2026-05-13
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 1: Create object_properties table for structured property storage
-- ----------------------------------------------------------------------------
CREATE TABLE "object_properties" (
    "id" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "objectTypeId" TEXT NOT NULL,
    
    -- Core identifier properties (extracted from JSON for indexing)
    "prop_slug" TEXT,
    "prop_name" TEXT,
    "prop_status" TEXT DEFAULT 'active',
    
    -- Categorical properties (high cardinality, frequently filtered)
    "prop_pricingType" TEXT,
    "prop_developer" TEXT,
    "prop_currency" TEXT DEFAULT 'CNY',
    
    -- Boolean flags (frequently filtered)
    "prop_isPopular" BOOLEAN DEFAULT false,
    "prop_isFeatured" BOOLEAN DEFAULT false,
    "prop_isVerified" BOOLEAN DEFAULT false,
    "prop_isOpenSource" BOOLEAN DEFAULT false,
    "prop_isChineseNative" BOOLEAN DEFAULT true,
    
    -- Numeric counters (frequently sorted/aggregated)
    "prop_viewCount" INTEGER DEFAULT 0,
    "prop_favoriteCount" INTEGER DEFAULT 0,
    "prop_compareCount" INTEGER DEFAULT 0,
    "prop_averageRating" DOUBLE PRECISION DEFAULT 0,
    "prop_reviewCount" INTEGER DEFAULT 0,
    "prop_startingPrice" INTEGER,
    
    -- Date fields
    "prop_releaseDate" TIMESTAMP(3),
    "prop_createdAt" TIMESTAMP(3),
    "prop_updatedAt" TIMESTAMP(3),
    
    -- Full-text search vector (for advanced search)
    "searchVector" TSVECTOR,
    
    -- Metadata
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "object_properties_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "object_properties_objectId_key" UNIQUE ("objectId")
);

-- ----------------------------------------------------------------------------
-- Step 2: Create indexes for frequently queried properties
-- ----------------------------------------------------------------------------

-- B-Tree indexes for exact match and range queries
CREATE INDEX "object_properties_objectTypeId_idx" ON "object_properties"("objectTypeId");
CREATE INDEX "object_properties_slug_idx" ON "object_properties"("prop_slug");
CREATE INDEX "object_properties_name_idx" ON "object_properties"("prop_name");
CREATE INDEX "object_properties_status_idx" ON "object_properties"("prop_status");
CREATE INDEX "object_properties_pricingType_idx" ON "object_properties"("prop_pricingType");
CREATE INDEX "object_properties_developer_idx" ON "object_properties"("prop_developer");

-- Composite indexes for common filter combinations
CREATE INDEX "object_properties_type_status_idx" ON "object_properties"("objectTypeId", "prop_status");
CREATE INDEX "object_properties_type_featured_idx" ON "object_properties"("objectTypeId", "prop_isFeatured");
CREATE INDEX "object_properties_type_popular_idx" ON "object_properties"("objectTypeId", "prop_isPopular");

-- Indexes for sorting
CREATE INDEX "object_properties_viewCount_idx" ON "object_properties"("prop_viewCount" DESC);
CREATE INDEX "object_properties_favoriteCount_idx" ON "object_properties"("prop_favoriteCount" DESC);
CREATE INDEX "object_properties_rating_idx" ON "object_properties"("prop_averageRating" DESC);
CREATE INDEX "object_properties_reviewCount_idx" ON "object_properties"("prop_reviewCount" DESC);
CREATE INDEX "object_properties_createdAt_idx" ON "object_properties"("prop_createdAt" DESC);

-- GIN index for full-text search
CREATE INDEX "object_properties_searchVector_idx" ON "object_properties" USING GIN ("searchVector");

-- ----------------------------------------------------------------------------
-- Step 3: Create function to sync properties from objects table
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_object_properties()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract common properties from JSON and upsert into object_properties
    INSERT INTO "object_properties" (
        "id", "objectId", "objectTypeId",
        "prop_slug", "prop_name", "prop_status",
        "prop_pricingType", "prop_developer", "prop_currency",
        "prop_isPopular", "prop_isFeatured", "prop_isVerified", 
        "prop_isOpenSource", "prop_isChineseNative",
        "prop_viewCount", "prop_favoriteCount", "prop_compareCount",
        "prop_averageRating", "prop_reviewCount", "prop_startingPrice",
        "prop_releaseDate", "prop_createdAt", "prop_updatedAt",
        "searchVector", "updatedAt"
    ) VALUES (
        COALESCE(NEW."id", gen_random_uuid()::text),
        NEW."id",
        NEW."objectTypeId",
        NEW."properties"->>'slug',
        NEW."properties"->>'name',
        COALESCE(NEW."properties"->>'status', 'active'),
        NEW."properties"->>'pricingType',
        NEW."properties"->>'developer',
        COALESCE(NEW."properties"->>'currency', 'CNY'),
        COALESCE((NEW."properties"->>'isPopular')::boolean, false),
        COALESCE((NEW."properties"->>'isFeatured')::boolean, false),
        COALESCE((NEW."properties"->>'isVerified')::boolean, false),
        COALESCE((NEW."properties"->>'isOpenSource')::boolean, false),
        COALESCE((NEW."properties"->>'isChineseNative')::boolean, true),
        COALESCE((NEW."properties"->>'viewCount')::integer, 0),
        COALESCE((NEW."properties"->>'favoriteCount')::integer, 0),
        COALESCE((NEW."properties"->>'compareCount')::integer, 0),
        COALESCE((NEW."properties"->>'averageRating')::double precision, 0),
        COALESCE((NEW."properties"->>'reviewCount')::integer, 0),
        NULLIF((NEW."properties"->>'startingPrice')::integer, 0),
        NULLIF((NEW."properties"->>'releaseDate')::timestamp, '1970-01-01'::timestamp),
        NULLIF((NEW."properties"->>'createdAt')::timestamp, '1970-01-01'::timestamp),
        NULLIF((NEW."properties"->>'updatedAt')::timestamp, '1970-01-01'::timestamp),
        to_tsvector('simple', 
            COALESCE(NEW."properties"->>'name', '') || ' ' ||
            COALESCE(NEW."properties"->>'description', '') || ' ' ||
            COALESCE(NEW."properties"->>'developer', '') || ' ' ||
            COALESCE(NEW."properties"->>'tagline', '')
        ),
        NOW()
    )
    ON CONFLICT ("objectId") 
    DO UPDATE SET
        "prop_slug" = EXCLUDED."prop_slug",
        "prop_name" = EXCLUDED."prop_name",
        "prop_status" = EXCLUDED."prop_status",
        "prop_pricingType" = EXCLUDED."prop_pricingType",
        "prop_developer" = EXCLUDED."prop_developer",
        "prop_currency" = EXCLUDED."prop_currency",
        "prop_isPopular" = EXCLUDED."prop_isPopular",
        "prop_isFeatured" = EXCLUDED."prop_isFeatured",
        "prop_isVerified" = EXCLUDED."prop_isVerified",
        "prop_isOpenSource" = EXCLUDED."prop_isOpenSource",
        "prop_isChineseNative" = EXCLUDED."prop_isChineseNative",
        "prop_viewCount" = EXCLUDED."prop_viewCount",
        "prop_favoriteCount" = EXCLUDED."prop_favoriteCount",
        "prop_compareCount" = EXCLUDED."prop_compareCount",
        "prop_averageRating" = EXCLUDED."prop_averageRating",
        "prop_reviewCount" = EXCLUDED."prop_reviewCount",
        "prop_startingPrice" = EXCLUDED."prop_startingPrice",
        "prop_releaseDate" = EXCLUDED."prop_releaseDate",
        "prop_createdAt" = EXCLUDED."prop_createdAt",
        "prop_updatedAt" = EXCLUDED."prop_updatedAt",
        "searchVector" = EXCLUDED."searchVector",
        "version" = "object_properties"."version" + 1,
        "updatedAt" = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Step 4: Create triggers for automatic sync
-- ----------------------------------------------------------------------------
CREATE TRIGGER trigger_sync_object_properties_insert
    AFTER INSERT ON "objects"
    FOR EACH ROW
    EXECUTE FUNCTION sync_object_properties();

CREATE TRIGGER trigger_sync_object_properties_update
    AFTER UPDATE OF "properties" ON "objects"
    FOR EACH ROW
    WHEN (OLD."properties" IS DISTINCT FROM NEW."properties")
    EXECUTE FUNCTION sync_object_properties();

-- ----------------------------------------------------------------------------
-- Step 5: Backfill existing data
-- ----------------------------------------------------------------------------
INSERT INTO "object_properties" (
    "id", "objectId", "objectTypeId",
    "prop_slug", "prop_name", "prop_status",
    "prop_pricingType", "prop_developer", "prop_currency",
    "prop_isPopular", "prop_isFeatured", "prop_isVerified", 
    "prop_isOpenSource", "prop_isChineseNative",
    "prop_viewCount", "prop_favoriteCount", "prop_compareCount",
    "prop_averageRating", "prop_reviewCount", "prop_startingPrice",
    "prop_releaseDate", "prop_createdAt", "prop_updatedAt",
    "searchVector", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    o."id",
    o."objectTypeId",
    o."properties"->>'slug',
    o."properties"->>'name',
    COALESCE(o."properties"->>'status', 'active'),
    o."properties"->>'pricingType',
    o."properties"->>'developer',
    COALESCE(o."properties"->>'currency', 'CNY'),
    COALESCE((o."properties"->>'isPopular')::boolean, false),
    COALESCE((o."properties"->>'isFeatured')::boolean, false),
    COALESCE((o."properties"->>'isVerified')::boolean, false),
    COALESCE((o."properties"->>'isOpenSource')::boolean, false),
    COALESCE((o."properties"->>'isChineseNative')::boolean, true),
    COALESCE((o."properties"->>'viewCount')::integer, 0),
    COALESCE((o."properties"->>'favoriteCount')::integer, 0),
    COALESCE((o."properties"->>'compareCount')::integer, 0),
    COALESCE((o."properties"->>'averageRating')::double precision, 0),
    COALESCE((o."properties"->>'reviewCount')::integer, 0),
    NULLIF((o."properties"->>'startingPrice')::integer, 0),
    NULLIF((o."properties"->>'releaseDate')::timestamp, '1970-01-01'::timestamp),
    NULLIF((o."properties"->>'createdAt')::timestamp, '1970-01-01'::timestamp),
    NULLIF((o."properties"->>'updatedAt')::timestamp, '1970-01-01'::timestamp),
    to_tsvector('simple', 
        COALESCE(o."properties"->>'name', '') || ' ' ||
        COALESCE(o."properties"->>'description', '') || ' ' ||
        COALESCE(o."properties"->>'developer', '') || ' ' ||
        COALESCE(o."properties"->>'tagline', '')
    ),
    NOW()
FROM "objects" o
LEFT JOIN "object_properties" op ON op."objectId" = o."id"
WHERE op."id" IS NULL;

-- ----------------------------------------------------------------------------
-- Step 6: Add GIN index on objects.properties for JSON path queries
-- ----------------------------------------------------------------------------
CREATE INDEX "objects_properties_gin_idx" ON "objects" USING GIN ("properties" jsonb_path_ops);

-- ----------------------------------------------------------------------------
-- Step 7: Add comment documentation
-- ----------------------------------------------------------------------------
COMMENT ON TABLE "object_properties" IS '结构化属性存储表 - 从objects.properties JSON中提取常用属性以支持索引查询';
COMMENT ON COLUMN "object_properties"."searchVector" IS 'PostgreSQL全文搜索向量，自动从name/description/developer/tagline生成';
