import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import kilnDatabase from './db.js';

class KilnInterface {
    constructor(portPath, baudRate = 9600) {
        this.portPath = portPath;
        this.baudRate = baudRate;
        this.port = null;
        this.parser = null;
        this.onStatusCallback = null;
        this.lastState = 'IDLE'; // Initialize to IDLE
        this.activeSessionId = null;
        this.isConnecting = false;
        this.reconnectInterval = null;
    }

    connect() {
        // If a reconnect interval is running, clear it.
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }

        // Prevent multiple concurrent connection attempts
        if (this.isConnecting || (this.port && this.port.isOpen)) {
            return Promise.resolve();
        }
        this.isConnecting = true;
        
        console.log(`Attempting to connect to kiln on ${this.portPath}...`);

        return new Promise((resolve, reject) => {
            this.port = new SerialPort({ path: this.portPath, baudRate: this.baudRate }, (err) => {
                this.isConnecting = false;
                if (err) {
                    console.error(`Failed to open port ${this.portPath}:`, err.message);
                    this.scheduleReconnect();
                    return reject(err);
                }
            });

            this.port.on('error', (err) => {
                console.error('Serial Port Error:', err.message);
            });

            this.port.on('close', () => {
                console.log('Serial port closed. Attempting to reconnect...');
                this.port = null; // Discard the old port object
                this.scheduleReconnect();
            });

            this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
            
            this.parser.on('data', (data) => {
                if (!data || data.trim() === '') return;
                try {
                    const json = JSON.parse(data);
                    this.handleData(json);
                } catch (e) {
                    console.log('Raw Serial Data:', data); 
                }
            });

            this.port.on('open', () => {
                this.isConnecting = false;
                console.log(`Connected to kiln on ${this.portPath}`);
                this.lastState = 'IDLE'; // Reset state on connect
                if (this.reconnectInterval) {
                    clearInterval(this.reconnectInterval);
                    this.reconnectInterval = null;
                }
                setTimeout(resolve, 2000); 
            });
        });
    }

    scheduleReconnect() {
        if (this.reconnectInterval) return; // Reconnect already scheduled

        if (this.onStatusCallback) {
            this.onStatusCallback({ state: 'RECONNECTING', message: 'Attempting to reconnect to Arduino...' });
        }

        this.reconnectInterval = setInterval(() => {
            this.connect().catch(() => {
                // Errors are logged in connect(), just need to catch to prevent unhandled rejections
            });
        }, 5000); // Retry every 5 seconds
    }

    async handleData(data) {
        // Ignore invalid or unknown states
        if (!data.state || data.state === 'UNKNOWN') {
            return;
        }

        // If it's a command response, just pass it to the callback and exit.
        if (data.status === 'ok' || data.status === 'error') {
            if (this.onStatusCallback) {
                this.onStatusCallback(data);
            } else {
                console.log('Received Command Response:', data);
            }
            return;
        }

        // If it's a status report, pass it to the callback
        if (this.onStatusCallback) {
            this.onStatusCallback(data);
        } else {
            console.log('Received:', data);
        }

        // --- Session Management ---
        const currentState = data.state;
        if (currentState && currentState !== this.lastState) {
            console.log(`[STATE CHANGE] ${this.lastState} -> ${currentState}`);

            // STARTING a new session
            const isStarting = this.lastState === 'IDLE' && (currentState === 'RAMP' || currentState === 'PREHEAT' || currentState === 'SOAK');
            if (!this.activeSessionId && isStarting) {
                const newSession = await kilnDatabase.createSession(data.profileId);
                this.activeSessionId = newSession.id;
                console.log(`[SESSION] Started new session: ${this.activeSessionId} for profile ${data.profileId}`);
            }

            // ENDING a session
            const isStopping = currentState === 'COMPLETED' || currentState === 'ABORTED' || currentState === 'EMERGENCY_STOP';
            if (this.activeSessionId && isStopping) {
                const finalStatus = currentState;
                console.log(`[SESSION] Ending session: ${this.activeSessionId} with status: ${finalStatus}`);
                await kilnDatabase.endSession(this.activeSessionId, finalStatus);
                this.activeSessionId = null;
                this.lastState = "IDLE"; // Explicitly reset state after stop
                return; // Stop further processing for this event
            }
        }

        // Add event to active session
        if (this.activeSessionId && data.state) {
            await kilnDatabase.addSessionEvent(this.activeSessionId, data);
        }

        this.lastState = currentState;
    }

    onStatus(callback) {
        this.onStatusCallback = callback;
    }

    sendCommand(commandObj) {
        if (!this.port || !this.port.isOpen) {
            console.error('Port not open, cannot send command:', commandObj);
            // Optionally, notify the frontend that the command could not be sent.
            if (this.onStatusCallback) {
                this.onStatusCallback({ state: 'ERROR', message: 'Cannot send command. Port is not open.' });
            }
            return;
        }

        const json = JSON.stringify(commandObj);
        console.log('Sending:', json);
        this.port.write(json + '\n', (err) => {
            if (err) {
                return console.log('Error on write: ', err.message);
            }
        });
    }

    // --- High Level Commands mapping to kiln.cpp ---

    start() {
        this.sendCommand({ command: 'start' });
    }

    stop() {
        this.sendCommand({ command: 'stop' });
    }

    /**
     * Set the kiln profile
     * @param {Object} profile - Full profile object with steps
     */
    setProfile(profile) {
        console.log('Setting profile:', JSON.stringify(profile, null, 2));
        
        const cmd = {
            command: 'profile',
            id: String(profile.id), // Ensure ID is a string
            name: profile.name,
            steps: profile.steps.map(s => ({
                type: s.type || s.mode || 'IDLE',
                targetTemperature: s.targetTemperature,
                duration: s.duration,
                rate: s.rate
            }))
        };
        
        this.sendCommand(cmd);
    }

    getStatus() {
        this.sendCommand({ command: 'status' });
    }

    testInput(temperature, duration, setPoint) {
        const cmd = {
            command: 'testInput',
            temperature: temperature
        };
        if (duration !== undefined) cmd.duration = duration;
        if (setPoint !== undefined) cmd.setPoint = setPoint;
        
        this.sendCommand(cmd);
    }
}

export default KilnInterface;
