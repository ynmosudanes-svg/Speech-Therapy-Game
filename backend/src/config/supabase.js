const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

let supabase = null;

if (env.supabaseUrl && env.supabaseKey) {
  supabase = createClient(env.supabaseUrl, env.supabaseKey);
} else {
  console.warn('Supabase URL or Key is missing. Supabase client is not initialized.');
}

module.exports = supabase;
