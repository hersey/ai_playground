# StoryTime - Children's Book Creator

A full-stack platform to create personalized, AI-generated children's books with warm, hand-illustrated style.

## Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database**: SQLite via Prisma 7 + better-sqlite3
- **Auth**: NextAuth.js (email/password + Google OAuth)
- **Payments**: Stripe (subscription billing)
- **AI Story**: Claude Opus (Anthropic) — adaptive thinking
- **AI Illustrations**: DALL-E 3 (OpenAI) — watercolor style
- **Styling**: Tailwind CSS + custom warm palette

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Environment Variables
Copy and configure `.env`:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID="price_..."
NEXT_PUBLIC_STRIPE_FAMILY_PRICE_ID="price_..."

# Optional Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### 3. Database
```bash
npx prisma generate
npx prisma db push
```

### 4. Stripe Setup
1. Create two products in Stripe Dashboard:
   - **Starter Plan**: $9.99/month → copy Price ID to `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID`
   - **Family Plan**: $19.99/month → copy Price ID to `NEXT_PUBLIC_STRIPE_FAMILY_PRICE_ID`
2. Set up webhook for `checkout.session.completed` and `invoice.payment_succeeded`

### 5. Run
```bash
npm run dev
```

## Features

### 🧒 Character Creator
- Multi-step wizard to build child characters
- Customize: name, age, gender, hair, eyes, skin tone
- Add personality traits and hobbies
- Add optional pet
- Reusable across unlimited books

### 📚 Story Creator (Gamified)
- Step-by-step story builder with visual choices
- Choose: character, theme (8 options), setting (8 options), moral (8 options)
- Optional additional story details
- Beautiful loading screen during generation

### ✨ AI Generation
- **Story**: Claude Opus with adaptive thinking for rich, age-appropriate narratives
- **Illustrations**: DALL-E 3 with watercolor/hand-illustrated style prompts
- 10 pages per book with both text and illustration per page

### 📖 Book Reader
- Page-by-page story view with illustrations
- All-pages grid view
- Print-ready output (browser print → PDF)

### 💳 Subscriptions (Stripe)
- Free: 1 character, 1 book
- Starter ($9.99/mo): 3 characters, 5 books
- Family ($19.99/mo): Unlimited everything

## Print Services
The print page (`/books/[id]/print`) generates a print-ready layout. Use:
- **Lulu.com** - Professional quality children's books
- **Blurb.com** - Hardcover photo books
- **Local print shop** - Using PDF export

