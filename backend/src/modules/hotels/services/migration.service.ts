import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Hotel } from '../entities/hotel.entity';
import { EnhancedHotel } from '../entities/enhanced-hotel.entity';
import { Room } from '../../rooms/entities/room.entity';
import { EnhancedRoom } from '../../rooms/entities/enhanced-room.entity';
import { DataIntegrationService } from './data-integration.service';
import * as fs from 'fs';
import * as path from 'path';

export interface MigrationResult {
  success: boolean;
  message: string;
  details?: any;
  errors?: string[];
  warnings?: string[];
}

export interface LegacyComponent {
  type: 'controller' | 'service' | 'dto' | 'entity' | 'test';
  path: string;
  name: string;
  dependencies: string[];
  isRemovable: boolean;
  reason?: string;
}

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

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
   * Analyze legacy components and create migration plan
   */
  async analyzeLegacyComponents(): Promise<{
    components: LegacyComponent[];
    migrationPlan: string[];
    risks: string[];
  }> {
    this.logger.log('Analyzing legacy components for migration');

    const components: LegacyComponent[] = [];
    const risks: string[] = [];

    // Define legacy components to be removed
    const legacyFiles = [
      {
        type: 'controller' as const,
        path: 'backend/src/modules/hotels/hotels.controller.ts',
        name: 'HotelsController',
        dependencies: ['HotelsService'],
        isRemovable: true,
      },
      {
        type: 'service' as const,
        path: 'backend/src/modules/hotels/hotels.service.ts',
        name: 'HotelsService',
        dependencies: ['Hotel', 'CreateHotelDto', 'UpdateHotelDto'],
        isRemovable: true,
      },
      {
        type: 'controller' as const,
        path: 'backend/src/modules/hotels/controllers/onboarding.controller.ts',
        name: 'OnboardingController',
        dependencies: ['OnboardingService'],
        isRemovable: true,
        reason: 'Replaced by IntegratedOnboardingController',
      },
      {
        type: 'dto' as const,
        path: 'backend/src/modules/hotels/dto/create-hotel.dto.ts',
        name: 'CreateHotelDto',
        dependencies: [],
        isRemovable: true,
      },
      {
        type: 'dto' as const,
        path: 'backend/src/modules/hotels/dto/update-hotel.dto.ts',
        name: 'UpdateHotelDto',
        dependencies: ['CreateHotelDto'],
        isRemovable: true,
      },
    ];

    // Check if files exist and analyze dependencies
    for (const file of legacyFiles) {
      const fullPath = path.resolve(file.path);
      if (fs.existsSync(fullPath)) {
        components.push(file);
      } else {
        this.logger.warn(`Legacy file not found: ${file.path}`);
      }
    }

    // Create migration plan (ordered by dependencies)
    const migrationPlan = [
      'Remove legacy DTOs (CreateHotelDto, UpdateHotelDto)',
      'Remove legacy HotelsController',
      'Remove legacy OnboardingController', 
      'Remove legacy HotelsService',
      'Update module imports and exports',
      'Verify all references removed',
    ];

    // Identify risks
    if (components.length > 0) {
      risks.push('Legacy components still exist and may cause conflicts');
      risks.push('API endpoints may be duplicated between old and new systems');
      risks.push('Frontend may still be calling legacy endpoints');
    }

    return {
      components,
      migrationPlan,
      risks,
    };
  }

  /**
   * Verify data migration completeness
   */
  async verifyDataMigration(): Promise<MigrationResult> {
    this.logger.log('Verifying data migration completeness');

    try {
      // Check if all hotels have been migrated
      const legacyHotels = await this.hotelRepository.find();
      const enhancedHotels = await this.enhancedHotelRepository.find();

      const unmigrated = [];
      for (const hotel of legacyHotels) {
        const enhanced = enhancedHotels.find(eh => eh.originalHotelId === hotel.id);
        if (!enhanced) {
          unmigrated.push(hotel.id);
        }
      }

      if (unmigrated.length > 0) {
        return {
          success: false,
          message: 'Data migration incomplete',
          errors: [`${unmigrated.length} hotels not migrated: ${unmigrated.join(', ')}`],
        };
      }

      // Check rooms migration
      const legacyRooms = await this.roomRepository.find();
      const enhancedRooms = await this.enhancedRoomRepository.find();

      const unmigratedRooms = [];
      for (const room of legacyRooms) {
        const enhanced = enhancedRooms.find(er => er.originalRoomId === room.id);
        if (!enhanced) {
          unmigratedRooms.push(room.id);
        }
      }

      if (unmigratedRooms.length > 0) {
        return {
          success: false,
          message: 'Room migration incomplete',
          errors: [`${unmigratedRooms.length} rooms not migrated: ${unmigratedRooms.join(', ')}`],
        };
      }

      return {
        success: true,
        message: 'Data migration verification completed successfully',
        details: {
          migratedHotels: enhancedHotels.length,
          migratedRooms: enhancedRooms.length,
        },
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
  async migrateLegacyData(): Promise<MigrationResult> {
    this.logger.log('Migrating remaining legacy data');

    try {
      const legacyHotels = await this.hotelRepository.find({
        relations: ['rooms'],
      });

      const migrationResults = [];
      
      for (const hotel of legacyHotels) {
        // Check if already migrated
        const existing = await this.enhancedHotelRepository.findOne({
          where: { originalHotelId: hotel.id },
        });

        if (!existing) {
          this.logger.log(`Migrating hotel: ${hotel.name} (${hotel.id})`);
          
          const result = await this.dataIntegrationService.migrateExistingHotel(hotel.id);
          migrationResults.push({
            hotelId: hotel.id,
            hotelName: hotel.name,
            result,
          });
        }
      }

      return {
        success: true,
        message: `Migration completed for ${migrationResults.length} hotels`,
        details: migrationResults,
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
   * Remove legacy file safely with backup
   */
  async removeLegacyFile(filePath: string): Promise<MigrationResult> {
    try {
      const fullPath = path.resolve(filePath);
      
      if (!fs.existsSync(fullPath)) {
        return {
          success: true,
          message: `File already removed: ${filePath}`,
        };
      }

      // Create backup
      const backupPath = `${fullPath}.backup.${Date.now()}`;
      fs.copyFileSync(fullPath, backupPath);

      // Remove original file
      fs.unlinkSync(fullPath);

      this.logger.log(`Removed legacy file: ${filePath} (backup: ${backupPath})`);

      return {
        success: true,
        message: `Successfully removed ${filePath}`,
        details: { backupPath },
      };
    } catch (error) {
      this.logger.error(`Failed to remove legacy file ${filePath}:`, error);
      return {
        success: false,
        message: `Failed to remove ${filePath}`,
        errors: [error.message],
      };
    }
  }

  /**
   * Update module configuration to remove legacy components
   */
  async updateModuleConfiguration(): Promise<MigrationResult> {
    try {
      const modulePath = 'backend/src/modules/hotels/hotels.module.ts';
      const fullPath = path.resolve(modulePath);

      if (!fs.existsSync(fullPath)) {
        return {
          success: false,
          message: 'Hotels module file not found',
          errors: ['Module file does not exist'],
        };
      }

      // Read current module content
      let moduleContent = fs.readFileSync(fullPath, 'utf8');

      // Remove legacy imports
      const legacyImports = [
        "import { HotelsService } from './hotels.service';",
        "import { HotelsController } from './hotels.controller';",
        "import { OnboardingController } from './controllers/onboarding.controller';",
      ];

      for (const importLine of legacyImports) {
        moduleContent = moduleContent.replace(importLine + '\n', '');
      }

      // Remove from controllers array
      moduleContent = moduleContent.replace(/HotelsController,?\s*/, '');
      moduleContent = moduleContent.replace(/OnboardingController,?\s*/, '');

      // Remove from providers array
      moduleContent = moduleContent.replace(/HotelsService,?\s*/, '');

      // Remove from exports array
      moduleContent = moduleContent.replace(/HotelsService,?\s*/, '');

      // Clean up any double commas or trailing commas
      moduleContent = moduleContent.replace(/,\s*,/g, ',');
      moduleContent = moduleContent.replace(/,\s*]/g, ']');

      // Write updated module
      fs.writeFileSync(fullPath, moduleContent);

      this.logger.log('Updated hotels module configuration');

      return {
        success: true,
        message: 'Module configuration updated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to update module configuration:', error);
      return {
        success: false,
        message: 'Failed to update module configuration',
        errors: [error.message],
      };
    }
  }

  /**
   * Execute complete legacy cleanup
   */
  async executeLegacyCleanup(): Promise<MigrationResult> {
    this.logger.log('Starting complete legacy cleanup');

    try {
      const results = [];

      // 1. Verify data migration
      const dataVerification = await this.verifyDataMigration();
      results.push({ step: 'Data Verification', result: dataVerification });

      if (!dataVerification.success) {
        // Migrate remaining data
        const dataMigration = await this.migrateLegacyData();
        results.push({ step: 'Data Migration', result: dataMigration });

        if (!dataMigration.success) {
          return {
            success: false,
            message: 'Cannot proceed with cleanup - data migration failed',
            details: results,
          };
        }
      }

      // 2. Remove legacy files
      const legacyFiles = [
        'backend/src/modules/hotels/dto/create-hotel.dto.ts',
        'backend/src/modules/hotels/dto/update-hotel.dto.ts',
        'backend/src/modules/hotels/hotels.controller.ts',
        'backend/src/modules/hotels/controllers/onboarding.controller.ts',
        'backend/src/modules/hotels/hotels.service.ts',
      ];

      for (const file of legacyFiles) {
        const removeResult = await this.removeLegacyFile(file);
        results.push({ step: `Remove ${file}`, result: removeResult });
      }

      // 3. Update module configuration
      const moduleUpdate = await this.updateModuleConfiguration();
      results.push({ step: 'Update Module', result: moduleUpdate });

      const allSuccessful = results.every(r => r.result.success);

      return {
        success: allSuccessful,
        message: allSuccessful 
          ? 'Legacy cleanup completed successfully' 
          : 'Legacy cleanup completed with some errors',
        details: results,
      };
    } catch (error) {
      this.logger.error('Legacy cleanup failed:', error);
      return {
        success: false,
        message: 'Legacy cleanup failed',
        errors: [error.message],
      };
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<{
    dataComplete: boolean;
    legacyFilesRemoved: boolean;
    moduleUpdated: boolean;
    readyForProduction: boolean;
  }> {
    const dataVerification = await this.verifyDataMigration();
    
    const legacyFiles = [
      'backend/src/modules/hotels/hotels.controller.ts',
      'backend/src/modules/hotels/hotels.service.ts',
      'backend/src/modules/hotels/controllers/onboarding.controller.ts',
    ];

    const legacyFilesRemoved = legacyFiles.every(file => 
      !fs.existsSync(path.resolve(file))
    );

    // Check if module is updated (simplified check)
    const modulePath = path.resolve('backend/src/modules/hotels/hotels.module.ts');
    const moduleContent = fs.existsSync(modulePath) 
      ? fs.readFileSync(modulePath, 'utf8') 
      : '';
    
    const moduleUpdated = !moduleContent.includes('HotelsController') && 
                         !moduleContent.includes('HotelsService');

    return {
      dataComplete: dataVerification.success,
      legacyFilesRemoved,
      moduleUpdated,
      readyForProduction: dataVerification.success && legacyFilesRemoved && moduleUpdated,
    };
  }
}