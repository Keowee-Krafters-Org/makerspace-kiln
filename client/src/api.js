// api.js
const getApiUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    // In a local Pi environment, the API is on the same host.
    // When deployed remotely, this will need to be configured.
    return window.location.origin;
};

export const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

