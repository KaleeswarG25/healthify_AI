import axios from 'axios';

const authApi = axios.create({
  baseURL: process.env.REACT_APP_AUTH_URL,
  headers: { 'Content-Type': 'application/json' }
});

const reportApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

const aiApi = axios.create({
  baseURL: process.env.REACT_APP_AI_URL,
  headers: { 'Content-Type': 'application/json' }
});

const tokenInterceptor = (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

reportApi.interceptors.request.use(tokenInterceptor);
aiApi.interceptors.request.use(tokenInterceptor);

export { authApi, reportApi, aiApi };   