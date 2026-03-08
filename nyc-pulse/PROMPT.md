# NYC Pulse — Original Project Brief

> Captured from the initial conversation prompt.

---

## Vision

Build a **mobile-first site (or app)** to stay on top of **New York's vibrant life** — designed for a busy parent who needs everything in one place, constantly updated, so they never miss a beat.

---

## Feature Requests

### 1. 🎟️ Late Night Show Lottery Monitor
- Monitor live shows that require lottery tickets, e.g.:
  - Late Night with **John Oliver**
  - **Jon Stewart** (The Daily Show)
  - **Stephen Colbert** (The Late Show)
- Send **notifications when the lottery opens**
- Help **discover** these shows too

### 2. 🗓️ NYC Events Discovery
- Show what events are happening **in New York this week**
- Pull from **broader sources than Timeout** so nothing cultural gets missed
- Support **keyword/interest entry** to personalize the feed, e.g.:
  - Broadway
  - Comedy
  - Theater
  - Restaurants
  - Art gallery openings
  - And more

### 3. 🧒 Toddler Activities
- Help **discover toddler-related activities and venues**

### 4. 🎥 Filmmaking Community
- Find **filmmaking-related community events** such as:
  - Screenings
  - Meetups
  - Opportunities to **volunteer on set**
  - Ways to **break into the industry**

---

## Design & UX Requirements

- **Mobile-friendly** (or native mobile app if easier)
- **Super intuitive** — easy to use for a busy parent
- **Constantly self-updating** — no manual refresh needed to stay current
- Fast, clean, zero friction

---

## What Was Built

**NYC Pulse** — a full-stack PWA at `nyc-pulse/`

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| PWA | vite-plugin-pwa + Service Worker |
| Backend | Node.js + Express + TypeScript |
| AI | Anthropic Claude claude-opus-4-6 (adaptive thinking) |
| Scheduling | node-cron (15-min show monitoring) |
| Notifications | Web Push API (VAPID) |
| Scraping | Axios + Cheerio |
| Storage | JSON file store (zero-config) |

### Quick Start
```bash
cd nyc-pulse
cp backend/.env.example backend/.env
# Add ANTHROPIC_API_KEY to backend/.env

npm install --prefix backend && npm install --prefix frontend
npm run dev
# Frontend → http://localhost:5173
# Backend  → http://localhost:3001
```
