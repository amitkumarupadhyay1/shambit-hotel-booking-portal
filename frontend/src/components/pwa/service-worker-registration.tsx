'use client';

import { useEffect } from 'react';
import { PWA_CONFIG } from '@/lib/pwa-config';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Check if we're in a valid environment for PWA
      if (!PWA_CONFIG.isValidHost()) {
        return;
      }
      
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, prompt user to refresh
                  if (confirm('New version available! Refresh to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch(() => {
          // Service worker registration failed silently
        });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING') {
          window.location.reload();
        }
      });
    }
  }, []);

  return null;
}