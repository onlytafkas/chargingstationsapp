import 'dotenv/config';
import { Pool } from 'pg';

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

async function checkDatabaseState() {
  const client = await pool.connect();
  
  try {
    console.log('Checking database state...\n');
    
    // Check if stations table exists
    const stationsTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'stations'
      );
    `);
    console.log('Stations table exists:', stationsTableCheck.rows[0].exists);
    
    if (stationsTableCheck.rows[0].exists) {
      // Check stations table structure
      const stationsColumns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'stations'
        ORDER BY ordinal_position;
      `);
      console.log('\nStations table columns:');
      stationsColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // Check if there's data
      const stationsCount = await client.query('SELECT COUNT(*) FROM stations');
      console.log(`\nStations count: ${stationsCount.rows[0].count}`);
      
      if (parseInt(stationsCount.rows[0].count) > 0) {
        const stationsSample = await client.query('SELECT * FROM stations LIMIT 5');
        console.log('\nSample stations:');
        stationsSample.rows.forEach(s => {
          console.log(`  - ID: ${s.id}, Name: ${s.name}, Description: ${s.description}`);
        });
      }
    }
    
    // Check loading_sessions table structure
    const sessionsColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'loading_sessions'
      ORDER BY ordinal_position;
    `);
    console.log('\n\nLoading_sessions table columns:');
    sessionsColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Check if there's data
    const sessionsCount = await client.query('SELECT COUNT(*) FROM loading_sessions');
    console.log(`\nSessions count: ${sessionsCount.rows[0].count}`);
    
    if (parseInt(sessionsCount.rows[0].count) > 0) {
      const sessionsSample = await client.query('SELECT * FROM loading_sessions LIMIT 3');
      console.log('\nSample sessions:');
      sessionsSample.rows.forEach(s => {
        console.log(`  - ID: ${s.id}, UserID: ${s.user_id}, StationID: ${s.station_id} (type: ${typeof s.station_id})`);
      });
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabaseState();
