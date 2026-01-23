import {
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { MigrationService } from '../services/migration.service';
import { DatabaseCleanupService } from '../services/database-cleanup.service';

@Controller('hotels/migration')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MigrationController {
  private readonly logger = new Logger(MigrationController.name);

  constructor(
    private readonly migrationService: MigrationService,
    private readonly databaseCleanupService: DatabaseCleanupService,
  ) {}

  /**
   * Analyze legacy components and create migration plan
   */
  @Get('analyze')
  @Roles(UserRole.ADMIN)
  async analyzeLegacyComponents() {
    this.logger.log('Analyzing legacy components');

    try {
      const analysis = await this.migrationService.analyzeLegacyComponents();

      return {
        success: true,
        data: analysis,
        message: 'Legacy component analysis completed',
      };
    } catch (error) {
      this.logger.error('Failed to analyze legacy components:', error);
      throw new BadRequestException('Failed to analyze legacy components');
    }
  }

  /**
   * Verify data migration status
   */
  @Get('verify-data')
  @Roles(UserRole.ADMIN)
  async verifyDataMigration() {
    this.logger.log('Verifying data migration');

    try {
      const result = await this.migrationService.verifyDataMigration();

      return {
        success: result.success,
        data: result.details,
        message: result.message,
        errors: result.errors,
        warnings: result.warnings,
      };
    } catch (error) {
      this.logger.error('Failed to verify data migration:', error);
      throw new BadRequestException('Failed to verify data migration');
    }
  }

  /**
   * Migrate remaining legacy data
   */
  @Post('migrate-data')
  @Roles(UserRole.ADMIN)
  async migrateLegacyData(@Request() req: any) {
    this.logger.log(`Admin ${req.user.id} initiating legacy data migration`);

    try {
      const result = await this.migrationService.migrateLegacyData();

      return {
        success: result.success,
        data: result.details,
        message: result.message,
        errors: result.errors,
        warnings: result.warnings,
      };
    } catch (error) {
      this.logger.error('Failed to migrate legacy data:', error);
      throw new BadRequestException('Failed to migrate legacy data');
    }
  }

  /**
   * Execute complete legacy cleanup
   */
  @Post('cleanup')
  @Roles(UserRole.ADMIN)
  async executeLegacyCleanup(@Request() req: any) {
    this.logger.log(`Admin ${req.user.id} initiating complete legacy cleanup`);

    try {
      const result = await this.migrationService.executeLegacyCleanup();

      return {
        success: result.success,
        data: result.details,
        message: result.message,
        errors: result.errors,
        warnings: result.warnings,
      };
    } catch (error) {
      this.logger.error('Failed to execute legacy cleanup:', error);
      throw new BadRequestException('Failed to execute legacy cleanup');
    }
  }

  /**
   * Get overall migration status
   */
  @Get('status')
  @Roles(UserRole.ADMIN)
  async getMigrationStatus() {
    this.logger.log('Getting migration status');

    try {
      const status = await this.migrationService.getMigrationStatus();

      return {
        success: true,
        data: status,
        message: 'Migration status retrieved successfully',
      };
    } catch (error) {
      this.logger.error('Failed to get migration status:', error);
      throw new BadRequestException('Failed to get migration status');
    }
  }

  /**
   * Health check for migration system
   */
  @Get('health')
  async healthCheck() {
    return {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
      message: 'Migration service is operational',
    };
  }

  /**
   * Verify database migration completeness
   */
  @Get('database/verify')
  @Roles(UserRole.ADMIN)
  async verifyDatabaseMigration() {
    this.logger.log('Verifying database migration');

    try {
      const result = await this.databaseCleanupService.verifyDataMigration();

      return {
        success: result.success,
        data: result.details,
        message: result.message,
        errors: result.errors,
        warnings: result.warnings,
      };
    } catch (error) {
      this.logger.error('Failed to verify database migration:', error);
      throw new BadRequestException('Failed to verify database migration');
    }
  }

  /**
   * Migrate remaining legacy data
   */
  @Post('database/migrate')
  @Roles(UserRole.ADMIN)
  async migrateRemainingData(@Request() req: any) {
    this.logger.log(`Admin ${req.user.id} initiating remaining data migration`);

    try {
      const result = await this.databaseCleanupService.migrateRemainingData();

      return {
        success: result.success,
        data: result.details,
        message: result.message,
        errors: result.errors,
        warnings: result.warnings,
      };
    } catch (error) {
      this.logger.error('Failed to migrate remaining data:', error);
      throw new BadRequestException('Failed to migrate remaining data');
    }
  }

  /**
   * Execute complete database cleanup
   */
  @Post('database/cleanup')
  @Roles(UserRole.ADMIN)
  async executeDatabaseCleanup(@Request() req: any) {
    this.logger.log(`Admin ${req.user.id} initiating database cleanup`);

    try {
      const result = await this.databaseCleanupService.executeCompleteCleanup();

      return {
        success: result.success,
        data: result.details,
        message: result.message,
        errors: result.errors,
        warnings: result.warnings,
      };
    } catch (error) {
      this.logger.error('Failed to execute database cleanup:', error);
      throw new BadRequestException('Failed to execute database cleanup');
    }
  }

  /**
   * Get database cleanup status
   */
  @Get('database/status')
  @Roles(UserRole.ADMIN)
  async getDatabaseCleanupStatus() {
    this.logger.log('Getting database cleanup status');

    try {
      const status = await this.databaseCleanupService.getCleanupStatus();

      return {
        success: true,
        data: status,
        message: 'Database cleanup status retrieved successfully',
      };
    } catch (error) {
      this.logger.error('Failed to get database cleanup status:', error);
      throw new BadRequestException('Failed to get database cleanup status');
    }
  }
}