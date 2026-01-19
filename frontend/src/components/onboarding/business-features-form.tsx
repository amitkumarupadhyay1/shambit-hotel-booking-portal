'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Wifi, 
  Users, 
  Settings, 
  Plus,
  Edit,
  Trash2,
  Clock,
  MapPin,
  Zap,
  Monitor,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

import { 
  MeetingRoomForm,
  BusinessCenterForm,
  WorkSpaceForm,
  BusinessServicesForm,
  BusinessFeaturesDisplay
} from './index';
// import ConnectivityForm from './connectivity-form';

import { businessFeaturesApi } from '@/lib/api/business-features';
import {
  BusinessFeatures,
  BusinessFeaturesFormProps,
  MeetingRoom,
  WorkSpace,
  BusinessService,
  WORKSPACE_TYPES,
  MEETING_ROOM_LAYOUTS,
} from '@/lib/types/business-features';

interface BusinessFeaturesFormState {
  features: BusinessFeatures | null;
  isLoading: boolean;
  isSaving: boolean;
  activeTab: string;
  editingMeetingRoom: MeetingRoom | null;
  editingWorkSpace: WorkSpace | null;
  showMeetingRoomForm: boolean;
  showWorkSpaceForm: boolean;
}

export const BusinessFeaturesForm: React.FC<BusinessFeaturesFormProps> = ({
  hotelId,
  initialData,
  onSave,
  onCancel,
}) => {
  const [state, setState] = useState<BusinessFeaturesFormState>({
    features: initialData || null,
    isLoading: !initialData,
    isSaving: false,
    activeTab: 'overview',
    editingMeetingRoom: null,
    editingWorkSpace: null,
    showMeetingRoomForm: false,
    showWorkSpaceForm: false,
  });

  // Load business features if not provided
  useEffect(() => {
    if (!initialData && hotelId) {
      loadBusinessFeatures();
    }
  }, [hotelId, initialData]);

  const loadBusinessFeatures = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const features = await businessFeaturesApi.getBusinessFeatures(hotelId);
      setState(prev => ({ 
        ...prev, 
        features: features || getDefaultBusinessFeatures(),
        isLoading: false 
      }));
    } catch (error) {
      console.error('Failed to load business features:', error);
      toast.error('Failed to load business features');
      setState(prev => ({ 
        ...prev, 
        features: getDefaultBusinessFeatures(),
        isLoading: false 
      }));
    }
  };

  const getDefaultBusinessFeatures = (): BusinessFeatures => ({
    meetingRooms: [],
    businessCenter: {
      available: false,
      hours: {
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '18:00' },
        friday: { open: '09:00', close: '18:00' },
        saturday: { open: '09:00', close: '18:00' },
        sunday: null,
        is24x7: false,
      },
      services: [],
      equipment: [],
      staffed: false,
    },
    connectivity: {
      wifiSpeed: { download: 0, upload: 0, latency: 0 },
      coverage: [],
      reliability: {
        uptime: 0,
        averageSpeed: { download: 0, upload: 0, latency: 0 },
        peakHourPerformance: { download: 0, upload: 0, latency: 0 },
      },
      businessGrade: false,
      wiredInternet: false,
      publicComputers: 0,
    },
    workSpaces: [],
    services: [],
  });

  const handleSave = async () => {
    if (!state.features) return;

    try {
      setState(prev => ({ ...prev, isSaving: true }));
      const updatedFeatures = await businessFeaturesApi.updateBusinessFeatures(hotelId, state.features);
      setState(prev => ({ ...prev, features: updatedFeatures, isSaving: false }));
      toast.success('Business features saved successfully');
      onSave(updatedFeatures);
    } catch (error) {
      console.error('Failed to save business features:', error);
      toast.error('Failed to save business features');
      setState(prev => ({ ...prev, isSaving: false }));
    }
  };

  const handleMeetingRoomSave = async (meetingRoom: MeetingRoom) => {
    try {
      const updatedFeatures = await businessFeaturesApi.addOrUpdateMeetingRoom(hotelId, meetingRoom);
      setState(prev => ({
        ...prev,
        features: updatedFeatures,
        showMeetingRoomForm: false,
        editingMeetingRoom: null,
      }));
      toast.success('Meeting room saved successfully');
    } catch (error) {
      console.error('Failed to save meeting room:', error);
      toast.error('Failed to save meeting room');
    }
  };

  const handleMeetingRoomDelete = async (roomId: string) => {
    try {
      const updatedFeatures = await businessFeaturesApi.removeMeetingRoom(hotelId, roomId);
      setState(prev => ({ ...prev, features: updatedFeatures }));
      toast.success('Meeting room deleted successfully');
    } catch (error) {
      console.error('Failed to delete meeting room:', error);
      toast.error('Failed to delete meeting room');
    }
  };

  const handleWorkSpaceSave = async (workSpace: WorkSpace) => {
    try {
      const updatedFeatures = await businessFeaturesApi.addOrUpdateWorkSpace(hotelId, workSpace);
      setState(prev => ({
        ...prev,
        features: updatedFeatures,
        showWorkSpaceForm: false,
        editingWorkSpace: null,
      }));
      toast.success('Workspace saved successfully');
    } catch (error) {
      console.error('Failed to save workspace:', error);
      toast.error('Failed to save workspace');
    }
  };

  const handleWorkSpaceDelete = async (workspaceId: string) => {
    try {
      const updatedFeatures = await businessFeaturesApi.removeWorkSpace(hotelId, workspaceId);
      setState(prev => ({ ...prev, features: updatedFeatures }));
      toast.success('Workspace deleted successfully');
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      toast.error('Failed to delete workspace');
    }
  };

  const handleBusinessCenterSave = async (businessCenter: any) => {
    try {
      const updatedFeatures = await businessFeaturesApi.updateBusinessCenter(hotelId, businessCenter);
      setState(prev => ({ ...prev, features: updatedFeatures }));
      toast.success('Business center updated successfully');
    } catch (error) {
      console.error('Failed to update business center:', error);
      toast.error('Failed to update business center');
    }
  };

  const handleConnectivitySave = async (connectivity: any) => {
    try {
      const updatedFeatures = await businessFeaturesApi.updateConnectivityDetails(hotelId, connectivity);
      setState(prev => ({ ...prev, features: updatedFeatures }));
      toast.success('Connectivity details updated successfully');
    } catch (error) {
      console.error('Failed to update connectivity:', error);
      toast.error('Failed to update connectivity');
    }
  };

  const handleBusinessServicesSave = async (services: BusinessService[]) => {
    try {
      const updatedFeatures = await businessFeaturesApi.updateBusinessServices(hotelId, services);
      setState(prev => ({ ...prev, features: updatedFeatures }));
      toast.success('Business services updated successfully');
    } catch (error) {
      console.error('Failed to update business services:', error);
      toast.error('Failed to update business services');
    }
  };

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading business features...</span>
      </div>
    );
  }

  if (!state.features) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Business Features</h3>
        <p className="text-gray-600 mb-4">There was an error loading the business features data.</p>
        <Button onClick={loadBusinessFeatures}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Features</h2>
          <p className="text-gray-600 mt-1">
            Configure meeting rooms, connectivity, workspaces, and business services to attract corporate travelers.
          </p>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleSave} 
            disabled={state.isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {state.isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={state.activeTab} onValueChange={(tab: string) => setState(prev => ({ ...prev, activeTab: tab }))}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="meeting-rooms" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Meeting Rooms
          </TabsTrigger>
          <TabsTrigger value="connectivity" className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Connectivity
          </TabsTrigger>
          <TabsTrigger value="workspaces" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Workspaces
          </TabsTrigger>
          <TabsTrigger value="business-center" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Business Center
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Services
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <BusinessFeaturesDisplay 
            features={state.features}
            isEditable={true}
            onEdit={() => {}}
          />
        </TabsContent>

        {/* Meeting Rooms Tab */}
        <TabsContent value="meeting-rooms" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Meeting Rooms</h3>
            <Button
              onClick={() => setState(prev => ({ ...prev, showMeetingRoomForm: true, editingMeetingRoom: null }))}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Meeting Room
            </Button>
          </div>

          {state.features.meetingRooms.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Meeting Rooms</h4>
                <p className="text-gray-600 mb-4">Add meeting rooms to attract business travelers and corporate events.</p>
                <Button
                  onClick={() => setState(prev => ({ ...prev, showMeetingRoomForm: true, editingMeetingRoom: null }))}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Meeting Room
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {state.features.meetingRooms.map((room) => (
                <Card key={room.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{room.name}</h4>
                          <Badge variant="secondary">
                            {MEETING_ROOM_LAYOUTS.find(l => l.value === room.layout)?.label || room.layout}
                          </Badge>
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            {room.capacity} people
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{room.bookingProcedure}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {room.size && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {room.size} sq m
                            </span>
                          )}
                          {room.hourlyRate && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              ₹{room.hourlyRate}/hour
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Monitor className="h-3 w-3" />
                            {room.equipment.length} equipment items
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setState(prev => ({ 
                            ...prev, 
                            showMeetingRoomForm: true, 
                            editingMeetingRoom: room 
                          }))}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMeetingRoomDelete(room.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {state.showMeetingRoomForm && (
            <MeetingRoomForm
              meetingRoom={state.editingMeetingRoom}
              onSave={handleMeetingRoomSave}
              onCancel={() => setState(prev => ({ 
                ...prev, 
                showMeetingRoomForm: false, 
                editingMeetingRoom: null 
              }))}
            />
          )}
        </TabsContent>

        {/* Connectivity Tab */}
        <TabsContent value="connectivity" className="space-y-6">
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
              <div className="space-y-6">
                {/* WiFi Speed Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">WiFi Speed</Label>
                    <Badge variant={state.features.connectivity.businessGrade ? "default" : "secondary"}>
                      {state.features.connectivity.businessGrade ? "Business Grade" : "Standard"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Download Speed (Mbps)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={state.features.connectivity.wifiSpeed.download}
                        placeholder="e.g., 100"
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Upload Speed (Mbps)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={state.features.connectivity.wifiSpeed.upload}
                        placeholder="e.g., 50"
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Latency (ms)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={state.features.connectivity.wifiSpeed.latency}
                        placeholder="e.g., 20"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Connection Options */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Connection Options</Label>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label className="font-medium">Business Grade Internet</Label>
                        <p className="text-sm text-gray-600">Enterprise-level connectivity with guaranteed speeds</p>
                      </div>
                      <Badge variant={state.features.connectivity.businessGrade ? "default" : "secondary"}>
                        {state.features.connectivity.businessGrade ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label className="font-medium">Wired Internet Access</Label>
                        <p className="text-sm text-gray-600">Ethernet connections available in rooms/common areas</p>
                      </div>
                      <Badge variant={state.features.connectivity.wiredInternet ? "default" : "secondary"}>
                        {state.features.connectivity.wiredInternet ? "Available" : "Not Available"}
                      </Badge>
                    </div>

                    {state.features.connectivity.publicComputers > 0 && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">Public Computers</Label>
                          <p className="text-sm text-gray-600">Computers available for guest use</p>
                        </div>
                        <Badge variant="outline">
                          {state.features.connectivity.publicComputers} computers
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">
                    Connectivity configuration is managed through the business features service.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workspaces Tab */}
        <TabsContent value="workspaces" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Work Spaces</h3>
            <Button
              onClick={() => setState(prev => ({ ...prev, showWorkSpaceForm: true, editingWorkSpace: null }))}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Workspace
            </Button>
          </div>

          {state.features.workSpaces.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Workspaces</h4>
                <p className="text-gray-600 mb-4">Add workspaces to provide flexible work environments for business travelers.</p>
                <Button
                  onClick={() => setState(prev => ({ ...prev, showWorkSpaceForm: true, editingWorkSpace: null }))}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Workspace
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {state.features.workSpaces.map((workspace) => (
                <Card key={workspace.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{workspace.name}</h4>
                          <Badge variant="secondary">
                            {WORKSPACE_TYPES.find(t => t.value === workspace.type)?.label || workspace.type}
                          </Badge>
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            {workspace.capacity} people
                          </Badge>
                          {workspace.isAccessible24x7 && (
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              <Clock className="h-3 w-3 mr-1" />
                              24/7
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {workspace.powerOutlets} outlets
                          </span>
                          <span className="capitalize">{workspace.lighting} lighting</span>
                          <span>{workspace.amenities.length} amenities</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setState(prev => ({ 
                            ...prev, 
                            showWorkSpaceForm: true, 
                            editingWorkSpace: workspace 
                          }))}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWorkSpaceDelete(workspace.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {state.showWorkSpaceForm && (
            <WorkSpaceForm
              workSpace={state.editingWorkSpace}
              onSave={handleWorkSpaceSave}
              onCancel={() => setState(prev => ({ 
                ...prev, 
                showWorkSpaceForm: false, 
                editingWorkSpace: null 
              }))}
            />
          )}
        </TabsContent>

        {/* Business Center Tab */}
        <TabsContent value="business-center" className="space-y-6">
          <BusinessCenterForm
            businessCenter={state.features.businessCenter}
            onSave={handleBusinessCenterSave}
          />
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <BusinessServicesForm
            services={state.features.services}
            onSave={handleBusinessServicesSave}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};