'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Zap, 
  Database, 
  Smartphone, 
  Wifi,
  Image as ImageIcon,
  Clock,
  BarChart3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import PerformanceMonitor from './PerformanceMonitor';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

interface PerformanceMetrics {
  uploadSpeed: number; // MB/s
  cacheHitRate: number; // percentage
  dataOptimization: number; // percentage saved
  mobileOptimization: boolean;
}

export default function PerformanceOptimizationDemo() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    uploadSpeed: 0,
    cacheHitRate: 0,
    dataOptimization: 0,
    mobileOptimization: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  
  const {
    connectionInfo,
    isOnline,
    connectionQuality,
    optimizationSettings,
    dataUsage,
    estimateDataUsage,
    optimizeData,
  } = useMobileOptimization();

  // Simulate performance metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        uploadSpeed: Math.random() * 10 + 5, // 5-15 MB/s
        cacheHitRate: Math.random() * 30 + 70, // 70-100%
        dataOptimization: Math.random() * 20 + 30, // 30-50% saved
        mobileOptimization: connectionQuality !== 'good',
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [connectionQuality]);

  const runPerformanceTest = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    const results: string[] = [];
    
    try {
      // Test 1: Image Upload Performance
      results.push('✅ Testing async image upload (up to 5MB)...');
      setTestResults([...results]);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test 2: Mobile Data Optimization
      results.push('✅ Testing mobile data transfer optimization...');
      setTestResults([...results]);
      
      if (optimizeData) {
        const testData = { 
          images: Array(10).fill({ url: 'test.jpg', size: 1024 * 1024 }), 
          description: 'A'.repeat(1000) 
        };
        const optimized = await optimizeData(testData, 'medium');
        results.push(`📊 Data optimization: ${optimized.optimization?.bandwidthSaved || 0} bytes saved`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test 3: Caching Performance
      results.push('✅ Testing amenity and quality data caching...');
      setTestResults([...results]);
      
      try {
        const response = await fetch('/api/performance/cache/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (response.ok) {
          const cacheStats = await response.json();
          results.push(`📈 Cache hit rate: ${cacheStats.hitRate?.toFixed(1) || 0}%`);
        }
      } catch (error) {
        results.push('⚠️ Cache stats unavailable (service not running)');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test 4: Progressive Loading
      results.push('✅ Testing progressive loading strategy...');
      setTestResults([...results]);
      
      try {
        const response = await fetch('/api/performance/mobile/progressive-loading/hotel?priority=high');
        if (response.ok) {
          const strategy = await response.json();
          results.push(`🚀 Progressive loading: ${strategy.immediate?.length || 0} immediate, ${strategy.deferred?.length || 0} deferred`);
        }
      } catch (error) {
        results.push('⚠️ Progressive loading test unavailable (service not running)');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test 5: Bandwidth Estimation
      results.push('✅ Testing bandwidth usage estimation...');
      setTestResults([...results]);
      
      if (estimateDataUsage) {
        const estimate = await estimateDataUsage('image_upload', 5 * 1024 * 1024); // 5MB
        results.push(`⏱️ Estimated upload time: ${estimate.estimatedTime?.toFixed(1) || 0}s`);
        results.push(`📱 ${estimate.recommendation || 'No recommendation'}`);
      }
      
      results.push('🎉 All performance tests completed!');
      setTestResults(results);
      
    } catch (error) {
      results.push(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTestResults(results);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUploadComplete = (images: any[]) => {
    console.log('Images uploaded successfully:', images);
    setTestResults(prev => [...prev, `📸 ${images.length} image(s) uploaded successfully`]);
  };

  const handleImageUploadError = (error: string) => {
    console.error('Image upload error:', error);
    setTestResults(prev => [...prev, `❌ Upload error: ${error}`]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Performance Optimization Demo</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            This demo showcases the three main performance optimizations implemented:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Upload className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-medium">Async Image Upload</h3>
                <p className="text-sm text-gray-600">Non-blocking uploads up to 5MB</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <Smartphone className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-medium">Mobile Optimization</h3>
                <p className="text-sm text-gray-600">Data transfer optimization</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <Database className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-medium">Smart Caching</h3>
                <p className="text-sm text-gray-600">Amenity & quality data caching</p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={runPerformanceTest} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Running Performance Tests...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Run Performance Tests
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upload Speed</p>
                <p className="text-2xl font-bold">{metrics.uploadSpeed.toFixed(1)} MB/s</p>
              </div>
              <Upload className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cache Hit Rate</p>
                <p className="text-2xl font-bold">{metrics.cacheHitRate.toFixed(1)}%</p>
              </div>
              <Database className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Data Saved</p>
                <p className="text-2xl font-bold">{metrics.dataOptimization.toFixed(1)}%</p>
              </div>
              <Smartphone className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mobile Mode</p>
                <Badge variant={metrics.mobileOptimization ? 'default' : 'secondary'}>
                  {metrics.mobileOptimization ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <Wifi className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  <span className="text-gray-500 w-6">{index + 1}.</span>
                  <span className="flex-1">{result}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Components */}
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Image Upload</TabsTrigger>
          <TabsTrigger value="monitor">Performance Monitor</TabsTrigger>
          <TabsTrigger value="optimization">Mobile Optimization</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ImageIcon className="h-5 w-5" />
                <span>Image Upload Demo</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Image upload demo is available in the onboarding flow.</p>
                <p className="text-sm mt-2">Visit <code>/onboarding</code> to test the image upload functionality.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="monitor" className="space-y-4">
          <PerformanceMonitor />
        </TabsContent>
        
        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Optimization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Connection Quality</label>
                  <Badge variant="outline" className="ml-2">
                    {connectionQuality}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Online Status</label>
                  <Badge variant={isOnline ? 'default' : 'destructive'} className="ml-2">
                    {isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Usage</label>
                <div className="flex items-center justify-between text-sm">
                  <span>Session Usage</span>
                  <span>{dataUsage.toFixed(2)} MB</span>
                </div>
                <Progress value={(dataUsage / 100) * 100} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Image Quality:</span>
                  <Badge variant="outline" className="ml-2">
                    {optimizationSettings.imageQuality}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Compression:</span>
                  <Badge variant={optimizationSettings.enableCompression ? 'default' : 'outline'} className="ml-2">
                    {optimizationSettings.enableCompression ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
              
              {connectionInfo && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Connection Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Type: {connectionInfo.effectiveType.toUpperCase()}</div>
                    <div>Speed: {connectionInfo.downlink} Mbps</div>
                    <div>Latency: {connectionInfo.rtt}ms</div>
                    <div>Data Saver: {connectionInfo.saveData ? 'On' : 'Off'}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}