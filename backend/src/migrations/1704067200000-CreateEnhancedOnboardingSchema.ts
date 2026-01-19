import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEnhancedOnboardingSchema1704067200000 implements MigrationInterface {
  name = 'CreateEnhancedOnboardingSchema1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enhanced_hotels table
    await queryRunner.query(`
      CREATE TABLE "enhanced_hotels" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "basicInfo" jsonb NOT NULL,
        "propertyDescription" jsonb,
        "locationDetails" jsonb,
        "policies" jsonb,
        "amenities" jsonb,
        "images" jsonb,
        "businessFeatures" jsonb,
        "qualityMetrics" jsonb,
        "onboardingStatus" character varying NOT NULL DEFAULT 'NOT_STARTED',
        "originalHotelId" uuid,
        "ownerId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_enhanced_hotels" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_onboarding_status" CHECK ("onboardingStatus" IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'NEEDS_REVIEW'))
      )
    `);

    // Create enhanced_rooms table
    await queryRunner.query(`
      CREATE TABLE "enhanced_rooms" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "basicInfo" jsonb NOT NULL,
        "description" jsonb,
        "amenities" jsonb,
        "images" jsonb,
        "layout" jsonb,
        "pricing" jsonb,
        "availability" jsonb,
        "services" jsonb,
        "qualityMetrics" jsonb,
        "originalRoomId" uuid,
        "enhancedHotelId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_enhanced_rooms" PRIMARY KEY ("id")
      )
    `);

    // Create amenity_definitions table
    await queryRunner.query(`
      CREATE TABLE "amenity_definitions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(255) NOT NULL,
        "description" text,
        "icon" character varying(255),
        "category" character varying(50) NOT NULL,
        "isEcoFriendly" boolean NOT NULL DEFAULT false,
        "applicablePropertyTypes" jsonb,
        "businessRules" jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_amenity_definitions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_amenity_name_category" UNIQUE ("name", "category"),
        CONSTRAINT "CHK_amenity_category" CHECK ("category" IN ('PROPERTY_WIDE', 'ROOM_SPECIFIC', 'BUSINESS', 'WELLNESS', 'DINING', 'SUSTAINABILITY', 'RECREATIONAL', 'CONNECTIVITY'))
      )
    `);

    // Create onboarding_sessions table
    await queryRunner.query(`
      CREATE TABLE "onboarding_sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "enhancedHotelId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "currentStep" integer NOT NULL DEFAULT 0,
        "completedSteps" jsonb NOT NULL DEFAULT '[]',
        "draftData" jsonb NOT NULL DEFAULT '{}',
        "qualityScore" decimal(5,2) NOT NULL DEFAULT 0.00,
        "sessionStatus" character varying(50) NOT NULL DEFAULT 'ACTIVE',
        "expiresAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_onboarding_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_session_status" CHECK ("sessionStatus" IN ('ACTIVE', 'COMPLETED', 'ABANDONED'))
      )
    `);

    // Create image_metadata table
    await queryRunner.query(`
      CREATE TABLE "image_metadata" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "filename" character varying(500) NOT NULL,
        "originalUrl" character varying(1000) NOT NULL,
        "optimizedUrls" jsonb,
        "thumbnails" jsonb,
        "sizeBytes" integer,
        "dimensions" jsonb,
        "format" character varying(20),
        "category" character varying(50),
        "qualityChecks" jsonb,
        "qualityScore" decimal(5,2),
        "tags" jsonb DEFAULT '[]',
        "uploadedBy" uuid,
        "entityType" character varying(50),
        "entityId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_image_metadata" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_image_category" CHECK ("category" IN ('EXTERIOR', 'LOBBY', 'ROOMS', 'AMENITIES', 'DINING', 'RECREATIONAL', 'BUSINESS', 'VIRTUAL_TOURS')),
        CONSTRAINT "CHK_entity_type" CHECK ("entityType" IN ('HOTEL', 'ROOM'))
      )
    `);

    // Create quality_reports table
    await queryRunner.query(`
      CREATE TABLE "quality_reports" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "enhancedHotelId" uuid NOT NULL,
        "overallScore" decimal(5,2) NOT NULL,
        "imageQualityScore" decimal(5,2),
        "contentCompletenessScore" decimal(5,2),
        "policyClarityScore" decimal(5,2),
        "scoreBreakdown" jsonb,
        "missingInformation" jsonb,
        "recommendations" jsonb,
        "generatedBy" character varying(100) DEFAULT 'SYSTEM',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quality_reports" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for enhanced_hotels
    await queryRunner.query(`CREATE INDEX "IDX_enhanced_hotels_basicInfo" ON "enhanced_hotels" USING GIN ("basicInfo")`);
    await queryRunner.query(`CREATE INDEX "IDX_enhanced_hotels_onboardingStatus" ON "enhanced_hotels" ("onboardingStatus")`);
    await queryRunner.query(`CREATE INDEX "IDX_enhanced_hotels_qualityMetrics" ON "enhanced_hotels" USING GIN ("qualityMetrics")`);
    await queryRunner.query(`CREATE INDEX "IDX_enhanced_hotels_ownerId" ON "enhanced_hotels" ("ownerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_enhanced_hotels_originalHotelId" ON "enhanced_hotels" ("originalHotelId")`);

    // Create indexes for enhanced_rooms
    await queryRunner.query(`CREATE INDEX "IDX_enhanced_rooms_enhancedHotelId" ON "enhanced_rooms" ("enhancedHotelId")`);
    await queryRunner.query(`CREATE INDEX "IDX_enhanced_rooms_basicInfo" ON "enhanced_rooms" USING GIN ("basicInfo")`);
    await queryRunner.query(`CREATE INDEX "IDX_enhanced_rooms_qualityMetrics" ON "enhanced_rooms" USING GIN ("qualityMetrics")`);
    await queryRunner.query(`CREATE INDEX "IDX_enhanced_rooms_availability" ON "enhanced_rooms" USING GIN ("availability")`);
    await queryRunner.query(`CREATE INDEX "IDX_enhanced_rooms_originalRoomId" ON "enhanced_rooms" ("originalRoomId")`);

    // Create indexes for amenity_definitions
    await queryRunner.query(`CREATE INDEX "IDX_amenity_definitions_category" ON "amenity_definitions" ("category")`);
    await queryRunner.query(`CREATE INDEX "IDX_amenity_definitions_isEcoFriendly" ON "amenity_definitions" ("isEcoFriendly")`);

    // Create indexes for onboarding_sessions
    await queryRunner.query(`CREATE INDEX "IDX_onboarding_sessions_enhancedHotelId" ON "onboarding_sessions" ("enhancedHotelId")`);
    await queryRunner.query(`CREATE INDEX "IDX_onboarding_sessions_userId" ON "onboarding_sessions" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_onboarding_sessions_sessionStatus" ON "onboarding_sessions" ("sessionStatus")`);

    // Create indexes for image_metadata
    await queryRunner.query(`CREATE INDEX "IDX_image_metadata_entity" ON "image_metadata" ("entityType", "entityId")`);
    await queryRunner.query(`CREATE INDEX "IDX_image_metadata_category" ON "image_metadata" ("category")`);
    await queryRunner.query(`CREATE INDEX "IDX_image_metadata_qualityScore" ON "image_metadata" ("qualityScore")`);
    await queryRunner.query(`CREATE INDEX "IDX_image_metadata_uploadedBy" ON "image_metadata" ("uploadedBy")`);

    // Create indexes for quality_reports
    await queryRunner.query(`CREATE INDEX "IDX_quality_reports_enhancedHotelId" ON "quality_reports" ("enhancedHotelId")`);
    await queryRunner.query(`CREATE INDEX "IDX_quality_reports_overallScore" ON "quality_reports" ("overallScore")`);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "enhanced_hotels" 
      ADD CONSTRAINT "FK_enhanced_hotels_owner" 
      FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "enhanced_hotels" 
      ADD CONSTRAINT "FK_enhanced_hotels_original" 
      FOREIGN KEY ("originalHotelId") REFERENCES "hotels"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "enhanced_rooms" 
      ADD CONSTRAINT "FK_enhanced_rooms_hotel" 
      FOREIGN KEY ("enhancedHotelId") REFERENCES "enhanced_hotels"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "enhanced_rooms" 
      ADD CONSTRAINT "FK_enhanced_rooms_original" 
      FOREIGN KEY ("originalRoomId") REFERENCES "rooms"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "onboarding_sessions" 
      ADD CONSTRAINT "FK_onboarding_sessions_hotel" 
      FOREIGN KEY ("enhancedHotelId") REFERENCES "enhanced_hotels"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "onboarding_sessions" 
      ADD CONSTRAINT "FK_onboarding_sessions_user" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "image_metadata" 
      ADD CONSTRAINT "FK_image_metadata_uploader" 
      FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "quality_reports" 
      ADD CONSTRAINT "FK_quality_reports_hotel" 
      FOREIGN KEY ("enhancedHotelId") REFERENCES "enhanced_hotels"("id") ON DELETE CASCADE
    `);

    // Insert default amenity definitions
    await queryRunner.query(`
      INSERT INTO "amenity_definitions" ("name", "description", "icon", "category", "isEcoFriendly", "applicablePropertyTypes", "businessRules") VALUES
      ('Free WiFi', 'Complimentary wireless internet access throughout the property', 'wifi', 'CONNECTIVITY', false, '["HOTEL", "RESORT", "GUEST_HOUSE", "HOMESTAY", "APARTMENT", "BOUTIQUE_HOTEL", "BUSINESS_HOTEL", "LUXURY_HOTEL"]', '[]'),
      ('Swimming Pool', 'Outdoor or indoor swimming pool facility', 'pool', 'RECREATIONAL', false, '["HOTEL", "RESORT", "LUXURY_HOTEL"]', '[{"type": "requires", "amenityId": "pool-maintenance", "condition": "outdoor_pool"}]'),
      ('Fitness Center', '24/7 access to modern fitness equipment', 'dumbbell', 'WELLNESS', false, '["HOTEL", "RESORT", "BUSINESS_HOTEL", "LUXURY_HOTEL"]', '[]'),
      ('Restaurant', 'On-site dining facility', 'restaurant', 'DINING', false, '["HOTEL", "RESORT", "BUSINESS_HOTEL", "LUXURY_HOTEL"]', '[]'),
      ('Parking', 'Vehicle parking facility', 'car', 'PROPERTY_WIDE', false, '["HOTEL", "RESORT", "GUEST_HOUSE", "HOMESTAY", "BUSINESS_HOTEL", "LUXURY_HOTEL"]', '[]'),
      ('24/7 Front Desk', 'Round-the-clock reception service', 'clock', 'PROPERTY_WIDE', false, '["HOTEL", "RESORT", "BUSINESS_HOTEL", "LUXURY_HOTEL"]', '[]'),
      ('Air Conditioning', 'Climate control in guest rooms', 'snowflake', 'ROOM_SPECIFIC', false, '["HOTEL", "RESORT", "GUEST_HOUSE", "HOMESTAY", "APARTMENT", "BOUTIQUE_HOTEL", "BUSINESS_HOTEL", "LUXURY_HOTEL"]', '[]'),
      ('Mini Bar', 'In-room refrigerated mini bar', 'wine-glass', 'ROOM_SPECIFIC', false, '["HOTEL", "RESORT", "BOUTIQUE_HOTEL", "LUXURY_HOTEL"]', '[]'),
      ('Safe', 'In-room security safe', 'shield', 'ROOM_SPECIFIC', false, '["HOTEL", "RESORT", "BUSINESS_HOTEL", "LUXURY_HOTEL"]', '[]'),
      ('Balcony', 'Private balcony or terrace', 'home', 'ROOM_SPECIFIC', false, '["HOTEL", "RESORT", "APARTMENT", "LUXURY_HOTEL"]', '[]'),
      ('Business Center', 'Dedicated business facilities and services', 'briefcase', 'BUSINESS', false, '["HOTEL", "BUSINESS_HOTEL", "LUXURY_HOTEL"]', '[]'),
      ('Meeting Rooms', 'Conference and meeting facilities', 'users', 'BUSINESS', false, '["HOTEL", "BUSINESS_HOTEL", "LUXURY_HOTEL"]', '[]'),
      ('High-Speed Internet', 'Premium internet connectivity for business needs', 'wifi', 'BUSINESS', false, '["BUSINESS_HOTEL", "LUXURY_HOTEL"]', '[]'),
      ('Spa', 'Full-service spa and wellness center', 'spa', 'WELLNESS', false, '["RESORT", "LUXURY_HOTEL"]', '[]'),
      ('Yoga Studio', 'Dedicated space for yoga and meditation', 'heart', 'WELLNESS', false, '["RESORT", "WELLNESS_HOTEL", "LUXURY_HOTEL"]', '[]'),
      ('Solar Power', 'Renewable energy from solar panels', 'sun', 'SUSTAINABILITY', true, '["HOTEL", "RESORT", "GUEST_HOUSE", "HOMESTAY", "BOUTIQUE_HOTEL"]', '[]'),
      ('Water Conservation', 'Water-saving fixtures and programs', 'droplet', 'SUSTAINABILITY', true, '["HOTEL", "RESORT", "GUEST_HOUSE", "HOMESTAY", "BOUTIQUE_HOTEL", "BUSINESS_HOTEL", "LUXURY_HOTEL"]', '[]'),
      ('Organic Garden', 'On-site organic herb and vegetable garden', 'leaf', 'SUSTAINABILITY', true, '["RESORT", "GUEST_HOUSE", "HOMESTAY", "BOUTIQUE_HOTEL"]', '[]'),
      ('Recycling Program', 'Comprehensive waste recycling initiative', 'recycle', 'SUSTAINABILITY', true, '["HOTEL", "RESORT", "GUEST_HOUSE", "HOMESTAY", "BOUTIQUE_HOTEL", "BUSINESS_HOTEL", "LUXURY_HOTEL"]', '[]')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints first
    await queryRunner.query(`ALTER TABLE "quality_reports" DROP CONSTRAINT "FK_quality_reports_hotel"`);
    await queryRunner.query(`ALTER TABLE "image_metadata" DROP CONSTRAINT "FK_image_metadata_uploader"`);
    await queryRunner.query(`ALTER TABLE "onboarding_sessions" DROP CONSTRAINT "FK_onboarding_sessions_user"`);
    await queryRunner.query(`ALTER TABLE "onboarding_sessions" DROP CONSTRAINT "FK_onboarding_sessions_hotel"`);
    await queryRunner.query(`ALTER TABLE "enhanced_rooms" DROP CONSTRAINT "FK_enhanced_rooms_original"`);
    await queryRunner.query(`ALTER TABLE "enhanced_rooms" DROP CONSTRAINT "FK_enhanced_rooms_hotel"`);
    await queryRunner.query(`ALTER TABLE "enhanced_hotels" DROP CONSTRAINT "FK_enhanced_hotels_original"`);
    await queryRunner.query(`ALTER TABLE "enhanced_hotels" DROP CONSTRAINT "FK_enhanced_hotels_owner"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_quality_reports_overallScore"`);
    await queryRunner.query(`DROP INDEX "IDX_quality_reports_enhancedHotelId"`);
    await queryRunner.query(`DROP INDEX "IDX_image_metadata_uploadedBy"`);
    await queryRunner.query(`DROP INDEX "IDX_image_metadata_qualityScore"`);
    await queryRunner.query(`DROP INDEX "IDX_image_metadata_category"`);
    await queryRunner.query(`DROP INDEX "IDX_image_metadata_entity"`);
    await queryRunner.query(`DROP INDEX "IDX_onboarding_sessions_sessionStatus"`);
    await queryRunner.query(`DROP INDEX "IDX_onboarding_sessions_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_onboarding_sessions_enhancedHotelId"`);
    await queryRunner.query(`DROP INDEX "IDX_amenity_definitions_isEcoFriendly"`);
    await queryRunner.query(`DROP INDEX "IDX_amenity_definitions_category"`);
    await queryRunner.query(`DROP INDEX "IDX_enhanced_rooms_originalRoomId"`);
    await queryRunner.query(`DROP INDEX "IDX_enhanced_rooms_availability"`);
    await queryRunner.query(`DROP INDEX "IDX_enhanced_rooms_qualityMetrics"`);
    await queryRunner.query(`DROP INDEX "IDX_enhanced_rooms_basicInfo"`);
    await queryRunner.query(`DROP INDEX "IDX_enhanced_rooms_enhancedHotelId"`);
    await queryRunner.query(`DROP INDEX "IDX_enhanced_hotels_originalHotelId"`);
    await queryRunner.query(`DROP INDEX "IDX_enhanced_hotels_ownerId"`);
    await queryRunner.query(`DROP INDEX "IDX_enhanced_hotels_qualityMetrics"`);
    await queryRunner.query(`DROP INDEX "IDX_enhanced_hotels_onboardingStatus"`);
    await queryRunner.query(`DROP INDEX "IDX_enhanced_hotels_basicInfo"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "quality_reports"`);
    await queryRunner.query(`DROP TABLE "image_metadata"`);
    await queryRunner.query(`DROP TABLE "onboarding_sessions"`);
    await queryRunner.query(`DROP TABLE "amenity_definitions"`);
    await queryRunner.query(`DROP TABLE "enhanced_rooms"`);
    await queryRunner.query(`DROP TABLE "enhanced_hotels"`);
  }
}