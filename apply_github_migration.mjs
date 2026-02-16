import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service role key available:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = fs.readFileSync('./supabase/migrations/20260216006000_create_github_sources.sql', 'utf-8');

console.log('\nExecuting migration SQL...\n');

try {
  const { data, error } = await supabase.rpc('exec', { sql });
  
  if (error) {
    console.error('Migration error:', error);
  } else {
    console.log('Migration applied successfully');
    console.log('Result:', data);
  }
} catch (e) {
  console.error('Exception:', e.message);
}
