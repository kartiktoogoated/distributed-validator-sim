import express from 'express'
import cors from 'cors'
import http from 'http'
import { WebSocketServer } from 'ws'
import dotenv from 'dotenv'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

import { info, error as logError } from '../../../../utils/logger'
import authRouter from './auth'
import websiteRouter from './website'
import createSimulationRouter from './simulation'
import createStatusRouter from './status'
import { initProducer } from '../../../services/producer'
import { Validator } from '../../../core/Validator'
import { RaftNode } from '../../../core/raft'
import { initRaftRouter } from './raftServer'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 3000

// — Security & JSON parsing —
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later',
  })
)

// — Your existing “normal” routes —
app.use('/api/auth', authRouter)
app.use('/api', websiteRouter)

// — Create HTTP+WS servers —
const server = http.createServer(app)
const wss = new WebSocketServer({ server })

wss.on('connection', (ws) => {
  info('New WebSocket client connected')
  ws.on('message', (msg: string) => {
    info(`WS message: ${msg}`)
    ws.send(`Echo: ${msg}`)
  })
  ws.on('error', (err) => logError(`WebSocket error: ${err}`))
})

// — Build & mount RaftNode —
// parse your ID & peer list from env
const validatorId = Number(process.env.VALIDATOR_ID) || 1
const peerList = (process.env.PEERS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const raft = new RaftNode(
  validatorId,
  peerList,
  (committedEntry) => {
    // on commit, broadcast over WS
    const msg = JSON.stringify({ type: 'raft-commit', data: committedEntry })
    wss.clients.forEach((c) => {
      if (c.readyState === c.OPEN) c.send(msg)
    })
  }
)

app.use('/api/raft', initRaftRouter(raft))

// — Initialize Kafka producer (unchanged) —
initProducer().catch((err) => logError(`Kafka init failed: ${err}`))

// — Simulation & Status endpoints (unchanged) —
app.use('/api/simulate', createSimulationRouter(wss))
app.use('/api', createStatusRouter(wss))

// — Start listening —
server.listen(PORT, () => {
  info(`Server is listening on port ${PORT}`)
})
