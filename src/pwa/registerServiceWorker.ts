/**
 * Register the offline service worker in production builds only.
 * Silently does nothing where service workers are unavailable
 * (dev server, file://, sandboxed previews, older browsers).
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  if (typeof window === 'undefined' || !window.isSecureContext) return;

  const register = () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* offline support is a bonus; the app works without it */
    });
  };

  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
