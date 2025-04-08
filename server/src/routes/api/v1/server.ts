import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { info, error as logError } from '../../../../utils/logger';
import { Router, Request, Response, NextFunction } from 'express';
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const serverRouter = Router();

/**
 * GET /simulate
 * Simulates a process (dummy implementation) and returns a consensus result.
 * This route handler is asynchronous and returns Promise<void>.
 */
serverRouter.get('/simulate', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Simulate some async operation
        const consensus = await new Promise<string>((resolve) => 
        setTimeout(() => resolve('UP'), 1000)
    );

    // Return the result as JSON
    res.json({ success: true, consensus});
    } catch(err) {
        logError(`Error in /simulate endpoint: ${err}`);
        res.status(500).json({ error: 'Simulation failed'});
    }
});

// Mount the router on the '/api' path
app.use('/api', serverRouter);

// Create an HTTP server from express
const server = http.createServer(app);

// Create a WS 
const wss = new WebSocketServer({ server });

// Listen for WebSocket connections
wss.on('connection', (ws) => {
    info('New WebSocket client connected');

    // Listen for messages from clients
    ws.on('message', (message: string) => {
        info(`Received WS message: ${message}`);
        // Echo the received message back to the client 
        ws.send(`Echo ${message}`);
    });

    ws.on('error', (err) => {
        logError(`WebSocket error: ${err}`)
    });
});

// Start the HTTP server and attach the WS to it
server.listen(PORT, () => {
    info(`Server is listening to port ${PORT}`);
});