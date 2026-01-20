'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Monitor, 
  Zap, 
  Database,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
}

interface PerformanceMetrics {
  cacheStats: CacheStats;
  activeUploads: number;
  completedUploads: number;
  failedUploads: number;
  totalDataTransferred: number; // MB
  averageUploadTime: number; // seconds
}

export default function PerformanceMonitor() {
  const {
    connectionInfo,
    isOnline,
    connectionQuality,
    optimizationSettings,
    dataUsage,
    resetDataUsage,
  } = useMobileOptimization();

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cacheStats: { hits: 0, misses: 0, hitRate: 0 },
    activeUploads: 0,
    completedUploads: 0,
    failedUploads: 0,
    totalDataTransferred: 0,
    averageUploadTime: 0,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Fetch performance metrics
  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/performance/cache/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const cacheStats = await response.json();
        setMetrics(prev => ({
          ...prev,
          cacheStats,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh metrics
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4 text-red-500" />;
    
    switch (connectionQuality) {
      case 'poor':
        return <Wifi className="h-4 w-4 text-red-500" />;
      case 'slow':
        return <Wifi className="h-4 w-4 text-orange-500" />;
      case 'moderate':
        return <Wifi className="h-4 w-4 text-yellow-500" />;
      case 'good':
        return <Wifi className="h-4 w-4 text-green-500" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConnectionBadgeVariant = () => {
    switch (connectionQuality) {
      case 'poor':
        return 'destructive';
      case 'slow':
        return 'secondary';
      case 'moderate':
        return 'outline';
      case 'good':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getOptimizationLevel = () => {
    const { imageQuality, enableCompression, maxConcurrentUploads } = optimizationSettings;
    
    if (imageQuality === 'low' && enableCompression && maxConcurrentUploads === 1) {
      return { level: 'High', color: 'text-green-600', icon: TrendingUp };
    } else if (imageQuality === 'medium' && enableCompression) {
      return { level: 'Medium', color: 'text-yellow-600', icon: Minus };
    } else {
      return { level: 'Low', color: 'text-red-600', icon: TrendingDown };
    }
  };

  const optimizationLevel = getOptimizationLevel();

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-sm">
            {getConnectionIcon()}
            <span>Connection Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
          
          {connectionInfo && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Quality</span>
                <Badge variant={getConnectionBadgeVariant()}>
                  {connectionQuality}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Type</span>
                <span className="text-sm font-medium">{connectionInfo.effectiveType.toUpperCase()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Speed</span>
                <span className="text-sm font-medium">{connectionInfo.downlink} Mbps</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Latency</span>
                <span className="text-sm font-medium">{connectionInfo.rtt}ms</span>
              </div>
              
              {connectionInfo.saveData && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Data Saver</span>
                  <Badge variant="outline">Enabled</Badge>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Optimization Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-sm">
            <Zap className="h-4 w-4" />
            <span>Optimization</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Level</span>
            <div className="flex items-center space-x-1">
              <optimizationLevel.icon className={`h-4 w-4 ${optimizationLevel.color}`} />
              <span className={`text-sm font-medium ${optimizationLevel.color}`}>
                {optimizationLevel.level}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Image Quality</span>
            <Badge variant="outline">{optimizationSettings.imageQuality}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Compression</span>
            <Badge variant={optimizationSettings.enableCompression ? 'default' : 'outline'}>
              {optimizationSettings.enableCompression ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Max Uploads</span>
            <span className="text-sm font-medium">{optimizationSettings.maxConcurrentUploads}</span>
          </div>
        </CardContent>
      </Card>

      {/* Data Usage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-sm">
            <Smartphone className="h-4 w-4" />
            <span>Data Usage</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Session Usage</span>
            <span className="text-sm font-medium">{dataUsage.toFixed(2)} MB</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Daily Limit (100MB)</span>
              <span className="text-gray-500">{((dataUsage / 100) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(dataUsage / 100) * 100} className="h-2" />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetDataUsage}
            className="w-full"
          >
            Reset Usage
          </Button>
        </CardContent>
      </Card>

      {/* Cache Performance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-sm">
            <Database className="h-4 w-4" />
            <span>Cache Performance</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchMetrics}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Hit Rate</span>
            <span className="text-sm font-medium">{metrics.cacheStats.hitRate.toFixed(1)}%</span>
          </div>
          
          <div className="space-y-2">
            <Progress value={metrics.cacheStats.hitRate} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="text-center">
              <div className="font-medium text-green-600">{metrics.cacheStats.hits}</div>
              <div className="text-gray-500">Hits</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-red-600">{metrics.cacheStats.misses}</div>
              <div className="text-gray-500">Misses</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-sm">
            <Monitor className="h-4 w-4" />
            <span>Device Info</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">User Agent</span>
            <Badge variant="outline">
              {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Screen</span>
            <span className="text-sm font-medium">
              {window.screen.width}x{window.screen.height}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Viewport</span>
            <span className="text-sm font-medium">
              {window.innerWidth}x{window.innerHeight}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}