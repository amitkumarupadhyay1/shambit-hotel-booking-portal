import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QualityReport, MissingInformation, Recommendation } from '../entities/quality-report.entity';
import { EnhancedHotel } from '../entities/enhanced-hotel.entity';
import {
  QualityMetrics,
  QualityScoreBreakdown,
  ImageQualityFactors,
  ContentCompletenessFactors,
  PolicyClarityFactors,
  ProcessedImage,
  CategorizedAmenities,
  HotelPolicies,
  RichTextContent,
  LocationDetails,
  BusinessFeatures,
  ImageCategory,
  CategorizedImages,
} from '../interfaces/enhanced-hotel.interface';

export interface QualityAssessmentData {
  images?: ProcessedImage[];
  amenities?: CategorizedAmenities;
  propertyDescription?: RichTextContent;
  locationDetails?: LocationDetails;
  policies?: HotelPolicies;
  businessFeatures?: BusinessFeatures;
  totalRooms?: number;
}

@Injectable()
export class QualityAssuranceService {
  private readonly logger = new Logger(QualityAssuranceService.name);

  constructor(
    @InjectRepository(QualityReport)
    private readonly qualityReportRepository: Repository<QualityReport>,
    @InjectRepository(EnhancedHotel)
    private readonly enhancedHotelRepository: Repository<EnhancedHotel>,
  ) {}

  /**
   * Calculate weighted quality score (image 40%, content 40%, policy 20%)
   * Requirements: 7.1 - Quality score calculation
   */
  async calculateQualityScore(data: QualityAssessmentData): Promise<QualityMetrics> {
    const startTime = Date.now();
    
    try {
      // Calculate individual component scores
      const imageQualityScore = this.calculateImageQualityScore(data.images || []);
      const contentCompletenessScore = this.calculateContentCompletenessScore(data);
      const policyClarityScore = this.calculatePolicyClarityScore(data.policies);

      // Apply weights: image 40%, content 40%, policy 20%
      const overallScore = Math.round(
        (imageQualityScore.score * 0.4) +
        (contentCompletenessScore.score * 0.4) +
        (policyClarityScore.score * 0.2)
      );

      const breakdown: QualityScoreBreakdown = {
        imageQuality: {
          score: imageQualityScore.score,
          weight: 0.4,
          factors: imageQualityScore.factors,
        },
        contentCompleteness: {
          score: contentCompletenessScore.score,
          weight: 0.4,
          factors: contentCompletenessScore.factors,
        },
        policyClarity: {
          score: policyClarityScore.score,
          weight: 0.2,
          factors: policyClarityScore.factors,
        },
      };

      const qualityMetrics: QualityMetrics = {
        overallScore,
        imageQuality: imageQualityScore.score,
        contentCompleteness: contentCompletenessScore.score,
        policyClarity: policyClarityScore.score,
        lastCalculated: new Date(),
        breakdown,
      };

      const calculationTime = Date.now() - startTime;
      this.logger.log(`Quality score calculated in ${calculationTime}ms: ${overallScore}`);

      return qualityMetrics;
    } catch (error) {
      this.logger.error('Error calculating quality score:', error);
      throw error;
    }
  }

  /**
   * Identify missing information and generate alerts
   * Requirements: 7.2 - Missing information detection
   */
  async identifyMissingInformation(data: QualityAssessmentData): Promise<MissingInformation[]> {
    const missingInfo: MissingInformation[] = [];

    // Check image completeness
    const imageMissing = this.checkMissingImages(data.images || []);
    if (imageMissing.items.length > 0) {
      missingInfo.push(imageMissing);
    }

    // Check content completeness
    const contentMissing = this.checkMissingContent(data);
    if (contentMissing.items.length > 0) {
      missingInfo.push(contentMissing);
    }

    // Check policy completeness
    const policyMissing = this.checkMissingPolicies(data.policies);
    if (policyMissing.items.length > 0) {
      missingInfo.push(policyMissing);
    }

    // Check business features completeness
    const businessMissing = this.checkMissingBusinessFeatures(data.businessFeatures);
    if (businessMissing.items.length > 0) {
      missingInfo.push(businessMissing);
    }

    return missingInfo;
  }

  /**
   * Generate recommendations based on hospitality best practices
   * Requirements: 7.4 - Recommendation engine
   */
  async generateRecommendations(qualityMetrics: QualityMetrics, missingInfo: MissingInformation[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Image quality recommendations
    if (qualityMetrics.imageQuality < 70) {
      recommendations.push({
        type: 'image',
        title: 'Improve Image Quality',
        description: 'Your property images need improvement to attract more bookings',
        priority: 'high',
        actionRequired: 'Upload high-resolution, professional photos covering all property areas',
        estimatedImpact: 15,
      });
    }

    // Content completeness recommendations
    if (qualityMetrics.contentCompleteness < 70) {
      recommendations.push({
        type: 'content',
        title: 'Complete Property Information',
        description: 'Missing property details can reduce booking confidence',
        priority: 'high',
        actionRequired: 'Add detailed descriptions, amenities, and location information',
        estimatedImpact: 12,
      });
    }

    // Policy clarity recommendations
    if (qualityMetrics.policyClarity < 70) {
      recommendations.push({
        type: 'policy',
        title: 'Clarify Booking Policies',
        description: 'Clear policies reduce booking disputes and improve guest satisfaction',
        priority: 'medium',
        actionRequired: 'Define check-in/out times, cancellation terms, and house rules',
        estimatedImpact: 8,
      });
    }

    // Add specific recommendations based on missing information
    for (const missing of missingInfo) {
      if (missing.priority === 'high') {
        recommendations.push({
          type: this.getRecommendationType(missing.category),
          title: `Add Missing ${missing.category}`,
          description: `Critical information is missing from your ${missing.category.toLowerCase()} section`,
          priority: 'high',
          actionRequired: `Complete: ${missing.items.join(', ')}`,
          estimatedImpact: 10,
        });
      }
    }

    // Best practice recommendations
    recommendations.push(...this.getHospitalityBestPracticeRecommendations(qualityMetrics));

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Create comprehensive quality report
   * Requirements: 7.5 - Quality report generation, 9.4 - Performance (5 seconds)
   */
  async createQualityReport(enhancedHotelId: string): Promise<QualityReport> {
    const startTime = Date.now();
    
    try {
      // Fetch hotel data
      const hotel = await this.enhancedHotelRepository.findOne({
        where: { id: enhancedHotelId },
        relations: ['images', 'rooms'],
      });

      if (!hotel) {
        throw new Error(`Hotel not found: ${enhancedHotelId}`);
      }

      // Prepare assessment data
      const assessmentData: QualityAssessmentData = {
        images: this.extractAllImages(hotel.images),
        amenities: hotel.amenities,
        propertyDescription: hotel.propertyDescription,
        locationDetails: hotel.locationDetails,
        policies: hotel.policies,
        businessFeatures: hotel.businessFeatures,
        totalRooms: hotel.basicInfo?.totalRooms || 0,
      };

      // Calculate quality metrics
      const qualityMetrics = await this.calculateQualityScore(assessmentData);
      
      // Identify missing information
      const missingInformation = await this.identifyMissingInformation(assessmentData);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(qualityMetrics, missingInformation);

      // Create quality report
      const qualityReport = new QualityReport();
      qualityReport.enhancedHotelId = enhancedHotelId;
      qualityReport.overallScore = qualityMetrics.overallScore;
      qualityReport.imageQualityScore = qualityMetrics.imageQuality;
      qualityReport.contentCompletenessScore = qualityMetrics.contentCompleteness;
      qualityReport.policyClarityScore = qualityMetrics.policyClarity;
      qualityReport.scoreBreakdown = qualityMetrics.breakdown;
      qualityReport.missingInformation = missingInformation;
      qualityReport.recommendations = recommendations;
      qualityReport.generatedBy = 'QUALITY_ASSURANCE_ENGINE';

      // Save report
      const savedReport = await this.qualityReportRepository.save(qualityReport);

      // Update hotel quality metrics
      hotel.qualityMetrics = qualityMetrics;
      await this.enhancedHotelRepository.save(hotel);

      const processingTime = Date.now() - startTime;
      this.logger.log(`Quality report generated in ${processingTime}ms for hotel ${enhancedHotelId}`);

      // Ensure performance requirement (5 seconds)
      if (processingTime > 5000) {
        this.logger.warn(`Quality report generation took ${processingTime}ms, exceeding 5 second target`);
      }

      return savedReport;
    } catch (error) {
      this.logger.error(`Error creating quality report for hotel ${enhancedHotelId}:`, error);
      throw error;
    }
  }

  // Private helper methods

  private extractAllImages(categorizedImages?: CategorizedImages): ProcessedImage[] {
    if (!categorizedImages) return [];
    
    const allImages: ProcessedImage[] = [];
    
    // Extract images from all categories
    if (categorizedImages.exterior) allImages.push(...categorizedImages.exterior);
    if (categorizedImages.lobby) allImages.push(...categorizedImages.lobby);
    if (categorizedImages.rooms) allImages.push(...categorizedImages.rooms);
    if (categorizedImages.amenities) allImages.push(...categorizedImages.amenities);
    if (categorizedImages.dining) allImages.push(...categorizedImages.dining);
    if (categorizedImages.recreational) allImages.push(...categorizedImages.recreational);
    if (categorizedImages.business) allImages.push(...categorizedImages.business);
    
    return allImages;
  }

  private calculateImageQualityScore(images: ProcessedImage[]): { score: number; factors: ImageQualityFactors } {
    if (!images || images.length === 0) {
      return {
        score: 0,
        factors: {
          totalImages: 0,
          highQualityImages: 0,
          categoryCoverage: 0,
          professionalPhotos: 0,
        },
      };
    }

    const totalImages = images.length;
    const highQualityImages = images.filter(img => img.qualityScore >= 80).length;
    
    // Check category coverage
    const requiredCategories = [ImageCategory.EXTERIOR, ImageCategory.LOBBY, ImageCategory.ROOMS];
    const presentCategories = new Set(images.map(img => img.category));
    const categoryCoverage = requiredCategories.filter(cat => presentCategories.has(cat)).length;
    
    // Estimate professional photos based on quality score and metadata
    const professionalPhotos = images.filter(img => 
      img.qualityScore >= 85 && 
      img.metadata?.dimensions?.width >= 1920 &&
      img.metadata?.dimensions?.height >= 1080
    ).length;

    // Calculate score based on factors
    let score = 0;
    
    // Base score for having images
    score += Math.min(totalImages * 5, 30); // Up to 30 points for quantity
    
    // Quality bonus
    score += (highQualityImages / totalImages) * 40; // Up to 40 points for quality
    
    // Category coverage bonus
    score += (categoryCoverage / requiredCategories.length) * 20; // Up to 20 points for coverage
    
    // Professional photos bonus
    score += Math.min(professionalPhotos * 2, 10); // Up to 10 points for professional quality

    return {
      score: Math.min(Math.round(score), 100),
      factors: {
        totalImages,
        highQualityImages,
        categoryCoverage,
        professionalPhotos,
      },
    };
  }

  private calculateContentCompletenessScore(data: QualityAssessmentData): { score: number; factors: ContentCompletenessFactors } {
    let score = 0;
    
    // Property description quality (25 points)
    const descriptionQuality = this.assessDescriptionQuality(data.propertyDescription);
    score += descriptionQuality * 0.25;
    
    // Amenity completeness (25 points)
    const amenityCompleteness = this.assessAmenityCompleteness(data.amenities);
    score += amenityCompleteness * 0.25;
    
    // Location details (25 points)
    const locationDetails = this.assessLocationDetails(data.locationDetails);
    score += locationDetails * 0.25;
    
    // Room information (25 points)
    const roomInformation = this.assessRoomInformation(data.totalRooms || 0);
    score += roomInformation * 0.25;

    return {
      score: Math.round(score),
      factors: {
        descriptionQuality,
        amenityCompleteness,
        locationDetails,
        roomInformation,
      },
    };
  }

  private calculatePolicyClarityScore(policies?: HotelPolicies): { score: number; factors: PolicyClarityFactors } {
    if (!policies) {
      return {
        score: 0,
        factors: {
          cancellationPolicy: 0,
          checkInOut: 0,
          bookingTerms: 0,
          additionalPolicies: 0,
        },
      };
    }

    const cancellationPolicy = policies.cancellation ? 100 : 0;
    const checkInOut = (policies.checkIn && policies.checkOut) ? 100 : 0;
    const bookingTerms = policies.booking ? 100 : 0;
    const additionalPolicies = (policies.pet && policies.smoking) ? 100 : 0;

    const score = Math.round((cancellationPolicy + checkInOut + bookingTerms + additionalPolicies) / 4);

    return {
      score,
      factors: {
        cancellationPolicy,
        checkInOut,
        bookingTerms,
        additionalPolicies,
      },
    };
  }

  private checkMissingImages(images: ProcessedImage[]): MissingInformation {
    const missing: string[] = [];
    const requiredCategories = [ImageCategory.EXTERIOR, ImageCategory.LOBBY, ImageCategory.ROOMS];
    const presentCategories = new Set(images.map(img => img.category));

    for (const category of requiredCategories) {
      if (!presentCategories.has(category)) {
        missing.push(`${category.toLowerCase()} photos`);
      }
    }

    if (images.length < 5) {
      missing.push('minimum 5 property photos');
    }

    return {
      category: 'Images',
      items: missing,
      priority: missing.length > 0 ? 'high' : 'low',
    };
  }

  private checkMissingContent(data: QualityAssessmentData): MissingInformation {
    const missing: string[] = [];

    if (!data.propertyDescription || data.propertyDescription.wordCount < 50) {
      missing.push('detailed property description');
    }

    if (!data.amenities || Object.keys(data.amenities).length === 0) {
      missing.push('property amenities');
    }

    if (!data.locationDetails) {
      missing.push('location details and nearby attractions');
    }

    return {
      category: 'Content',
      items: missing,
      priority: missing.length > 2 ? 'high' : missing.length > 0 ? 'medium' : 'low',
    };
  }

  private checkMissingPolicies(policies?: HotelPolicies): MissingInformation {
    const missing: string[] = [];

    if (!policies) {
      missing.push('all booking policies');
      return {
        category: 'Policies',
        items: missing,
        priority: 'high',
      };
    }

    if (!policies.checkIn) missing.push('check-in policy');
    if (!policies.checkOut) missing.push('check-out policy');
    if (!policies.cancellation) missing.push('cancellation policy');
    if (!policies.booking) missing.push('booking terms');

    return {
      category: 'Policies',
      items: missing,
      priority: missing.length > 2 ? 'high' : missing.length > 0 ? 'medium' : 'low',
    };
  }

  private checkMissingBusinessFeatures(businessFeatures?: BusinessFeatures): MissingInformation {
    const missing: string[] = [];

    if (!businessFeatures) {
      return {
        category: 'Business Features',
        items: ['business amenities and services'],
        priority: 'low',
      };
    }

    if (!businessFeatures.connectivity || !businessFeatures.connectivity.wifiSpeed) {
      missing.push('WiFi speed information');
    }

    if (!businessFeatures.workSpaces || businessFeatures.workSpaces.length === 0) {
      missing.push('workspace details');
    }

    return {
      category: 'Business Features',
      items: missing,
      priority: missing.length > 0 ? 'medium' : 'low',
    };
  }

  private assessDescriptionQuality(description?: RichTextContent): number {
    if (!description) return 0;
    
    let score = 0;
    
    // Word count scoring
    if (description.wordCount >= 100) score += 40;
    else if (description.wordCount >= 50) score += 25;
    else if (description.wordCount >= 20) score += 10;
    
    // Content quality indicators
    if (description.content.includes('unique') || description.content.includes('special')) score += 15;
    if (description.content.includes('location') || description.content.includes('nearby')) score += 15;
    if (description.content.includes('amenities') || description.content.includes('facilities')) score += 15;
    if (description.readingTime > 0) score += 15;
    
    return Math.min(score, 100);
  }

  private assessAmenityCompleteness(amenities?: CategorizedAmenities): number {
    if (!amenities) return 0;
    
    const categories = Object.keys(amenities);
    const nonEmptyCategories = categories.filter(cat => 
      amenities[cat as keyof CategorizedAmenities] && 
      amenities[cat as keyof CategorizedAmenities].length > 0
    );
    
    return Math.round((nonEmptyCategories.length / categories.length) * 100);
  }

  private assessLocationDetails(locationDetails?: LocationDetails): number {
    if (!locationDetails) return 0;
    
    let score = 0;
    
    if (locationDetails.nearbyAttractions && locationDetails.nearbyAttractions.length > 0) score += 25;
    if (locationDetails.transportation) score += 25;
    if (locationDetails.accessibility) score += 25;
    if (locationDetails.neighborhood) score += 25;
    
    return score;
  }

  private assessRoomInformation(totalRooms: number): number {
    if (totalRooms === 0) return 0;
    if (totalRooms >= 10) return 100;
    if (totalRooms >= 5) return 80;
    if (totalRooms >= 2) return 60;
    return 40;
  }

  private getRecommendationType(category: string): 'image' | 'content' | 'policy' | 'amenity' {
    switch (category.toLowerCase()) {
      case 'images': return 'image';
      case 'policies': return 'policy';
      case 'business features': return 'amenity';
      default: return 'content';
    }
  }

  private getHospitalityBestPracticeRecommendations(qualityMetrics: QualityMetrics): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Overall score recommendations
    if (qualityMetrics.overallScore >= 90) {
      recommendations.push({
        type: 'content',
        title: 'Excellent Property Profile',
        description: 'Your property profile is outstanding! Consider highlighting unique features.',
        priority: 'low',
        actionRequired: 'Add seasonal promotions or special packages',
        estimatedImpact: 2,
      });
    } else if (qualityMetrics.overallScore >= 70) {
      recommendations.push({
        type: 'content',
        title: 'Good Foundation, Room for Growth',
        description: 'Your profile is solid. Focus on the highest-impact improvements.',
        priority: 'medium',
        actionRequired: 'Address the highest priority missing elements first',
        estimatedImpact: 5,
      });
    }

    // Industry best practices
    recommendations.push({
      type: 'image',
      title: 'Professional Photography',
      description: 'Professional photos can increase bookings by up to 40%',
      priority: 'medium',
      actionRequired: 'Consider hiring a professional photographer for key areas',
      estimatedImpact: 8,
    });

    return recommendations;
  }
}