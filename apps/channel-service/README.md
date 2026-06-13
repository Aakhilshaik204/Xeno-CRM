# XenoCRM Channel Service 📡

An independent microservice simulating an omnichannel dispatching system (Email, SMS, WhatsApp, RCS). It isolates the simulated delivery logic from the core backend.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript

## ✨ Key Responsibilities

1. **Batch Dispatching (`/api/dispatch`)**
   - Accepts large payloads of communications from the core XenoCRM backend.
   - Returns a `200 OK` immediately to free up the backend dispatcher.

2. **Realistic Funnel Simulation**
   - Asynchronously creates delays and network latency to simulate real-world message delivery pipelines.
   - Generates sequential webhook events: `sent` ➔ `delivered` ➔ `opened` ➔ `clicked` ➔ `converted`.
   - Injects realistic failure rates (e.g., bounced emails, dead numbers).
   - Simulates revenue generated from `converted` events using weighted random algorithms.

3. **Webhook Callbacks**
   - Once simulated events occur in memory, the service fires HTTP POST requests back to the core backend (`/api/receipts/webhook`) containing the timestamp, status, and metadata.

## 🛠️ Setup & Development

### Environment Variables
*(Optional if running on default ports)*
Create a `.env` file in the `channel-service` directory:
```env
PORT=3002
BACKEND_WEBHOOK_URL="http://localhost:3001/api/receipts/webhook"
```

### Running Locally
```bash
# Install dependencies
npm install

# Start the simulator service
npm run dev
```

The channel service runs on `http://localhost:3002`.
