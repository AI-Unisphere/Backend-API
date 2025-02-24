import { AppDataSource } from '../src/config/database';
import fs from 'fs';
import path from 'path';

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

        // Import data for each entity
        for (const [entityName, data] of Object.entries(exportData)) {
            console.log(`Processing ${entityName}...`);
            const repository = AppDataSource.getRepository(entityName);
            
            // Backup existing data
            const existingData = await repository.find();
            const backupPath = path.join(backupDir, `${entityName}-${timestamp}.json`);
            fs.writeFileSync(backupPath, JSON.stringify(existingData, null, 2));
            console.log(`Backed up existing ${entityName} data`);

            try {
                // Clear existing data
                if (existingData.length > 0) {
                    console.log(`Clearing existing ${entityName} data...`);
                    await repository.clear();
                }

                // Insert new data
                if (Array.isArray(data) && data.length > 0) {
                    console.log(`Importing ${data.length} records for ${entityName}...`);
                    const entities = repository.create(data);
                    await repository.save(entities);
                    console.log(`Successfully imported ${data.length} records for ${entityName}`);
                }
            } catch (error) {
                console.error(`Error importing ${entityName}:`, error);
                // Restore backup
                console.log(`Attempting to restore ${entityName} from backup...`);
                if (existingData.length > 0) {
                    const restoredEntities = repository.create(existingData);
                    await repository.save(restoredEntities);
                    console.log(`Successfully restored ${entityName} from backup`);
                }
                throw error;
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