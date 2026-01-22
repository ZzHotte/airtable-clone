-- Migration: Rename Table to DataTable and create new tables
-- This migration preserves all existing data in the Table by renaming it instead of dropping
-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('owner', 'member');

-- CreateEnum
CREATE TYPE "ColumnType" AS ENUM ('text', 'number');

-- RenameTable: Rename "Table" to "DataTable" to avoid confusion with database table terminology
-- This preserves all existing data
ALTER TABLE "Table" RENAME TO "DataTable";

-- RenameIndex: Update index name to match new table name
ALTER INDEX "Table_baseId_idx" RENAME TO "DataTable_baseId_idx";

-- RenameConstraint: Update foreign key constraint name to match new table name
ALTER TABLE "DataTable" RENAME CONSTRAINT "Table_baseId_fkey" TO "DataTable_baseId_fkey";

-- RenameConstraint: Update primary key constraint name to match new table name
ALTER TABLE "DataTable" RENAME CONSTRAINT "Table_pkey" TO "DataTable_pkey";

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableColumn" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ColumnType" NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TableColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableRow" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TableRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableView" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "sort" JSONB NOT NULL,
    "search" TEXT,
    "visibleColumnKeys" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TableView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- Note: DataTable_baseId_idx already exists from the rename operation above

-- CreateIndex
CREATE INDEX "TableColumn_tableId_order_idx" ON "TableColumn"("tableId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "TableColumn_tableId_key_key" ON "TableColumn"("tableId", "key");

-- CreateIndex
CREATE INDEX "TableRow_tableId_createdAt_idx" ON "TableRow"("tableId", "createdAt");

-- CreateIndex
CREATE INDEX "TableView_tableId_idx" ON "TableView"("tableId");

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Note: DataTable_baseId_fkey already exists from the rename operation above

-- AddForeignKey
ALTER TABLE "TableColumn" ADD CONSTRAINT "TableColumn_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "DataTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableRow" ADD CONSTRAINT "TableRow_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "DataTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableView" ADD CONSTRAINT "TableView_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "DataTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
