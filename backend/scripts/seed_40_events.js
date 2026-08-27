"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv.config({ path: path_1.default.resolve(__dirname, '../.env') });
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
const categories = ["Music", "Food", "Sports", "Community", "Education", "Arts", "Yard Sale", "Other"];
// Generate realistic event data
const cbeEvents = [
    { title: "Gandhipuram Tech Meetup", desc: "A monthly gathering of developers and tech enthusiasts in Gandhipuram. Network, share ideas, and build the future.", cat: "Community", lat: 11.0183, lon: 76.9725, loc: "Gandhipuram, Coimbatore" },
    { title: "RS Puram Food & Culture Festival", desc: "Experience the vibrant tastes and culture of Coimbatore right in the heart of RS Puram. Live music, stalls, and much more.", cat: "Food", lat: 11.0084, lon: 76.9498, loc: "RS Puram, Coimbatore" },
    { title: "Peelamedu Startup Connect", desc: "Founders and investors converge at Peelamedu. Bring your pitch deck and meet your next co-founder.", cat: "Community", lat: 11.0287, lon: 77.0019, loc: "Peelamedu, Coimbatore" },
    { title: "Saibaba Colony Book Club", desc: "Discussing the latest bestsellers and classic literature. New members always welcome.", cat: "Arts", lat: 11.0267, lon: 76.9442, loc: "Saibaba Colony, Coimbatore" },
    { title: "Singanallur Lake Clean-up", desc: "Join our community initiative to clean up Singanallur lake and restore the local ecosystem. Gloves and bags provided.", cat: "Community", lat: 10.9856, lon: 77.0256, loc: "Singanallur, Coimbatore" },
    { title: "Race Course Fitness Run", desc: "Morning 5k and 10k run around the scenic Race Course. Suitable for all fitness levels.", cat: "Sports", lat: 10.9995, lon: 76.9746, loc: "Race Course, Coimbatore" },
    { title: "Avinashi Road Corporate Networking", desc: "High-level networking for executives and managers working along Avinashi Road. Great for career growth.", cat: "Community", lat: 11.0233, lon: 77.0003, loc: "Avinashi Road, Coimbatore" },
    { title: "Saravanampatti AI/ML Workshop", desc: "Deep dive into neural networks and machine learning models in this intensive 3-hour workshop.", cat: "Education", lat: 11.0797, lon: 76.9989, loc: "Saravanampatti, Coimbatore" },
    { title: "Kalapatti Tech Career Fair", desc: "Looking for your next role in tech? Meet top IT companies hiring in the Kalapatti region.", cat: "Education", lat: 11.0664, lon: 77.0260, loc: "Kalapatti, Coimbatore" },
    { title: "Vadavalli Weekend Market", desc: "Local vendors, fresh produce, and handmade crafts. Support small businesses at the Vadavalli weekend market.", cat: "Yard Sale", lat: 11.0180, lon: 76.9042, loc: "Vadavalli, Coimbatore" },
    { title: "Ukkadam Arts Exhibition", desc: "Showcasing modern and traditional artworks from local artists around Coimbatore.", cat: "Arts", lat: 10.9866, lon: 76.9634, loc: "Ukkadam, Coimbatore" },
    { title: "Ganapathy Music Evening", desc: "A serene evening of classical and contemporary music performances.", cat: "Music", lat: 11.0360, lon: 76.9774, loc: "Ganapathy, Coimbatore" },
    { title: "Kuniyamuthur Coding Bootcamp", desc: "Introduction to React and Next.js for absolute beginners. Bring your laptop!", cat: "Education", lat: 10.9575, lon: 76.9547, loc: "Kuniyamuthur, Coimbatore" },
    { title: "Coimbatore Developer Community Meetup", desc: "The largest gathering of software engineers in the city. Keynotes, lightning talks, and networking.", cat: "Education", lat: 11.0168, lon: 76.9558, loc: "Central Coimbatore" },
    { title: "Codissia Business Expo", desc: "Annual business exposition featuring SMEs and large enterprises at the Codissia Trade Fair Complex.", cat: "Community", lat: 11.0312, lon: 77.0270, loc: "Codissia, Coimbatore" },
    { title: "PSG Tech Alumni Meet", desc: "Reconnect with old friends and professors at the annual alumni gathering.", cat: "Community", lat: 11.0245, lon: 77.0028, loc: "Peelamedu, Coimbatore" },
    { title: "Kovaipudur Sports Festival", desc: "A weekend of cricket, football, and badminton tournaments. Register your team now.", cat: "Sports", lat: 10.9272, lon: 76.9389, loc: "Kovaipudur, Coimbatore" },
    { title: "Thudiyalur Photography Walk", desc: "Capture the essence of the city on this guided photography walk for amateurs and pros.", cat: "Arts", lat: 11.0772, lon: 76.9405, loc: "Thudiyalur, Coimbatore" },
    { title: "Ramanathapuram Yoga Session", desc: "Free morning yoga session to rejuvenate your mind and body.", cat: "Sports", lat: 10.9922, lon: 76.9936, loc: "Ramanathapuram, Coimbatore" },
    { title: "KCT Hackathon 2026", desc: "24-hour coding marathon to solve real-world problems. Prizes worth 1 Lakh!", cat: "Education", lat: 11.0792, lon: 76.9902, loc: "Saravanampatti, Coimbatore" }
];
const trichyEvents = [
    { title: "Thillai Nagar Startup Connect", desc: "Network with local founders and investors in Thillai Nagar.", cat: "Community", lat: 10.8250, lon: 78.6850, loc: "Thillai Nagar, Trichy" },
    { title: "Cantonment Tech Symposium", desc: "A full day of tech talks and workshops.", cat: "Education", lat: 10.8035, lon: 78.6840, loc: "Cantonment, Trichy" },
    { title: "Srirangam Cultural Evening", desc: "Classical dance and music performances in the temple town.", cat: "Music", lat: 10.8624, lon: 78.6974, loc: "Srirangam, Trichy" },
    { title: "Woraiyur Heritage Walk", desc: "Explore the ancient capital of the Cholas with our expert guide.", cat: "Arts", lat: 10.8322, lon: 78.6781, loc: "Woraiyur, Trichy" },
    { title: "KK Nagar Badminton Tournament", desc: "Local doubles and singles badminton championship.", cat: "Sports", lat: 10.7818, lon: 78.6854, loc: "KK Nagar, Trichy" },
    { title: "Tennur Food Festival", desc: "Taste the best street food Trichy has to offer all in one place.", cat: "Food", lat: 10.8160, lon: 78.6830, loc: "Tennur, Trichy" },
    { title: "Anna Nagar Career Fair", desc: "Meet recruiters from top companies looking for fresh talent.", cat: "Education", lat: 10.8273, lon: 78.6946, loc: "Anna Nagar, Trichy" },
    { title: "Rockfort Photography Walk", desc: "A scenic sunrise photography walk around the iconic Rockfort temple.", cat: "Arts", lat: 10.8278, lon: 78.6983, loc: "Rockfort, Trichy" },
    { title: "NIT Trichy Hackathon", desc: "The premier coding competition in the region.", cat: "Education", lat: 10.7634, lon: 78.8163, loc: "NIT, Trichy" },
    { title: "Trichy Entrepreneurship Meetup", desc: "Discussions on funding, scaling, and marketing your startup.", cat: "Community", lat: 10.8050, lon: 78.6850, loc: "Central Trichy" }
];
const chennaiEvents = [
    { title: "T Nagar Shopping Carnival", desc: "Massive weekend sale and cultural events at T Nagar.", cat: "Yard Sale", lat: 13.0392, lon: 80.2335, loc: "T Nagar, Chennai" },
    { title: "Adyar Tech Leaders Summit", desc: "Exclusive invite-only summit for engineering leaders and CTOs.", cat: "Community", lat: 13.0012, lon: 80.2565, loc: "Adyar, Chennai" },
    { title: "Anna Nagar Food Walk", desc: "Explore the vibrant food scene and cafes in Anna Nagar.", cat: "Food", lat: 13.0850, lon: 80.2101, loc: "Anna Nagar, Chennai" },
    { title: "Velachery Gaming Tournament", desc: "E-sports tournament featuring Valorant, CS:GO, and FIFA.", cat: "Sports", lat: 12.9774, lon: 80.2227, loc: "Velachery, Chennai" },
    { title: "Guindy Industrial Expo", desc: "Showcasing the latest manufacturing technologies and innovations.", cat: "Community", lat: 13.0075, lon: 80.2190, loc: "Guindy, Chennai" },
    { title: "OMR Startup Networking Night", desc: "Meet the brilliant minds building the future along the IT corridor.", cat: "Community", lat: 12.9238, lon: 80.2291, loc: "OMR, Chennai" },
    { title: "Sholinganallur AI Meetup", desc: "Deep learning and Generative AI discussion group.", cat: "Education", lat: 12.9010, lon: 80.2279, loc: "Sholinganallur, Chennai" },
    { title: "Nungambakkam Indie Music Fest", desc: "Supporting local indie bands and artists. Live performances all evening.", cat: "Music", lat: 13.0630, lon: 80.2433, loc: "Nungambakkam, Chennai" },
    { title: "Besant Nagar Beach Clean-up", desc: "Help keep our beaches clean. Community service initiative.", cat: "Community", lat: 13.0002, lon: 80.2707, loc: "Besant Nagar, Chennai" },
    { title: "Mylapore Heritage Festival", desc: "Celebrating the rich culture, history, and traditions of Mylapore.", cat: "Arts", lat: 13.0336, lon: 80.2678, loc: "Mylapore, Chennai" }
];
const allEvents = [...cbeEvents, ...trichyEvents, ...chennaiEvents];
const images = [
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
    "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
    "https://images.unsplash.com/photo-1475721025871-c7d0e82c2b3c?w=800&q=80",
    "https://images.unsplash.com/photo-1558008258-3256797b43f3?w=800&q=80",
    "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&q=80"
];
function seed() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        console.log("Starting seed process for 40 events...");
        const { data: users, error: usersErr } = yield supabase.from('profiles').select('id, role').limit(50);
        if (usersErr)
            throw usersErr;
        let adminUserId = (_a = users.find(u => u.role === 'admin')) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminUserId) {
            if (users.length > 0)
                adminUserId = users[0].id;
            else
                throw new Error("No users found in database to act as event creator.");
        }
        const availableUsers = users.map(u => u.id);
        const now = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000;
        let insertedCount = 0;
        for (let i = 0; i < allEvents.length; i++) {
            const e = allEvents[i];
            let status = 'active';
            let eventDate, eventEndDate;
            let capacity = Math.floor(Math.random() * 400) + 20;
            if (i % 10 === 0) {
                status = 'active'; // pending logic not supported by remote DB constraint
                eventDate = new Date(now + ONE_DAY * 14);
                eventEndDate = new Date(now + ONE_DAY * 14 + ONE_DAY * 0.2);
            }
            else if (i % 9 === 0) {
                status = 'expired';
                eventDate = new Date(now - ONE_DAY * 30);
                eventEndDate = new Date(now - ONE_DAY * 29);
            }
            else if (i % 15 === 0) {
                status = 'active';
                eventDate = new Date(now - ONE_DAY * 0.1);
                eventEndDate = new Date(now + ONE_DAY * 0.2);
            }
            else {
                status = 'active';
                const daysAhead = Math.floor(Math.random() * 60) + 2;
                eventDate = new Date(now + ONE_DAY * daysAhead);
                eventEndDate = new Date(now + ONE_DAY * daysAhead + (Math.random() * 4 + 1) * 60 * 60 * 1000);
            }
            const imageUrl = images[i % images.length];
            const { data: event, error: eventErr } = yield supabase.from('events').insert({
                title: e.title,
                description: e.desc,
                category: e.cat,
                location: e.loc,
                latitude: e.lat,
                longitude: e.lon,
                capacity: capacity,
                status: status,
                event_date: eventDate.toISOString(),
                event_end_date: eventEndDate.toISOString(),
                created_by: adminUserId
            }).select().single();
            if (eventErr) {
                console.error(`Failed to insert event ${e.title}:`, eventErr);
                continue;
            }
            insertedCount++;
            if (status === 'active' || status === 'expired') {
                const rsvpCount = Math.min(availableUsers.length, Math.floor(Math.random() * Math.min(capacity, 50)) + 5);
                const rsvpInserts = [];
                const shuffled = [...availableUsers].sort(() => 0.5 - Math.random());
                for (let j = 0; j < rsvpCount; j++) {
                    rsvpInserts.push({
                        event_id: event.id,
                        user_id: shuffled[j],
                        status: 'registered'
                    });
                }
                if (rsvpInserts.length > 0) {
                    yield supabase.from('event_registrations').insert(rsvpInserts);
                }
            }
        }
        console.log(`Successfully inserted ${insertedCount} events.`);
        const { count: cbeCount } = yield supabase.from('events').select('*', { count: 'exact', head: true }).ilike('location', '%Coimbatore%');
        const { count: tryCount } = yield supabase.from('events').select('*', { count: 'exact', head: true }).ilike('location', '%Trichy%');
        const { count: cheCount } = yield supabase.from('events').select('*', { count: 'exact', head: true }).ilike('location', '%Chennai%');
        console.log(`Distribution Check:`);
        console.log(`Coimbatore: ${cbeCount}`);
        console.log(`Trichy: ${tryCount}`);
        console.log(`Chennai: ${cheCount}`);
        const { data: statuses } = yield supabase.from('events').select('status');
        const statusDist = statuses.reduce((acc, row) => {
            acc[row.status] = (acc[row.status] || 0) + 1;
            return acc;
        }, {});
        console.log('Status Distribution:', statusDist);
    });
}
seed().catch(console.error);
