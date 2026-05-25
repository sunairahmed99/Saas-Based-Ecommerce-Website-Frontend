export const API_BASE_URL = import.meta.env.VITE_API_URL || "https://saas-based-ecommerce-website-backen-navy.vercel.app";

/** Live chat sockets — off on Vercel unless VITE_ENABLE_SOCKET=true */
export { isSocketIoEnabled } from "./utils/socket";
