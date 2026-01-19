import { EnhancedHotel } from '../../src/modules/hotels/entities/enhanced-hotel.entity';
import { EnhancedRoom } from '../../src/modules/rooms/entities/enhanced-room.entity';
import { AmenityDefinition } from '../../src/modules/hotels/entities/amenity-definition.entity';
import { OnboardingSession } from '../../src/modules/hotels/entities/onboarding-session.entity';
import { ImageMetadata } from '../../src/modules/hotels/entities/image-metadata.entity';
import { QualityReport } from '../../src/modules/hotels/entities/quality-report.entity';
import { 
  PropertyType, 
  OnboardingStatus, 
  AmenityCategory 
} from '../../src/modules/hotels/interfaces/enhanced-hotel.interface';
import { RoomType } from '../../src/modules/rooms/interfaces/enhanced-room.interface';

describe('Enhanced Hotel Onboarding Models', () => {
  describe('EnhancedHotel Entity', () => {
    it('should create an enhanced hotel with basic info', () => {
      const hotel = new EnhancedHotel();
      hotel.basicInfo = {
        name: 'Test Hotel',
        propertyType: PropertyType.HOTEL,
        starRating: 4,
        contactInfo: {
          phone: '+91-9876543210',
          email: 'test@hotel.com',
        },
        address: {
          street: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India',
        },
        totalRooms: 50,
      };
      hotel.onboardingStatus = OnboardingStatus.IN_PROGRESS;
      hotel.ownerId = 'test-owner-id';

      expect(hotel.getPropertyType()).toBe(PropertyType.HOTEL);
      expect(hotel.isOnboardingComplete()).toBe(false);
      expect(hotel.getTotalAmenities()).toBe(0);
      expect(hotel.getTotalImages()).toBe(0);
    });

    it('should calculate total amenities correctly', () => {
      const hotel = new EnhancedHotel();
      hotel.amenities = {
        propertyWide: ['wifi', 'parking'],
        roomSpecific: ['ac', 'tv'],
        business: ['meeting-room'],
        wellness: ['gym'],
        dining: ['restaurant'],
        sustainability: ['solar'],
        recreational: ['pool'],
        connectivity: ['high-speed-wifi'],
      };

      expect(hotel.getTotalAmenities()).toBe(10);
    });
  });

  describe('EnhancedRoom Entity', () => {
    it('should create an enhanced room with basic info', () => {
      const room = new EnhancedRoom();
      room.basicInfo = {
        name: 'Deluxe Room 101',
        type: RoomType.DELUXE,
        capacity: {
          adults: 2,
          children: 1,
          infants: 0,
          maxOccupancy: 3,
        },
        size: {
          area: 35,
          unit: 'sqm',
        },
        bedConfiguration: {
          beds: [{
            type: 'QUEEN' as any,
            count: 1,
            size: 'Queen Size',
          }],
          totalBeds: 1,
          sofaBeds: 0,
          cribs: 0,
        },
      };
      room.enhancedHotelId = 'test-hotel-id';

      expect(room.getRoomType()).toBe(RoomType.DELUXE);
      expect(room.getMaxOccupancy()).toBe(3);
      expect(room.getRoomSize()).toBe(35);
      expect(room.getTotalAmenities()).toBe(0);
      expect(room.getImageCount()).toBe(0);
      expect(room.hasVirtualTour()).toBe(false);
    });

    it('should calculate amenities correctly with inheritance', () => {
      const room = new EnhancedRoom();
      room.amenities = {
        inherited: ['wifi', 'parking'],
        specific: ['balcony', 'minibar'],
        overrides: [],
      };

      expect(room.getTotalAmenities()).toBe(4);
    });
  });

  describe('AmenityDefinition Entity', () => {
    it('should create amenity definition with business rules', () => {
      const amenity = new AmenityDefinition();
      amenity.name = 'Swimming Pool';
      amenity.category = AmenityCategory.RECREATIONAL;
      amenity.isEcoFriendly = false;
      amenity.applicablePropertyTypes = [PropertyType.HOTEL, PropertyType.RESORT];
      amenity.businessRules = [
        {
          type: 'requires',
          amenityId: 'pool-maintenance',
          condition: 'outdoor_pool',
        },
      ];

      expect(amenity.isApplicableToPropertyType(PropertyType.HOTEL)).toBe(true);
      expect(amenity.isApplicableToPropertyType(PropertyType.HOMESTAY)).toBe(false);
      expect(amenity.hasBusinessRules()).toBe(true);
      expect(amenity.getBusinessRulesByType('requires')).toHaveLength(1);
    });
  });

  describe('OnboardingSession Entity', () => {
    it('should track onboarding progress', () => {
      const session = new OnboardingSession();
      session.currentStep = 3;
      session.completedSteps = ['step1', 'step2', 'step3'];
      session.qualityScore = 65.5;
      session.sessionStatus = 'ACTIVE' as any;
      session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      expect(session.isActive()).toBe(true);
      expect(session.isExpired()).toBe(false);
      expect(session.getCompletionPercentage()).toBeCloseTo(21.43, 1); // 3/14 * 100
      expect(session.isStepCompleted('step2')).toBe(true);
      expect(session.isStepCompleted('step5')).toBe(false);
    });

    it('should handle draft data updates', () => {
      const session = new OnboardingSession();
      session.draftData = {};

      session.updateDraftData('amenities', { selected: ['wifi', 'parking'] });
      session.updateDraftData('images', { uploaded: 3 });

      expect(session.getDraftData('amenities')).toEqual({ selected: ['wifi', 'parking'] });
      expect(session.getDraftData('images')).toEqual({ uploaded: 3 });
      expect(session.getDraftData('nonexistent')).toBeUndefined();
    });
  });

  describe('ImageMetadata Entity', () => {
    it('should handle image metadata and quality checks', () => {
      const image = new ImageMetadata();
      image.filename = 'hotel-exterior.jpg';
      image.sizeBytes = 2048000; // 2MB
      image.dimensions = { width: 1920, height: 1080 };
      image.qualityScore = 85;
      image.qualityChecks = {
        passed: true,
        score: 85,
        issues: [],
        recommendations: [],
      };
      image.tags = ['exterior', 'professional'];

      expect(image.getFileSize()).toBe('2.0 MB');
      expect(image.getAspectRatio()).toBeCloseTo(1.78, 2);
      expect(image.isHighQuality()).toBe(true);
      expect(image.hasQualityIssues()).toBe(false);
      expect(image.hasTag('exterior')).toBe(true);
      expect(image.hasTag('interior')).toBe(false);
    });
  });

  describe('QualityReport Entity', () => {
    it('should calculate quality grades and recommendations', () => {
      const report = new QualityReport();
      report.overallScore = 75;
      report.imageQualityScore = 80;
      report.contentCompletenessScore = 70;
      report.policyClarityScore = 75;
      report.recommendations = [
        {
          type: 'image',
          title: 'Add more photos',
          description: 'Upload photos of amenities',
          priority: 'high',
          actionRequired: 'Upload 5 more photos',
          estimatedImpact: 10,
        },
        {
          type: 'content',
          title: 'Complete description',
          description: 'Add detailed property description',
          priority: 'medium',
          actionRequired: 'Write 200+ word description',
          estimatedImpact: 5,
        },
      ];

      expect(report.getScoreGrade()).toBe('C');
      expect(report.getScoreColor()).toBe('yellow');
      expect(report.isPassingGrade()).toBe(true);
      expect(report.needsImprovement()).toBe(true);
      expect(report.getHighPriorityRecommendations()).toHaveLength(1);
      expect(report.getTotalRecommendations()).toBe(2);
      expect(report.getEstimatedScoreImprovement()).toBe(10);
    });
  });
});