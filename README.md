# Distributed Validator Platform

A resilient, decentralized uptime monitoring and consensus system using distributed validators, gossip, Raft, Kafka, and real-time alerting.

## Features
- Distributed validators ping websites from multiple regions
- Gossip protocol for vote sharing and quorum
- Aggregator node for consensus and alerting
- Raft-based log replication for durability
- Real-time WebSocket and REST APIs
- Kafka integration for event streaming
- Email alerts for downtime
- PostgreSQL persistence via Prisma ORM
- Modern React dashboard (Vite, Tailwind)

## Architecture
```
[Validator Nodes] <-> [Gossip] <-> [Aggregator (Raft Leader)] <-> [Kafka/DB/Alerts]
      |                                                        |
      +-------------------[WebSocket/API]----------------------+
```

## Monorepo Structure
- `apps/server`   — Node.js backend (validators, aggregator, API)
- `apps/web`      — React client dashboard
- `apps/docs`     — Documentation site
- `monitoring/`   — Prometheus/Grafana configs
- `packages/`     — Shared code, configs, and types

## Quick Start
1. **Clone & Install**
   ```bash
   git clone ...
   cd distributed-validator
   pnpm install
   ```
2. **Copy and configure env files**
   - See `.env.example` in each app (server, web, etc.)
   - Example for aggregator:
     ```ini
     IS_AGGREGATOR=true
     PORT=3000
     VALIDATOR_IDS=1,2
     KAFKA_BROKER_LIST=kafka:9092
     ...
     ```
3. **Run with Docker Compose**
   ```bash
   docker-compose up --build
   ```
4. **Access the dashboard**
   - http://localhost:5173/client-dashboard

## Environment Variables
- Each service has its own `.env.example` (see `apps/server`, `apps/web`)
- Common variables:
  - `PORT` — Service port
  - `DATABASE_URL` — PostgreSQL connection string
  - `KAFKA_BROKER_LIST` — Kafka brokers
  - `IS_AGGREGATOR` — Set to `true` for aggregator node
  - `VALIDATOR_ID` — Unique ID for each validator
  - `PEERS` — Comma-separated peer addresses
  - `LOCATION` — Validator location label
  - `PING_INTERVAL_MS` — Ping interval in ms
  - `SMTP_*` — Email alert config
  - See each `.env.example` for full details

## API Overview
- **REST:** `/api/*` for CRUD, logs, status, simulation
- **WebSocket:** `/api/ws` for live consensus updates
- **Kafka:** Internal event streaming

## Contributing
- Fork, branch, and PR with clear description
- Add/modify `.env.example` for any new config
- See `CONTRIBUTING.md` for style and test guidelines

## License
MIT © Kartik Tomar

