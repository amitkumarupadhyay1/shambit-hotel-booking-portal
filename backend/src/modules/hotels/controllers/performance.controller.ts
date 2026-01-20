import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { PerformanceOptimizedImageService } from '../services/performance-optimized-image.service';
import { PerformanceCacheService } from '../services/performance-cache.service';
import { MobileOptimizationService } from '../services/mobile-optimization.service';
import { ImageCategory } from '../interfaces/enhanced-hotel.interface';
import { EntityType } from '../entities/image-metadata.entity';

@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PerformanceController {
  constructor(
    private readonly imageService: PerformanceOptimizedImageService,
    private readonly cacheService: PerformanceCacheService,
    private readonly mobileService: MobileOptimizationService,
  ) {}

  /**
   * Async image upload endpoint - returns immediately with upload ID
   */
  @Post('images/upload-async')
  @Roles(UserRole.SELLER)
  @UseInterceptors(FileInterceptor('image'))
  async uploadImageAsync(
    @UploadedFile() file: Express.Multer.File,
    @Body('category') category: ImageCategory,
    @Body('entityType') entityType: EntityType,
    @Body('entityId') entityId: string,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    return this.imageService.uploadImageAsync(
      file,
      category,
      entityType,
      entityId,
      req.user.id,
    );
  }

  /**
   * Batch async image upload
   */
  @Post('images/upload-batch-async')
  @Roles(UserRole.SELLER)
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 files
  async uploadMultipleImagesAsync(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('category') category: ImageCategory,
    @Body('entityType') entityType: EntityType,
    @Body('entityId') entityId: string,
    @Request() req: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No image files provided');
    }

    return this.imageService.uploadMultipleImagesAsync(
      files,
      category,
      entityType,
      entityId,
      req.user.id,
    );
  }

  /**
   * Get upload status and progress
   */
  @Get('images/upload-status/:uploadId')
  @Roles(UserRole.SELLER)
  async getUploadStatus(@Param('uploadId') uploadId: string) {
    const status = await this.imageService.getUploadStatus(uploadId);
    if (!status) {
      throw new BadRequestException('Upload ID not found');
    }
    return status;
  }

  /**
   * Get batch upload status
   */
  @Post('images/batch-status')
  @Roles(UserRole.SELLER)
  async getBatchUploadStatus(@Body('uploadIds') uploadIds: string[]) {
    return this.imageService.getBatchUploadStatus(uploadIds);
  }

  /**
   * Get mobile-optimized images
   */
  @Get('images/mobile/:entityType/:entityId')
  async getMobileOptimizedImages(
    @Param('entityType') entityType: EntityType,
    @Param('entityId') entityId: string,
    @Query('category') category?: ImageCategory,
  ) {
    return this.imageService.getMobileOptimizedImages(entityType, entityId, category);
  }

  /**
   * Get mobile-optimized hotel data
   */
  @Get('mobile/hotel/:hotelId')
  async getMobileOptimizedHotel(@Param('hotelId') hotelId: string) {
    const hotel = await this.mobileService.getMobileOptimizedHotel(hotelId);
    if (!hotel) {
      throw new BadRequestException('Hotel not found');
    }
    return hotel;
  }

  /**
   * Get mobile-optimized room data
   */
  @Get('mobile/rooms/:hotelId')
  async getMobileOptimizedRooms(@Param('hotelId') hotelId: string) {
    return this.mobileService.getMobileOptimizedRooms(hotelId);
  }

  /**
   * Get mobile onboarding steps with data size estimates
   */
  @Get('mobile/onboarding-steps')
  async getMobileOnboardingSteps() {
    return this.mobileService.getMobileOnboardingSteps();
  }

  /**
   * Optimize data transfer for mobile
   */
  @Post('mobile/optimize-data')
  async optimizeDataTransfer(
    @Body('data') data: any,
    @Body('level') level: 'low' | 'medium' | 'high' = 'medium',
  ) {
    return this.mobileService.optimizeDataTransfer(data, level);
  }

  /**
   * Get progressive loading strategy
   */
  @Get('mobile/progressive-loading/:contentType')
  async getProgressiveLoadingStrategy(
    @Param('contentType') contentType: 'hotel' | 'rooms' | 'amenities' | 'images',
    @Query('priority') priority: 'high' | 'medium' | 'low' = 'medium',
  ) {
    return this.mobileService.getProgressiveLoadingStrategy(contentType, priority);
  }

  /**
   * Estimate bandwidth usage
   */
  @Post('mobile/bandwidth-estimate')
  async estimateBandwidthUsage(
    @Body('operation') operation: string,
    @Body('dataSize') dataSize: number,
  ) {
    return this.mobileService.estimateBandwidthUsage(operation, dataSize);
  }

  /**
   * Get cached amenities (with caching optimization)
   */
  @Get('cache/amenities')
  async getCachedAmenities() {
    return this.cacheService.getCategorizedAmenities();
  }

  /**
   * Get cached amenity validation rules
   */
  @Get('cache/amenity-rules/:propertyType/:region')
  async getCachedAmenityRules(
    @Param('propertyType') propertyType: string,
    @Param('region') region: string,
  ) {
    return this.cacheService.getAmenityValidationRules(propertyType, region);
  }

  /**
   * Get cached quality report
   */
  @Get('cache/quality-report/:sessionId')
  @Roles(UserRole.SELLER)
  async getCachedQualityReport(@Param('sessionId') sessionId: string) {
    return this.cacheService.getQualityReport(sessionId);
  }

  /**
   * Get cache statistics
   */
  @Get('cache/stats')
  @Roles(UserRole.ADMIN)
  async getCacheStats() {
    return this.cacheService.getCacheStats();
  }

  /**
   * Warm up cache
   */
  @Post('cache/warm-up')
  @Roles(UserRole.ADMIN)
  async warmUpCache() {
    await this.cacheService.warmUpCache();
    return { message: 'Cache warm-up completed' };
  }

  /**
   * Clear cache
   */
  @Post('cache/clear')
  @Roles(UserRole.ADMIN)
  async clearCache(@Body('pattern') pattern?: string) {
    if (pattern) {
      await this.cacheService.invalidateCache(pattern);
      return { message: `Cache cleared for pattern: ${pattern}` };
    } else {
      await this.cacheService.clearAllCache();
      return { message: 'All cache cleared' };
    }
  }

  /**
   * Clean up completed uploads
   */
  @Post('images/cleanup')
  @Roles(UserRole.ADMIN)
  async cleanupCompletedUploads() {
    await this.imageService.clearCompletedUploads();
    return { message: 'Completed uploads cleaned up' };
  }
}