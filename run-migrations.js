const { exec } = require('child_process');

console.log('Running database migrations...');

// Run TypeORM migrations
exec('npx typeorm-ts-node-commonjs migration:run -d src/config/database.ts', (error, stdout, stderr) => {
  if (error) {
    console.error(`Migration error: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Migration stderr: ${stderr}`);
    return;
  }
  
  console.log(`Migration stdout: ${stdout}`);
  console.log('Migrations completed successfully!');
}); 