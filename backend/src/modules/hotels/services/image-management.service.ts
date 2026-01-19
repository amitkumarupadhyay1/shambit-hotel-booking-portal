import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  VirtualTourData,
} from '../interfaces/enhanced-hotel.interface';

export interface ImageQualityStandards {
  minResolution: { width: number; height: number };
  acceptableAspectRatios: number[];
  blurThreshold: number;
  brightnessRange: { min: number; max: number };
  contrastRange: { min: number; max: number };
  maxFileSize: number; // in bytes
}

export interface OptimizedImageSet {
  original: string;
  large: string; // 1920x1080
  medium: string; // 1024x768
  small: string; // 640x480
  thumbnail: string; // 300x300
}

@Injectable()
export class ImageManagementService {
  private readonly uploadPath = process.env.UPLOAD_PATH || './uploads';
  private readonly baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  private readonly qualityStandards: ImageQualityStandards = {
    minResolution: { width: 1920, height: 1080 },
    acceptableAspectRatios: [16/9, 4/3, 3/2, 1/1], // Common aspect ratios
    blurThreshold: 0.8, // Laplacian variance threshold
    brightnessRange: { min: 50, max: 200 }, // 0-255 scale
    contrastRange: { min: 30, max: 200 }, // Standard deviation threshold
    maxFileSize: 5 * 1024 * 1024, // 5MB
  };

  constructor(
    @InjectRepository(ImageMetadata)
    private readonly imageMetadataRepository: Repository<ImageMetadata>,
  ) {
    this.ensureUploadDirectories();
  }

  private async ensureUploadDirectories(): Promise<void> {
    const directories = [
      this.uploadPath,
      path.join(this.uploadPath, 'original'),
      path.join(this.uploadPath, 'optimized'),
      path.join(this.uploadPath, 'thumbnails'),
    ];

    for (const dir of directories) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    category: ImageCategory,
    entityType: EntityType,
    entityId: string,
    uploadedBy: string,
  ): Promise<ProcessedImage> {
    try {
      // Validate file size
      if (file.size > this.qualityStandards.maxFileSize) {
        throw new BadRequestException(
          `File size exceeds maximum limit of ${this.qualityStandards.maxFileSize / (1024 * 1024)}MB`
        );
      }

      // Validate image quality
      const qualityResult = await this.validateImageQuality(file.buffer);
      
      // Generate optimized images
      const optimizedSet = await this.optimizeImage(file.buffer, file.originalname);
      
      // Generate thumbnails
      const thumbnails = await this.generateThumbnails(file.buffer, file.originalname);
      
      // Create metadata record
      const imageMetadata = new ImageMetadata();
      imageMetadata.filename = file.originalname;
      imageMetadata.originalUrl = `${this.baseUrl}/uploads/original/${optimizedSet.original}`;
      imageMetadata.optimizedUrls = {
        large: `${this.baseUrl}/uploads/optimized/${optimizedSet.large}`,
        medium: `${this.baseUrl}/uploads/optimized/${optimizedSet.medium}`,
        small: `${this.baseUrl}/uploads/optimized/${optimizedSet.small}`,
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

      // Return processed image
      return {
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
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to process image upload');
    }
  }

  async validateImageQuality(imageBuffer: Buffer): Promise<QualityCheckResult> {
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

      // Check brightness (using channel statistics)
      if (stats.channels) {
        const avgBrightness = stats.channels.reduce((sum, channel) => sum + channel.mean, 0) / stats.channels.length;
        
        if (avgBrightness < this.qualityStandards.brightnessRange.min) {
          issues.push({
            type: 'brightness',
            severity: 'medium',
            description: 'Image appears too dark',
            suggestedFix: 'Increase brightness or improve lighting when taking the photo',
          });
          score -= 15;
        } else if (avgBrightness > this.qualityStandards.brightnessRange.max) {
          issues.push({
            type: 'brightness',
            severity: 'medium',
            description: 'Image appears overexposed',
            suggestedFix: 'Reduce brightness or avoid harsh lighting',
          });
          score -= 15;
        }

        // Check contrast (using standard deviation as proxy)
        const avgStdDev = stats.channels.reduce((sum, channel) => sum + channel.stdev, 0) / stats.channels.length;
        
        if (avgStdDev < this.qualityStandards.contrastRange.min) {
          issues.push({
            type: 'contrast',
            severity: 'medium',
            description: 'Image has low contrast',
            suggestedFix: 'Increase contrast or ensure better lighting conditions',
          });
          score -= 15;
        }
      }

      // Blur detection using Laplacian variance
      const blurScore = await this.detectBlur(imageBuffer);
      if (blurScore < this.qualityStandards.blurThreshold) {
        issues.push({
          type: 'blur',
          severity: 'high',
          description: 'Image appears blurry or out of focus',
          suggestedFix: 'Ensure camera is focused and stable when taking the photo',
        });
        score -= 25;
      }

      // Generate recommendations
      const recommendations: string[] = [];
      if (issues.length === 0) {
        recommendations.push('Image meets all quality standards');
      } else {
        recommendations.push('Consider retaking the photo with the following improvements:');
        issues.forEach(issue => recommendations.push(`- ${issue.suggestedFix}`));
      }

      return {
        passed: issues.length === 0 || !issues.some(issue => issue.severity === 'high'),
        score: Math.max(0, score),
        issues,
        recommendations,
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

  private async detectBlur(imageBuffer: Buffer): Promise<number> {
    try {
      // Convert to grayscale and apply Laplacian filter for blur detection
      const { data, info } = await sharp(imageBuffer)
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Simple Laplacian variance calculation
      let variance = 0;
      const width = info.width;
      const height = info.height;

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          const laplacian = 
            -data[idx - width - 1] - data[idx - width] - data[idx - width + 1] +
            -data[idx - 1] + 8 * data[idx] - data[idx + 1] +
            -data[idx + width - 1] - data[idx + width] - data[idx + width + 1];
          variance += laplacian * laplacian;
        }
      }

      return variance / ((width - 2) * (height - 2));
    } catch {
      return 0; // Return 0 if blur detection fails
    }
  }

  async optimizeImage(imageBuffer: Buffer, originalFilename: string): Promise<OptimizedImageSet> {
    const timestamp = Date.now();
    const ext = path.extname(originalFilename);
    const baseName = path.basename(originalFilename, ext);
    
    const filenames = {
      original: `${baseName}_${timestamp}_original${ext}`,
      large: `${baseName}_${timestamp}_large.webp`,
      medium: `${baseName}_${timestamp}_medium.webp`,
      small: `${baseName}_${timestamp}_small.webp`,
      thumbnail: `${baseName}_${timestamp}_thumb.webp`,
    };

    // Save original
    await fs.writeFile(
      path.join(this.uploadPath, 'original', filenames.original),
      imageBuffer
    );

    // Generate optimized versions
    const image = sharp(imageBuffer);
    
    // Large version (1920x1080 max)
    await image
      .clone()
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(this.uploadPath, 'optimized', filenames.large));

    // Medium version (1024x768 max)
    await image
      .clone()
      .resize(1024, 768, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(this.uploadPath, 'optimized', filenames.medium));

    // Small version (640x480 max)
    await image
      .clone()
      .resize(640, 480, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(path.join(this.uploadPath, 'optimized', filenames.small));

    return filenames;
  }

  async generateThumbnails(imageBuffer: Buffer, originalFilename: string): Promise<ThumbnailSet> {
    const timestamp = Date.now();
    const baseName = path.basename(originalFilename, path.extname(originalFilename));
    
    const filenames = {
      small: `${baseName}_${timestamp}_thumb_150.webp`,
      medium: `${baseName}_${timestamp}_thumb_300.webp`,
      large: `${baseName}_${timestamp}_thumb_600.webp`,
    };

    const image = sharp(imageBuffer);

    // Generate square thumbnails
    await Promise.all([
      image
        .clone()
        .resize(150, 150, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(path.join(this.uploadPath, 'thumbnails', filenames.small)),
      
      image
        .clone()
        .resize(300, 300, { fit: 'cover' })
        .webp({ quality: 85 })
        .toFile(path.join(this.uploadPath, 'thumbnails', filenames.medium)),
      
      image
        .clone()
        .resize(600, 600, { fit: 'cover' })
        .webp({ quality: 90 })
        .toFile(path.join(this.uploadPath, 'thumbnails', filenames.large)),
    ]);

    return filenames;
  }

  async categorizeImage(imageId: string, category: ImageCategory): Promise<void> {
    await this.imageMetadataRepository.update(imageId, { category });
  }

  async deleteImage(imageId: string): Promise<void> {
    const imageMetadata = await this.imageMetadataRepository.findOne({
      where: { id: imageId },
    });

    if (!imageMetadata) {
      throw new BadRequestException('Image not found');
    }

    // Delete physical files
    try {
      const originalPath = imageMetadata.originalUrl.replace(this.baseUrl, '.');
      await fs.unlink(originalPath);

      // Delete optimized versions
      if (imageMetadata.optimizedUrls) {
        for (const url of Object.values(imageMetadata.optimizedUrls)) {
          const filePath = url.replace(this.baseUrl, '.');
          try {
            await fs.unlink(filePath);
          } catch {
            // Ignore if file doesn't exist
          }
        }
      }

      // Delete thumbnails
      if (imageMetadata.thumbnails) {
        for (const url of Object.values(imageMetadata.thumbnails)) {
          const filePath = url.replace(this.baseUrl, '.');
          try {
            await fs.unlink(filePath);
          } catch {
            // Ignore if file doesn't exist
          }
        }
      }
    } catch (error) {
      // Log error but don't fail the deletion
      console.error('Failed to delete physical files:', error);
    }

    // Delete database record
    await this.imageMetadataRepository.delete(imageId);
  }

  async getImagesByEntity(entityType: EntityType, entityId: string): Promise<ProcessedImage[]> {
    const imageMetadataList = await this.imageMetadataRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });

    return imageMetadataList.map(metadata => ({
      id: metadata.id,
      originalUrl: metadata.originalUrl,
      optimizedUrls: metadata.optimizedUrls,
      thumbnails: metadata.thumbnails,
      metadata: {
        filename: metadata.filename,
        size: metadata.sizeBytes,
        dimensions: metadata.dimensions,
        format: metadata.format,
        uploadedAt: metadata.createdAt,
        uploadedBy: metadata.uploadedBy,
        qualityChecks: metadata.qualityChecks,
        tags: metadata.tags,
      },
      qualityScore: metadata.qualityScore,
      category: metadata.category,
    }));
  }

  async getImagesByCategory(
    entityType: EntityType,
    entityId: string,
    category: ImageCategory,
  ): Promise<ProcessedImage[]> {
    const imageMetadataList = await this.imageMetadataRepository.find({
      where: { entityType, entityId, category },
      order: { createdAt: 'DESC' },
    });

    return imageMetadataList.map(metadata => ({
      id: metadata.id,
      originalUrl: metadata.originalUrl,
      optimizedUrls: metadata.optimizedUrls,
      thumbnails: metadata.thumbnails,
      metadata: {
        filename: metadata.filename,
        size: metadata.sizeBytes,
        dimensions: metadata.dimensions,
        format: metadata.format,
        uploadedAt: metadata.createdAt,
        uploadedBy: metadata.uploadedBy,
        qualityChecks: metadata.qualityChecks,
        tags: metadata.tags,
      },
      qualityScore: metadata.qualityScore,
      category: metadata.category,
    }));
  }

  // Virtual tour integration methods
  async createVirtualTour(
    name: string,
    url: string,
    type: '360_image' | '360_video' | 'virtual_walkthrough',
    category: ImageCategory,
    entityType: EntityType,
    entityId: string,
    metadata: { duration?: number; resolution: string; fileSize: number },
  ): Promise<VirtualTourData> {
    // For now, we'll store virtual tour data in a simple format
    // In a production system, you might want a separate VirtualTour entity
    return {
      id: `vt_${Date.now()}`,
      name,
      url,
      type,
      category,
      metadata,
    };
  }

  async updateImageTags(imageId: string, tags: string[]): Promise<void> {
    await this.imageMetadataRepository.update(imageId, { tags });
  }

  async getQualityStandards(): Promise<ImageQualityStandards> {
    return this.qualityStandards;
  }
}