# 🗽 NYC Pulse

**Your NYC life companion** — never miss a beat in the city.

A mobile-first PWA that helps you stay on top of NYC's vibrant cultural scene with AI-powered curation, show lottery monitoring, toddler activities, and filmmaking community events.

## Features

### 🎭 Events Feed
- Aggregates events from Eventbrite, NYC.gov, Meetup, NYC Parks, and more
- **AI-powered curation** using Claude claude-opus-4-6 — ranks events by your interests
- Set your interests (Broadway, comedy, art, food, etc.) for personalized feeds
- Weekly AI digest: a witty "This Week in NYC" briefing
- Free, cheap, and premium events clearly marked

### 🎟️ Show Lottery Monitor
- Monitors 8 NYC late night shows including **Jon Stewart, Stephen Colbert, Jimmy Fallon, SNL, John Oliver, Seth Meyers**
- Checks 1iota.com and show websites **every 15 minutes**
- **Instant push notification** the moment a lottery opens
- Step-by-step instructions on how to apply for each show
- Links directly to ticket pages

### 🧒 Little Explorers (Toddler Mode)
- Weekly toddler-friendly events: storytimes, museum family days, park programs
- Curated guide to the best permanent toddler venues in NYC
- Free & affordable events highlighted
- Parent tips for navigating NYC with little ones

### 🎥 Film Scene
- NYC filmmaking events: screenings, meetups, crew calls, volunteer opportunities
- Claude AI filters events to find truly filmmaking-relevant content
- Curated resources: Mandy.com, Staff Me Up, IFP, Rooftop Films, etc.
- Tips for breaking into the NYC indie film industry

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS (mobile-first) |
| State | TanStack Query |
| PWA | vite-plugin-pwa + Service Worker |
| Backend | Node.js + Express + TypeScript |
| AI | Anthropic Claude claude-opus-4-6 (adaptive thinking) |
| Scraping | Axios + Cheerio |
| Scheduling | node-cron |
| Push Notif | web-push (VAPID) |
| Storage | JSON file store (no DB needed) |

## Quick Start

```bash
# 1. Install dependencies
npm run install:all

# 2. Configure backend
cp backend/.env.example backend/.env
# Add your ANTHROPIC_API_KEY to backend/.env

# 3. (Optional) Generate VAPID keys for push notifications
npm run setup

# 4. Start both servers
npm run dev
```

Then open **http://localhost:5173** in your browser.

### Environment Variables

**backend/.env:**
```env
PORT=3001
CORS_ORIGIN=http://localhost:5173
ANTHROPIC_API_KEY=your_key_here  # Required for AI features

# Optional — enables real push notifications
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/events` | Fetch events (supports `interests`, `toddler`, `film`, `category` params) |
| `GET /api/events/digest` | Get AI-generated weekly digest |
| `GET /api/events/toddler` | Toddler-filtered events |
| `GET /api/events/film` | Film/filmmaking events |
| `GET /api/shows` | All monitored shows |
| `GET /api/shows/open` | Shows with open lotteries |
| `POST /api/shows/check` | Trigger manual show check |
| `GET /api/preferences` | Get user preferences |
| `PUT /api/preferences` | Save user preferences |
| `GET /api/notifications/vapid-key` | Get VAPID public key |
| `POST /api/notifications/subscribe` | Save push subscription |

## PWA Installation

On mobile (iOS/Android), open the app in Safari/Chrome and use "Add to Home Screen" to install it as a native-feeling app.

## Adding Real Data Sources

The app is designed to be extended with:
- **Eventbrite API key** — for richer event data
- **Meetup API key** — for authenticated meetup searches
- **NYC Open Data** — already integrated (no key needed)
- **Venue direct RSS feeds** — BAM, Lincoln Center, etc.

## Architecture

```
nyc-pulse/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── claude.ts      # AI curation, digests, film filtering
│   │   │   ├── events.ts      # Multi-source event aggregation
│   │   │   ├── shows.ts       # Show lottery monitoring
│   │   │   ├── notifications.ts # Push notification service
│   │   │   └── scheduler.ts   # Background cron jobs
│   │   └── routes/            # REST API routes
│   └── data/                  # JSON file storage (created on first run)
└── frontend/
    └── src/
        ├── pages/             # EventsPage, ShowsPage, ToddlerPage, FilmPage, SettingsPage
        ├── components/        # EventCard, ShowCard, CategoryFilter, etc.
        ├── hooks/             # usePreferences, useNotifications
        └── services/api.ts    # API client
```
