import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch, { FetchError } from 'node-fetch';
import fs from 'fs';
import config from './config.js';
import KilnInterface from './kiln-interface.js';
import SimulatedKilnInterface from './kiln-interface-sim.js';

const kiln = new KilnInterface(config.serialPort, config.baudRate);
const kilnLogger = (req, res, next) => {
    // This is a placeholder for any logging middleware you might want.
    // For now, it just passes control to the next middleware.
    next();
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const isSimulation = process.argv.includes('--simulate');
const portArg = process.argv.find(arg => arg.startsWith('--port='));
const serverPort = portArg ? parseInt(portArg.split('=')[1], 10) : config.serverPort;

let clients = [];
let latestStatus = { state: 'UNKNOWN', timestamp: 0 };

// --- Event-Driven Webhook ---
const postStatusToWebhook = async (status) => {
    if (!config.webhook.url) return;

    try {
        const response = await fetch(config.webhook.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(status),
        });

        if (response.ok) {
            const { pendingCommand } = await response.json();
            if (pendingCommand) {
                console.log('Received command from remote service:', pendingCommand);
                const { command, payload } = pendingCommand;
                switch (command) {
                    case 'start':
                        kilnInterface.start();
                        break;
                    case 'stop':
                        kilnInterface.stop();
                        break;
                    case 'set-temperature':
                        if (payload && typeof payload.temp === 'number') {
                            kilnInterface.setTargetTemperature(payload.temp);
                        }
                        break;
                    default:
                        console.log(`Unknown command received from remote: ${command}`);
                }
            }
        } else {
            console.error(`Webhook failed: ${response.statusText}`);
        }
    } catch (error) {
        if (error instanceof FetchError && error.type === 'invalid-json') {
            // This is expected if there's no command, the remote server sends an empty 200 OK
            // console.log('Webhook response had no command.');
        } else {
            console.error(`Error sending webhook: ${error.message}`);
        }
    }
};

const sendEventsToAll = (data) => {
    latestStatus = { ...data, timestamp: Date.now() };
    // Send to all connected SSE clients
    clients.forEach(client => client.res.write(`data: ${JSON.stringify(latestStatus)}\n\n`));
    // Post status to remote webhook
    postStatusToWebhook(latestStatus);
};

let kilnInterface;

if (isSimulation) {
    console.log('Starting in simulation mode.');
    kilnInterface = new SimulatedKilnInterface();
    kilnInterface.on('status', (status) => {
        sendEventsToAll(status);
    });
} else {
    console.log('Starting in hardware mode.');
    kilnInterface = kiln;
    // In hardware mode, the kiln-interface itself is an event emitter
    kilnInterface.on('status', (status) => {
        sendEventsToAll(status);
    });
}

kilnInterface.connect();

// SSE endpoint
app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);
    console.log(`Client ${clientId} connected`);

    // Send initial status
    res.write(`data: ${JSON.stringify(latestStatus)}\n\n`);

    req.on('close', () => {
        console.log(`Client ${clientId} disconnected`);
        clients = clients.filter(client => client.id !== clientId);
    });
});

// Endpoint for receiving commands
app.post('/api/command', (req, res) => {
    const { command, payload } = req.body;

    if (!command) {
        return res.status(400).send({ message: 'Command not provided.' });
    }

    try {
        switch (command) {
            case 'set-temperature':
                if (typeof payload.temp !== 'number') {
                    return res.status(400).send({ message: 'Invalid temperature payload.' });
                }
                kilnInterface.setTargetTemperature(payload.temp);
                res.status(200).send({ message: `Temperature set to ${payload.temp}` });
                break;
            case 'start':
                kilnInterface.start();
                res.status(200).send({ message: 'Kiln run started.' });
                break;
            case 'stop':
                kilnInterface.stop();
                res.status(200).send({ message: 'Kiln run stopped.' });
                break;
            default:
                res.status(400).send({ message: `Unknown command: ${command}` });
        }
    } catch (error) {
        console.error(`Error executing command '${command}':`, error);
        res.status(500).send({ message: 'An error occurred while executing the command.' });
    }
});

// API endpoints for control
app.get('/api/profiles', async (req, res) => {
    try {
        const configPath = path.join(__dirname, 'config.json');
        const configData = fs.readFileSync(configPath, 'utf8');
        const profiles = JSON.parse(configData).profiles;
        res.json(profiles || []);
    } catch (error) {
        console.error('Error reading profiles from config.json:', error);
        res.status(500).json({ error: 'Could not load profiles' });
    }
});

app.post('/api/start', (req, res) => {
    const { profileId } = req.body;
    console.log(`Start command received for profile ${profileId}`);
    kilnInterface.start(profileId); // Assuming start takes profileId
    res.status(200).send('Start command sent');
});

app.post('/api/stop', (req, res) => {
    console.log('Stop command received');
    kilnInterface.stop();
    res.status(200).send('Stop command sent');
});

// Serve the client application
const clientPath = config.clientPath;
app.use(express.static(clientPath));
app.get('*', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
});

app.listen(serverPort, () => {
    console.log(`Local kiln service running on http://localhost:${serverPort}`);
});
