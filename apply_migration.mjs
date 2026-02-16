import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

// Parse Supabase connection string
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Supabase URL format: https://project-ref.supabase.co
// Convert to postgres connection string
const projectRef = supabaseUrl.split('//')[1].split('.')[0];
const dbUrl = `postgresql://postgres:[password]@${projectRef}.supabase.co:5432/postgres`;

console.log('Note: This requires direct database access');
console.log('For simplicity, please apply the migration manually:');
console.log('');
console.log('1. Open Supabase SQL Editor: https://app.supabase.com/project/efybjwirnwtrclqkwyvs/sql/new');
console.log('2. Copy this SQL:');
console.log('');
const sql = fs.readFileSync('./supabase/migrations/20260216006000_create_github_sources.sql', 'utf-8');
console.log(sql);
console.log('');
console.log('3. Click "Run" to apply the migration');
