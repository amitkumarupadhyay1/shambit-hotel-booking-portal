import { useState, useEffect } from 'react';
import { PWA_CONFIG } from '@/lib/pwa-config';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if we're in a valid environment for PWA
    if (!PWA_CONFIG.isValidHost()) {
      return;
    }

    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // Check for iOS Safari standalone mode
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      const beforeInstallPromptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(beforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Listen for the appinstalled event
    window.addEventListener('appinstalled', handleAppInstalled);

    // Add user engagement tracking for Android
    let userInteractions = 0;
    const trackEngagement = () => {
      userInteractions++;
      
      // After some interactions, try to trigger install prompt for Android
      if (userInteractions >= 3 && isAndroidDevice() && !isInstallable && !isInstalled) {
        // Engagement threshold met
      }
    };

    // Track user engagement
    const engagementEvents = ['click', 'scroll', 'touchstart'];
    engagementEvents.forEach(event => {
      document.addEventListener(event, trackEngagement, { passive: true });
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      
      // Clean up engagement tracking
      const engagementEvents = ['click', 'scroll', 'touchstart'];
      engagementEvents.forEach(event => {
        document.removeEventListener(event, trackEngagement);
      });
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  };

  const isIOSDevice = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  };

  const isAndroidDevice = () => {
    return /Android/.test(navigator.userAgent);
  };

  const isMobileDevice = () => {
    return isIOSDevice() || isAndroidDevice() || /Mobile|Tablet/.test(navigator.userAgent);
  };

  const canInstall = isInstallable && !isInstalled && PWA_CONFIG.isValidHost();
  const showIOSInstructions = isIOSDevice() && !isInstalled && !isInstallable && PWA_CONFIG.isValidHost();
  const showAndroidInstructions = isAndroidDevice() && !isInstalled && !isInstallable && PWA_CONFIG.isValidHost();

  return {
    canInstall,
    isInstalled,
    isInstallable,
    showIOSInstructions,
    showAndroidInstructions,
    installApp,
    isIOSDevice: isIOSDevice(),
    isAndroidDevice: isAndroidDevice(),
    isMobileDevice: isMobileDevice(),
    isValidHost: PWA_CONFIG.isValidHost(),
  };
}