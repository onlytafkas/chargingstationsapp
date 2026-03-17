import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

// Ensure the connection string has the recommended SSL mode
let connectionString = process.env.DATABASE_URL!;
if (!connectionString.includes('sslmode=')) {
  connectionString += connectionString.includes('?') 
    ? '&sslmode=verify-full' 
    : '?sslmode=verify-full';
}

const pool = new Pool({
  connectionString,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration...');
    
    // First, check if stations table already exists
    const stationsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'stations'
      );
    `);
    
    if (stationsExists.rows[0].exists) {
      console.log('⚠️  Stations table already exists. Checking if migration is needed...');
      
      // Check if loading_sessions.station_id is already integer
      const columnType = await client.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'loading_sessions' 
        AND column_name = 'station_id';
      `);
      
      if (columnType.rows[0].data_type === 'integer') {
        console.log('✅ Migration already applied! (station_id is already integer type)');
        return;
      } else {
        console.log(`Current station_id type: ${columnType.rows[0].data_type}`);
        console.log('Migration needed: will convert text to integer...');
      }
    }
    
    // Read the migration file
    const migrationPath = join(process.cwd(), 'drizzle', '0001_shallow_randall_flagg.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Split by statement-breakpoint and execute each statement
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      // Remove standalone comment lines but keep SQL with inline comments
      .map(s => s.split('\n').filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('--');
      }).join('\n'))
      .filter(s => s.trim().length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement, skipping ones that fail due to already existing
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
      const preview = statement.substring(0, 100).replace(/\n/g, ' ');
      console.log(preview + '...');
      
      try {
        await client.query(statement);
        console.log(`✓ Statement ${i + 1} completed`);
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === '42P07') {
          // Table already exists
          console.log(`⚠️  Skipping (table already exists)`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
