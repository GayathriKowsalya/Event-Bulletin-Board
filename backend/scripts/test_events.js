import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ygykgceoanhuwywjscey.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlneWtnY2VvYW5odXd5d2pzY2V5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTExOTcxMywiZXhwIjoyMDkwNjk1NzEzfQ._F2-KSpjCeS1Ms6zChZ4uSqOXti_lizWtdxErqhiK8A';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testQuery() {
  const { data, error } = await supabase
    .from('events')
    .select('*, created_by')
    .limit(1);
    
  console.log("Events:", data, error);
}

testQuery();
