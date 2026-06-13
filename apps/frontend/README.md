# XenoCRM Frontend

This is the user-facing web application for XenoCRM, providing a premium "Maison Luxe" interface for managing customers, segments, and campaigns via an autonomous AI agent.

## 🏗️ Architecture & Libraries

- **Framework:** React 18 + Vite + TypeScript
- **Routing:** React Router v6
- **Styling:** Tailwind CSS (v3) + Lucide React for iconography
- **State Management:** React `useState`/`useEffect` + Axios for API communication
- **Authentication:** `@clerk/clerk-react`
- **Charts:** Recharts for responsive, interactive data visualization
- **Animations:** Custom Tailwind keyframes (`animate-fade-in`, `animate-slide-up`, `animate-pulse-slow`)

## 📂 Directory Structure

- `src/components/`: Reusable UI elements.
  - `Layout.tsx`: The main application shell (sidebar, topbar, background).
  - `AIAssistant.tsx`: The globally accessible floating AI chat widget.
  - `XenoLogo.tsx`: The core brand logo component.
- `src/pages/`: Route-level components.
  - `AgentPage.tsx`: The crown jewel of the app. A master-detail execution layout where the user speaks to the Gemini AI to draft campaigns and segments.
  - `Dashboard.tsx`: High-level metrics and health scores.
  - `Campaigns.tsx`, `Audiences.tsx`, `Analytics.tsx`: Specific CRM functional views.
  - `Landing.tsx`: Public-facing marketing page.
- `src/App.tsx`: Route definitions and authentication wrapping.
- `src/main.tsx`: Entry point and Clerk provider setup.

## 🎨 Design System (Maison Luxe OS)

The frontend utilizes a custom "glassmorphic" design system to convey luxury and advanced technology. 
- **Colors:** Deep indigos, slate grays, and a custom primary blue/violet gradient.
- **Glassmorphism:** Heavy use of `bg-surface/50 backdrop-blur-xl border-border` to create frosted glass panels that float over a textured background.
- **Micro-interactions:** Buttons and cards feature `hover:-translate-y-0.5 hover:shadow-md transition-all` for a buttery-smooth, responsive feel.

## 🤖 AI Integrations

The frontend integrates heavily with the backend's AI capabilities:
1. **Agent Page Feed:** Unlike traditional chat, the `AgentPage.tsx` renders structured deliverables (like data grids, charts, and campaign previews) inline within the conversation feed, allowing one-click execution.
2. **Dynamic Recommendations (Groq):** The frontend polls for context-aware suggestions every 5 minutes to guide the user on what to do next.

## 🚀 Getting Started

1. Set up your `.env` file with `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_URL` (usually `http://localhost:3001`).
2. Run `npm install`
3. Run `npm run dev` to start the Vite development server on port 3000.
