// kiln-interface-sim.js
import { EventEmitter } from 'events';

class SimulatedKilnInterface extends EventEmitter {
    constructor() {
        super();
        this.status = {
            state: 'IDLE',
            input: 25,
            setpoint: 25,
            targetTemperature: 0,
            ssrUpper: false,
            ssrLower: false,
            isSimulated: true,
            timeRemaining: 0,
        };
        this.interval = null;
        this.startSimulation(); // Start emitting events immediately
    }

    connect() {
        // In simulation, connect does nothing as it's always "connected"
        console.log('SIM: Connect method called (no-op).');
        return Promise.resolve();
    }

    startSimulation() {
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => {
            const tempDiff = this.status.targetTemperature - this.status.input;
            
            // If there's a significant difference, move towards the target
            if (Math.abs(tempDiff) > 1) {
                // Move 10% of the way to the target, plus a little randomness
                const change = tempDiff * 0.1 + (Math.random() * 2 - 1);
                this.status.input += change;
            } else {
                // Otherwise, just fluctuate slightly around the target
                this.status.input += Math.random() * 0.5 - 0.25;
            }

            // Fake the setpoint to follow the input temp for now
            this.status.setpoint = this.status.input;

            this.emit('status', { ...this.status });
        }, 2000); // Emit status every 2 seconds
    }

    onStatus(callback) {
        this.on('status', callback);
    }

    // Mock methods to be called by the API
    start() {
        this.status.state = 'RAMP';
        this.status.timeRemaining = 3600000; // 1 hour
        console.log('SIM: Start command received');
    }

    stop() {
        this.status.state = 'IDLE';
        this.status.timeRemaining = 0;
        console.log('SIM: Stop command received');
    }

    setProfile(profile) {
        this.status.targetTemperature = profile.steps[0]?.targetTemperature || 0;
        console.log('SIM: Profile set', profile);
    }

    setTargetTemperature(temp) {
        this.status.targetTemperature = temp;
        console.log(`SIM: Target temperature set to ${temp}`);
    }

    testInput(temperature) {
        this.status.input = temperature;
        console.log(`SIM: Test temperature set to ${temperature}`);
    }
}

export default SimulatedKilnInterface;
