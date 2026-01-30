import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { initializeDatabase, seedDatabase } from '../src/database/schema';
import { DB_PATH } from '../src/database/config';

interface CliArgs {
  reset: boolean;
  seed: boolean;
  help: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  return {
    reset: args.includes('--reset'),
    seed: args.includes('--seed'),
    help: args.includes('--help') || args.includes('-h'),
  };
}

function printHelp(): void {
  console.log(`
Orbit Database Setup Script

Usage: npm run db:setup [options]

Options:
  --reset    Delete existing database and recreate tables
  --seed     Seed database with sample data
  --help, -h Show this help message

Examples:
  npm run db:setup                 # Create tables only
  npm run db:setup --seed          # Create tables and add sample data
  npm run db:setup --reset         # Reset database and create tables
  npm run db:setup --reset --seed  # Reset, create tables, and seed data
`);
}

async function main(): Promise<void> {
  const { reset, seed, help } = parseArgs();

  if (help) {
    printHelp();
    process.exit(0);
  }

  console.log('===========================================');
  console.log('  Orbit Database Setup');
  console.log('===========================================');
  console.log('');

  // Handle database reset
  if (reset) {
    console.log('Resetting database...');
    // SQLite WAL mode creates additional files that must also be deleted
    const dbFiles = [DB_PATH, `${DB_PATH}-shm`, `${DB_PATH}-wal`];
    let removed = false;
    for (const file of dbFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`  - Removed ${path.basename(file)}`);
        removed = true;
      }
    }
    if (!removed) {
      console.log('  - No existing database found');
    }
    console.log('');
  }

  // Initialize database schema
  console.log('Initializing database schema...');
  initializeDatabase();
  console.log('  - All tables created successfully');
  console.log('');

  // Seed database if requested
  if (seed) {
    console.log('Seeding database with sample data...');
    seedDatabase();
    console.log('  - Sample data added successfully');
    console.log('');
  }

  console.log('===========================================');
  console.log('  Database setup complete!');
  console.log('===========================================');
  console.log('');
  console.log(`Database location: ${DB_PATH}`);
  console.log('');
}

main().catch((error) => {
  console.error('Error during database setup:', error);
  process.exit(1);
});
