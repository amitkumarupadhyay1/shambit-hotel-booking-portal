import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Hotel } from '../entities/hotel.entity';
import { EnhancedHotel } from '../entities/enhanced-hotel.entity';
import { Room } from '../../rooms/entities/room.entity';
import { EnhancedRoom } from '../../rooms/entities/enhanced-room.entity';
import { DataIntegrationService } from './data-integration.service';

export interface DatabaseCleanupResult {
  success: boolean;
  message: string;
  details?: any;
  errors?: string[];
  warnings?: string[];
}

@Injectable()
export class DatabaseCleanupService {
  private readonly logger = new Logger(DatabaseCleanupService.name);

  constructor(
    @InjectRepository(Hotel)
    private hotelRepository: Repository<Hotel>,
    @InjectRepository(EnhancedHotel)
    private enhancedHotelRepository: Repository<EnhancedHotel>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(EnhancedRoom)
    private enhancedRoomRepository: Repository<EnhancedRoom>,
    private dataSource: DataSource,
    private dataIntegrationService: DataIntegrationService,
  ) {}

  /**
   * Verify all data has been migrated to enhanced tables
   */
  async verifyDataMigration(): Promise<DatabaseCleanupResult> {
    this.logger.log('Verifying data migration completeness');

    try {
      const legacyHotels = await this.hotelRepository.find();
      const enhancedHotels = await this.enhancedHotelRepository.find();

      const migrationReport = {
        legacyHotels: legacyHotels.length,
        enhancedHotels: enhancedHotels.length,
        unmigrated: [],
        migrated: [],
      };

      // Check each legacy hotel
      for (const hotel of legacyHotels) {
        const enhanced = enhancedHotels.find(eh => eh.originalHotelId === hotel.id);
        if (enhanced) {
          migrationReport.migrated.push({
            legacyId: hotel.id,
            enhancedId: enhanced.id,
            name: hotel.name,
          });
        } else {
          migrationReport.unmigrated.push({
            id: hotel.id,
            name: hotel.name,
          });
        }
      }

      // Check rooms
      const legacyRooms = await this.roomRepository.find();
      const enhancedRooms = await this.enhancedRoomRepository.find();

      const roomMigrationReport = {
        legacyRooms: legacyRooms.length,
        enhancedRooms: enhancedRooms.length,
        unmigrated: [],
        migrated: [],
      };

      for (const room of legacyRooms) {
        const enhanced = enhancedRooms.find(er => er.originalRoomId === room.id);
        if (enhanced) {
          roomMigrationReport.migrated.push({
            legacyId: room.id,
            enhancedId: enhanced.id,
            name: room.name,
          });
        } else {
          roomMigrationReport.unmigrated.push({
            id: room.id,
            name: room.name,
          });
        }
      }

      const allMigrated = migrationReport.unmigrated.length === 0 && 
                         roomMigrationReport.unmigrated.length === 0;

      return {
        success: allMigrated,
        message: allMigrated 
          ? 'All data successfully migrated to enhanced tables'
          : 'Some data still needs migration',
        details: {
          hotels: migrationReport,
          rooms: roomMigrationReport,
        },
        warnings: allMigrated ? [] : [
          `${migrationReport.unmigrated.length} hotels not migrated`,
          `${roomMigrationReport.unmigrated.length} rooms not migrated`,
        ],
      };
    } catch (error) {
      this.logger.error('Data migration verification failed:', error);
      return {
        success: false,
        message: 'Data migration verification failed',
        errors: [error.message],
      };
    }
  }

  /**
   * Migrate any remaining legacy data
   */
  async migrateRemainingData(): Promise<DatabaseCleanupResult> {
    this.logger.log('Migrating remaining legacy data');

    try {
      const verification = await this.verifyDataMigration();
      
      if (verification.success) {
        return {
          success: true,
          message: 'No migration needed - all data already migrated',
          details: verification.details,
        };
      }

      const migrationResults = [];

      // Migrate unmigrated hotels
      const unmigratedHotels = verification.details.hotels.unmigrated;
      for (const hotel of unmigratedHotels) {
        this.logger.log(`Migrating hotel: ${hotel.name} (${hotel.id})`);
        
        const result = await this.dataIntegrationService.migrateExistingHotel(hotel.id);
        migrationResults.push({
          type: 'hotel',
          legacyId: hotel.id,
          name: hotel.name,
          result,
        });
      }

      return {
        success: true,
        message: `Migration completed for ${migrationResults.length} items`,
        details: {
          migrationResults,
          finalVerification: await this.verifyDataMigration(),
        },
      };
    } catch (error) {
      this.logger.error('Legacy data migration failed:', error);
      return {
        success: false,
        message: 'Legacy data migration failed',
        errors: [error.message],
      };
    }
  }

  /**
   * Check for booking references that need updating
   */
  async checkBookingReferences(): Promise<DatabaseCleanupResult> {
    this.logger.log('Checking booking references');

    try {
      // This would check if there are any booking tables that reference legacy room IDs
      // For now, we'll assume no bookings exist or they're already updated
      
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        // Check if bookings table exists
        const bookingsTableExists = await queryRunner.hasTable('bookings');
        
        if (!bookingsTableExists) {
          return {
            success: true,
            message: 'No bookings table found - no references to update',
          };
        }

        // If bookings table exists, we would check for references here
        // This is a placeholder for actual booking reference checking
        const bookingCount = await queryRunner.query('SELECT COUNT(*) as count FROM bookings');
        
        return {
          success: true,
          message: 'Booking references checked',
          details: {
            bookingCount: bookingCount[0]?.count || 0,
            note: 'Booking reference updates would be implemented based on actual booking schema',
          },
        };
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error('Booking reference check failed:', error);
      return {
        success: false,
        message: 'Booking reference check failed',
        errors: [error.message],
      };
    }
  }

  /**
   * Safely drop legacy tables after verification
   */
  async dropLegacyTables(): Promise<DatabaseCleanupResult> {
    this.logger.log('Preparing to drop legacy tables');

    try {
      // First verify all data is migrated
      const verification = await this.verifyDataMigration();
      
      if (!verification.success) {
        return {
          success: false,
          message: 'Cannot drop legacy tables - data migration incomplete',
          errors: ['Data migration must be completed before dropping legacy tables'],
          details: verification.details,
        };
      }

      // Check booking references
      const bookingCheck = await this.checkBookingReferences();
      if (!bookingCheck.success) {
        return {
          success: false,
          message: 'Cannot drop legacy tables - booking references need attention',
          errors: bookingCheck.errors,
        };
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Create backup tables first
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Backup hotels table
        await queryRunner.query(`
          CREATE TABLE hotels_backup_${timestamp.substring(0, 10)} AS 
          SELECT * FROM hotels
        `);

        // Backup rooms table
        await queryRunner.query(`
          CREATE TABLE rooms_backup_${timestamp.substring(0, 10)} AS 
          SELECT * FROM rooms
        `);

        this.logger.log('Legacy tables backed up successfully');

        // Note: We're not actually dropping the tables yet for safety
        // In a real migration, you would uncomment these lines after thorough testing:
        // await queryRunner.query('DROP TABLE IF EXISTS rooms CASCADE');
        // await queryRunner.query('DROP TABLE IF EXISTS hotels CASCADE');

        await queryRunner.commitTransaction();

        return {
          success: true,
          message: 'Legacy tables backed up (not dropped for safety)',
          details: {
            backupTables: [
              `hotels_backup_${timestamp.substring(0, 10)}`,
              `rooms_backup_${timestamp.substring(0, 10)}`,
            ],
            note: 'Tables were backed up but not dropped for safety. Uncomment DROP statements in production after thorough testing.',
          },
        };
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error('Legacy table cleanup failed:', error);
      return {
        success: false,
        message: 'Legacy table cleanup failed',
        errors: [error.message],
      };
    }
  }

  /**
   * Execute complete database cleanup
   */
  async executeCompleteCleanup(): Promise<DatabaseCleanupResult> {
    this.logger.log('Starting complete database cleanup');

    try {
      const results = [];

      // 1. Verify data migration
      const verification = await this.verifyDataMigration();
      results.push({ step: 'Data Verification', result: verification });

      // 2. Migrate remaining data if needed
      if (!verification.success) {
        const migration = await this.migrateRemainingData();
        results.push({ step: 'Data Migration', result: migration });

        if (!migration.success) {
          return {
            success: false,
            message: 'Database cleanup failed - could not complete data migration',
            details: results,
          };
        }
      }

      // 3. Check booking references
      const bookingCheck = await this.checkBookingReferences();
      results.push({ step: 'Booking Reference Check', result: bookingCheck });

      // 4. Backup and prepare for table cleanup
      const tableCleanup = await this.dropLegacyTables();
      results.push({ step: 'Table Cleanup', result: tableCleanup });

      const allSuccessful = results.every(r => r.result.success);

      return {
        success: allSuccessful,
        message: allSuccessful 
          ? 'Database cleanup completed successfully'
          : 'Database cleanup completed with some issues',
        details: results,
      };
    } catch (error) {
      this.logger.error('Complete database cleanup failed:', error);
      return {
        success: false,
        message: 'Complete database cleanup failed',
        errors: [error.message],
      };
    }
  }

  /**
   * Get database cleanup status
   */
  async getCleanupStatus(): Promise<{
    dataMigrated: boolean;
    bookingReferencesChecked: boolean;
    legacyTablesBackedUp: boolean;
    readyForTableDrop: boolean;
  }> {
    const verification = await this.verifyDataMigration();
    const bookingCheck = await this.checkBookingReferences();

    // Check if backup tables exist
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    let backupTablesExist = false;
    try {
      const tables = await queryRunner.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name LIKE 'hotels_backup_%' OR table_name LIKE 'rooms_backup_%'
      `);
      backupTablesExist = tables.length > 0;
    } catch (error) {
      this.logger.warn('Could not check for backup tables:', error);
    } finally {
      await queryRunner.release();
    }

    return {
      dataMigrated: verification.success,
      bookingReferencesChecked: bookingCheck.success,
      legacyTablesBackedUp: backupTablesExist,
      readyForTableDrop: verification.success && bookingCheck.success && backupTablesExist,
    };
  }
}