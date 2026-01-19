'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Wifi, Monitor, TrendingUp, Clock, Zap } from 'lucide-react';

import { ConnectivityDetails } from '@/lib/types/business-features';

interface ConnectivityFormProps {
  connectivity: ConnectivityDetails;
  onSave: (connectivity: ConnectivityDetails) => void;
}

const ConnectivityForm: React.FC<ConnectivityFormProps> = ({
  connectivity,
  onSave,
}) => {
  const [formData, setFormData] = useState(connectivity);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Connectivity Details
        </CardTitle>
        <CardDescription>
          Configure WiFi speeds, coverage areas, and internet connectivity options for business travelers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* WiFi Speed Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">WiFi Speed</Label>
              <Badge variant={formData.businessGrade ? "default" : "secondary"}>
                {formData.businessGrade ? "Business Grade" : "Standard"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="download">Download Speed (Mbps)</Label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="download"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.wifiSpeed.download}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      wifiSpeed: { ...prev.wifiSpeed, download: parseFloat(e.target.value) || 0 }
                    }))}
                    className="pl-10"
                    placeholder="e.g., 100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="upload">Upload Speed (Mbps)</Label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 rotate-180" />
                  <Input
                    id="upload"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.wifiSpeed.upload}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      wifiSpeed: { ...prev.wifiSpeed, upload: parseFloat(e.target.value) || 0 }
                    }))}
                    className="pl-10"
                    placeholder="e.g., 50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="latency">Latency (ms)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="latency"
                    type="number"
                    min="0"
                    value={formData.wifiSpeed.latency}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      wifiSpeed: { ...prev.wifiSpeed, latency: parseInt(e.target.value) || 0 }
                    }))}
                    className="pl-10"
                    placeholder="e.g., 20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Business Grade and Additional Options */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Connection Options</Label>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="businessGrade" className="font-medium">Business Grade Internet</Label>
                  <p className="text-sm text-gray-600">Enterprise-level connectivity with guaranteed speeds</p>
                </div>
                <Switch
                  id="businessGrade"
                  checked={formData.businessGrade}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, businessGrade: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="wiredInternet" className="font-medium">Wired Internet Access</Label>
                  <p className="text-sm text-gray-600">Ethernet connections available in rooms/common areas</p>
                </div>
                <Switch
                  id="wiredInternet"
                  checked={formData.wiredInternet}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, wiredInternet: checked }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publicComputers">Public Computers Available</Label>
              <div className="relative">
                <Monitor className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="publicComputers"
                  type="number"
                  min="0"
                  value={formData.publicComputers}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    publicComputers: parseInt(e.target.value) || 0 
                  }))}
                  className="pl-10"
                  placeholder="Number of computers"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uptime">Uptime Percentage</Label>
              <div className="relative">
                <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="uptime"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.reliability.uptime}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reliability: { ...prev.reliability, uptime: parseFloat(e.target.value) || 0 }
                  }))}
                  className="pl-10"
                  placeholder="e.g., 99.9"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Save Connectivity Settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ConnectivityForm;