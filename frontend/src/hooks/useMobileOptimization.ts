'use client';

import { useState, useEffect, useCallback } from 'react';

interface ConnectionInfo {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface OptimizationSettings {
  imageQuality: 'low' | 'medium' | 'high';
  enableCompression: boolean;
  enableLazyLoading: boolean;
  maxConcurrentUploads: number;
  chunkSize: number; // KB
}

interface DataUsageEstimate {
  estimatedTime: number; // seconds
  dataUsage: number; // MB
  recommendation: string;
}

export function useMobileOptimization() {
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [optimizationSettings, setOptimizationSettings] = useState<OptimizationSettings>({
    imageQuality: 'medium',
    enableCompression: true,
    enableLazyLoading: true,
    maxConcurrentUploads: 2,
    chunkSize: 64,
  });
  const [isOnline, setIsOnline] = useState(true);
  const [dataUsage, setDataUsage] = useState(0); // MB

  // Detect network connection
  useEffect(() => {
    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setConnectionInfo({
          effectiveType: connection.effectiveType || '4g',
          downlink: connection.downlink || 10,
          rtt: connection.rtt || 100,
          saveData: connection.saveData || false,
        });
      }
    };

    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Initial setup
    updateConnectionInfo();
    updateOnlineStatus();

    // Event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', updateConnectionInfo);
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, []);

  // Auto-adjust settings based on connection
  useEffect(() => {
    if (!connectionInfo) return;

    const { effectiveType, saveData, downlink } = connectionInfo;

    let newSettings: OptimizationSettings = { ...optimizationSettings };

    // Adjust based on connection speed
    if (effectiveType === 'slow-2g' || effectiveType === '2g' || saveData) {
      newSettings = {
        imageQuality: 'low',
        enableCompression: true,
        enableLazyLoading: true,
        maxConcurrentUploads: 1,
        chunkSize: 32,
      };
    } else if (effectiveType === '3g' || downlink < 1.5) {
      newSettings = {
        imageQuality: 'medium',
        enableCompression: true,
        enableLazyLoading: true,
        maxConcurrentUploads: 2,
        chunkSize: 64,
      };
    } else if (effectiveType === '4g' && downlink > 5) {
      newSettings = {
        imageQuality: 'high',
        enableCompression: false,
        enableLazyLoading: false,
        maxConcurrentUploads: 4,
        chunkSize: 128,
      };
    }

    setOptimizationSettings(newSettings);
  }, [connectionInfo]);

  // Get optimized image URL based on connection
  const getOptimizedImageUrl = useCallback((image: any, size: 'thumbnail' | 'small' | 'medium' | 'large' = 'medium') => {
    if (!image) return '';

    const { effectiveType, saveData } = connectionInfo || {};
    
    // Use mobile-optimized versions for slow connections
    if (effectiveType === 'slow-2g' || effectiveType === '2g' || saveData) {
      return image.optimizedUrls?.mobile || image.thumbnails?.small || '';
    }
    
    // Use appropriate size based on connection and requested size
    if (effectiveType === '3g') {
      const sizeMap = {
        thumbnail: image.thumbnails?.small,
        small: image.optimizedUrls?.small,
        medium: image.optimizedUrls?.small,
        large: image.optimizedUrls?.medium,
      };
      return sizeMap[size] || image.thumbnails?.small || '';
    }

    // High-speed connection - use requested size
    const sizeMap = {
      thumbnail: image.thumbnails?.small,
      small: image.optimizedUrls?.small,
      medium: image.optimizedUrls?.medium,
      large: image.optimizedUrls?.large,
    };
    return sizeMap[size] || image.optimizedUrls?.medium || '';
  }, [connectionInfo]);

  // Estimate data usage for an operation
  const estimateDataUsage = useCallback(async (operation: string, dataSize: number): Promise<DataUsageEstimate> => {
    try {
      const response = await fetch('/api/performance/mobile/bandwidth-estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ operation, dataSize }),
      });

      if (!response.ok) {
        throw new Error('Failed to estimate data usage');
      }

      return await response.json();
    } catch (error) {
      // Fallback estimation
      const avgSpeed = connectionInfo?.downlink || 5; // Mbps
      const estimatedTime = dataSize / (avgSpeed * 1024 * 1024 / 8); // Convert to seconds
      const dataUsage = dataSize / (1024 * 1024); // Convert to MB

      return {
        estimatedTime,
        dataUsage,
        recommendation: dataUsage > 5 ? 'Consider using WiFi' : 'Safe for mobile data',
      };
    }
  }, [connectionInfo]);

  // Optimize data for transfer
  const optimizeData = useCallback(async (data: any, level: 'low' | 'medium' | 'high' = 'medium') => {
    try {
      const response = await fetch('/api/performance/mobile/optimize-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ data, level }),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize data');
      }

      const result = await response.json();
      
      // Track data usage
      setDataUsage(prev => prev + (result.optimization.bandwidthSaved / (1024 * 1024)));
      
      return result;
    } catch (error) {
      console.error('Data optimization failed:', error);
      return { data, optimization: null };
    }
  }, []);

  // Get progressive loading strategy
  const getProgressiveLoadingStrategy = useCallback(async (
    contentType: 'hotel' | 'rooms' | 'amenities' | 'images',
    priority: 'high' | 'medium' | 'low' = 'medium'
  ) => {
    try {
      const response = await fetch(`/api/performance/mobile/progressive-loading/${contentType}?priority=${priority}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get loading strategy');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get progressive loading strategy:', error);
      // Fallback strategy
      return {
        immediate: ['name', 'id'],
        deferred: ['description'],
        lazy: ['images', 'details'],
      };
    }
  }, []);

  // Check if operation should be deferred due to poor connection
  const shouldDeferOperation = useCallback((dataSize: number) => {
    if (!connectionInfo) return false;

    const { effectiveType, saveData, downlink } = connectionInfo;
    
    // Defer large operations on slow connections
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return dataSize > 100 * 1024; // 100KB
    }
    
    if (effectiveType === '3g' || saveData) {
      return dataSize > 500 * 1024; // 500KB
    }
    
    if (downlink < 1) {
      return dataSize > 1024 * 1024; // 1MB
    }

    return false;
  }, [connectionInfo]);

  // Get connection quality indicator
  const getConnectionQuality = useCallback(() => {
    if (!connectionInfo) return 'unknown';

    const { effectiveType, downlink, rtt } = connectionInfo;

    if (effectiveType === 'slow-2g' || (downlink < 0.5 && rtt > 2000)) {
      return 'poor';
    }
    
    if (effectiveType === '2g' || (downlink < 1.5 && rtt > 1000)) {
      return 'slow';
    }
    
    if (effectiveType === '3g' || (downlink < 5 && rtt > 500)) {
      return 'moderate';
    }
    
    return 'good';
  }, [connectionInfo]);

  // Reset data usage tracking
  const resetDataUsage = useCallback(() => {
    setDataUsage(0);
  }, []);

  return {
    // Connection info
    connectionInfo,
    isOnline,
    connectionQuality: getConnectionQuality(),
    
    // Optimization settings
    optimizationSettings,
    setOptimizationSettings,
    
    // Data usage tracking
    dataUsage,
    resetDataUsage,
    
    // Optimization functions
    getOptimizedImageUrl,
    estimateDataUsage,
    optimizeData,
    getProgressiveLoadingStrategy,
    shouldDeferOperation,
  };
}