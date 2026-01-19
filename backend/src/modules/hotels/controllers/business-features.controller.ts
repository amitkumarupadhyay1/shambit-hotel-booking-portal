import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { BusinessFeaturesService } from '../services/business-features.service';
import {
  BusinessFeaturesDto,
  UpdateBusinessFeaturesDto,
  MeetingRoomDto,
  BusinessCenterDto,
  ConnectivityDetailsDto,
  WorkSpaceDto,
  BusinessServiceDto,
} from '../dto/business-features.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('hotels/:hotelId/business-features')
export class BusinessFeaturesController {
  constructor(
    private readonly businessFeaturesService: BusinessFeaturesService,
  ) {}

  @Get()
  async getBusinessFeatures(@Param('hotelId') hotelId: string) {
    return this.businessFeaturesService.getBusinessFeatures(hotelId);
  }

  @Put()
  async updateBusinessFeatures(
    @Param('hotelId') hotelId: string,
    @Body() updateBusinessFeaturesDto: UpdateBusinessFeaturesDto,
  ) {
    return this.businessFeaturesService.updateBusinessFeatures(
      hotelId,
      updateBusinessFeaturesDto as any, // Type assertion to handle DTO compatibility
    );
  }

  @Get('formatted')
  async getFormattedBusinessFeatures(@Param('hotelId') hotelId: string) {
    return this.businessFeaturesService.getFormattedBusinessFeatures(hotelId);
  }

  // Meeting Rooms endpoints
  @Post('meeting-rooms')
  async addOrUpdateMeetingRoom(
    @Param('hotelId') hotelId: string,
    @Body() meetingRoomDto: MeetingRoomDto,
  ) {
    return this.businessFeaturesService.addOrUpdateMeetingRoom(
      hotelId,
      meetingRoomDto as any, // Type assertion to handle DTO compatibility
    );
  }

  @Delete('meeting-rooms/:roomId')
  async removeMeetingRoom(
    @Param('hotelId') hotelId: string,
    @Param('roomId') roomId: string,
  ) {
    return this.businessFeaturesService.removeMeetingRoom(hotelId, roomId);
  }

  // Business Center endpoints
  @Put('business-center')
  async updateBusinessCenter(
    @Param('hotelId') hotelId: string,
    @Body() businessCenterDto: BusinessCenterDto,
  ) {
    return this.businessFeaturesService.updateBusinessCenter(
      hotelId,
      businessCenterDto as any, // Type assertion to handle DTO compatibility
    );
  }

  // Connectivity endpoints
  @Put('connectivity')
  async updateConnectivityDetails(
    @Param('hotelId') hotelId: string,
    @Body() connectivityDto: ConnectivityDetailsDto,
  ) {
    return this.businessFeaturesService.updateConnectivityDetails(
      hotelId,
      connectivityDto as any, // Type assertion to handle DTO compatibility
    );
  }

  // Work Spaces endpoints
  @Post('workspaces')
  async addOrUpdateWorkSpace(
    @Param('hotelId') hotelId: string,
    @Body() workSpaceDto: WorkSpaceDto,
  ) {
    return this.businessFeaturesService.addOrUpdateWorkSpace(
      hotelId,
      workSpaceDto as any, // Type assertion to handle DTO compatibility
    );
  }

  @Delete('workspaces/:workspaceId')
  async removeWorkSpace(
    @Param('hotelId') hotelId: string,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.businessFeaturesService.removeWorkSpace(hotelId, workspaceId);
  }

  // Business Services endpoints
  @Put('services')
  async updateBusinessServices(
    @Param('hotelId') hotelId: string,
    @Body() services: BusinessServiceDto[],
  ) {
    return this.businessFeaturesService.updateBusinessServices(hotelId, services as any);
  }
}