# XenoCRM Backend Core API

This is the central nervous system of XenoCRM. It handles all database transactions, authentication verification, background dispatching, and AI model orchestration.

## 🏗️ Architecture & Libraries

- **Runtime:** Node.js + Express + TypeScript
- **Database Client:** `@supabase/supabase-js` interacting with PostgreSQL
- **AI Clients:** `@google/genai` (Gemini 1.5) and `groq-sdk` (Llama 3.1)
- **Auth:** `@clerk/express` for protecting routes

## 📂 Core Modules

### 1. The Agent Service (`src/services/agent.ts`)
This is the most complex service in the application. It initializes the Gemini model and provides it with a strict set of **Tools** (Function Calling). 
When the user sends a prompt, Gemini can decide to:
- Call `getSegments` or `createSegment`
- Call `predictCampaignOutcome` to run a heuristic math algorithm estimating open/click rates.
- Call `createDraftCampaign` to save a draft to the database and format a structured response for the frontend UI.
- Read analytics via `revenueReport`.

### 2. The Recommendation Engine (`src/services/recommendation.ts`)
A separate, ultra-fast pipeline using Groq and Llama 3.1. It reads the recent state of the database (latest campaigns, segments) and generates 8 context-aware suggestions formatted as JSON.

### 3. The Dispatcher (`src/services/dispatcher.ts`)
A background loop that simulates an asynchronous job queue. 
- It scans the `communications` table for `status = 'queued'`.
- It groups them into batches and sends POST requests to the `channel-service`.
- Upon successful transmission, it marks them as `sent`.

### 4. Webhook Receiver (`src/routes/receipts.ts`)
Listens for simulated real-world events (delivered, opened, clicked, converted) from the `channel-service`. 
When a conversion event is received, this route automatically generates a new `Order` in the database and attributes the revenue to the corresponding campaign.

## 🗄️ Database Schema

The backend directly manipulates a rich relational schema:
- `customers` (demographics, LTV)
- `orders` (purchases, attributed to campaigns)
- `segments` (dynamic audience filters saved as JSON logic)
- `campaigns` (marketing blasts)
- `communications` (granular, per-customer message tracking)
- `campaign_stats` / `segment_stats` (denormalized rollups for fast querying)

## 🚀 Getting Started

1. Create a `.env` file with your `DATABASE_URL`, `DIRECT_URL`, `GEMINI_API_KEY`, `GROQ_API_KEY`, and `CLERK_SECRET_KEY`.
2. Run `npm install`
3. Run `npm run dev` to start the server on port 3001.
