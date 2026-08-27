import { createClient } from '@supabase/supabase-js';
import https from 'https';

const SUPABASE_URL = 'https://ygykgceoanhuwywjscey.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlneWtnY2VvYW5odXd5d2pzY2V5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTExOTcxMywiZXhwIjoyMDkwNjk1NzEzfQ._F2-KSpjCeS1Ms6zChZ4uSqOXti_lizWtdxErqhiK8A';

async function fetchSchema() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    const data = await response.json();
    console.log("Tables found in OpenAPI spec:");
    const paths = Object.keys(data.paths || {});
    // Extract table names from paths (e.g., /events -> events)
    const tables = paths.map(p => p.split('/')[1]).filter((v, i, a) => a.indexOf(v) === i && v);
    console.log(tables);
  } catch (err) {
    console.error(err);
  }
}

fetchSchema();
