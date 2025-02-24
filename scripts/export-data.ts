import { AppDataSource } from '../src/config/database';
import fs from 'fs';
import path from 'path';

async function exportData() {
    try {
        // Initialize database connection
        await AppDataSource.initialize();
        console.log('Database connected');

        // Get all entities
        const entities = AppDataSource.entityMetadatas;
        const exportData: Record<string, any[]> = {};

        // Export data from each entity
        for (const entity of entities) {
            console.log(`Exporting ${entity.name}...`);
            const repository = AppDataSource.getRepository(entity.name);
            const data = await repository.find();
            
            // Remove any circular references or complex objects
            const cleanData = data.map(item => {
                const cleaned = { ...item };
                // Remove any TypeORM metadata
                delete cleaned.__entity;
                return cleaned;
            });
            
            exportData[entity.name] = cleanData;
        }

        // Save to file
        const exportPath = path.join(__dirname, '../data/export.json');
        fs.mkdirSync(path.dirname(exportPath), { recursive: true });
        fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

        console.log('Data exported successfully to data/export.json');
        
        // Also save to a timestamped file for backup
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(__dirname, `../data/export-${timestamp}.json`);
        fs.writeFileSync(backupPath, JSON.stringify(exportData, null, 2));
        console.log(`Backup saved to data/export-${timestamp}.json`);

    } catch (error) {
        console.error('Export failed:', error);
        process.exit(1);
    } finally {
        await AppDataSource.destroy();
    }
}

exportData().catch(error => {
    console.error('Export failed:', error);
    process.exit(1);
}); 