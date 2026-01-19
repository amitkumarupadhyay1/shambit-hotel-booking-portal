import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PropertyInformationService } from '../services/property-information.service';
import {
  PropertyDescriptionUpdateDto,
  LocationDetailsUpdateDto,
  HotelPoliciesUpdateDto,
  PropertyInformationValidationResultDto,
  CustomerDisplayDto,
} from '../dto/property-information.dto';
import {
  RichTextContent,
  LocationDetails,
  HotelPolicies,
} from '../interfaces/enhanced-hotel.interface';

@Controller('hotels/:hotelId/property-information')
@UseGuards(JwtAuthGuard)
export class PropertyInformationController {
  constructor(
    private readonly propertyInformationService: PropertyInformationService,
  ) {}

  @Put('description')
  async updatePropertyDescription(
    @Param('hotelId', ParseUUIDPipe) hotelId: string,
    @Body() descriptionData: PropertyDescriptionUpdateDto,
  ): Promise<RichTextContent> {
    return this.propertyInformationService.updatePropertyDescription(
      hotelId,
      descriptionData,
    );
  }

  @Put('location')
  async updateLocationDetails(
    @Param('hotelId', ParseUUIDPipe) hotelId: string,
    @Body() locationData: LocationDetailsUpdateDto,
  ): Promise<LocationDetails> {
    return this.propertyInformationService.updateLocationDetails(
      hotelId,
      locationData,
    );
  }

  @Put('policies')
  async updateHotelPolicies(
    @Param('hotelId', ParseUUIDPipe) hotelId: string,
    @Body() policiesData: HotelPoliciesUpdateDto,
  ): Promise<HotelPolicies> {
    return this.propertyInformationService.updateHotelPolicies(
      hotelId,
      policiesData,
    );
  }

  @Get()
  async getPropertyInformation(
    @Param('hotelId', ParseUUIDPipe) hotelId: string,
  ): Promise<{
    propertyDescription: RichTextContent | null;
    locationDetails: LocationDetails | null;
    policies: HotelPolicies | null;
  }> {
    return this.propertyInformationService.getPropertyInformation(hotelId);
  }

  @Get('validation')
  async validatePropertyInformation(
    @Param('hotelId', ParseUUIDPipe) hotelId: string,
  ): Promise<PropertyInformationValidationResultDto> {
    return this.propertyInformationService.validatePropertyInformation(hotelId);
  }

  @Get('customer-display')
  async getCustomerDisplay(
    @Param('hotelId', ParseUUIDPipe) hotelId: string,
  ): Promise<CustomerDisplayDto> {
    const propertyInfo = await this.propertyInformationService.getPropertyInformation(hotelId);
    
    return this.propertyInformationService.formatForCustomerDisplay(
      propertyInfo.propertyDescription,
      propertyInfo.locationDetails,
      propertyInfo.policies,
    );
  }
}