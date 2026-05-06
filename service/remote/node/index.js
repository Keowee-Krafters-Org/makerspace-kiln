import express from 'express';
import path from 'path';
import config from './config.js';

const app = express();

let latestStatus = { state: 'UNKNOWN', timestamp: 0 };
let pendingCommand = null;
let clients = [];

// Middleware
app.use(express.json());

// --- API Endpoints ---

// Webhook endpoint for receiving status from the local kiln service
app.post('/api/webhook', (req, res) => {
    latestStatus = req.body;
    console.log('Received status update:', latestStatus);
    
    // Send to all connected SSE clients
    clients.forEach(client => client.res.write(`data: ${JSON.stringify(latestStatus)}\n\n`));

    // Respond with any pending command
    res.json({ pendingCommand: pendingCommand || null });

    // Clear the command after sending it
    if (pendingCommand) {
        pendingCommand = null; 
    }
});

app.post('/api/command', (req, res) => {
    pendingCommand = req.body;
    console.log('Received command:', pendingCommand);
    res.status(200).send('Command queued');
});

app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = {
        id: clientId,
        res
    };
    clients.push(newClient);
    console.log(`Client ${clientId} connected for events`);

    // Send initial status
    res.write(`data: ${JSON.stringify(latestStatus)}\n\n`);

    req.on('close', () => {
        console.log(`Client ${clientId} disconnected`);
        clients = clients.filter(client => client.id !== clientId);
    });
});

app.get('/api/status', (req, res) => {
    res.json(latestStatus);
});

// --- Client Serving ---

// Serve the static files from the client build directory
app.use(express.static(config.clientPath));

// Catch-all to serve the index.html for any other request (enables client-side routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(config.clientPath, 'index.html'));
});

// --- Start Server ---

app.listen(config.port, () => {
    console.log(`Kiln remote service listening on port ${config.port}`);
});
