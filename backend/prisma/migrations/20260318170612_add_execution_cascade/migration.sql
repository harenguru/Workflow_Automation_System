-- DropForeignKey
ALTER TABLE "Execution" DROP CONSTRAINT "Execution_workflow_id_fkey";

-- AlterTable
ALTER TABLE "Execution" ALTER COLUMN "logs" DROP NOT NULL,
ALTER COLUMN "logs" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Execution" ADD CONSTRAINT "Execution_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
