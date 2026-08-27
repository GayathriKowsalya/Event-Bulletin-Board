"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const SUPABASE_URL = "https://ygykgceoanhuwywjscey.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlneWtnY2VvYW5odXd5d2pzY2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTk3MTMsImV4cCI6MjA5MDY5NTcxM30.aRgeBVYVjyPC3B0PKzubeoTpde2Bz1uOHVqSLz7Vyys";
const supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_ANON_KEY);
const email = `testuser_${Date.now()}@example.com`;
const password = "Password123!";
function runTest() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("1. Registering user:", email);
        const { data: authData, error: authError } = yield supabase.auth.signUp({
            email,
            password,
        });
        if (authError) {
            console.error("Auth Error:", authError);
            return;
        }
        const token = authData.session.access_token;
        console.log("User registered and token acquired!");
        console.log("2. Creating event via API...");
        const res = yield fetch("http://localhost:3001/api/events", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                title: "Auth Test Event",
                description: "Testing created_by logic",
                category: "Community",
                event_date: new Date(Date.now() + 86400000).toISOString(),
                location: "Local Library"
            })
        });
        const eventData = yield res.json();
        if (!res.ok) {
            console.error("Create event failed:", eventData);
            return;
        }
        const eventId = eventData.event.id;
        console.log("Event created with ID:", eventId, "Created By:", eventData.event.created_by);
        console.log("3. Test unauthenticated create event...");
        const failRes = yield fetch("http://localhost:3001/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: "Fail Event", description: "Should fail", category: "Community", event_date: new Date().toISOString(), location: "Fail"
            })
        });
        console.log("Unauthenticated create status:", failRes.status, "(Expected 401)");
        console.log("4. RSVPing to event...");
        const rsvpRes = yield fetch(`http://localhost:3001/api/events/${eventId}/rsvp`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
        });
        console.log("RSVP status:", rsvpRes.status);
        console.log("5. Checking RSVP status via API...");
        const statusRes = yield fetch(`http://localhost:3001/api/events/${eventId}/rsvp`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const statusData = yield statusRes.json();
        console.log("RSVP Status:", statusData.going);
        console.log("6. Verifying RSVP count on event...");
        const eventGet = yield fetch(`http://localhost:3001/api/events/${eventId}`);
        const eventGetData = yield eventGet.json();
        console.log("RSVP Count (should be 1):", eventGetData.event.rsvp_count);
        console.log("7. Removing RSVP...");
        const removeRes = yield fetch(`http://localhost:3001/api/events/${eventId}/rsvp`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        console.log("Remove RSVP status:", removeRes.status);
        console.log("8. Verifying RSVP count after removal...");
        const eventGet2 = yield fetch(`http://localhost:3001/api/events/${eventId}`);
        const eventGet2Data = yield eventGet2.json();
        console.log("RSVP Count (should be 0):", eventGet2Data.event.rsvp_count);
        console.log("9. Deleting event as owner...");
        const delRes = yield fetch(`http://localhost:3001/api/events/${eventId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        console.log("Delete status:", delRes.status);
    });
}
runTest().catch(console.error);
