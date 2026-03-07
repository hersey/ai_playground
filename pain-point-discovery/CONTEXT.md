# Pain Point Discovery System — Project Context

> Living document. Update this as strategy evolves.

---

## The Mission

Build a deep research system that surfaces **highly validated, specific pain points** in niche audiences — so that each discovered problem becomes a candidate for a bootstrapped product that generates revenue within 2–3 months.

**Not** a broad firehose of trends. A focused, rigorous research process that produces conviction.

---

## Core Principles

### 1. Depth Over Volume
- We are not building a dashboard of 500 weak signals
- Each pain point we surface should be backed by **robust, multi-source validation**
- Criteria for a "validated" pain point:
  - [ ] Multiple independent sources confirm the same frustration
  - [ ] Evidence of people already spending money (or time) on workarounds
  - [ ] Emotional intensity in language (not just inconvenience — real pain)
  - [ ] No dominant solution exists, or existing solutions are widely disliked
  - [ ] Business model is legible (SaaS, marketplace, productized service, info product)

### 2. Non-Tech Mass Audience
- Target people who are **slow AI adopters** — their pre-AI problems still persist
- Avoid the tech industry / developer / AI-native space (already crowded)
- Look for verticals where AI hasn't penetrated yet, or where adoption is confusing/inaccessible
- The opportunity: tech-enabled solutions for non-tech people who don't know the solution exists yet

### 3. The AI Angle — Two Lenses
- **Persistent problems** AI hasn't solved for non-tech users (they don't know it could)
- **New problems created by AI** — overwhelm, trust, misinformation, job anxiety, tool fatigue, identity questions

---

## Target Niches (Deep Dive One at a Time)

Priority order TBD — these are industries to explore sequentially:

| Niche | Notes |
|---|---|
| Filmmakers / Screenwriters | Already have `screenwriter-library` project in repo — natural starting point |
| Travel | Mass audience, high spend, lots of friction |
| Education | Parents + students + teachers, AI disruption anxiety |
| Climate Tech | Emerging, less crowded, mission-aligned |
| Parenting | Emotionally intense problems, high willingness to pay |
| Mental Health | Stigma fading, demand exploding, underserved non-tech users |
| Product Management | Adjacent to tech but non-developer, lots of process pain |
| Data Analytics | Business users who aren't engineers, tons of tool friction |

---

## Research Sources

### Public Forums & Communities
- Reddit (subreddits per niche — e.g. r/Screenwriting, r/travel, r/Parenting)
- Facebook Groups (public, niche communities)
- Quora (question patterns reveal gaps)
- Discord servers (public invite links)
- Niche forums (e.g. Stage 32 for filmmakers, The Dyrt for travel)

### Long-Form & Editorial
- Substack newsletters (reader comments are gold)
- Personal blog posts (search: "I wish there was a tool for..." / "why is X so hard")
- Lenny's Newsletter community, Indie Hackers, Product Hunt discussions
- Medium posts with high engagement in niche topics

### Product Feedback
- App Store / Google Play 1–3 star reviews
- G2, Capterra, Trustpilot (negative reviews = unmet needs)
- Product Hunt "upcoming" and launch comments

### Social Media
- Twitter/X threads (frustration language, "hot takes" about broken tools)
- TikTok & YouTube comments (non-tech audiences live here)
- LinkedIn (for professional/enterprise niches)

### Industry Reports (Free Tiers)
- Gartner, CB Insights, McKinsey (free summaries)
- Statista
- Google Trends (directional signal)
- Exploding Topics

### APIs Available (to be confirmed)
- Reddit API — *owner to provide credentials*
- Substack — scraping or RSS
- Twitter/X — *owner to confirm access tier*
- Others — add here as confirmed

---

## Pain Point Scorecard

Each discovered pain point gets scored against these dimensions:

| Dimension | Question | Score (1–5) |
|---|---|---|
| Frequency | How many people mention this? | |
| Intensity | How emotional / urgent is the language? | |
| Recency | Is this a growing or fading problem? | |
| Solution gap | How bad are existing solutions? | |
| Willingness to pay | Are people already spending on workarounds? | |
| Build feasibility | Can an MVP ship in 4–6 weeks? | |
| Audience accessibility | Can we reach this audience affordably? | |
| AI leverage | Can AI meaningfully improve the solution? | |

**Threshold to pursue**: avg score ≥ 3.5, no dimension below 2.

---

## Output Format Per Pain Point

Each validated pain point produces a one-page brief:

```
## Pain Point Brief: [Title]

**Niche**: [e.g. Screenwriters]
**Audience**: [Who exactly]
**The Problem**: [1–2 sentences, in the user's own words where possible]
**Evidence**: [Source links + quotes]
**Existing Solutions & Why They Fail**:
**Proposed MVP**:
**Monetization Model**:
**Scorecard**: [filled table]
**Verdict**: Pursue / Watch / Pass
```

---

## What We're Building

### Phase 1 — Manual-Assisted Research Tool (current phase)
A Python script that:
- Accepts a niche as input
- Queries configured sources (Reddit API, web scraping)
- Uses Claude API to cluster themes and score pain points
- Outputs a structured markdown brief per pain point

### Phase 2 — Ongoing Discovery Loop
- Scheduled runs per niche
- Pain point database (tracks new vs. recurring signals)
- Trend detection (is this problem getting louder?)

### Phase 3 — Agent Loop (future)
- Autonomous multi-source research agent
- Generates full pain point briefs without manual prompting
- Feeds into a lightweight dashboard

---

## Open Questions

- [ ] Which niche do we start with? (Leaning toward Filmmakers/Screenwriters given existing work)
- [ ] Twitter/X API access — confirm tier and cost
- [ ] Reddit API credentials — owner to provide
- [ ] Any Substack newsletters to prioritize?
- [ ] Do we want a simple web UI from the start, or CLI output first?

---

## Log

| Date | Update |
|---|---|
| 2026-03-07 | Initial context document created |
