// PWA Configuration for different environments

export const PWA_CONFIG = {
  // Allowed hosts for PWA functionality
  allowedHosts: [
    'localhost',
    '127.0.0.1',
    '192.168.29.45', // Your local IP
    // Add more local IPs as needed
    '192.168.1.',    // Common local network range
    '192.168.0.',    // Common local network range
    '10.',           // Private network range
    '172.',          // Private network range
  ],

  // Check if current host is allowed for PWA
  isValidHost: (): boolean => {
    if (typeof window === 'undefined') return false;
    
    const { protocol, hostname } = window.location;
    
    // Always allow HTTPS
    if (protocol === 'https:') return true;
    
    // In development, allow HTTP for specific hosts
    if (process.env.NODE_ENV === 'development') {
      return PWA_CONFIG.allowedHosts.some(allowedHost => {
        if (allowedHost.endsWith('.')) {
          return hostname.startsWith(allowedHost);
        }
        return hostname === allowedHost;
      });
    }
    
    // Production: only HTTPS
    return false;
  },
};