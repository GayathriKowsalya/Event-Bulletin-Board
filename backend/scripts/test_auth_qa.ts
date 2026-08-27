import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'c:/Users/Gayathri B/OneDrive/Desktop/event-registeration-main/backend/.env' });

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const testEmail = `testuser_${Date.now()}@example.com`;
const testPassword = 'Password123!';

async function runTests() {
  console.log("=== STARTING AUTH & Q&A TEST MATRIX ===\n");

  // 1. Register new user
  console.log("[TEST] Registering new user...");
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });
  
  if (signUpError) {
    console.error("❌ Registration failed:", signUpError.message);
    return;
  }
  console.log("✅ Registered new user:", signUpData.user?.id);

  // 2. Profile automatically created
  console.log("[TEST] Checking if profile was created...");
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', signUpData.user?.id)
    .single();
    
  if (profileError || !profile) {
    console.error("❌ Profile not created:", profileError?.message);
  } else {
    console.log("✅ Profile automatically created.");
  }

  // 3. Login unconfirmed user
  console.log("[TEST] Logging in unconfirmed user...");
  const { error: loginError1 } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  
  if (loginError1 && loginError1.message === 'Email not confirmed') {
    console.log("✅ Email confirmation correctly handled (prevented login).");
  } else {
    console.error("❌ Expected 'Email not confirmed' error, got:", loginError1?.message);
  }

  // 4. Wrong password
  console.log("[TEST] Testing wrong password...");
  const { error: loginError2 } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: 'WrongPassword!',
  });
  
  if (loginError2 && loginError2.message === 'Invalid login credentials') {
    console.log("✅ Wrong password correctly rejected.");
  } else {
    console.error("❌ Expected 'Invalid login credentials', got:", loginError2?.message);
  }

  // 5. Nonexistent account
  console.log("[TEST] Testing nonexistent account...");
  const { error: loginError3 } = await supabase.auth.signInWithPassword({
    email: 'doesnotexist123@example.com',
    password: 'Password123!',
  });
  
  if (loginError3 && loginError3.message === 'Invalid login credentials') {
    console.log("✅ Nonexistent account correctly rejected.");
  } else {
    console.error("❌ Expected 'Invalid login credentials', got:", loginError3?.message);
  }

  console.log("\n=== AUTHENTICATION INITIAL TESTS COMPLETE ===\n");
}

runTests();
