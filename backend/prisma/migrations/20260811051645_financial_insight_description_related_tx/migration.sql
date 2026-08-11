/*
  Warnings:

  - You are about to drop the column `message` on the `FinancialInsight` table. All the data in the column will be lost.
  - Added the required column `description` to the `FinancialInsight` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FinancialInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "relatedTransactionIds" TEXT NOT NULL DEFAULT '[]',
    "periodStart" DATETIME,
    "periodEnd" DATETIME,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinancialInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FinancialInsight_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FinancialInsight" ("categoryId", "createdAt", "id", "isRead", "periodEnd", "periodStart", "severity", "title", "type", "userId") SELECT "categoryId", "createdAt", "id", "isRead", "periodEnd", "periodStart", "severity", "title", "type", "userId" FROM "FinancialInsight";
DROP TABLE "FinancialInsight";
ALTER TABLE "new_FinancialInsight" RENAME TO "FinancialInsight";
CREATE INDEX "FinancialInsight_userId_idx" ON "FinancialInsight"("userId");
CREATE INDEX "FinancialInsight_userId_isRead_idx" ON "FinancialInsight"("userId", "isRead");
CREATE INDEX "FinancialInsight_userId_periodStart_periodEnd_idx" ON "FinancialInsight"("userId", "periodStart", "periodEnd");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
