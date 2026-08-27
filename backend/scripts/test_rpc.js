import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ygykgceoanhuwywjscey.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlneWtnY2VvYW5odXd5d2pzY2V5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTExOTcxMywiZXhwIjoyMDkwNjk1NzEzfQ._F2-KSpjCeS1Ms6zChZ4uSqOXti_lizWtdxErqhiK8A';

async function checkRpc() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    const data = await response.json();
    console.log("RPC functions available:");
    const paths = Object.keys(data.paths || {});
    const rpcs = paths.filter(p => p.startsWith('/rpc/'));
    console.log(rpcs);
  } catch (err) {
    console.error(err);
  }
}

checkRpc();
