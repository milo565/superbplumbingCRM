-- Service categories: plumbing → air conditioning
ALTER TYPE "ServiceCategory" RENAME VALUE 'GENERAL_PLUMBING' TO 'SPLIT_INSTALL';
ALTER TYPE "ServiceCategory" RENAME VALUE 'GAS_FITTING' TO 'DUCTED_INSTALL';
ALTER TYPE "ServiceCategory" RENAME VALUE 'DRAINAGE' TO 'REPAIR';
ALTER TYPE "ServiceCategory" RENAME VALUE 'ROOFING' TO 'SERVICE';
ALTER TYPE "ServiceCategory" RENAME VALUE 'MAINTENANCE' TO 'COMMERCIAL_MAINTENANCE';
ALTER TYPE "ServiceCategory" ADD VALUE 'CASSETTE_INSTALL';
ALTER TYPE "ServiceCategory" ADD VALUE 'WARRANTY';

-- Site record: plumbing plant → AC assets
ALTER TABLE "Property" RENAME COLUMN "waterMeter" TO "outdoorUnit";
ALTER TABLE "Property" RENAME COLUMN "shutOffLocation" TO "isolatorLocation";
ALTER TABLE "Property" RENAME COLUMN "hotWaterSystem" TO "indoorHeads";
ALTER TABLE "Property" RENAME COLUMN "gasNotes" TO "refrigerantType";
ALTER TABLE "Property" RENAME COLUMN "roofingDrainage" TO "mountNotes";
ALTER TABLE "Property" RENAME COLUMN "fixtures" TO "modelSerial";
ALTER TABLE "Property" ADD COLUMN "filterDates" TEXT;

ALTER TABLE "Customer" ALTER COLUMN "billingState" SET DEFAULT 'QLD';
ALTER TABLE "Property" ALTER COLUMN "state" SET DEFAULT 'QLD';
