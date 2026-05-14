import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { EventEmitter } from 'events';

class KilnInterface extends EventEmitter {
    constructor(portPath, baudRate) {
        super();
        this.portPath = portPath;
        this.baudRate = baudRate;
        this.port = null;
        this.parser = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.port = new SerialPort({ path: this.portPath, baudRate: this.baudRate }, (err) => {
                if (err) {
                    console.error('Error opening port:', err.message);
                    return reject(err);
                }
            });

            this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));

            this.port.on('open', () => {
                console.log('Serial port opened.');
                resolve();
            });

            this.parser.on('data', (data) => {
                try {
                    const status = JSON.parse(data);
                    this.emit('status', status); // Emit the status event
                } catch (e) {
                    console.error('Error parsing JSON from serial:', e);
                    // Also emit an error event for the main app to potentially handle
                    this.emit('error', new Error('Invalid JSON from device'));
                }
            });

            this.port.on('error', (err) => {
                console.error('Serial port error:', err.message);
                this.emit('error', err); // Forward the error
                reject(err);
            });

            this.port.on('close', () => {
                console.log('Serial port closed.');
                this.emit('close'); // Let the main app know the port closed
            });
        });
    }

    sendCommand(command) {
        if (this.port && this.port.isOpen) {
            this.port.write(command + '\n', (err) => {
                if (err) {
                    console.error('Error writing to port:', err.message);
                } else {
                    console.log('Command sent:', command);
                }
            });
        } else {
            console.error('Cannot send command: port is not open.');
        }
    }

    start() {
        this.sendCommand('START');
    }

    stop() {
        this.sendCommand('STOP');
    }

    setTargetTemperature(temp) {
        // Format the command as "SET_TEMP,<temperature>"
        const command = `SET_TEMP,${temp}`;
        this.sendCommand(command);
    }
}

export default KilnInterface;
