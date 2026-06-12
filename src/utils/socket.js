import { io } from "socket.io-client";

/**
 * Socket.io needs a persistent Node server. Vercel serverless returns 404 on /socket.io.
 * Enable only for local dev or when VITE_ENABLE_SOCKET=true with a compatible backend host.
 */
export const isSocketIoEnabled = () => {
  return true;
};

export const createAppSocket = (baseUrl, options = {}) => {
  if (!isSocketIoEnabled()) return null;

  return io(baseUrl, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    timeout: 8000,
    transports: ["websocket", "polling"],
    ...options,
  });
};
