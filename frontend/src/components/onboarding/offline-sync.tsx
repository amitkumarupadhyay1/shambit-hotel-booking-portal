'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Upload,
  Download,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface OfflineData {
  id: string;
  type: 'draft' | 'step_completion' | 'image_upload';
  data: any;
  timestamp: Date;
  retryCount: number;
  lastError?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingItems: number;
  lastSyncTime?: Date;
  syncErrors: string[];
}

export interface OfflineSyncProps {
  onSync: (items: OfflineData[]) => Promise<void>;
  onDataLoad: () => Promise<OfflineData[]>;
  className?: string;
}

// Hook for network status detection
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Working offline - changes will sync when connected');
    };
    
    // Get connection type if available
    const updateConnectionType = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      if (connection) {
        setConnectionType(connection.effectiveType || connection.type || 'unknown');
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateConnectionType);
      updateConnectionType();
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateConnectionType);
      }
    };
  }, []);
  
  return { isOnline, connectionType };
};

// Hook for offline data management
const useOfflineData = () => {
  const [offlineData, setOfflineData] = useState<OfflineData[]>([]);
  
  const addOfflineData = useCallback((item: Omit<OfflineData, 'id' | 'timestamp' | 'retryCount'>) => {
    const newItem: OfflineData = {
      ...item,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      retryCount: 0
    };
    
    setOfflineData(prev => [...prev, newItem]);
    
    // Persist to localStorage
    const stored = localStorage.getItem('offline-onboarding-data');
    const existing = stored ? JSON.parse(stored) : [];
    localStorage.setItem('offline-onboarding-data', JSON.stringify([...existing, newItem]));
    
    return newItem.id;
  }, []);
  
  const removeOfflineData = useCallback((id: string) => {
    setOfflineData(prev => prev.filter(item => item.id !== id));
    
    // Update localStorage
    const stored = localStorage.getItem('offline-onboarding-data');
    if (stored) {
      const existing = JSON.parse(stored);
      const filtered = existing.filter((item: OfflineData) => item.id !== id);
      localStorage.setItem('offline-onboarding-data', JSON.stringify(filtered));
    }
  }, []);
  
  const updateOfflineData = useCallback((id: string, updates: Partial<OfflineData>) => {
    setOfflineData(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
    
    // Update localStorage
    const stored = localStorage.getItem('offline-onboarding-data');
    if (stored) {
      const existing = JSON.parse(stored);
      const updated = existing.map((item: OfflineData) => 
        item.id === id ? { ...item, ...updates } : item
      );
      localStorage.setItem('offline-onboarding-data', JSON.stringify(updated));
    }
  }, []);
  
  const loadOfflineData = useCallback(() => {
    const stored = localStorage.getItem('offline-onboarding-data');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setOfflineData(data);
        return data;
      } catch (error) {
        console.error('Failed to load offline data:', error);
        localStorage.removeItem('offline-onboarding-data');
      }
    }
    return [];
  }, []);
  
  return {
    offlineData,
    addOfflineData,
    removeOfflineData,
    updateOfflineData,
    loadOfflineData
  };
};

export const OfflineSync: React.FC<OfflineSyncProps> = ({
  onSync,
  onDataLoad,
  className
}) => {
  const { isOnline, connectionType } = useNetworkStatus();
  const { 
    offlineData, 
    addOfflineData, 
    removeOfflineData, 
    updateOfflineData, 
    loadOfflineData 
  } = useOfflineData();
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline,
    isSyncing: false,
    pendingItems: 0,
    syncErrors: []
  });
  
  const [syncProgress, setSyncProgress] = useState(0);
  
  // Load offline data on mount
  useEffect(() => {
    loadOfflineData();
  }, [loadOfflineData]);
  
  // Update sync status when online status or offline data changes
  useEffect(() => {
    setSyncStatus(prev => ({
      ...prev,
      isOnline,
      pendingItems: offlineData.length
    }));
  }, [isOnline, offlineData.length]);
  
  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && offlineData.length > 0 && !syncStatus.isSyncing) {
      handleSync();
    }
  }, [isOnline, offlineData.length, syncStatus.isSyncing]);
  
  const handleSync = async () => {
    if (!isOnline || offlineData.length === 0) return;
    
    setSyncStatus(prev => ({ ...prev, isSyncing: true, syncErrors: [] }));
    setSyncProgress(0);
    
    const totalItems = offlineData.length;
    let syncedItems = 0;
    const errors: string[] = [];
    
    for (const item of offlineData) {
      try {
        await onSync([item]);
        removeOfflineData(item.id);
        syncedItems++;
        setSyncProgress((syncedItems / totalItems) * 100);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${item.type}: ${errorMessage}`);
        
        // Update retry count
        updateOfflineData(item.id, {
          retryCount: item.retryCount + 1,
          lastError: errorMessage
        });
      }
    }
    
    setSyncStatus(prev => ({
      ...prev,
      isSyncing: false,
      lastSyncTime: new Date(),
      syncErrors: errors
    }));
    
    if (syncedItems > 0) {
      toast.success(`Synced ${syncedItems} items successfully`);
    }
    
    if (errors.length > 0) {
      toast.error(`Failed to sync ${errors.length} items`);
    }
  };
  
  const handleManualSync = () => {
    if (isOnline) {
      handleSync();
    } else {
      toast.error('Cannot sync while offline');
    }
  };
  
  const getConnectionQuality = () => {
    if (!isOnline) return 'offline';
    
    switch (connectionType) {
      case 'slow-2g':
      case '2g':
        return 'poor';
      case '3g':
        return 'fair';
      case '4g':
      case '5g':
        return 'good';
      default:
        return 'unknown';
    }
  };
  
  const connectionQuality = getConnectionQuality();
  
  return (
    <Card className={cn("border-slate-200", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <CardTitle className="text-lg">
              {isOnline ? 'Online' : 'Offline Mode'}
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            {connectionType !== 'unknown' && isOnline && (
              <Badge 
                variant={connectionQuality === 'good' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {connectionType.toUpperCase()}
              </Badge>
            )}
            
            {syncStatus.pendingItems > 0 && (
              <Badge variant="outline" className="text-xs">
                {syncStatus.pendingItems} pending
              </Badge>
            )}
          </div>
        </div>
        
        <CardDescription>
          {isOnline 
            ? 'Your changes are being saved automatically'
            : 'Working offline - changes will sync when connected'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Sync Status */}
        {syncStatus.isSyncing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Syncing changes...</span>
              <span className="text-slate-600">{Math.round(syncProgress)}%</span>
            </div>
            <Progress value={syncProgress} className="h-2" />
          </div>
        )}
        
        {/* Pending Items */}
        {syncStatus.pendingItems > 0 && !syncStatus.isSyncing && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-700">
                  {syncStatus.pendingItems} changes waiting to sync
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  These will be uploaded automatically when you're back online
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Sync Errors */}
        {syncStatus.syncErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700">
                  Some changes failed to sync
                </p>
                <ul className="text-xs text-red-600 mt-1 space-y-1">
                  {syncStatus.syncErrors.slice(0, 3).map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                  {syncStatus.syncErrors.length > 3 && (
                    <li>• And {syncStatus.syncErrors.length - 3} more...</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* Last Sync Time */}
        {syncStatus.lastSyncTime && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>
              Last synced: {syncStatus.lastSyncTime.toLocaleTimeString()}
            </span>
          </div>
        )}
        
        {/* Manual Sync Button */}
        {(syncStatus.pendingItems > 0 || syncStatus.syncErrors.length > 0) && (
          <Button
            onClick={handleManualSync}
            disabled={!isOnline || syncStatus.isSyncing}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {syncStatus.isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>
        )}
        
        {/* Offline Data Summary */}
        {offlineData.length > 0 && (
          <div className="border-t border-slate-200 pt-3">
            <h4 className="text-sm font-medium text-slate-700 mb-2">
              Offline Changes
            </h4>
            <div className="space-y-2">
              {offlineData.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {item.type === 'draft' && <Download className="h-3 w-3 text-blue-500" />}
                    {item.type === 'step_completion' && <CheckCircle className="h-3 w-3 text-green-500" />}
                    {item.type === 'image_upload' && <Upload className="h-3 w-3 text-purple-500" />}
                    <span className="text-slate-600 capitalize">
                      {item.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.retryCount > 0 && (
                      <Badge variant="destructive" className="text-xs px-1 py-0">
                        {item.retryCount} retries
                      </Badge>
                    )}
                    <span className="text-slate-500">
                      {item.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              {offlineData.length > 5 && (
                <p className="text-xs text-slate-500 text-center">
                  And {offlineData.length - 5} more items...
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Connection Tips */}
        {!isOnline && (
          <div className="border-t border-slate-200 pt-3">
            <h4 className="text-sm font-medium text-slate-700 mb-2">
              Working Offline
            </h4>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Your changes are saved locally</li>
              <li>• They'll sync automatically when connected</li>
              <li>• You can continue working normally</li>
              <li>• Large images may take longer to upload</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OfflineSync;