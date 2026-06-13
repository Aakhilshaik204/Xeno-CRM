# XenoCRM Channel Service Simulator

The Channel Service is an independent microservice designed to simulate the asynchronous, real-world behavior of external communication providers (like SendGrid, Twilio, or Meta API).

## 🎯 Purpose

In a real CRM, when you send 10,000 emails, they don't immediately reach the customer. They go into a queue, get delivered over hours, and users slowly open, click, and purchase over the following days.

This service perfectly simulates that lifecycle so that XenoCRM's analytics dashboards and funnel tracking work realistically during demonstrations.

## 🏗️ How it Works

1. **Acceptance:** The main backend POSTs an array of messages to `/api/send`. The Channel Service immediately returns `200 OK` (simulating successful ingestion).
2. **Lifecycle Simulation:** For each message, the service spins up asynchronous timeouts to simulate delays:
   - **Delivery:** Simulated latency between 1 to 5 seconds.
   - **Opens:** If a message "opens" (based on random probability weighted by channel type), it fires an open event 5 to 15 seconds later.
   - **Clicks:** If opened, it might "click" 10 to 30 seconds later.
   - **Conversions:** If clicked, the customer might "buy" 20 to 60 seconds later.
3. **Webhook Dispatch:** When an event occurs, the Channel Service fires a POST request back to the main backend's webhook URL (`http://localhost:3001/api/receipts/webhook`), including the `communicationId` and `event` type.

## 📊 Channel Characteristics

The service simulates different behaviors for different channels:
- **Email:** Average delivery, decent open rate, standard click rate.
- **SMS:** Extremely fast delivery, very high open rate, lower click rate.
- **WhatsApp:** Fast delivery, high open rate, high conversion rate.
- **RCS:** Rich media results in high engagement and the highest conversion rate.

## 🚀 Getting Started

1. No specific environment variables are strictly required, though you can adjust the target webhook URL if necessary.
2. Run `npm install`
3. Run `npm run dev` to start the simulation server on port 3002.
