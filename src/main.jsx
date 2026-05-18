import React from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App.jsx'
import { Provider } from 'react-redux';
import { store } from './app/store.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Initialize TanStack Query client for high-performance caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents aggressive background re-fetches when switching browser tabs
      staleTime: 5 * 60 * 1000,    // Consider data fresh for 5 minutes
      gcTime: 10 * 60 * 1000,      // Keep unused data in memory cache for 10 minutes
    },
  },
});

// Disable console logs in production
if (import.meta.env.MODE === 'production') {
  console.log = () => {};
  console.error = () => {};
  console.debug = () => {};
  console.warn = () => {};
  console.info = () => {};
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
)
