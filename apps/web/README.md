# Web Dashboard (Client)

A modern React dashboard for the Distributed Validator Platform.

## Features
- Live consensus status via WebSocket
- Uptime, latency, and validator analytics
- Add/manage monitored websites
- Responsive, dark-mode UI (Vite + Tailwind)

## Setup
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Copy `.env.example` to `.env` and configure:
   ```ini
   VITE_AGGREGATOR_WS_URL=ws://localhost:3000/api/ws
   # ...other Vite/React envs
   ```
3. Start the dev server:
   ```bash
   pnpm dev
   ```
4. Open [http://localhost:5173/client-dashboard](http://localhost:5173/client-dashboard)

## Environment Variables
- `VITE_AGGREGATOR_WS_URL` — WebSocket endpoint for live consensus
- See `.env.example` for all options

## Connecting to Consensus WebSocket
The dashboard listens for live consensus updates:
```js
const ws = new WebSocket(import.meta.env.VITE_AGGREGATOR_WS_URL);
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // { url, consensus, votes, timestamp }
};
```

## License
MIT © Kartik Tomar
