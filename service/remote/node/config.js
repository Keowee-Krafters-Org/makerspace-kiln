import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';

export default {
    isProduction,
    // Service Configuration
    port: 3001,         // Port for the remote service (API and Web App)

    // Web App Path
    clientPath: path.resolve(__dirname, '..', '..', '..', 'client', 'dist'),
};
