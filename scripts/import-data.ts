import { AppDataSource } from '../src/config/database';
import fs from 'fs';
import path from 'path';
import { EntityTarget } from 'typeorm';

interface BackupData {
    [key: string]: any[];
}

// Define interfaces for type safety
interface RfpData {
    id: string;
    awardedContractId: string | null;
    [key: string]: any; // Allow other properties
}

async function importData() {
    try {
        // Initialize database connection
        await AppDataSource.initialize();
        console.log('Database connected');

        // Read export file
        const importPath = path.join(__dirname, '../data/export.json');
        if (!fs.existsSync(importPath)) {
            throw new Error('Export file not found. Please run data:export first.');
        }

        const exportData = JSON.parse(fs.readFileSync(importPath, 'utf-8'));
        
        // Create backup of current data
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(__dirname, '../data/backups');
        fs.mkdirSync(backupDir, { recursive: true });

        // Define the import order to respect foreign key constraints
        const importOrder = ['User', 'RfpCategory', 'Contract', 'Rfp', 'Bid', 'Milestone', 'MilestoneUpdate'];
        
        // Store RFP-Contract relationships to restore later
        let rfpContractRelationships: {rfpId: string, contractId: string}[] = [];

        // First, backup all existing data
        const backups: BackupData = {};
        for (const entityName of importOrder) {
            if (!exportData[entityName]) {
                console.log(`No data found for ${entityName}, skipping...`);
                continue;
            }

            console.log(`Backing up ${entityName}...`);
            const repository = AppDataSource.getRepository(entityName as EntityTarget<any>);
            const existingData = await repository.find();
            backups[entityName] = existingData;
            
            const backupPath = path.join(backupDir, `${entityName}-${timestamp}.json`);
            fs.writeFileSync(backupPath, JSON.stringify(existingData, null, 2));
            console.log(`Backed up existing ${entityName} data`);
        }

        // Clear data in reverse order to handle foreign key constraints
        console.log('Clearing existing data...');
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        
        try {
            // Drop foreign key constraints
            await queryRunner.query('ALTER TABLE "milestone_updates" DROP CONSTRAINT IF EXISTS "FK_milestone_updates_milestone"');
            await queryRunner.query('ALTER TABLE "milestones" DROP CONSTRAINT IF EXISTS "FK_milestones_contract"');
            await queryRunner.query('ALTER TABLE "contracts" DROP CONSTRAINT IF EXISTS "FK_contracts_rfp"');
            await queryRunner.query('ALTER TABLE "contracts" DROP CONSTRAINT IF EXISTS "FK_contracts_vendor"');
            await queryRunner.query('ALTER TABLE "bids" DROP CONSTRAINT IF EXISTS "FK_bids_rfp"');
            await queryRunner.query('ALTER TABLE "bids" DROP CONSTRAINT IF EXISTS "FK_bids_vendor"');
            await queryRunner.query('ALTER TABLE "rfps" DROP CONSTRAINT IF EXISTS "FK_rfps_category"');
            await queryRunner.query('ALTER TABLE "rfps" DROP CONSTRAINT IF EXISTS "FK_rfps_createdBy"');

            // Clear tables
            await queryRunner.query('TRUNCATE TABLE "milestone_updates" CASCADE');
            await queryRunner.query('TRUNCATE TABLE "milestones" CASCADE');
            await queryRunner.query('TRUNCATE TABLE "contracts" CASCADE');
            await queryRunner.query('TRUNCATE TABLE "bids" CASCADE');
            await queryRunner.query('TRUNCATE TABLE "rfps" CASCADE');
            await queryRunner.query('TRUNCATE TABLE "rfp_categories" CASCADE');
            await queryRunner.query('TRUNCATE TABLE "users" CASCADE');

            // Restore foreign key constraints
            await queryRunner.query('ALTER TABLE "milestone_updates" ADD CONSTRAINT "FK_milestone_updates_milestone" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE CASCADE');
            await queryRunner.query('ALTER TABLE "milestones" ADD CONSTRAINT "FK_milestones_contract" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE');
            await queryRunner.query('ALTER TABLE "contracts" ADD CONSTRAINT "FK_contracts_rfp" FOREIGN KEY ("rfpId") REFERENCES "rfps"("id") ON DELETE CASCADE');
            await queryRunner.query('ALTER TABLE "contracts" ADD CONSTRAINT "FK_contracts_vendor" FOREIGN KEY ("vendorId") REFERENCES "users"("id") ON DELETE CASCADE');
            await queryRunner.query('ALTER TABLE "bids" ADD CONSTRAINT "FK_bids_rfp" FOREIGN KEY ("rfpId") REFERENCES "rfps"("id") ON DELETE CASCADE');
            await queryRunner.query('ALTER TABLE "bids" ADD CONSTRAINT "FK_bids_vendor" FOREIGN KEY ("vendorId") REFERENCES "users"("id") ON DELETE CASCADE');
            await queryRunner.query('ALTER TABLE "rfps" ADD CONSTRAINT "FK_rfps_category" FOREIGN KEY ("categoryId") REFERENCES "rfp_categories"("id") ON DELETE CASCADE');
            await queryRunner.query('ALTER TABLE "rfps" ADD CONSTRAINT "FK_rfps_createdBy" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE');

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }

        // Import data for each entity type
        for (const entityName of importOrder) {
            if (exportData[entityName]) {
                console.log(`Importing ${entityName} data...`);
                
                // Backup existing data
                const backupQuery = `SELECT * FROM "${entityName.toLowerCase()}s"`;
                const backup = await queryRunner.query(backupQuery);
                backups[entityName] = backup;
                
                try {
                    // Clear existing data
                    await queryRunner.query(`TRUNCATE TABLE "${entityName.toLowerCase()}s" CASCADE`);
                    
                    // Special handling for RFPs to handle contract references
                    if (entityName === 'Rfp') {
                        // Store contract relationships before nullifying them
                        rfpContractRelationships = (exportData[entityName] as RfpData[])
                            .filter(rfp => rfp.awardedContractId)
                            .map(rfp => ({
                                rfpId: rfp.id,
                                contractId: rfp.awardedContractId as string
                            }));
                            
                        // Nullify contract references temporarily
                        exportData[entityName] = (exportData[entityName] as RfpData[]).map(rfp => ({
                            ...rfp,
                            awardedContractId: null
                        }));
                    }
                    
                    // Import the data
                    await queryRunner.manager.save(entityName, exportData[entityName]);
                    
                    // Restore RFP-Contract relationships after both RFPs and Contracts are imported
                    if (entityName === 'Rfp' && rfpContractRelationships.length > 0) {
                        for (const rel of rfpContractRelationships) {
                            await queryRunner.query(
                                `UPDATE rfps SET "awardedContractId" = $1 WHERE id = $2`,
                                [rel.contractId, rel.rfpId]
                            );
                        }
                    }
                    
                } catch (error) {
                    // Restore from backup if import fails
                    console.error(`Import failed: ${error}`);
                    if (backups[entityName]) {
                        await queryRunner.manager.save(entityName, backups[entityName]);
                    }
                    throw error;
                }
            }
        }

        console.log('Data imported successfully');
    } catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
    } finally {
        await AppDataSource.destroy();
    }
}

importData().catch(error => {
    console.error('Import failed:', error);
    process.exit(1);
}); 