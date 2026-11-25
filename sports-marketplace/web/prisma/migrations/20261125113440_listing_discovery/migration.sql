-- CreateTable
CREATE TABLE "ListingDiscovery" (
    "listingId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "source" TEXT NOT NULL,
    "term" TEXT NOT NULL DEFAULT '',
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ListingDiscovery_pkey" PRIMARY KEY ("listingId","day","source","term")
);

-- CreateIndex
CREATE INDEX "ListingDiscovery_listingId_day_idx" ON "ListingDiscovery"("listingId", "day");

-- AddForeignKey
ALTER TABLE "ListingDiscovery" ADD CONSTRAINT "ListingDiscovery_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
