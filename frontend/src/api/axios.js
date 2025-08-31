import axios from 'axios'


const api = axios.create({
baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
timeout: 10000
})


// attach Firebase token automatically if present in localStorage
api.interceptors.request.use(async (config) => {
try {
const token = localStorage.getItem('firebase_id_token')
if (token) config.headers.Authorization = `Bearer ${token}`
} catch (err) {
// ignore
}
return config
})


export default api