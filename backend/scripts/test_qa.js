import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ygykgceoanhuwywjscey.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlneWtnY2VvYW5odXd5d2pzY2V5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTExOTcxMywiZXhwIjoyMDkwNjk1NzEzfQ._F2-KSpjCeS1Ms6zChZ4uSqOXti_lizWtdxErqhiK8A';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testQA() {
  const eventId = '27fa0016-ed22-4467-b5bd-2c262176dddb';
  const { data, error } = await supabase
    .from('event_questions')
    .select(`
      id,
      question,
      created_at,
      user_id,
      profile:profiles(id, name, email),
      answers:event_answers(
        id,
        answer,
        created_at,
        user_id,
        profile:profiles(id, name, email)
      )
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("QA Query Error:", error);
  } else {
    console.log("QA Query Success:", data);
  }
}

testQA();
