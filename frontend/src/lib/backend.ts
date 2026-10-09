// Kanhoot Go backend adresi. Alan adı değişince kod değil, Vercel'deki NEXT_PUBLIC_KANHOOT_API değişkeni değişir
// (örn. https://kanhoot-api.kanakademi.com.tr:8443). NEXT_PUBLIC_ değişkenleri derlemede koda gömülür: değiştirince yeniden yayınlayın.
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_KANHOOT_API ??
  (process.env.NODE_ENV === "production" ? "https://188-132-232-104.sslip.io:8443" : "http://localhost:8080");

/** https → wss, http → ws */
export const WS_URL = BACKEND_URL.replace(/^http/, "ws");
