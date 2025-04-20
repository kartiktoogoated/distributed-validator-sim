Distributed Uptime Monitoring with Raft + Gossip + WebSockets
=============================================================

This project is a **decentralized uptime monitoring system** built using:

-   🗳️ **Raft consensus** for log replication and leadership election

-   🧅 **Gossip protocol** to spread status votes among validators

-   🌐 **WebSockets** for real-time updates to clients

-   📦 **Kafka** to stream data for scalability (optional)

-   🗃️ **PostgreSQL + Prisma** for persistent validator logs

-   🐳 **Docker Compose** for multi-node local simulation

* * * * *

🌍 Project Overview
-------------------

-   Users can submit websites to be monitored.

-   Multiple **validators** check the website's availability.

-   Validators **vote** on status (`UP` / `DOWN`) and **gossip** their votes.

-   A **hub** gathers the votes and checks for consensus.

-   The consensus result is sent in real-time over **WebSocket** to connected clients.

-   **Raft** ensures only the current leader proposes final decisions (e.g., writing to Kafka).