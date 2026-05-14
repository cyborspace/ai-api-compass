-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "nickname" TEXT,
    "avatar" TEXT,
    "password" TEXT,
    "authType" TEXT NOT NULL DEFAULT 'phone',
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_codes" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "tries" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "apiName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "description" TEXT,
    "developer" TEXT,
    "releaseDate" TIMESTAMP(3),
    "pricingType" TEXT NOT NULL DEFAULT 'free',
    "startingPrice" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "compareCount" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_attributes" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "groupName" TEXT NOT NULL DEFAULT 'general',
    "apiName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "value" TEXT,
    "valueType" TEXT NOT NULL DEFAULT 'string',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_favorite_categories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '📁',
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_favorite_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "productId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'product',
    "customTitle" TEXT,
    "customUrl" TEXT,
    "customDescription" TEXT,
    "customIcon" TEXT,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "favorite_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sms_codes_phone_key" ON "sms_codes"("phone");

-- CreateIndex
CREATE INDEX "sms_codes_phone_idx" ON "sms_codes"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_apiName_key" ON "product_categories"("apiName");

-- CreateIndex
CREATE INDEX "product_categories_apiName_idx" ON "product_categories"("apiName");

-- CreateIndex
CREATE INDEX "product_categories_isActive_idx" ON "product_categories"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_slug_idx" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "products_isFeatured_idx" ON "products"("isFeatured");

-- CreateIndex
CREATE INDEX "product_attributes_productId_idx" ON "product_attributes"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_attributes_productId_apiName_key" ON "product_attributes"("productId", "apiName");

-- CreateIndex
CREATE INDEX "user_favorite_categories_userId_idx" ON "user_favorite_categories"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_favorite_categories_userId_name_key" ON "user_favorite_categories"("userId", "name");

-- CreateIndex
CREATE INDEX "favorite_items_userId_idx" ON "favorite_items"("userId");

-- CreateIndex
CREATE INDEX "favorite_items_categoryId_idx" ON "favorite_items"("categoryId");

-- CreateIndex
CREATE INDEX "favorite_items_productId_idx" ON "favorite_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_items_userId_productId_key" ON "favorite_items"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_items_userId_customUrl_key" ON "favorite_items"("userId", "customUrl");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_categories" ADD CONSTRAINT "user_favorite_categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_items" ADD CONSTRAINT "favorite_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_items" ADD CONSTRAINT "favorite_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "user_favorite_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_items" ADD CONSTRAINT "favorite_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
