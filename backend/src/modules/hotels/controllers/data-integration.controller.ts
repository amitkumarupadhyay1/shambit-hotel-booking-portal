import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Logger,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { DataIntegrationService, DataIntegrationResult } from '../services/data-integration.service';
import { EnhancedDataService, EnhancedHotelQuery, DataConsistencyReport } from '../services/enhanced-data.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HotelPermissionGuard } from '../../auth/guards/hotel-permission.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User, UserRole } from '../../users/entities/user.entity';

@Controller('data-integration')
@UseGuards(JwtAuthGuard)
export class DataIntegrationController {
  private readonly logger = new Logger(DataIntegrationController.name);

  constructor(
    private readonly dataIntegrationService: DataIntegrationService,
    private readonly enhancedDataService: EnhancedDataService,
  ) {}

  @Post('hotels/:originalHotelId/create-enhanced')
  @UseGuards(HotelPermissionGuard)
  async createEnhancedHotel(
    @Param('originalHotelId') originalHotelId: string,
    @CurrentUser() user: User,
    @Body() onboardingData: any,
  ): Promise<DataIntegrationResult> {
    try {
      this.logger.log(`Creating enhanced hotel for original hotel: ${originalHotelId}`);

      const result = await this.dataIntegrationService.createEnhancedHotel(
        originalHotelId,
        user.id,
        onboardingData,
      );

      if (!result.success) {
        throw new HttpException(
          {
            message: 'Failed to create enhanced hotel',
            errors: result.errors,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to create enhanced hotel: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error while creating enhanced hotel',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('hotels/:enhancedHotelId')
  @UseGuards(HotelPermissionGuard)
  async updateEnhancedHotel(
    @Param('enhancedHotelId') enhancedHotelId: string,
    @Body() updateData: any,
  ): Promise<DataIntegrationResult> {
    try {
      this.logger.log(`Updating enhanced hotel: ${enhancedHotelId}`);

      const result = await this.dataIntegrationService.updateEnhancedHotel(
        enhancedHotelId,
        updateData,
      );

      if (!result.success) {
        throw new HttpException(
          {
            message: 'Failed to update enhanced hotel',
            errors: result.errors,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to update enhanced hotel: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error while updating enhanced hotel',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('hotels/:enhancedHotelId/rooms')
  @UseGuards(HotelPermissionGuard)
  async createEnhancedRoom(
    @Param('enhancedHotelId') enhancedHotelId: string,
    @Body() roomData: any,
    @Query('originalRoomId') originalRoomId?: string,
  ): Promise<DataIntegrationResult> {
    try {
      this.logger.log(`Creating enhanced room for hotel: ${enhancedHotelId}`);

      const result = await this.dataIntegrationService.createEnhancedRoom(
        enhancedHotelId,
        roomData,
        originalRoomId,
      );

      if (!result.success) {
        throw new HttpException(
          {
            message: 'Failed to create enhanced room',
            errors: result.errors,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to create enhanced room: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error while creating enhanced room',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('onboarding/:sessionId/complete')
  @UseGuards(HotelPermissionGuard)
  async completeOnboarding(
    @Param('sessionId') sessionId: string,
  ): Promise<DataIntegrationResult> {
    try {
      this.logger.log(`Completing onboarding for session: ${sessionId}`);

      const result = await this.dataIntegrationService.completeOnboarding(sessionId);

      if (!result.success) {
        throw new HttpException(
          {
            message: 'Failed to complete onboarding',
            errors: result.errors,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to complete onboarding: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error while completing onboarding',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('hotels/:originalHotelId/migrate')
  @UseGuards(HotelPermissionGuard)
  async migrateExistingHotel(
    @Param('originalHotelId') originalHotelId: string,
  ): Promise<DataIntegrationResult> {
    try {
      this.logger.log(`Migrating existing hotel: ${originalHotelId}`);

      const result = await this.dataIntegrationService.migrateExistingHotel(originalHotelId);

      if (!result.success) {
        throw new HttpException(
          {
            message: 'Failed to migrate hotel',
            errors: result.errors,
            warnings: result.warnings,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to migrate hotel: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error while migrating hotel',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('hotels/:enhancedHotelId/integration-status')
  @UseGuards(HotelPermissionGuard)
  async getIntegrationStatus(
    @Param('enhancedHotelId') enhancedHotelId: string,
  ): Promise<{
    isIntegrated: boolean;
    lastUpdated: Date;
    systemsUpdated: string[];
    pendingUpdates: string[];
  }> {
    try {
      this.logger.log(`Getting integration status for hotel: ${enhancedHotelId}`);

      return await this.dataIntegrationService.getIntegrationStatus(enhancedHotelId);
    } catch (error) {
      this.logger.error(`Failed to get integration status: ${error.message}`, error.stack);
      if (error.message.includes('not found')) {
        throw new HttpException('Enhanced hotel not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Internal server error while getting integration status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('hotels')
  async findEnhancedHotels(
    @Query() query: EnhancedHotelQuery,
    @CurrentUser() user: User,
  ): Promise<{
    hotels: any[];
    total: number;
  }> {
    try {
      // Add user filter for non-admin users
      if (!user.roles?.includes(UserRole.ADMIN)) {
        query.ownerId = user.id;
      }

      const result = await this.enhancedDataService.findEnhancedHotels(query);

      return {
        hotels: result.hotels.map(hotel => ({
          id: hotel.id,
          name: hotel.basicInfo?.name,
          propertyType: hotel.getPropertyType(),
          onboardingStatus: hotel.onboardingStatus,
          qualityScore: hotel.getOverallQualityScore(),
          totalAmenities: hotel.getTotalAmenities(),
          totalImages: hotel.getTotalImages(),
          totalRooms: hotel.enhancedRooms?.length || 0,
          lastUpdated: hotel.updatedAt,
        })),
        total: result.total,
      };
    } catch (error) {
      this.logger.error(`Failed to find enhanced hotels: ${error.message}`, error.stack);
      throw new HttpException(
        'Internal server error while finding enhanced hotels',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('hotels/:enhancedHotelId/consistency-check')
  @UseGuards(HotelPermissionGuard)
  async checkDataConsistency(
    @Param('enhancedHotelId') enhancedHotelId: string,
  ): Promise<DataConsistencyReport> {
    try {
      this.logger.log(`Checking data consistency for hotel: ${enhancedHotelId}`);

      return await this.enhancedDataService.checkDataConsistency(enhancedHotelId);
    } catch (error) {
      this.logger.error(`Failed to check data consistency: ${error.message}`, error.stack);
      if (error.message.includes('not found')) {
        throw new HttpException('Enhanced hotel not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Internal server error while checking data consistency',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('statistics')
  async getOnboardingStatistics(): Promise<{
    totalHotels: number;
    completedOnboarding: number;
    inProgress: number;
    notStarted: number;
    averageQualityScore: number;
    averageCompletionTime: number;
  }> {
    try {
      this.logger.log('Getting onboarding statistics');

      return await this.enhancedDataService.getOnboardingStatistics();
    } catch (error) {
      this.logger.error(`Failed to get onboarding statistics: ${error.message}`, error.stack);
      throw new HttpException(
        'Internal server error while getting onboarding statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('hotels/requiring-attention')
  async getHotelsRequiringAttention(): Promise<{
    lowQualityScore: any[];
    incompleteOnboarding: any[];
    missingImages: any[];
    dataInconsistencies: any[];
  }> {
    try {
      this.logger.log('Getting hotels requiring attention');

      const result = await this.enhancedDataService.getHotelsRequiringAttention();

      return {
        lowQualityScore: result.lowQualityScore.map(hotel => ({
          id: hotel.id,
          name: hotel.basicInfo?.name,
          qualityScore: hotel.getOverallQualityScore(),
        })),
        incompleteOnboarding: result.incompleteOnboarding.map(hotel => ({
          id: hotel.id,
          name: hotel.basicInfo?.name,
          onboardingStatus: hotel.onboardingStatus,
          roomCount: hotel.enhancedRooms?.length || 0,
        })),
        missingImages: result.missingImages.map(hotel => ({
          id: hotel.id,
          name: hotel.basicInfo?.name,
          imageCount: hotel.getTotalImages(),
        })),
        dataInconsistencies: result.dataInconsistencies.map(hotel => ({
          id: hotel.id,
          name: hotel.basicInfo?.name,
          onboardingStatus: hotel.onboardingStatus,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get hotels requiring attention: ${error.message}`, error.stack);
      throw new HttpException(
        'Internal server error while getting hotels requiring attention',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}