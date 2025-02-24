import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRfpRequirementsAndEvaluation1738063289137 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE rfps 
            ADD COLUMN "requirements" JSONB,
            ADD COLUMN "evaluationMetrics" JSONB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE rfps 
            DROP COLUMN IF EXISTS "requirements",
            DROP COLUMN IF EXISTS "evaluationMetrics"
        `);
    }
} 