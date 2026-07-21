'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // 1. Reload the page when the active service worker changes (new version takes control)
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      });

      const handleRegister = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('Service Worker registered successfully with scope:', reg.scope);

            // Trigger manual update check
            try {
              reg.update();
            } catch (e) {}

            // If a new service worker is already waiting, tell it to take control immediately
            if (reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            // Listen for new service worker installation
            reg.addEventListener('updatefound', () => {
              const installingWorker = reg.installing;
              if (!installingWorker) return;

              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  installingWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            });
          })
          .catch((err) => {
            console.error('Service Worker registration failed:', err);
          });
      };

      // Register immediately for maximum speed
      handleRegister();
    }
  }, []);

  return null;
}
