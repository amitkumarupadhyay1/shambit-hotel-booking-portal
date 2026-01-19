import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnhancedHotel } from '../entities/enhanced-hotel.entity';
import {
  BusinessFeatures,
  MeetingRoom,
  BusinessCenter,
  ConnectivityDetails,
  WorkSpace,
  BusinessService,
  OperatingHours,
  Equipment,
  WifiSpeed,
  CoverageArea,
  ReliabilityMetrics,
} from '../interfaces/enhanced-hotel.interface';

@Injectable()
export class BusinessFeaturesService {
  constructor(
    @InjectRepository(EnhancedHotel)
    private readonly hotelRepository: Repository<EnhancedHotel>,
  ) {}

  /**
   * Get business features for a hotel
   * Requirements: 5.1, 5.2, 5.3, 5.4
   */
  async getBusinessFeatures(hotelId: string): Promise<BusinessFeatures | null> {
    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
      select: ['businessFeatures'],
    });

    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${hotelId} not found`);
    }

    return hotel.businessFeatures || null;
  }

  /**
   * Update business features for a hotel
   * Requirements: 5.1, 5.2, 5.3, 5.4
   */
  async updateBusinessFeatures(
    hotelId: string,
    businessFeatures: Partial<BusinessFeatures>,
  ): Promise<BusinessFeatures> {
    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
    });

    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${hotelId} not found`);
    }

    // Merge with existing business features
    const currentFeatures = hotel.businessFeatures || this.getDefaultBusinessFeatures();
    const updatedFeatures = { ...currentFeatures, ...businessFeatures };

    // Validate the updated features
    this.validateBusinessFeatures(updatedFeatures);

    // Update the hotel
    await this.hotelRepository.update(hotelId, {
      businessFeatures: updatedFeatures,
    });

    return updatedFeatures;
  }

  /**
   * Add or update a meeting room
   * Requirements: 5.1
   */
  async addOrUpdateMeetingRoom(
    hotelId: string,
    meetingRoom: MeetingRoom,
  ): Promise<BusinessFeatures> {
    const currentFeatures = await this.getBusinessFeatures(hotelId) || this.getDefaultBusinessFeatures();
    
    // Validate meeting room data
    this.validateMeetingRoom(meetingRoom);

    // Find existing room or add new one
    const existingRoomIndex = currentFeatures.meetingRooms.findIndex(
      room => room.id === meetingRoom.id
    );

    if (existingRoomIndex >= 0) {
      currentFeatures.meetingRooms[existingRoomIndex] = meetingRoom;
    } else {
      currentFeatures.meetingRooms.push(meetingRoom);
    }

    return this.updateBusinessFeatures(hotelId, currentFeatures);
  }

  /**
   * Remove a meeting room
   * Requirements: 5.1
   */
  async removeMeetingRoom(hotelId: string, roomId: string): Promise<BusinessFeatures> {
    const currentFeatures = await this.getBusinessFeatures(hotelId) || this.getDefaultBusinessFeatures();
    
    currentFeatures.meetingRooms = currentFeatures.meetingRooms.filter(
      room => room.id !== roomId
    );

    return this.updateBusinessFeatures(hotelId, currentFeatures);
  }

  /**
   * Update business center information
   * Requirements: 5.4
   */
  async updateBusinessCenter(
    hotelId: string,
    businessCenter: BusinessCenter,
  ): Promise<BusinessFeatures> {
    this.validateBusinessCenter(businessCenter);
    
    return this.updateBusinessFeatures(hotelId, { businessCenter });
  }

  /**
   * Update connectivity details
   * Requirements: 5.2
   */
  async updateConnectivityDetails(
    hotelId: string,
    connectivity: ConnectivityDetails,
  ): Promise<BusinessFeatures> {
    this.validateConnectivityDetails(connectivity);
    
    return this.updateBusinessFeatures(hotelId, { connectivity });
  }

  /**
   * Add or update a workspace
   * Requirements: 5.3
   */
  async addOrUpdateWorkSpace(
    hotelId: string,
    workSpace: WorkSpace,
  ): Promise<BusinessFeatures> {
    const currentFeatures = await this.getBusinessFeatures(hotelId) || this.getDefaultBusinessFeatures();
    
    // Validate workspace data
    this.validateWorkSpace(workSpace);

    // Find existing workspace or add new one
    const existingWorkspaceIndex = currentFeatures.workSpaces.findIndex(
      ws => ws.id === workSpace.id
    );

    if (existingWorkspaceIndex >= 0) {
      currentFeatures.workSpaces[existingWorkspaceIndex] = workSpace;
    } else {
      currentFeatures.workSpaces.push(workSpace);
    }

    return this.updateBusinessFeatures(hotelId, currentFeatures);
  }

  /**
   * Remove a workspace
   * Requirements: 5.3
   */
  async removeWorkSpace(hotelId: string, workspaceId: string): Promise<BusinessFeatures> {
    const currentFeatures = await this.getBusinessFeatures(hotelId) || this.getDefaultBusinessFeatures();
    
    currentFeatures.workSpaces = currentFeatures.workSpaces.filter(
      ws => ws.id !== workspaceId
    );

    return this.updateBusinessFeatures(hotelId, currentFeatures);
  }

  /**
   * Update business services
   * Requirements: 5.4
   */
  async updateBusinessServices(
    hotelId: string,
    services: BusinessService[],
  ): Promise<BusinessFeatures> {
    // Validate each service
    services.forEach(service => this.validateBusinessService(service));
    
    return this.updateBusinessFeatures(hotelId, { services });
  }

  /**
   * Get formatted business features for customer display
   * Requirements: 5.5
   */
  async getFormattedBusinessFeatures(hotelId: string): Promise<any> {
    const features = await this.getBusinessFeatures(hotelId);
    
    if (!features) {
      return null;
    }

    return {
      meetingFacilities: {
        available: features.meetingRooms.length > 0,
        totalRooms: features.meetingRooms.length,
        maxCapacity: Math.max(...features.meetingRooms.map(room => room.capacity), 0),
        rooms: features.meetingRooms.map(room => ({
          name: room.name,
          capacity: room.capacity,
          layout: room.layout,
          equipment: room.equipment.map(eq => eq.name),
          bookingRequired: !!room.bookingProcedure,
          hourlyRate: room.hourlyRate,
        })),
      },
      businessCenter: {
        available: features.businessCenter.available,
        hours: this.formatOperatingHours(features.businessCenter.hours),
        services: features.businessCenter.services,
        staffed: features.businessCenter.staffed,
      },
      connectivity: {
        wifiSpeed: `${features.connectivity.wifiSpeed.download}/${features.connectivity.wifiSpeed.upload} Mbps`,
        businessGrade: features.connectivity.businessGrade,
        coverage: features.connectivity.coverage.map(area => ({
          area: area.area,
          quality: area.signalStrength,
        })),
        reliability: `${features.connectivity.reliability.uptime}% uptime`,
        wiredInternet: features.connectivity.wiredInternet,
        publicComputers: features.connectivity.publicComputers,
      },
      workSpaces: features.workSpaces.map(ws => ({
        name: ws.name,
        type: this.formatWorkspaceType(ws.type),
        capacity: ws.capacity,
        available24x7: ws.isAccessible24x7,
        amenities: ws.amenities,
        powerOutlets: ws.powerOutlets,
        lighting: ws.lighting,
      })),
      services: features.services
        .filter(service => service.available)
        .map(service => ({
          name: service.name,
          description: service.description,
          fee: service.fee ? `₹${service.fee}` : 'Complimentary',
          hours: service.hours ? this.formatOperatingHours(service.hours) : '24/7',
        })),
    };
  }

  // Private helper methods

  private getDefaultBusinessFeatures(): BusinessFeatures {
    return {
      meetingRooms: [],
      businessCenter: {
        available: false,
        hours: this.getDefault24x7Hours(),
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
    };
  }

  private getDefault24x7Hours(): OperatingHours {
    const defaultHours = { open: '00:00', close: '23:59' };
    return {
      monday: defaultHours,
      tuesday: defaultHours,
      wednesday: defaultHours,
      thursday: defaultHours,
      friday: defaultHours,
      saturday: defaultHours,
      sunday: defaultHours,
      is24x7: true,
    };
  }

  private validateBusinessFeatures(features: BusinessFeatures): void {
    if (!features.meetingRooms || !Array.isArray(features.meetingRooms)) {
      throw new BadRequestException('Meeting rooms must be an array');
    }

    if (!features.businessCenter) {
      throw new BadRequestException('Business center information is required');
    }

    if (!features.connectivity) {
      throw new BadRequestException('Connectivity details are required');
    }

    if (!features.workSpaces || !Array.isArray(features.workSpaces)) {
      throw new BadRequestException('Work spaces must be an array');
    }

    if (!features.services || !Array.isArray(features.services)) {
      throw new BadRequestException('Services must be an array');
    }

    // Validate each component
    features.meetingRooms.forEach(room => this.validateMeetingRoom(room));
    this.validateBusinessCenter(features.businessCenter);
    this.validateConnectivityDetails(features.connectivity);
    features.workSpaces.forEach(ws => this.validateWorkSpace(ws));
    features.services.forEach(service => this.validateBusinessService(service));
  }

  private validateMeetingRoom(room: MeetingRoom): void {
    if (!room.id || !room.name) {
      throw new BadRequestException('Meeting room must have ID and name');
    }

    if (!room.capacity || room.capacity <= 0) {
      throw new BadRequestException('Meeting room capacity must be greater than 0');
    }

    if (!room.equipment || !Array.isArray(room.equipment)) {
      throw new BadRequestException('Meeting room equipment must be an array');
    }

    if (!room.bookingProcedure) {
      throw new BadRequestException('Meeting room booking procedure is required');
    }

    if (!['theater', 'classroom', 'boardroom', 'u_shape', 'banquet'].includes(room.layout)) {
      throw new BadRequestException('Invalid meeting room layout');
    }
  }

  private validateBusinessCenter(center: BusinessCenter): void {
    if (typeof center.available !== 'boolean') {
      throw new BadRequestException('Business center availability must be boolean');
    }

    if (!center.hours) {
      throw new BadRequestException('Business center hours are required');
    }

    if (!center.services || !Array.isArray(center.services)) {
      throw new BadRequestException('Business center services must be an array');
    }

    if (!center.equipment || !Array.isArray(center.equipment)) {
      throw new BadRequestException('Business center equipment must be an array');
    }

    if (typeof center.staffed !== 'boolean') {
      throw new BadRequestException('Business center staffed status must be boolean');
    }
  }

  private validateConnectivityDetails(connectivity: ConnectivityDetails): void {
    if (!connectivity.wifiSpeed) {
      throw new BadRequestException('WiFi speed information is required');
    }

    if (connectivity.wifiSpeed.download < 0 || connectivity.wifiSpeed.upload < 0) {
      throw new BadRequestException('WiFi speeds must be non-negative');
    }

    if (!connectivity.coverage || !Array.isArray(connectivity.coverage)) {
      throw new BadRequestException('Coverage areas must be an array');
    }

    if (!connectivity.reliability) {
      throw new BadRequestException('Reliability metrics are required');
    }

    if (connectivity.reliability.uptime < 0 || connectivity.reliability.uptime > 100) {
      throw new BadRequestException('Uptime must be between 0 and 100');
    }

    if (typeof connectivity.businessGrade !== 'boolean') {
      throw new BadRequestException('Business grade status must be boolean');
    }

    if (typeof connectivity.wiredInternet !== 'boolean') {
      throw new BadRequestException('Wired internet availability must be boolean');
    }

    if (connectivity.publicComputers < 0) {
      throw new BadRequestException('Public computers count must be non-negative');
    }
  }

  private validateWorkSpace(workspace: WorkSpace): void {
    if (!workspace.id || !workspace.name) {
      throw new BadRequestException('Workspace must have ID and name');
    }

    if (!['quiet_zone', 'co_working', 'business_lounge'].includes(workspace.type)) {
      throw new BadRequestException('Invalid workspace type');
    }

    if (!workspace.capacity || workspace.capacity <= 0) {
      throw new BadRequestException('Workspace capacity must be greater than 0');
    }

    if (!workspace.hours) {
      throw new BadRequestException('Workspace hours are required');
    }

    if (!workspace.amenities || !Array.isArray(workspace.amenities)) {
      throw new BadRequestException('Workspace amenities must be an array');
    }

    if (typeof workspace.isAccessible24x7 !== 'boolean') {
      throw new BadRequestException('24x7 accessibility status must be boolean');
    }

    if (workspace.powerOutlets < 0) {
      throw new BadRequestException('Power outlets count must be non-negative');
    }

    if (!['natural', 'artificial', 'mixed'].includes(workspace.lighting)) {
      throw new BadRequestException('Invalid lighting type');
    }
  }

  private validateBusinessService(service: BusinessService): void {
    if (!service.name || !service.description) {
      throw new BadRequestException('Service must have name and description');
    }

    if (typeof service.available !== 'boolean') {
      throw new BadRequestException('Service availability must be boolean');
    }

    if (service.fee && service.fee < 0) {
      throw new BadRequestException('Service fee must be non-negative');
    }
  }

  private formatOperatingHours(hours: OperatingHours): string {
    if (hours.is24x7) {
      return '24/7';
    }

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const openDays = days.filter(day => hours[day] !== null);
    
    if (openDays.length === 0) {
      return 'Closed';
    }

    if (openDays.length === 7) {
      const firstDay = hours[openDays[0]];
      const allSameHours = openDays.every(day => 
        hours[day]?.open === firstDay?.open && hours[day]?.close === firstDay?.close
      );
      
      if (allSameHours) {
        return `Daily ${firstDay?.open} - ${firstDay?.close}`;
      }
    }

    return openDays.map(day => {
      const dayHours = hours[day];
      return `${day.charAt(0).toUpperCase() + day.slice(1)}: ${dayHours?.open} - ${dayHours?.close}`;
    }).join(', ');
  }

  private formatWorkspaceType(type: string): string {
    switch (type) {
      case 'quiet_zone':
        return 'Quiet Zone';
      case 'co_working':
        return 'Co-working Space';
      case 'business_lounge':
        return 'Business Lounge';
      default:
        return type;
    }
  }
}