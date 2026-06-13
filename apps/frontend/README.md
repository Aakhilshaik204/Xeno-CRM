# XenoCRM Frontend Documentation

Welcome to the comprehensive frontend documentation for XenoCRM. This package contains the entire user-facing web application, providing a premium, "Maison Luxe OS" interface for managing customers, segments, and AI-driven campaigns.

---

## 🏗️ Technical Architecture

### Core Stack
- **Framework:** React 18 + Vite + TypeScript. Provides instant HMR (Hot Module Replacement) and strict type safety across all components.
- **Routing:** React Router v6. Utilizes nested routes (`<Outlet />`) for the authenticated dashboard shell.
- **Styling:** Tailwind CSS (v3). Extensively customized with luxury-tier glassmorphism utilities and micro-animations.
- **Icons:** Lucide React for consistent, scalable vector iconography.
- **State & Data Fetching:** React `useState`/`useEffect` paired with Axios for asynchronous REST API calls.
- **Authentication:** `@clerk/clerk-react`. Clerk components (`<SignedIn>`, `<SignedOut>`, `<UserButton>`) handle session management seamlessly.
- **Data Visualization:** Recharts is used for dynamic, interactive KPI graphs, campaign reach charts, and AI prediction analytics.

---

## 📂 Deep-Dive Directory Structure

```text
apps/frontend/
├── src/
│   ├── components/
│   │   ├── AIAssistant.tsx    # Global floating widget for instant AI chats. Persistent across routes.
│   │   ├── ErrorBoundary.tsx  # Catches React render errors to prevent white-screens.
│   │   ├── Layout.tsx         # The main authenticated shell. Houses the collapsible sidebar and topbar.
│   │   └── XenoLogo.tsx       # Core brand asset.
│   ├── pages/
│   │   ├── AgentPage.tsx      # The crown jewel. Master-detail layout for AI-driven execution.
│   │   ├── Analytics.tsx      # High-level time-series charting.
│   │   ├── Audiences.tsx      # List view of customer segments.
│   │   ├── CampaignDetail.tsx # Granular funnel view for a specific campaign.
│   │   ├── Campaigns.tsx      # List of all campaigns (draft, sending, sent).
│   │   ├── ChurnAlertsPage.tsx# AI-flagged at-risk customers.
│   │   ├── CreateCampaign.tsx # Manual campaign creation wizard.
│   │   ├── CreateSegment.tsx  # Visual audience builder (converts UI rules to JSON filters).
│   │   ├── CustomerProfile.tsx# 360-degree view of a single customer's history.
│   │   ├── Dashboard.tsx      # Landing view post-login. High-level health scores.
│   │   ├── Landing.tsx        # Public marketing page.
│   │   ├── SegmentDetail.tsx  # Audience breakdown and statistics.
│   │   └── SettingsPage.tsx   # Static company profile information.
│   ├── App.tsx                # Central route definitions and Clerk wrapper.
│   ├── index.css              # Global Tailwind imports and custom `@layer` utilities.
│   └── main.tsx               # React DOM entry point and ClerkProvider initialization.
```

---

## 🎨 Design System: Maison Luxe OS

The frontend utilizes a custom design system built directly into `tailwind.config.js` and `index.css` to convey luxury, trust, and advanced technology.

### Glassmorphism & Depth
Rather than flat colors, XenoCRM uses depth. 
- **Surfaces:** Components use `bg-surface/70 backdrop-blur-xl border border-border` to create frosted glass panels that float over the main textured application background (`bg-[url(...)]`).
- **Hover States:** Interactive elements lift and cast light: `hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300`.

### Typography & Spacing
- Small uppercase headers utilize wide tracking (`tracking-[0.2em]`) for an editorial, high-end look.
- Gradients (`bg-gradient-to-r from-primary to-violet-500`) are used sparingly on primary action buttons (like "Run Agent") to draw the eye.

---

## 🤖 The Agent Page (`AgentPage.tsx`) Architecture

The `AgentPage.tsx` is an entirely custom execution environment that breaks away from traditional "chatbot" interfaces.

### 1. Dual-Pane Layout
- **Left Sidebar:** Static context. Displays the AI's capabilities and Groq-powered "Quick Start" recommendations.
- **Main Feed:** A vertical, infinite-scroll feed where the conversation happens inline.

### 2. Structured Deliverables
When the user asks Gemini to draft a campaign, Gemini responds with a JSON string indicating a `structured` type (e.g., `draft`).
The `AgentPage` parses this JSON and dynamically replaces the text bubble with a massive, interactive React Component. This component includes:
- Live, animated Recharts progress bars predicting Open Rates, Clicks, and Revenue.
- A "Dispatch Campaign" button that immediately fires an API call to send the drafted campaign, entirely bypassing the manual UI.

---

## 🔐 Authentication Flow

1. User arrives at `/` (`Landing.tsx`). Clerk's `<SignedOut>` component renders the marketing page.
2. User clicks "Sign In", triggering the Clerk OAuth modal.
3. Upon success, Clerk's `<SignedIn>` component redirects the user to `/dashboard`.
4. All routes inside the `<Layout>` are protected. `Layout.tsx` calls `useUser()` from Clerk to display the user's name and avatar in the topbar.

---

## 🚀 Development Setup

1. Copy `.env.example` to `.env`.
2. Ensure you have your `VITE_CLERK_PUBLISHABLE_KEY` from your Clerk dashboard.
3. Ensure `VITE_API_URL` points to your local backend (e.g., `http://localhost:3001`).
4. Install dependencies: `npm install`
5. Start Vite: `npm run dev` (Runs on `http://localhost:3000`).
