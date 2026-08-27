const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
sb.from('events').insert([{ title: 'Test', description: 'test', category: 'Music', event_date: new Date().toISOString(), event_end_date: new Date().toISOString(), location: 'Test', capacity: 100, created_by: null }]).then(res => console.log(res.error));
