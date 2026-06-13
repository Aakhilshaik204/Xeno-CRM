# XenoCRM Backend ⚙️

The core API server and AI orchestration engine for XenoCRM. It handles all database operations, dual-AI execution, background job queuing, and API requests from the frontend.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL) + `@supabase/supabase-js`
- **Primary AI**: Google GenAI (Gemini 1.5) for complex reasoning and function calling.
- **Secondary AI**: Groq (Llama 3.1 8b) for ultra-fast, context-aware dynamic recommendations.
- **Authentication**: `@clerk/clerk-sdk-node`

## 📁 Directory Structure

```text
src/
├── routes/           # Express route controllers (agent, dashboard, campaigns, etc.)
├── services/         # Background workers and business logic (dispatcher)
├── lib/              # Database clients and AI initialization
├── types/            # TypeScript interfaces
└── index.ts          # Express server entry point
```

## ✨ Key Features

1. **Dual-AI Architecture**
   - **Gemini Agent (`routes/agent.ts`)**: Powers the `XenoAI` conversational assistant. It has access to severe backend "tools" (Function Calling) like `createDraftCampaign`, `predictCampaignOutcome`, `searchCustomers`, and `targetCustomers`.
   - **Groq Engine (`routes/agent.ts`)**: Generates rapid, highly-contextual "Action Chips" based on the user's latest campaigns and segments.

2. **Background Dispatcher (`services/dispatcher.ts`)**
   - Safely processes outbound campaign communications in batches of 50.
   - Connects to the external `channel-service` to simulate actual message delivery over the network, decoupling the API layer from heavy dispatch loops.

3. **Webhook Processing (`routes/receipts.ts`)**
   - Receives massive throughput of webhooks from the `channel-service`.
   - Atomically updates granular communication states (sent, delivered, opened, clicked, converted) and aggregates campaign-level stats instantly.
   - Automatically attributes generated revenue back to the campaign if a conversion event fires.

4. **Performance Optimized**
   - Uses ETag generation (`HTTP 304 Not Modified`) on heavy endpoints like `/api/dashboard/stats` to allow rapid UI polling without database strain.

## 🛠️ Setup & Development

### Environment Variables
Create a `.env` file in the root of the `backend` directory:
```env
# Database Connections
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# AI APIs
GEMINI_API_KEY="..."
GROQ_API_KEY="gsk_..."

# Authentication
CLERK_SECRET_KEY="sk_test_..."
```

### Running Locally
```bash
# Install dependencies
npm install

# Start the server with hot-reload (tsx)
npm run dev
```

The backend server runs on `http://localhost:3001`.
