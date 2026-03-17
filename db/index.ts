import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Ensure the connection string uses the recommended sslmode=verify-full
// This prevents the deprecation warning about 'prefer', 'require', and 'verify-ca'
let connectionString = process.env.DATABASE_URL!;

// Parse the URL to properly handle sslmode
try {
  const url = new URL(connectionString);
  
  // Remove deprecated SSL modes and set to verify-full
  url.searchParams.delete('sslmode');
  url.searchParams.set('sslmode', 'verify-full');
  
  connectionString = url.toString();
} catch (error) {
  // Fallback if URL parsing fails - just append sslmode if not present
  if (!connectionString.includes('sslmode=')) {
    connectionString += connectionString.includes('?') 
      ? '&sslmode=verify-full' 
      : '?sslmode=verify-full';
  }
}

// Create a pool with the updated connection string
const pool = new Pool({
  connectionString,
});

const db = drizzle(pool, { schema });

export { db };