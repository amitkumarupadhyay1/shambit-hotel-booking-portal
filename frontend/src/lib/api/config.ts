// API configuration that works with both localhost and local IP
export const getApiUrl = () => {
  // In development, use the current host but with backend port
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // If accessing via IP address, use the same IP for backend
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:3002/api/v1`;
    }
  }
  
  // Fallback to environment variable or localhost
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1';
};

export const API_BASE_URL = getApiUrl();