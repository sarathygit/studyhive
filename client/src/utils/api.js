import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

// Generous timeout: the backend runs on a free tier that sleeps after inactivity,
// so a cold start can legitimately take ~50s. Without a timeout a dead backend
// leaves requests pending forever and the UI just spins with no explanation.
const REQUEST_TIMEOUT_MS = 60000;

const api = axios.create({
    baseURL: `${API_URL}/api`,
    timeout: REQUEST_TIMEOUT_MS,
    headers: { 'Content-Type': 'application/json' }
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('studyhive_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses, and attach a human-readable message to every failure
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('studyhive_token');
            localStorage.removeItem('studyhive_user');
            window.location.href = '/login';
        }

        error.friendlyMessage = describeError(error);
        return Promise.reject(error);
    }
);

function describeError(error) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return 'The server is taking too long to respond. It may be waking up from sleep — please try again in a moment.';
    }

    if (!error.response) {
        return "Can't reach the server. Check your internet connection and try again.";
    }

    const { status, data } = error.response;

    // The server's own message is the most specific one available.
    if (data?.message) return data.message;

    if (status === 503) {
        return "The server can't reach its database right now. Please try again in a moment.";
    }
    if (status >= 500) {
        return 'Something went wrong on the server. Please try again.';
    }

    return 'Something went wrong. Please try again.';
}

// Use in catch blocks: getErrorMessage(err, 'Login failed')
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
    error?.friendlyMessage || error?.response?.data?.message || fallback;

export default api;
