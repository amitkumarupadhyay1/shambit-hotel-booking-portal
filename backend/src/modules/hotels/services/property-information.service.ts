import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnhancedHotel } from '../entities/enhanced-hotel.entity';
import {
  RichTextContent,
  LocationDetails,
  HotelPolicies,
} from '../interfaces/enhanced-hotel.interface';
import {
  PropertyDescriptionUpdateDto,
  LocationDetailsUpdateDto,
  HotelPoliciesUpdateDto,
  PropertyInformationValidationResultDto,
  CustomerDisplayDto,
  CustomerDisplayLocationDto,
  CustomerDisplayPoliciesDto,
} from '../dto/property-information.dto';

@Injectable()
export class PropertyInformationService {
  constructor(
    @InjectRepository(EnhancedHotel)
    private readonly hotelRepository: Repository<EnhancedHotel>,
  ) {}

  async updatePropertyDescription(
    hotelId: string,
    descriptionData: PropertyDescriptionUpdateDto,
  ): Promise<RichTextContent> {
    if (!descriptionData.content || descriptionData.content.trim().length === 0) {
      throw new BadRequestException('Property description content cannot be empty');
    }

    if (descriptionData.content.length > 10000) {
      throw new BadRequestException('Property description content cannot exceed 10,000 characters');
    }

    const hotel = await this.hotelRepository.findOne({ where: { id: hotelId } });
    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${hotelId} not found`);
    }

    const wordCount = this.calculateWordCount(descriptionData.content);
    const readingTime = this.calculateReadingTime(wordCount);

    const richTextContent: RichTextContent = {
      content: descriptionData.content,
      format: descriptionData.format,
      wordCount,
      readingTime,
    };

    hotel.propertyDescription = richTextContent;
    await this.hotelRepository.save(hotel);

    return richTextContent;
  }

  async updateLocationDetails(
    hotelId: string,
    locationData: LocationDetailsUpdateDto | LocationDetails,
  ): Promise<LocationDetails> {
    const hotel = await this.hotelRepository.findOne({ where: { id: hotelId } });
    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${hotelId} not found`);
    }

    if (locationData.accessibility && locationData.accessibility.accessibleRooms < 0) {
      throw new BadRequestException('Number of accessible rooms cannot be negative');
    }

    const updatedLocationDetails: LocationDetails = {
      nearbyAttractions: locationData.nearbyAttractions || [],
      transportation: locationData.transportation || {
        publicTransport: [],
        parkingAvailable: false,
      },
      accessibility: locationData.accessibility || {
        wheelchairAccessible: false,
        elevatorAccess: false,
        brailleSignage: false,
        hearingAssistance: false,
        visualAssistance: false,
        accessibleRooms: 0,
        accessibleBathrooms: false,
      },
      neighborhood: locationData.neighborhood || {
        type: 'mixed',
        safetyRating: 3,
        noiseLevel: 'moderate',
        walkability: 3,
      },
    };

    hotel.locationDetails = updatedLocationDetails;
    await this.hotelRepository.save(hotel);

    return updatedLocationDetails;
  }

  async updateHotelPolicies(
    hotelId: string,
    policiesData: HotelPoliciesUpdateDto | HotelPolicies,
  ): Promise<HotelPolicies> {
    const hotel = await this.hotelRepository.findOne({ where: { id: hotelId } });
    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${hotelId} not found`);
    }

    if (policiesData.checkIn?.standardTime && !this.isValidTimeFormat(policiesData.checkIn.standardTime)) {
      throw new BadRequestException('Invalid check-in time format. Use HH:MM format.');
    }

    if (policiesData.checkOut?.standardTime && !this.isValidTimeFormat(policiesData.checkOut.standardTime)) {
      throw new BadRequestException('Invalid check-out time format. Use HH:MM format.');
    }

    const updatedPolicies: HotelPolicies = {
      checkIn: policiesData.checkIn || {
        standardTime: '15:00',
        requirements: ['Valid ID'],
        process: 'Standard check-in process',
      },
      checkOut: policiesData.checkOut || {
        standardTime: '11:00',
        lateCheckoutAvailable: false,
        process: 'Standard check-out process',
      },
      cancellation: policiesData.cancellation || {
        type: 'moderate',
        freeUntilHours: 24,
        penaltyPercentage: 50,
        noShowPolicy: 'Full charge for no-show',
        details: 'Standard cancellation policy',
      },
      booking: policiesData.booking || {
        advanceBookingDays: 365,
        instantBooking: true,
        requiresApproval: false,
        paymentTerms: 'Payment required at booking',
      },
      pet: policiesData.pet || {
        allowed: false,
      },
      smoking: policiesData.smoking || {
        allowed: false,
      },
    };

    hotel.policies = updatedPolicies;
    await this.hotelRepository.save(hotel);

    return updatedPolicies;
  }

  async getPropertyInformation(hotelId: string): Promise<{
    propertyDescription: RichTextContent | null;
    locationDetails: LocationDetails | null;
    policies: HotelPolicies | null;
  }> {
    const hotel = await this.hotelRepository.findOne({ where: { id: hotelId } });
    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${hotelId} not found`);
    }

    return {
      propertyDescription: hotel.propertyDescription || null,
      locationDetails: hotel.locationDetails || null,
      policies: hotel.policies || null,
    };
  }

  async validatePropertyInformation(hotelId: string): Promise<PropertyInformationValidationResultDto> {
    const hotel = await this.hotelRepository.findOne({ where: { id: hotelId } });
    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${hotelId} not found`);
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    let completenessScore = 0;
    let totalChecks = 0;

    totalChecks++;
    if (hotel.propertyDescription?.content && hotel.propertyDescription.content.length > 50) {
      completenessScore++;
    } else {
      errors.push('Property description is missing or too short');
    }

    totalChecks++;
    if (hotel.locationDetails?.nearbyAttractions && hotel.locationDetails.nearbyAttractions.length > 0) {
      completenessScore++;
    } else {
      warnings.push('No nearby attractions listed');
    }

    totalChecks++;
    if (hotel.locationDetails?.transportation) {
      completenessScore++;
    } else {
      warnings.push('Transportation information is incomplete');
    }

    totalChecks++;
    if (hotel.locationDetails?.accessibility) {
      completenessScore++;
    } else {
      warnings.push('Accessibility information is missing');
    }

    totalChecks++;
    if (hotel.policies?.checkIn && hotel.policies?.checkOut) {
      completenessScore++;
    } else {
      errors.push('Check-in and check-out policies are required');
    }

    totalChecks++;
    if (hotel.policies?.cancellation) {
      completenessScore++;
    } else {
      errors.push('Cancellation policy is required');
    }

    totalChecks++;
    if (hotel.policies?.booking) {
      completenessScore++;
    } else {
      warnings.push('Booking policy should be specified');
    }

    const finalScore = Math.round((completenessScore / totalChecks) * 100);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completenessScore: finalScore,
    };
  }

  formatForCustomerDisplay(
    propertyDescription?: RichTextContent | null,
    locationDetails?: LocationDetails | null,
    policies?: HotelPolicies | null,
  ): CustomerDisplayDto {
    const description = propertyDescription?.content || 'Property description not available';

    const location: CustomerDisplayLocationDto = {
      attractions: [],
      transportation: [],
      accessibility: [],
    };

    if (locationDetails?.nearbyAttractions) {
      location.attractions = locationDetails.nearbyAttractions.map(
        (attraction) => `${attraction.name} (${attraction.distance}km) - ${attraction.type}`,
      );
    }

    if (locationDetails?.transportation) {
      const transport = locationDetails.transportation;
      if (transport.nearestAirport) {
        location.transportation.push(
          `Airport: ${transport.nearestAirport.name} (${transport.nearestAirport.distance}km)`,
        );
      }
      if (transport.nearestRailway) {
        location.transportation.push(
          `Railway: ${transport.nearestRailway.name} (${transport.nearestRailway.distance}km)`,
        );
      }
      if (transport.publicTransport.length > 0) {
        location.transportation.push(`Public Transport: ${transport.publicTransport.join(', ')}`);
      }
      if (transport.parkingAvailable) {
        location.transportation.push(`Parking: ${transport.parkingType || 'Available'}`);
      }
    }

    if (locationDetails?.accessibility) {
      const access = locationDetails.accessibility;
      if (access.wheelchairAccessible) {
        location.accessibility.push('Wheelchair accessible');
      }
      if (access.elevatorAccess) {
        location.accessibility.push('Elevator access');
      }
      if (access.accessibleRooms > 0) {
        location.accessibility.push(`${access.accessibleRooms} accessible rooms`);
      }
      if (access.brailleSignage) {
        location.accessibility.push('Braille signage');
      }
      if (access.hearingAssistance) {
        location.accessibility.push('Hearing assistance');
      }
      if (access.visualAssistance) {
        location.accessibility.push('Visual assistance');
      }
    }

    const policiesDisplay: CustomerDisplayPoliciesDto = {
      checkIn: 'Check-in information not available',
      checkOut: 'Check-out information not available',
      cancellation: 'Cancellation policy not available',
      important: [],
    };

    if (policies?.checkIn) {
      policiesDisplay.checkIn = `Check-in: ${policies.checkIn.standardTime}`;
      if (policies.checkIn.earliestTime) {
        policiesDisplay.checkIn += ` (earliest: ${policies.checkIn.earliestTime})`;
      }
    }

    if (policies?.checkOut) {
      policiesDisplay.checkOut = `Check-out: ${policies.checkOut.standardTime}`;
      if (policies.checkOut.lateCheckoutAvailable) {
        policiesDisplay.checkOut += ' (late check-out available)';
      }
    }

    if (policies?.cancellation) {
      policiesDisplay.cancellation = `Cancellation: ${policies.cancellation.type} - Free until ${policies.cancellation.freeUntilHours} hours before check-in`;
    }

    if (policies?.pet?.allowed) {
      policiesDisplay.important.push('Pet-friendly property');
    }
    if (policies?.smoking?.allowed) {
      policiesDisplay.important.push('Smoking allowed in designated areas');
    }
    if (policies?.booking?.instantBooking) {
      policiesDisplay.important.push('Instant booking available');
    }

    return {
      description,
      location,
      policies: policiesDisplay,
    };
  }

  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return false;
    }

    const [hours, minutes] = time.split(':').map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  }

  private calculateWordCount(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private calculateReadingTime(wordCount: number): number {
    return Math.max(1, Math.ceil(wordCount / 200));
  }
}