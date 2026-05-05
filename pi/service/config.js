import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';

export default {
    isProduction,
    // Serial Port Configuration
    // On Linux/RPi this is often /dev/ttyACM0 or /dev/ttyUSB0
    // On Windows this might be COM3, COM4, etc.
    serialPort: '/dev/ttyACM0', 
    baudRate: 9600,

    // Service Configuration
    statusInterval: 10000, // Poll status every 10 seconds
    dbWriteInterval: 15000, // Write to db every 15 seconds
    serverPort: 3000,      // Port for the Web API

    // Web App Path (Changes based on environment)
    // Production (Pi): './public' (bundled as sibling to index.js)
    // Development Local: '../client/dist' (relative to source index.js)
    clientPath: isProduction 
        ? path.join(__dirname, 'public') 
        : path.join(__dirname, '../client/dist'),

    // Future: Google AppScript Configuration
    // cloudApiUrl: 'https://script.google.com/macros/s/...'
};