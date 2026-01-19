import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../config/database.config';
import { Hotel } from '../modules/hotels/entities/hotel.entity';
import { Room } from '../modules/rooms/entities/room.entity';
import { EnhancedHotel } from '../modules/hotels/entities/enhanced-hotel.entity';
import { EnhancedRoom } from '../modules/rooms/entities/enhanced-room.entity';
import { PropertyType, OnboardingStatus } from '../modules/hotels/interfaces/enhanced-hotel.interface';
import { RoomType } from '../modules/rooms/interfaces/enhanced-room.interface';

/**
 * Data Migration Script for Enhanced Hotel Onboarding System
 * Requirements: 8.5 - Preserve existing hotel data while enhancing it with new structured information
 * 
 * This script migrates existing hotel and room data to the enhanced schema
 * while preserving all original information and maintaining referential integrity.
 */

async function migrateExistingData() {
  console.log('🚀 Starting data migration for Enhanced Hotel Onboarding System...');
  
  const dataSource = new DataSource(dataSourceOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Get repositories
    const hotelRepository = dataSource.getRepository(Hotel);
    const roomRepository = dataSource.getRepository(Room);
    const enhancedHotelRepository = dataSource.getRepository(EnhancedHotel);
    const enhancedRoomRepository = dataSource.getRepository(EnhancedRoom);

    // Check if migration has already been run
    const existingEnhancedHotels = await enhancedHotelRepository.count();
    if (existingEnhancedHotels > 0) {
      console.log('⚠️  Enhanced hotels already exist. Skipping migration to prevent duplicates.');
      console.log(`Found ${existingEnhancedHotels} existing enhanced hotels.`);
      return;
    }

    // Fetch all existing hotels with their rooms
    const existingHotels = await hotelRepository.find({
      relations: ['rooms', 'owner'],
    });

    console.log(`📊 Found ${existingHotels.length} existing hotels to migrate`);

    let migratedHotels = 0;
    let migratedRooms = 0;

    for (const hotel of existingHotels) {
      console.log(`🏨 Migrating hotel: ${hotel.name}`);

      // Map hotel type to property type
      const propertyTypeMapping: { [key: string]: PropertyType } = {
        'HOTEL': PropertyType.HOTEL,
        'RESORT': PropertyType.RESORT,
        'GUEST_HOUSE': PropertyType.GUEST_HOUSE,
        'HOMESTAY': PropertyType.HOMESTAY,
        'APARTMENT': PropertyType.APARTMENT,
      };

      // Create enhanced hotel
      const enhancedHotel = new EnhancedHotel();
      enhancedHotel.basicInfo = {
        name: hotel.name,
        propertyType: propertyTypeMapping[hotel.hotelType] || PropertyType.HOTEL,
        starRating: undefined, // Not available in original schema
        contactInfo: {
          phone: hotel.phone,
          email: hotel.email || undefined,
          website: hotel.website || undefined,
        },
        address: {
          street: hotel.address,
          city: hotel.city,
          state: hotel.state,
          pincode: hotel.pincode,
          country: 'India', // Default assumption
          latitude: hotel.latitude || undefined,
          longitude: hotel.longitude || undefined,
        },
        totalRooms: hotel.rooms?.length || 0,
      };

      // Migrate property description
      if (hotel.description) {
        enhancedHotel.propertyDescription = {
          content: hotel.description,
          format: 'markdown',
          wordCount: hotel.description.split(' ').length,
          readingTime: Math.ceil(hotel.description.split(' ').length / 200), // Assuming 200 words per minute
        };
      }

      // Migrate amenities to categorized structure
      if (hotel.amenities && hotel.amenities.length > 0) {
        enhancedHotel.amenities = {
          propertyWide: hotel.amenities,
          roomSpecific: [],
          business: [],
          wellness: [],
          dining: [],
          sustainability: [],
          recreational: [],
          connectivity: [],
        };
      }

      // Migrate images to categorized structure
      if (hotel.images && hotel.images.length > 0) {
        enhancedHotel.images = {
          exterior: hotel.images.map((url, index) => ({
            id: `migrated-${hotel.id}-${index}`,
            originalUrl: url,
            optimizedUrls: {},
            thumbnails: {
              small: url,
              medium: url,
              large: url,
            },
            metadata: {
              filename: `migrated-image-${index}`,
              size: 0,
              dimensions: { width: 0, height: 0 },
              format: 'unknown',
              uploadedAt: hotel.createdAt,
              uploadedBy: hotel.ownerId,
              qualityChecks: {
                passed: true,
                score: 50, // Default score for migrated images
                issues: [],
                recommendations: ['Consider uploading higher quality images'],
              },
              tags: ['migrated'],
            },
            qualityScore: 50,
            category: 'EXTERIOR' as any,
          })),
          lobby: [],
          rooms: [],
          amenities: [],
          dining: [],
          recreational: [],
          business: [],
          virtualTours: [],
        };
      }

      // Set initial quality metrics
      enhancedHotel.qualityMetrics = {
        overallScore: 40, // Low initial score to encourage completion
        imageQuality: hotel.images?.length ? 30 : 0,
        contentCompleteness: hotel.description ? 50 : 20,
        policyClarity: 20, // No policies in original schema
        lastCalculated: new Date(),
        breakdown: {
          imageQuality: {
            score: hotel.images?.length ? 30 : 0,
            weight: 0.4,
            factors: {
              totalImages: hotel.images?.length || 0,
              highQualityImages: 0,
              categoryCoverage: hotel.images?.length ? 1 : 0,
              professionalPhotos: 0,
            },
          },
          contentCompleteness: {
            score: hotel.description ? 50 : 20,
            weight: 0.4,
            factors: {
              descriptionQuality: hotel.description ? 50 : 0,
              amenityCompleteness: hotel.amenities?.length ? 60 : 20,
              locationDetails: 30, // Basic location info available
              roomInformation: 20, // Will be updated after room migration
            },
          },
          policyClarity: {
            score: 20,
            weight: 0.2,
            factors: {
              cancellationPolicy: 0,
              checkInOut: 0,
              bookingTerms: 0,
              additionalPolicies: 0,
            },
          },
        },
      };

      enhancedHotel.onboardingStatus = OnboardingStatus.IN_PROGRESS;
      enhancedHotel.originalHotelId = hotel.id;
      enhancedHotel.ownerId = hotel.ownerId;

      // Save enhanced hotel
      const savedEnhancedHotel = await enhancedHotelRepository.save(enhancedHotel);
      migratedHotels++;

      // Migrate rooms
      if (hotel.rooms && hotel.rooms.length > 0) {
        for (const room of hotel.rooms) {
          console.log(`🛏️  Migrating room: ${room.name}`);

          const enhancedRoom = new EnhancedRoom();
          
          // Map room type
          const roomTypeMapping: { [key: string]: RoomType } = {
            'SINGLE': RoomType.SINGLE,
            'DOUBLE': RoomType.DOUBLE,
            'DELUXE': RoomType.DELUXE,
            'SUITE': RoomType.SUITE,
            'FAMILY': RoomType.FAMILY,
          };

          enhancedRoom.basicInfo = {
            name: room.name,
            type: roomTypeMapping[room.roomType] || RoomType.DOUBLE,
            capacity: {
              adults: room.maxOccupancy,
              children: 0,
              infants: 0,
              maxOccupancy: room.maxOccupancy,
            },
            size: {
              area: room.roomSize || 25, // Default size if not available
              unit: 'sqm',
            },
            bedConfiguration: {
              beds: [{
                type: room.bedType?.toUpperCase() as any || 'QUEEN',
                count: room.bedCount,
                size: room.bedType || 'Queen Size',
              }],
              totalBeds: room.bedCount,
              sofaBeds: 0,
              cribs: 0,
            },
            roomNumber: room.name,
          };

          // Migrate room description
          if (room.description) {
            enhancedRoom.description = {
              content: room.description,
              format: 'markdown',
              wordCount: room.description.split(' ').length,
              readingTime: Math.ceil(room.description.split(' ').length / 200),
            };
          }

          // Migrate room amenities
          if (room.amenities && room.amenities.length > 0) {
            enhancedRoom.amenities = {
              inherited: [], // Will be populated from hotel amenities
              specific: room.amenities,
              overrides: [],
            };
          }

          // Migrate room images
          if (room.images && room.images.length > 0) {
            enhancedRoom.images = room.images.map((url, index) => ({
              id: `migrated-room-${room.id}-${index}`,
              originalUrl: url,
              optimizedUrls: {},
              thumbnails: {
                small: url,
                medium: url,
                large: url,
              },
              metadata: {
                filename: `migrated-room-image-${index}`,
                size: 0,
                dimensions: { width: 0, height: 0 },
                format: 'unknown',
                uploadedAt: room.createdAt,
                uploadedBy: hotel.ownerId,
                qualityChecks: {
                  passed: true,
                  score: 50,
                  issues: [],
                  recommendations: ['Consider uploading higher quality images'],
                },
                tags: ['migrated'],
              },
              qualityScore: 50,
              category: 'ROOMS' as any,
            }));
          }

          // Set room pricing
          enhancedRoom.pricing = {
            basePrice: room.basePrice,
            weekendPrice: room.weekendPrice || undefined,
            seasonalPricing: [],
            currency: 'INR',
            taxesIncluded: false,
          };

          // Set room availability
          enhancedRoom.availability = {
            isActive: room.status === 'AVAILABLE',
            availabilityRules: [],
            blackoutDates: [],
            minimumStay: 1,
            advanceBookingDays: 365,
          };

          // Set initial quality metrics
          enhancedRoom.qualityMetrics = {
            overallScore: 35,
            imageQuality: room.images?.length ? 30 : 0,
            descriptionQuality: room.description ? 40 : 20,
            amenityCompleteness: room.amenities?.length ? 50 : 20,
            lastUpdated: new Date(),
            maintenanceScore: 80, // Assume good maintenance for existing rooms
          };

          enhancedRoom.originalRoomId = room.id;
          enhancedRoom.enhancedHotelId = savedEnhancedHotel.id;

          await enhancedRoomRepository.save(enhancedRoom);
          migratedRooms++;
        }
      }

      console.log(`✅ Migrated hotel: ${hotel.name} with ${hotel.rooms?.length || 0} rooms`);
    }

    console.log(`🎉 Migration completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   - Hotels migrated: ${migratedHotels}`);
    console.log(`   - Rooms migrated: ${migratedRooms}`);
    console.log(`   - All original data preserved with backward compatibility`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateExistingData()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateExistingData };