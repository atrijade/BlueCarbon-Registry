const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const ws = require('ws');
const fs = require('fs');

const envPath = fs.existsSync(path.resolve(__dirname, '../../.env'))
  ? path.resolve(__dirname, '../../.env')
  : path.resolve(__dirname, '../../../.env');

require('dotenv').config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('CRITICAL ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not defined.');
}

// Initialize Supabase Client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  realtime: {
    transport: ws
  }
});

module.exports = supabase;
