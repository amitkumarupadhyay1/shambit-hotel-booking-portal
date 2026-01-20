import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ImageMetadata, EntityType } from '../entities/image-metadata.entity';
import {
  ImageCategory,
  ProcessedImage,
  QualityCheckResult,
  QualityIssue,
  ThumbnailSet,
} from '../interfaces/enhanced-hotel.interface';
import { PerformanceCacheService } from './performance-cache.service';

export interface AsyncUploadResult {
  uploadId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  processedImage?: ProcessedImage;
  error?: string;
}

export interface MobileOptimizedImage {
  id: string;
  thumbnailUrl: string;
  compressedUrl: string;
  metadata: {
    size: number;
    dimensions: { width: number; height: number };
    format: string;
  };
}

@Injectable()
export class PerformanceOptimizedImageService {
  private readonly uploadPath: string;
  private readonly baseUrl: string;
  private readonly processingQueue = new Map<string, AsyncUploadResult>();
  
  private readonly qualityStandards = {
    minResolution: { width: 1920, height: 1080 },
    acceptableAspectRatios: [16/9, 4/3, 3/2, 1/1],
    blurThreshold: 0.8,
    brightnessRange: { min: 50, max: 200 },
    contrastRange: { min: 30, max: 200 },
    maxFileSize: 5 * 1024 * 1024, // 5MB
  };

  constructor(
    @InjectRepository(ImageMetadata)
    private readonly imageMetadataRepository: Repository<ImageMetadata>,
    private readonly configService: ConfigService,
    private readonly cacheService: PerformanceCacheService,
  ) {
    this.uploadPath = this.configService.get<string>('UPLOAD_PATH') || './uploads';
    this.baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
    this.ensureUploadDirectories();
  }

  private async ensureUploadDirectories(): Promise<void> {
    const directories = [
      this.uploadPath,
      path.join(this.uploadPath, 'original'),
      path.join(this.uploadPath, 'optimized'),
      path.join(this.uploadPath, 'thumbnails'),
      path.join(this.uploadPath, 'mobile'),
    ];

    for (const dir of directories) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  /**
   * Async image upload that doesn't block the UI
   * Returns immediately with upload ID for progress tracking
   */
  async uploadImageAsync(
    file: Express.Multer.File,
    category: ImageCategory,
    entityType: EntityType,
    entityId: string,
    uploadedBy: string,
  ): Promise<{ uploadId: string }> {
    // Validate file size immediately
    if (file.size > this.qualityStandards.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum limit of ${this.qualityStandards.maxFileSize / (1024 * 1024)}MB`
      );
    }

    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // Initialize processing status
    this.processingQueue.set(uploadId, {
      uploadId,
      status: 'processing',
      progress: 0,
    });

    // Process asynchronously without blocking
    this.processImageAsync(uploadId, file, category, entityType, entityId, uploadedBy)
      .catch(error => {
        this.processingQueue.set(uploadId, {
          uploadId,
          status: 'failed',
          progress: 0,
          error: error.message,
        });
      });

    return { uploadId };
  }

  /**
   * Get upload status and progress
   */
  async getUploadStatus(uploadId: string): Promise<AsyncUploadResult | null> {
    return this.processingQueue.get(uploadId) || null;
  }

  /**
   * Process image asynchronously with progress updates
   */
  private async processImageAsync(
    uploadId: string,
    file: Express.Multer.File,
    category: ImageCategory,
    entityType: EntityType,
    entityId: string,
    uploadedBy: string,
  ): Promise<void> {
    try {
      // Update progress: Starting quality validation
      this.updateProgress(uploadId, 10);

      // Validate image quality
      const qualityResult = await this.validateImageQuality(file.buffer);
      this.updateProgress(uploadId, 25);

      // Generate optimized images
      const optimizedSet = await this.optimizeImageWithProgress(file.buffer, file.originalname, uploadId);
      this.updateProgress(uploadId, 60);

      // Generate thumbnails
      const thumbnails = await this.generateThumbnailsWithProgress(file.buffer, file.originalname, uploadId);
      this.updateProgress(uploadId, 80);

      // Generate mobile-optimized versions
      const mobileOptimized = await this.generateMobileOptimized(file.buffer, file.originalname);
      this.updateProgress(uploadId, 90);

      // Create metadata record
      const imageMetadata = new ImageMetadata();
      imageMetadata.filename = file.originalname;
      imageMetadata.originalUrl = `${this.baseUrl}/uploads/original/${optimizedSet.original}`;
      imageMetadata.optimizedUrls = {
        large: `${this.baseUrl}/uploads/optimized/${optimizedSet.large}`,
        medium: `${this.baseUrl}/uploads/optimized/${optimizedSet.medium}`,
        small: `${this.baseUrl}/uploads/optimized/${optimizedSet.small}`,
        mobile: `${this.baseUrl}/uploads/mobile/${mobileOptimized.mobile}`,
      };
      imageMetadata.thumbnails = {
        small: `${this.baseUrl}/uploads/thumbnails/${thumbnails.small}`,
        medium: `${this.baseUrl}/uploads/thumbnails/${thumbnails.medium}`,
        large: `${this.baseUrl}/uploads/thumbnails/${thumbnails.large}`,
      };
      imageMetadata.sizeBytes = file.size;
      imageMetadata.format = file.mimetype.split('/')[1];
      imageMetadata.category = category;
      imageMetadata.qualityChecks = qualityResult;
      imageMetadata.qualityScore = qualityResult.score;
      imageMetadata.entityType = entityType;
      imageMetadata.entityId = entityId;
      imageMetadata.uploadedBy = uploadedBy;
      imageMetadata.tags = [];

      // Get image dimensions
      const metadata = await sharp(file.buffer).metadata();
      imageMetadata.dimensions = {
        width: metadata.width || 0,
        height: metadata.height || 0,
      };

      // Save to database
      const savedMetadata = await this.imageMetadataRepository.save(imageMetadata);

      // Create processed image result
      const processedImage: ProcessedImage = {
        id: savedMetadata.id,
        originalUrl: savedMetadata.originalUrl,
        optimizedUrls: savedMetadata.optimizedUrls,
        thumbnails: savedMetadata.thumbnails,
        metadata: {
          filename: savedMetadata.filename,
          size: savedMetadata.sizeBytes,
          dimensions: savedMetadata.dimensions,
          format: savedMetadata.format,
          uploadedAt: savedMetadata.createdAt,
          uploadedBy: savedMetadata.uploadedBy,
          qualityChecks: savedMetadata.qualityChecks,
          tags: savedMetadata.tags,
        },
        qualityScore: savedMetadata.qualityScore,
        category: savedMetadata.category,
      };

      // Update final status
      this.processingQueue.set(uploadId, {
        uploadId,
        status: 'completed',
        progress: 100,
        processedImage,
      });

      // Cache the processed image for quick access
      await this.cacheService.cacheMobileData(
        `processed_image_${savedMetadata.id}`,
        processedImage
      );

      // Clean up processing queue after 1 hour
      setTimeout(() => {
        this.processingQueue.delete(uploadId);
      }, 3600000);

    } catch (error) {
      this.processingQueue.set(uploadId, {
        uploadId,
        status: 'failed',
        progress: 0,
        error: error.message,
      });
    }
  }

  private updateProgress(uploadId: string, progress: number): void {
    const current = this.processingQueue.get(uploadId);
    if (current) {
      this.processingQueue.set(uploadId, {
        ...current,
        progress,
      });
    }
  }

  /**
   * Generate mobile-optimized images for data transfer optimization
   */
  private async generateMobileOptimized(
    imageBuffer: Buffer,
    originalFilename: string,
  ): Promise<{ mobile: string }> {
    const timestamp = Date.now();
    const baseName = path.basename(originalFilename, path.extname(originalFilename));
    
    const filename = `${baseName}_${timestamp}_mobile.webp`;

    // Generate highly compressed mobile version (480x320 max, high compression)
    await sharp(imageBuffer)
      .resize(480, 320, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 60, effort: 6 }) // Higher effort for better compression
      .toFile(path.join(this.uploadPath, 'mobile', filename));

    return { mobile: filename };
  }

  /**
   * Get mobile-optimized images for bandwidth-conscious loading
   */
  async getMobileOptimizedImages(
    entityType: EntityType,
    entityId: string,
    category?: ImageCategory,
  ): Promise<MobileOptimizedImage[]> {
    const cacheKey = `mobile_images_${entityType}_${entityId}_${category || 'all'}`;
    
    // Try cache first
    const cached = await this.cacheService.getCachedMobileData<MobileOptimizedImage[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Build query
    const where: any = { entityType, entityId };
    if (category) {
      where.category = category;
    }

    const imageMetadataList = await this.imageMetadataRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    const mobileImages: MobileOptimizedImage[] = imageMetadataList.map(metadata => ({
      id: metadata.id,
      thumbnailUrl: metadata.thumbnails?.small || '',
      compressedUrl: metadata.optimizedUrls?.mobile || metadata.optimizedUrls?.small || '',
      metadata: {
        size: metadata.sizeBytes || 0,
        dimensions: metadata.dimensions || { width: 0, height: 0 },
        format: metadata.format || 'unknown',
      },
    }));

    // Cache for 10 minutes
    await this.cacheService.cacheMobileData(cacheKey, mobileImages);

    return mobileImages;
  }

  /**
   * Optimized image processing with progress tracking
   */
  private async optimizeImageWithProgress(
    imageBuffer: Buffer,
    originalFilename: string,
    uploadId: string,
  ): Promise<any> {
    const timestamp = Date.now();
    const ext = path.extname(originalFilename);
    const baseName = path.basename(originalFilename, ext);
    
    const filenames = {
      original: `${baseName}_${timestamp}_original${ext}`,
      large: `${baseName}_${timestamp}_large.webp`,
      medium: `${baseName}_${timestamp}_medium.webp`,
      small: `${baseName}_${timestamp}_small.webp`,
    };

    // Save original
    await fs.writeFile(
      path.join(this.uploadPath, 'original', filenames.original),
      imageBuffer
    );
    this.updateProgress(uploadId, 35);

    const image = sharp(imageBuffer);
    
    // Generate optimized versions in parallel for better performance
    await Promise.all([
      // Large version (1920x1080 max)
      image
        .clone()
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85, effort: 4 })
        .toFile(path.join(this.uploadPath, 'optimized', filenames.large)),

      // Medium version (1024x768 max)
      image
        .clone()
        .resize(1024, 768, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 })
        .toFile(path.join(this.uploadPath, 'optimized', filenames.medium)),

      // Small version (640x480 max)
      image
        .clone()
        .resize(640, 480, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 75, effort: 4 })
        .toFile(path.join(this.uploadPath, 'optimized', filenames.small)),
    ]);

    this.updateProgress(uploadId, 50);
    return filenames;
  }

  /**
   * Generate thumbnails with progress tracking
   */
  private async generateThumbnailsWithProgress(
    imageBuffer: Buffer,
    originalFilename: string,
    uploadId: string,
  ): Promise<ThumbnailSet> {
    const timestamp = Date.now();
    const baseName = path.basename(originalFilename, path.extname(originalFilename));
    
    const filenames = {
      small: `${baseName}_${timestamp}_thumb_150.webp`,
      medium: `${baseName}_${timestamp}_thumb_300.webp`,
      large: `${baseName}_${timestamp}_thumb_600.webp`,
    };

    const image = sharp(imageBuffer);

    // Generate thumbnails in parallel
    await Promise.all([
      image
        .clone()
        .resize(150, 150, { fit: 'cover' })
        .webp({ quality: 80, effort: 4 })
        .toFile(path.join(this.uploadPath, 'thumbnails', filenames.small)),
      
      image
        .clone()
        .resize(300, 300, { fit: 'cover' })
        .webp({ quality: 85, effort: 4 })
        .toFile(path.join(this.uploadPath, 'thumbnails', filenames.medium)),
      
      image
        .clone()
        .resize(600, 600, { fit: 'cover' })
        .webp({ quality: 90, effort: 4 })
        .toFile(path.join(this.uploadPath, 'thumbnails', filenames.large)),
    ]);

    this.updateProgress(uploadId, 75);
    return filenames;
  }

  /**
   * Validate image quality (reused from original service)
   */
  private async validateImageQuality(imageBuffer: Buffer): Promise<QualityCheckResult> {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      const stats = await image.stats();
      
      const issues: QualityIssue[] = [];
      let score = 100;

      // Check resolution
      if (!metadata.width || !metadata.height) {
        issues.push({
          type: 'resolution',
          severity: 'high',
          description: 'Unable to determine image dimensions',
          suggestedFix: 'Upload a valid image file',
        });
        score -= 30;
      } else if (
        metadata.width < this.qualityStandards.minResolution.width ||
        metadata.height < this.qualityStandards.minResolution.height
      ) {
        issues.push({
          type: 'resolution',
          severity: 'medium',
          description: `Image resolution ${metadata.width}x${metadata.height} is below minimum ${this.qualityStandards.minResolution.width}x${this.qualityStandards.minResolution.height}`,
          suggestedFix: 'Upload a higher resolution image',
        });
        score -= 20;
      }

      // Check aspect ratio
      if (metadata.width && metadata.height) {
        const aspectRatio = metadata.width / metadata.height;
        const isAcceptableRatio = this.qualityStandards.acceptableAspectRatios.some(
          ratio => Math.abs(aspectRatio - ratio) < 0.1
        );
        
        if (!isAcceptableRatio) {
          issues.push({
            type: 'aspect_ratio',
            severity: 'low',
            description: `Aspect ratio ${aspectRatio.toFixed(2)} may not display optimally`,
            suggestedFix: 'Consider cropping to standard aspect ratios like 16:9 or 4:3',
          });
          score -= 10;
        }
      }

      // Check brightness and contrast (simplified for performance)
      if (stats.channels) {
        const avgBrightness = stats.channels.reduce((sum, channel) => sum + channel.mean, 0) / stats.channels.length;
        
        if (avgBrightness < this.qualityStandards.brightnessRange.min || 
            avgBrightness > this.qualityStandards.brightnessRange.max) {
          issues.push({
            type: 'brightness',
            severity: 'medium',
            description: avgBrightness < this.qualityStandards.brightnessRange.min ? 'Image appears too dark' : 'Image appears overexposed',
            suggestedFix: avgBrightness < this.qualityStandards.brightnessRange.min ? 'Increase brightness' : 'Reduce brightness',
          });
          score -= 15;
        }
      }

      return {
        passed: issues.length === 0 || !issues.some(issue => issue.severity === 'high'),
        score: Math.max(0, score),
        issues,
        recommendations: issues.length === 0 ? ['Image meets quality standards'] : issues.map(i => i.suggestedFix),
      };
    } catch (error) {
      return {
        passed: false,
        score: 0,
        issues: [{
          type: 'resolution',
          severity: 'high',
          description: 'Failed to analyze image quality',
          suggestedFix: 'Upload a valid image file',
        }],
        recommendations: ['Upload a valid image file in a supported format'],
      };
    }
  }

  /**
   * Batch process multiple images for better performance
   */
  async uploadMultipleImagesAsync(
    files: Express.Multer.File[],
    category: ImageCategory,
    entityType: EntityType,
    entityId: string,
    uploadedBy: string,
  ): Promise<{ uploadIds: string[] }> {
    const uploadIds: string[] = [];

    for (const file of files) {
      if (file.size <= this.qualityStandards.maxFileSize) {
        const result = await this.uploadImageAsync(file, category, entityType, entityId, uploadedBy);
        uploadIds.push(result.uploadId);
      }
    }

    return { uploadIds };
  }

  /**
   * Get batch upload status
   */
  async getBatchUploadStatus(uploadIds: string[]): Promise<AsyncUploadResult[]> {
    return uploadIds.map(id => this.processingQueue.get(id)).filter(Boolean) as AsyncUploadResult[];
  }

  /**
   * Clear completed uploads from queue (cleanup)
   */
  async clearCompletedUploads(): Promise<void> {
    for (const [uploadId, result] of this.processingQueue.entries()) {
      if (result.status === 'completed' || result.status === 'failed') {
        this.processingQueue.delete(uploadId);
      }
    }
  }
}