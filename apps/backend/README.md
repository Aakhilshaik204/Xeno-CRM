# XenoCRM Backend Documentation

Welcome to the core API documentation for XenoCRM. This Express.js application is the central nervous system of the platform, orchestrating everything from database atomic transactions and authentication middleware to dual-LLM integrations and background asynchronous dispatching.

---

## 🏗️ Technical Architecture

### Core Stack
- **Runtime:** Node.js (v18+) + Express + TypeScript.
- **Database Connection:** `@supabase/supabase-js`. We use Supabase as a fully managed PostgreSQL database, bypassing an ORM in favor of raw Supabase data API calls for maximum performance.
- **Authentication:** `@clerk/express`. Validates JWTs passed from the frontend.
- **AI Models:** 
  - `@google/genai` (Gemini 1.5 Pro/Flash) for complex reasoning and function calling.
  - `groq-sdk` (Llama 3.1 8B) for ultra-low latency contextual generation.

### 🗺️ Microservice Architecture

```mermaid
graph TD
    Client[React Frontend] -->|REST| API[Express API Router]
    API --> Clerk[Clerk Auth Middleware]
    Clerk --> Controllers{Controllers}
    
    Controllers --> AgentC[Agent Routes]
    Controllers --> AnalyticsC[Analytics Routes]
    Controllers --> CampaignC[Campaign Routes]
    
    AgentC --> Gemini[Gemini 1.5 Service]
    AgentC --> Groq[Groq Llama 3.1 Service]
    
    CampaignC --> DB[(Supabase PostgreSQL)]
    
    subgraph Background Services
        Dispatcher[Campaign Dispatcher Loop]
        Dispatcher -->|Fetch Queued| DB
        Dispatcher -->|Bulk Dispatch| Channel[Channel Service]
    end
    
    Webhook[POST /api/receipts/webhook] --> DB
```

---

## 📂 Deep-Dive Directory Structure

```text
apps/backend/
├── src/
│   ├── routes/                # Express Route Controllers
│   │   ├── agent.ts           # /api/agent - Dual LLM endpoints (Chat & Recommendations)
│   │   ├── analytics.ts       # /api/analytics - Timeseries data aggregation
│   │   ├── audiences.ts       # /api/audiences - Segment logic & preview execution
│   │   ├── campaigns.ts       # /api/campaigns - Campaign CRUD and dispatch trigger
│   │   ├── customers.ts       # /api/customers - Customer profiles and timelines
│   │   ├── dashboard.ts       # /api/dashboard - High-level metrics
│   │   ├── orders.ts          # /api/orders - Transaction management
│   │   └── receipts.ts        # /api/receipts - Public Webhook for channel events
│   ├── services/              # Core Business Logic
│   │   ├── agent.ts           # Gemini tool definitions and execution logic
│   │   ├── dispatcher.ts      # Background simulated job queue for message dispatching
│   │   └── recommendation.ts  # Groq prompt engineering for dynamic UI chips
│   ├── utils/                 # Helpers
│   │   └── db.ts              # Supabase singleton client initialization
│   └── index.ts               # Express server initialization, middleware, and route mounting
```

---

## 🤖 The AI Engines

### 1. The Action Engine (Gemini 1.5)
Located in `src/services/agent.ts`, this engine is given a strict system prompt instructing it to act as an autonomous marketing agent. 

**Function Calling (Tools):**
We define rigid JSON schemas for tools that Gemini can call. For example, `predictCampaignOutcome` accepts a `channel` and a `segmentId`. 
When Gemini calls a tool, the backend interrupts the LLM stream, executes raw PostgreSQL queries via Supabase to fetch historical data, runs a heuristic math algorithm to determine success probabilities, and feeds the mathematical result back into Gemini so it can answer the user accurately.

### 2. The Recommendation Engine (Groq Llama 3.1)
Located in `src/services/recommendation.ts`. To make the UI feel "alive", we need to suggest actions to the user based on their actual data (e.g., suggesting they follow up on a recently sent campaign).
Because this runs every 5 minutes in the background, latency and cost are critical. We use Groq's Llama 3.1 model, feeding it a compressed JSON string of the 5 most recent campaigns and segments. Groq returns exactly 8 highly contextual prompts formatted as JSON, which the frontend renders as "Quick Start" chips.

---

## ⚙️ The Dispatcher & Webhooks (Event-Driven Architecture)

Sending campaigns to 100,000 users cannot happen within an HTTP request lifecycle. 

### The Dispatch Loop (`src/services/dispatcher.ts`)
1. When a user clicks "Dispatch", the API sets the campaign status to `sending` and creates a `Communication` row in the database for every customer in the target segment with `status = 'queued'`.
2. A `setInterval` loop runs every 5 seconds in the background.
3. It queries the DB for up to 50 `queued` communications.
4. It sends a bulk POST request to the `Channel Service` (our simulator).
5. Upon a `200 OK` response, it atomically updates those rows to `sent`.

### Webhook Processing (`src/routes/receipts.ts`)
The Channel Service simulates the real world, firing webhooks back to the backend when a user "opens", "clicks", or "converts".
When `/api/receipts/webhook` receives a payload:
1. It validates the payload structure.
2. It updates the exact timestamp on the `Communication` row (e.g., `openedAt = NOW()`).
3. It performs an atomic increment on the `CampaignStats` table (`opened = opened + 1`) to ensure dashboard queries are O(1) instead of expensive `COUNT()` aggregations.
4. **Attribution:** If the event is a `conversion`, the webhook automatically generates an `Order` attached to the customer, and hard-links the `campaignId` to the order, proving exact Revenue ROI.

---

## 🔒 Security & Middleware

- **Clerk Express Middleware:** `ClerkExpressRequireAuth()` is applied globally to all `/api/*` routes except `/api/receipts/webhook`. It ensures a valid JWT is present in the `Authorization` header.
- **CORS:** Configured to accept requests from the frontend development server (`http://localhost:3000`).

---

## 🚀 Development Setup

1. Configure `.env`:
   ```env
   DATABASE_URL="postgresql://postgres.[YOUR_PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
   DIRECT_URL="postgresql://postgres.[YOUR_PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   GEMINI_API_KEY="AIza..."
   GROQ_API_KEY="gsk_..."
   CLERK_SECRET_KEY="sk_test_..."
   ```
2. Run `npm install`
3. Run `npm run dev` to start the server on port 3001.
