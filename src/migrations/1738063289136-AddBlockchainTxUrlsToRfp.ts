import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBlockchainTxUrlsToRfp1738063289136 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE rfps 
            ADD COLUMN "creationTxUrl" TEXT,
            ADD COLUMN "publicationTxUrl" TEXT
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE rfps 
            DROP COLUMN IF EXISTS "creationTxUrl",
            DROP COLUMN IF EXISTS "publicationTxUrl"
        `);
    }
}
