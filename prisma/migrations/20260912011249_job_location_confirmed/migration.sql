-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW_ENQUIRY',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "emergency" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "appointmentStart" DATETIME,
    "appointmentEnd" DATETIME,
    "windowLabel" TEXT,
    "labourHours" REAL NOT NULL DEFAULT 0,
    "labourRate" REAL NOT NULL DEFAULT 120,
    "materialsCost" REAL NOT NULL DEFAULT 0,
    "otherCost" REAL NOT NULL DEFAULT 0,
    "gstAmount" REAL NOT NULL DEFAULT 0,
    "totalIncGst" REAL NOT NULL DEFAULT 0,
    "marginPercent" REAL,
    "beforeNotes" TEXT,
    "afterNotes" TEXT,
    "internalNotes" TEXT,
    "recommendations" TEXT,
    "signatureName" TEXT,
    "signedAt" DATETIME,
    "warrantyMonths" INTEGER,
    "complianceNotes" TEXT,
    "nextFollowUpAt" DATETIME,
    "locationConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" DATETIME,
    "checkedOutAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "customerId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdById" TEXT,
    "quoteId" TEXT,
    CONSTRAINT "Job_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Job_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Job_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Job_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Job_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Job" ("afterNotes", "appointmentEnd", "appointmentStart", "assignedToId", "beforeNotes", "category", "checkedInAt", "checkedOutAt", "completedAt", "complianceNotes", "createdAt", "createdById", "customerId", "description", "emergency", "gstAmount", "id", "internalNotes", "jobNumber", "labourHours", "labourRate", "marginPercent", "materialsCost", "nextFollowUpAt", "otherCost", "priority", "propertyId", "quoteId", "recommendations", "signatureName", "signedAt", "status", "title", "totalIncGst", "updatedAt", "warrantyMonths", "windowLabel") SELECT "afterNotes", "appointmentEnd", "appointmentStart", "assignedToId", "beforeNotes", "category", "checkedInAt", "checkedOutAt", "completedAt", "complianceNotes", "createdAt", "createdById", "customerId", "description", "emergency", "gstAmount", "id", "internalNotes", "jobNumber", "labourHours", "labourRate", "marginPercent", "materialsCost", "nextFollowUpAt", "otherCost", "priority", "propertyId", "quoteId", "recommendations", "signatureName", "signedAt", "status", "title", "totalIncGst", "updatedAt", "warrantyMonths", "windowLabel" FROM "Job";
DROP TABLE "Job";
ALTER TABLE "new_Job" RENAME TO "Job";
CREATE UNIQUE INDEX "Job_jobNumber_key" ON "Job"("jobNumber");
CREATE INDEX "Job_status_idx" ON "Job"("status");
CREATE INDEX "Job_appointmentStart_idx" ON "Job"("appointmentStart");
CREATE INDEX "Job_assignedToId_idx" ON "Job"("assignedToId");
CREATE INDEX "Job_customerId_idx" ON "Job"("customerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
