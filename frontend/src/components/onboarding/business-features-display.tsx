'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Wifi, 
  Users, 
  MapPin, 
  Settings,
  Clock,
  Zap,
  Monitor,
  Signal,
  CheckCircle,
  XCircle,
  DollarSign,
  Edit
} from 'lucide-react';

import {
  BusinessFeatures,
  BusinessFeaturesDisplayProps,
} from '@/lib/types/business-features';

export const BusinessFeaturesDisplay: React.FC<BusinessFeaturesDisplayProps> = ({
  features,
  isEditable = false,
  onEdit,
}) => {
  const formatOperatingHours = (hours: any) => {
    if (hours.is24x7) return '24/7';
    
    const activeDays = Object.entries(hours)
      .filter(([key, value]) => key !== 'is24x7' && value !== null)
      .map(([key, value]: [string, any]) => ({
        day: key,
        hours: value,
      }));

    if (activeDays.length === 0) return 'Closed';
    
    // Check if all active days have the same hours
    const firstHours = activeDays[0].hours;
    const allSameHours = activeDays.every(
      day => day.hours.open === firstHours.open && day.hours.close === firstHours.close
    );

    if (allSameHours && activeDays.length === 7) {
      return `Daily ${firstHours.open} - ${firstHours.close}`;
    }

    if (allSameHours && activeDays.length === 5) {
      const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      const isWeekdays = activeDays.every(day => weekdays.includes(day.day));
      if (isWeekdays) {
        return `Mon-Fri ${firstHours.open} - ${firstHours.close}`;
      }
    }

    return `${activeDays.length} days/week`;
  };

  const getConnectivityScore = () => {
    const { wifiSpeed, businessGrade, reliability } = features.connectivity;
    let score = 0;
    
    if (wifiSpeed.download >= 100) score += 30;
    else if (wifiSpeed.download >= 50) score += 20;
    else if (wifiSpeed.download >= 25) score += 10;
    
    if (businessGrade) score += 30;
    if (reliability.uptime >= 99) score += 25;
    else if (reliability.uptime >= 95) score += 15;
    
    if (features.connectivity.coverage.length >= 3) score += 15;
    
    return Math.min(score, 100);
  };

  const getBusinessReadinessScore = () => {
    let score = 0;
    
    // Meeting rooms (30 points)
    if (features.meetingRooms.length >= 3) score += 30;
    else if (features.meetingRooms.length >= 1) score += 20;
    
    // Business center (25 points)
    if (features.businessCenter.available) {
      score += 15;
      if (features.businessCenter.staffed) score += 5;
      if (features.businessCenter.services.length >= 5) score += 5;
    }
    
    // Connectivity (25 points)
    score += Math.round(getConnectivityScore() * 0.25);
    
    // Workspaces (20 points)
    if (features.workSpaces.length >= 2) score += 20;
    else if (features.workSpaces.length >= 1) score += 10;
    
    return Math.min(score, 100);
  };

  const businessScore = getBusinessReadinessScore();
  const connectivityScore = getConnectivityScore();

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Business Readiness</p>
                <p className="text-2xl font-bold text-blue-600">{businessScore}%</p>
              </div>
              <div className={`p-2 rounded-full ${
                businessScore >= 80 ? 'bg-green-100 text-green-600' :
                businessScore >= 60 ? 'bg-yellow-100 text-yellow-600' :
                'bg-red-100 text-red-600'
              }`}>
                <Building2 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Connectivity Score</p>
                <p className="text-2xl font-bold text-green-600">{connectivityScore}%</p>
              </div>
              <div className={`p-2 rounded-full ${
                connectivityScore >= 80 ? 'bg-green-100 text-green-600' :
                connectivityScore >= 60 ? 'bg-yellow-100 text-yellow-600' :
                'bg-red-100 text-red-600'
              }`}>
                <Wifi className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Services</p>
                <p className="text-2xl font-bold text-purple-600">
                  {features.services.filter(s => s.available).length}
                </p>
              </div>
              <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                <Settings className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meeting Rooms Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Meeting Rooms ({features.meetingRooms.length})
            </CardTitle>
            <CardDescription>
              Conference and meeting facilities for business travelers
            </CardDescription>
          </div>
          {isEditable && onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {features.meetingRooms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No meeting rooms configured</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.meetingRooms.map((room) => (
                <div key={room.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{room.name}</h4>
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      {room.capacity}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Layout: {room.layout}</p>
                    <p>Equipment: {room.equipment.length} items</p>
                    {room.hourlyRate && (
                      <p className="text-green-600 font-medium">₹{room.hourlyRate}/hour</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connectivity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Connectivity & Internet
          </CardTitle>
          <CardDescription>
            WiFi speeds, coverage areas, and internet connectivity options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Signal className="h-4 w-4" />
                  WiFi Performance
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Download Speed:</span>
                    <span className="font-medium">{features.connectivity.wifiSpeed.download} Mbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Upload Speed:</span>
                    <span className="font-medium">{features.connectivity.wifiSpeed.upload} Mbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Latency:</span>
                    <span className="font-medium">{features.connectivity.wifiSpeed.latency} ms</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Connection Features</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {features.connectivity.businessGrade ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm">Business Grade Internet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {features.connectivity.wiredInternet ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm">Wired Internet Access</span>
                  </div>
                  {features.connectivity.publicComputers > 0 && (
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{features.connectivity.publicComputers} Public Computers</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Coverage Areas</h4>
              {features.connectivity.coverage.length === 0 ? (
                <p className="text-sm text-gray-500">No coverage areas specified</p>
              ) : (
                <div className="space-y-2">
                  {features.connectivity.coverage.map((area, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{area.area}</span>
                      <Badge 
                        variant={
                          area.signalStrength === 'excellent' ? 'default' :
                          area.signalStrength === 'good' ? 'secondary' :
                          'outline'
                        }
                        className="text-xs"
                      >
                        {area.signalStrength}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workspaces Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Work Spaces ({features.workSpaces.length})
          </CardTitle>
          <CardDescription>
            Dedicated work areas and business lounges
          </CardDescription>
        </CardHeader>
        <CardContent>
          {features.workSpaces.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No workspaces configured</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.workSpaces.map((workspace) => (
                <div key={workspace.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{workspace.name}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{workspace.type.replace('_', ' ')}</Badge>
                      {workspace.isAccessible24x7 && (
                        <Badge variant="outline" className="text-green-600">
                          <Clock className="h-3 w-3 mr-1" />
                          24/7
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {workspace.capacity} people
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {workspace.powerOutlets} outlets
                      </span>
                    </div>
                    <p>Lighting: {workspace.lighting}</p>
                    <p>Amenities: {workspace.amenities.length} items</p>
                    {!workspace.isAccessible24x7 && (
                      <p>Hours: {formatOperatingHours(workspace.hours)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Center Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Center
          </CardTitle>
          <CardDescription>
            Business support services and facilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!features.businessCenter.available ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Business center not available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Services Available</h4>
                {features.businessCenter.services.length === 0 ? (
                  <p className="text-sm text-gray-500">No services specified</p>
                ) : (
                  <div className="space-y-1">
                    {features.businessCenter.services.slice(0, 5).map((service, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-sm">{service}</span>
                      </div>
                    ))}
                    {features.businessCenter.services.length > 5 && (
                      <p className="text-sm text-gray-500">
                        +{features.businessCenter.services.length - 5} more services
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Operating Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {features.businessCenter.staffed ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-sm">Staffed Business Center</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">
                        Hours: {formatOperatingHours(features.businessCenter.hours)}
                      </span>
                    </div>
                  </div>
                </div>

                {features.businessCenter.equipment.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Equipment Available</h4>
                    <div className="space-y-1">
                      {features.businessCenter.equipment.slice(0, 3).map((equipment, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Monitor className="h-3 w-3 text-blue-600" />
                          <span className="text-sm">
                            {equipment.name} ({equipment.quantity})
                          </span>
                        </div>
                      ))}
                      {features.businessCenter.equipment.length > 3 && (
                        <p className="text-sm text-gray-500">
                          +{features.businessCenter.equipment.length - 3} more items
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Services Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Business Services ({features.services.filter(s => s.available).length} active)
          </CardTitle>
          <CardDescription>
            Additional services for business travelers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {features.services.filter(s => s.available).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No business services configured</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.services.filter(s => s.available).map((service, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{service.name}</h4>
                    {service.fee && service.fee > 0 ? (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ₹{service.fee}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Free</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{service.description}</p>
                  {service.hours && (
                    <p className="text-xs text-gray-500 mt-1">
                      Available: {formatOperatingHours(service.hours)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};