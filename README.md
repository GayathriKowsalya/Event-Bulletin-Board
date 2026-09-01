# EventHub – Event Bulletin Board

EventHub is a full-stack event discovery and management application.

Users can:
- Create events
- Discover upcoming and nearby events
- Search and filter events
- RSVP / register for events
- Ask and answer event questions
- View event locations on maps
- Manage their profiles
- Share events
- Get AI-powered event recommendations

Admins can:
- Review submitted events
- Approve or reject events
- Manage users
- View registrations
- Manage events

---

# Project Structure

```text
Event-Bulletin-Board/
│
├── backend/
│   ├── src/
│   ├── supabase/
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── Dockerfile
│   ├── cloudbuild.yaml
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md