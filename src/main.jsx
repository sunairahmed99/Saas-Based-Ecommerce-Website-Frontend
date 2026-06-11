import './utils/silenceConsole.js';
import React from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import axios from 'axios';
import { getAuthToken } from './utils/auth';
import App from './App.jsx'
import { Provider } from 'react-redux';
import { store } from './app/store.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { hydrateQueryClient } from './utils/catalogCache';

// Attach auth token to every API request when logged in
axios.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    if (!config.headers.auth_token) {
      config.headers.auth_token = token;
    }
  }
  return config;
});

// Initialize TanStack Query client for high-performance caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

hydrateQueryClient(queryClient);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
)
