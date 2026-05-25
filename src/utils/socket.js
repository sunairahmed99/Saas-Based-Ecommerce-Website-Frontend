import { io } from "socket.io-client";

/**
 * Socket.io needs a persistent Node server. Vercel serverless returns 404 on /socket.io.
 * Enable only for local dev or when VITE_ENABLE_SOCKET=true with a compatible backend host.
 */
export const isSocketIoEnabled = () => {
  if (import.meta.env.VITE_ENABLE_SOCKET === "true") return true;
  if (import.meta.env.VITE_ENABLE_SOCKET === "false") return false;

  const apiUrl = import.meta.env.VITE_API_URL || "";
  if (!apiUrl) return false;

  try {
    const host = new URL(apiUrl).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
};

export const createAppSocket = (baseUrl, options = {}) => {
  if (!isSocketIoEnabled()) return null;

  return io(baseUrl, {
    autoConnect: true,
    reconnection: false,
    timeout: 8000,
    transports: ["websocket", "polling"],
    ...options,
  });
};
