# Distributed Validator Uptime Monitoring

A highly resilient, distributed uptime monitoring system using decentralized validators, gossip-based voting, Raft consensus, and real-time notifications.

## Features

- **Distributed Validators**: Multiple validator instances ping target websites from different regions.
- **DNS Caching**: In-process DNS cache to speed up host resolution.
- **Gossip Protocol**: Validators share ping results with peers for quorum voting.
- **Hub Consensus**: Centralized vote-aggregator that determines UP/DOWN based on quorum threshold.
- **Raft Consensus**: Strongly-consistent log replication and leader election for durable, fault-tolerant storage of consensus decisions.
- **WebSocket API**: Real-time broadcast of ping results and consensus to frontend clients.
- **REST API**: CRUD operations for users and monitored websites, status checks, history, and summaries.
- **Kafka Integration**: Publish health checks and alerts to Kafka topics, consumed by alert service.
- **Alert Service**: Sends email and WebSocket notifications for region-specific DOWN events.
- **Prisma ORM**: PostgreSQL-backed persistence for validators, logs, and metadata.

## Architecture Overview

```
+-------------------+        +----------------+        +--------------+
|   Validator Node  | <----> |   Gossip Hub   | <----> | Other Nodes  |
|  (ping + DNS)    |        | (vote tally)   |        |              |
+---------+---------+        +--------+-------+        +------+-------+
          |                            |                      |
          v                            v                      v
+------------------------------------+                    [Kafka]
|      Raft Cluster (Leader)         |                       |
|  - Leader Election                 |                       v
|  - AppendEntries / Log Replication |              +------------------+
+------------------------------------+              | Alert Service    |
          |                                         | - Email Alerts   |
          v                                         | - WS Broadcast   |
+----------------------+                            +------------------+
| WebSocket Server     |
| REST API Endpoints   |
+----------+-----------+
           |
           v
       Frontend

```

## Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/your-org/distributed-validator.git
   cd distributed-validator
   ```
2. Install dependencies (uses pnpm):
   ```bash
   pnpm install
   ```
3. Build & run:
   ```bash
   pnpm build
   pnpm start
   ```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```ini
# Server
PORT=3000
DEFAULT_TARGET_URL=https://example.com

# Validators
VALIDATOR_ID=0
PEERS=localhost:3000,localhost:3001
LOCATION=us-east-1
PING_INTERVAL_MS=60000
GOSSIP_ROUNDS=1

# Kafka
KAFKA_BROKER=broker1:9092,broker2:9092
VALIDATOR_STATUS_TOPIC=validator-status
HEALTH_LOGS_TOPIC=health-logs
HEALTH_ALERTS_TOPIC=health-alerts

# SMTP (Alert Service)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=alert@example.com
SMTP_PASS=yourpassword
MAIL_FROM="Alert Service <alert@example.com>"

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/validator_db
```

## API Endpoints

### Authentication

- `POST /api/auth/signup`  – Create user
- `POST /api/auth/login`   – Login & receive token

### Websites

- `POST /api/websites`     – Add new site (authenticated)
- `GET /api/websites`      – List user sites
- `PUT /api/websites/:id`  – Update site URL
- `DELETE /api/websites/:id` – Remove site
- `PUT /api/websites/:id/pause`   – Pause/resume monitoring
- `GET /api/websites/:id/history` – Fetch ping history
- `GET /api/websites/:id/summary` – Uptime summary

### Simulation & Status

- `POST /api/simulate/gossip` – Receive gossip payloads
- `GET /api/simulate?url=`    – Start/poll simulation loop
- `GET /api/status?url=`      – Single ping status check

### Raft

- `POST /api/raft/request-vote`   – Raft RequestVote RPC
- `POST /api/raft/append-entries` – Raft AppendEntries RPC

### Logs & Alerts

- `GET /api/logs`            – Stream or query logs
- WebSocket: connect to `ws://localhost:3000` for real-time events

## Frontend Integration

Listen on WebSocket for messages:

```js
ws.onmessage = evt => {
  const msg = JSON.parse(evt.data);
  switch(msg.type) {
    case 'REGION_DOWN':
      // show region down alert msg.data
      break;
    case 'raft-commit':
      // update committed commands
      break;
    default:
      // consensus update: msg.url, msg.consensus, msg.timeStamp
  }
};
```

## Contributing

1. Fork and create feature branch
2. Write tests and adhere to code style
3. Submit a PR with clear description

## License

MIT © Kartik Tomar

