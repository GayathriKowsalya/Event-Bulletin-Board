import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const testEmail = 'admin@example.com';
const testPassword = 'Password123!';

async function runTests() {
  console.log("=== STARTING Q&A TEST MATRIX ===\n");

  // 1. Login
  const { data, error } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  
  if (error || !data.session) {
    console.error("❌ Login failed:", error?.message);
    return;
  }
  const token = data.session.access_token;
  console.log("✅ Logged in successfully");

  // Fetch an event ID
  const eventsRes = await fetch('http://localhost:3001/api/events');
  const eventsData = await eventsRes.json() as any;
  const eventId = eventsData.events[0].id;
  console.log("✅ Using event ID:", eventId);

  // 2. Fetch questions (empty)
  const qRes1 = await fetch(`http://localhost:3001/api/events/${eventId}/questions`);
  const qData1 = await qRes1.json() as any;
  if (Array.isArray(qData1) || Array.isArray(qData1.questions)) {
    console.log("✅ Fetched questions successfully");
  } else {
    console.error("❌ Failed to fetch questions:", qData1);
  }

  // 3. Create question
  console.log("[TEST] Creating question...");
  const createQRes = await fetch(`http://localhost:3001/api/events/${eventId}/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ question: 'Test question from script?' })
  });
  const newQuestion = await createQRes.json() as any;
  if (newQuestion.id) {
    console.log("✅ Question created:", newQuestion.id);
  } else {
    console.error("❌ Failed to create question:", newQuestion);
  }

  // 4. Create answer
  console.log("[TEST] Creating answer...");
  const createARes = await fetch(`http://localhost:3001/api/events/${eventId}/questions/${newQuestion.id}/answers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ answer: 'Test answer from script.' })
  });
  const newAnswer = await createARes.json() as any;
  if (newAnswer.id) {
    console.log("✅ Answer created:", newAnswer.id);
  } else {
    console.error("❌ Failed to create answer:", newAnswer);
  }

  // 5. Delete answer
  console.log("[TEST] Deleting answer...");
  const deleteARes = await fetch(`http://localhost:3001/api/events/${eventId}/questions/${newQuestion.id}/answers/${newAnswer.id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (deleteARes.ok) {
    console.log("✅ Answer deleted");
  } else {
    console.error("❌ Failed to delete answer", deleteARes.statusText);
  }

  // 6. Delete question
  console.log("[TEST] Deleting question...");
  const deleteQRes = await fetch(`http://localhost:3001/api/events/${eventId}/questions/${newQuestion.id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (deleteQRes.ok) {
    console.log("✅ Question deleted");
  } else {
    console.error("❌ Failed to delete question", deleteQRes.statusText);
  }

  console.log("\n=== Q&A TESTS COMPLETE ===\n");
}

runTests();
