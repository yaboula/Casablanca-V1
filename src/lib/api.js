import axios from 'axios';

// In Create React App, environment variables must start with REACT_APP_
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
