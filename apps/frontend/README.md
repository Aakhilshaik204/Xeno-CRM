# XenoCRM Frontend 🌐

This is the user-facing web application for XenoCRM. It is a highly interactive, premium CRM dashboard built with modern web technologies, featuring AI-driven tools, real-time campaign tracking, and extensive data visualization.

## 🚀 Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + custom glassmorphic design system
- **Routing**: React Router DOM v6
- **Data Fetching**: Axios
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **Authentication**: Clerk React SDK

## 📁 Directory Structure

```text
src/
├── components/       # Reusable UI components (KPI cards, Modals, Badges)
├── pages/            # Top-level route components (Dashboard, Agent, Campaigns, etc.)
├── lib/              # Utility functions, API clients, and constants
├── types/            # TypeScript interface definitions
├── index.css         # Global Tailwind configuration and custom CSS variables
└── main.tsx          # Application entry point & React Router setup
```

## ✨ Key Features

1. **The XenoAI Agent Page (`/agent`)**
   - The core conversational interface where users can interact with the dual-AI system.
   - Features dynamic "Action Chips" powered by Groq Llama 3.1 that recommend contextual prompts.
   - Renders structured UI components (like the `CampaignPreview`) natively within the chat stream when the AI uses backend tools.

2. **Real-time Campaign Dashboard (`/campaigns/:id`)**
   - Displays live funnel metrics tracking message delivery, opens, clicks, and conversions.
   - Includes a terminal-style "Live Simulation Feed" to watch outgoing message events stream in real-time.

3. **Audience Segmentation (`/audiences`)**
   - A visual query builder allowing users to create dynamic customer segments.
   - Predicts audience sizes instantly using debounced API calls.

4. **Clerk Authentication**
   - Secure login and session management out-of-the-box. Routes are protected and require a valid session to access the CRM data.

## 🛠️ Setup & Development

### Environment Variables
Create a `.env` file in the root of the `frontend` directory:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3001
```

### Running Locally
```bash
# Install dependencies (from monorepo root or frontend dir)
npm install

# Start the Vite development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.
