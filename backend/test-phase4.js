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
function runTest() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("1. Creating test events via test-phase3.ts (or assume some exist)...");
        console.log("2. Hitting expiration endpoint...");
        const res = yield fetch("http://localhost:3001/api/jobs/expire-events", {
            method: "POST"
        });
        const data = yield res.json();
        console.log("Expiration result:", data);
        console.log("3. Checking GET /api/events for expired events...");
        const evRes = yield fetch("http://localhost:3001/api/events");
        const evData = yield evRes.json();
        const pastEvents = evData.events.filter((e) => new Date(e.event_date) < new Date());
        console.log("Found past events in list (should be 0):", pastEvents.length);
    });
}
runTest().catch(console.error);
