'use client';

import { Wifi, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Wifi className="w-8 h-8 text-gray-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          You're Offline
        </h1>
        
        <p className="text-gray-600 mb-6">
          It looks like you've lost your internet connection. Don't worry, you can still browse some content that's been saved on your device.
        </p>
        
        <Button 
          onClick={handleRefresh} 
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Shambit works best with an internet connection for the latest hotel availability and prices.
          </p>
        </div>
      </Card>
    </div>
  );
}