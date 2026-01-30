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
        this.lastState = null;
        this.activeSessionId = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.port = new SerialPort({ path: this.portPath, baudRate: this.baudRate }, (err) => {
                if (err) {
                    return reject(err);
                }
            });

            // Handle SerialPort errors (like disconnection)
            this.port.on('error', (err) => {
                console.error('Serial Port Error:', err.message);
            });

            // Arduino println() uses \r\n, so we parse lines
            this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
            
            this.parser.on('data', (data) => {
                // Ignore empty lines
                if (!data || data.trim() === '') return;
                
                try {
                    const json = JSON.parse(data);
                    this.handleData(json);
                } catch (e) {
                    // Sometimes startup messages aren't JSON
                    console.log('Raw Serial Data:', data); 
                }
            });

            this.port.on('open', () => {
                console.log(`Connected to kiln on ${this.portPath}`);
                // Allow time for Arduino autorestart on serial connection
                setTimeout(resolve, 2000); 
            });
        });
    }

    async handleData(data) {
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
            // STARTING a new session
            if (currentState === 'STARTING') {
                const newSession = await kilnDatabase.createSession();
                this.activeSessionId = newSession.id;
                console.log(`[SESSION] Started new session: ${this.activeSessionId}`);
            }

            // ENDING a session
            const isStopping = currentState === 'COMPLETED' || currentState === 'ABORTED' || currentState === 'EMERGENCY_STOP';
            if (this.activeSessionId && isStopping) {
                const finalStatus = currentState;
                console.log(`[SESSION] Ending session: ${this.activeSessionId} with status: ${finalStatus}`);
                await kilnDatabase.endSession(this.activeSessionId, finalStatus);
                this.activeSessionId = null;
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
        // Transform service profile format to Arduino command format if needed
        // Service: { steps: [{ number, targetTemperature, duration, rate, mode, initialSetpoint }] }
        // Arduino expects: { command: "profile", steps: [...] }
        
        const cmd = {
            command: 'profile',
            steps: profile.steps.map(s => ({
                type: s.mode, // RAMP, SOAK, COOL...
                targetTemperature: s.targetTemperature,
                duration: s.duration, // minutes
                rate: s.rate // degrees/hour
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
