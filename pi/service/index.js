import config from './config.js';
import kilnDatabase from './db.js';
import KilnInterface from './kiln-interface.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Initializing Kiln Controller Service...');
console.log(`Environment: ${config.isProduction ? 'Production' : 'Development'}`);
console.log(`Serving Client from: ${config.clientPath}`);

const kiln = new KilnInterface(config.serialPort, config.baudRate);
const app = express();
let latestStatus = { state: 'UNKNOWN', timestamp: 0 };
let clients = [];
let currentSessionId = null;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(config.clientPath));

// --- Web API Routes ---

// --- Preferences ---
app.get('/api/preferences', async (req, res) => {
    const prefs = await kilnDatabase.getPreferences();
    res.json(prefs);
});

app.post('/api/preferences', async (req, res) => {
    const prefs = await kilnDatabase.updatePreferences(req.body);
    res.json(prefs);
});

// --- Profiles ---
app.get('/api/profiles', async (req, res) => {
    const profiles = await kilnDatabase.getProfiles();
    res.json(profiles || []);
});

app.post('/api/profiles', async (req, res) => {
    const profile = await kilnDatabase.addProfile(req.body);
    res.json(profile);
});

app.put('/api/profiles/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const profile = await kilnDatabase.updateProfile(id, req.body);
    if (profile) res.json(profile);
    else res.status(404).json({ error: 'Profile not found' });
});

app.delete('/api/profiles/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    await kilnDatabase.deleteProfile(id);
    res.json({ success: true });
});

// GET /api/history - Get all history records
app.get('/api/history', (req, res) => {
    res.json(kilnDatabase.historyDb.data.sessions);
});

// DELETE /api/history - Clear all history records
app.delete('/api/history', async (req, res) => {
    await kilnDatabase.clearHistory();
    res.json({ success: true, message: 'History cleared' });
});

// GET /api/history/:id - Get a single session by ID
app.get('/api/history/:id', (req, res) => {
    const sessionId = parseInt(req.params.id, 10);
    const session = kilnDatabase.historyDb.data.sessions.find(s => s.id === sessionId);
    if (session) {
        res.json(session);
    } else {
        res.status(404).json({ success: false, message: 'Session not found' });
    }
});

// GET /api/events - Server Sent Events endpoint
app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send initial status immediately
    const initialData = JSON.stringify(latestStatus);
    res.write(`data: ${initialData}\n\n`);

    const clientId = Date.now();
    const newClient = {
        id: clientId,
        res
    };
    clients.push(newClient);

    req.on('close', () => {
        clients = clients.filter(c => c.id !== clientId);
    });
});

// GET /api/status - Get the latest known status
app.get('/api/status', (req, res) => {
    res.json(latestStatus);
});

// POST /api/start - Start the kiln
app.post('/api/start', async (req, res) => {
    const { profileId } = req.body;
    
    if (profileId) {
        const profiles = await kilnDatabase.getProfiles();
        const profile = profiles?.find(p => p.id === profileId);
        if (profile) {
            console.log(`Loading profile ${profile.name} before starting...`);
            kiln.setProfile(profile);
        } else {
             return res.status(404).json({ success: false, message: 'Profile not found' });
        }
    }

    // Add a delay to allow the Arduino to process the profile before starting.
    setTimeout(() => {
        kiln.start();
    }, 500); // 500ms delay
    
    // Create new history session
    try {
        const session = await kilnDatabase.createSession();
        currentSessionId = session.id;
        console.log(`Started new session: ${currentSessionId}`);
    } catch (err) {
        console.error('Failed to create history session:', err);
    }
    
    res.json({ success: true, message: 'Start command sent' });
});

// POST /api/stop - Stop the kiln
app.post('/api/stop', async (req, res) => {
    kiln.stop();
    
    // End history session
    if (currentSessionId) {
        await kilnDatabase.endSession(currentSessionId, 'ABORTED');
        console.log(`Ended session ${currentSessionId}: ABORTED`);
        currentSessionId = null;
    }
    
    res.json({ success: true, message: 'Stop command sent' });
});

// POST /api/profile - Set the firing profile
// Body: { targetTemperature, rampTime, soakDuration, coolTime }
app.post('/api/profile', (req, res) => {
    const { targetTemperature, rampTime, soakDuration, coolTime } = req.body;
    
    if (targetTemperature === undefined) {
        return res.status(400).json({ success: false, message: 'targetTemperature is required' });
    }

    kiln.setProfile(targetTemperature, rampTime, soakDuration, coolTime);
    res.json({ 
        success: true, 
        message: 'Profile update sent',
        params: { targetTemperature, rampTime, soakDuration, coolTime }
    });
});

// POST /api/test - Initiate test mode
app.post('/api/test', (req, res) => {
    const { temperature, duration, setPoint } = req.body;
    
    if (temperature === undefined) {
        return res.status(400).json({ success: false, message: 'temperature is required' });
    }

    kiln.testInput(temperature, duration, setPoint);
    res.json({ 
        success: true, 
        message: 'Test mode initiated',
        params: { temperature, duration, setPoint }
    });
});

// POST /api/test/temp - Set simulated temperature
app.post('/api/test/temp', (req, res) => {
    const { temperature } = req.body;
    
    if (temperature === undefined) {
        return res.status(400).json({ success: false, message: 'temperature is required' });
    }

    kiln.testInput(temperature);
    res.json({ 
        success: true, 
        message: 'Simulated temperature set',
        params: { temperature }
    });
});

// Handle incoming status messages from the Kiln
kiln.onStatus(async (data) => {
    const previousState = latestStatus.state;
    latestStatus = { ...data, timestamp: Date.now() };

    // Broadcast status to connected SSE clients
    clients.forEach(client => {
        client.res.write(`data: ${JSON.stringify(latestStatus)}\n\n`);
    });

    // Record history if in a session
    if (currentSessionId && (data.state === 'RAMP' || data.state === 'SOAK' || data.state === 'COOL')) {
        try {
            await kilnDatabase.addSessionEvent(currentSessionId, data);
        } catch (err) {
            console.error('Error saving session event:', err);
        }
    } else if (currentSessionId && (data.state === 'COMPLETED' || data.state === 'ABORTED' || data.state === 'EMERGENCY_STOP')) {
        // Automatically close session if the kiln reports it's done
        try {
            await kilnDatabase.addSessionEvent(currentSessionId, data); // Capture final state
            await kilnDatabase.endSession(currentSessionId, data.state);
            console.log(`Session ${currentSessionId} completed via status update: ${data.state}`);
            currentSessionId = null;
        } catch (err)
            {
            console.error('Error closing session:', err);
        }
    }

    // Conditional Logging
    const prefs = await kilnDatabase.getPreferences();
    const logLevel = prefs.logLevel || 'verbose'; // Default to verbose if not set

    if (logLevel === 'quiet') {
        if (data.state && data.state !== previousState) {
            console.log(`[STATE CHANGE] ${previousState} -> ${data.state}`);
        }
        if (data.message && data.message.includes('Lost contact')) {
            console.log(`[CONNECTION] ${data.message}`);
        }
    } else {
        // Verbose logging
        if (data.state) {
            console.log('[STATUS]', JSON.stringify(data));
        } else if (data.message) {
            console.log(`[MSG] ${data.message}`);
        } else {
            console.log('[DATA]', data);
        }
    }
});

// Serve index.html for any other requests (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(config.clientPath, 'index.html'));
});

async function main() {
    try {
        // The connect method will now handle its own retries.
        await kiln.connect();
        
        // Start Web Server
        app.listen(config.serverPort, () => {
            console.log(`Web API running on http://localhost:${config.serverPort}`);
        });

        // Initial status check is less critical now, as connection is maintained.
        console.log('Service is running and attempting to maintain Arduino connection.');

        // setup signal handlers for graceful shutdown
        const shutdown = () => {
            console.log('\nService stopping. Turning off kiln...');
            if (kiln.reconnectInterval) {
                clearInterval(kiln.reconnectInterval);
            }
            kiln.stop();
            setTimeout(() => {
                if (kiln.port && kiln.port.isOpen) {
                    kiln.port.close();
                }
                process.exit(0);
            }, 500);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (error) {
        // Initial connection failure is now handled by the reconnect logic,
        // but we keep this for any synchronous errors during setup.
        console.error('FATAL: Unrecoverable error during service startup.');
        console.error('Details:', error.message);
        process.exit(1);
    }
}

main();
