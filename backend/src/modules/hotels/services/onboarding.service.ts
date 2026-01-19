import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OnboardingSession, SessionStatus } from '../entities/onboarding-session.entity';
import { EnhancedHotel } from '../entities/enhanced-hotel.entity';
import { User } from '../../users/entities/user.entity';
import { OnboardingStatus } from '../interfaces/enhanced-hotel.interface';

export interface StepData {
  [key: string]: any;
}

export interface OnboardingDraft {
  [stepId: string]: StepData;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CompletionResult {
  success: boolean;
  sessionId: string;
  hotelId: string;
  qualityScore: number;
  message: string;
}

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    @InjectRepository(OnboardingSession)
    private readonly onboardingSessionRepository: Repository<OnboardingSession>,
    @InjectRepository(EnhancedHotel)
    private readonly enhancedHotelRepository: Repository<EnhancedHotel>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new onboarding session for a hotel
   * Requirements: 6.1, 6.4 - Mobile-first onboarding with offline support
   */
  async createOnboardingSession(hotelId: string, userId: string): Promise<OnboardingSession> {
    this.logger.log(`Creating onboarding session for hotel ${hotelId} and user ${userId}`);

    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify hotel exists
    const hotel = await this.enhancedHotelRepository.findOne({ where: { id: hotelId } });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    // Check if there's already an active session
    const existingSession = await this.onboardingSessionRepository.findOne({
      where: {
        enhancedHotelId: hotelId,
        userId,
        sessionStatus: SessionStatus.ACTIVE,
      },
    });

    if (existingSession && existingSession.isActive()) {
      this.logger.log(`Returning existing active session ${existingSession.id}`);
      return existingSession;
    }

    // Create new session
    const session = new OnboardingSession();
    session.enhancedHotelId = hotelId;
    session.userId = userId;
    session.currentStep = 0;
    session.completedSteps = [];
    session.draftData = {};
    session.qualityScore = 0;
    session.sessionStatus = SessionStatus.ACTIVE;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const savedSession = await this.onboardingSessionRepository.save(session);
    this.logger.log(`Created new onboarding session ${savedSession.id}`);

    return savedSession;
  }

  /**
   * Update onboarding step data
   * Requirements: 6.5 - Real-time validation, 6.4 - Offline draft saving
   */
  async updateOnboardingStep(sessionId: string, stepId: string, stepData: StepData): Promise<void> {
    this.logger.log(`Updating step ${stepId} for session ${sessionId}`);

    const session = await this.onboardingSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Onboarding session not found');
    }

    if (!session.isActive()) {
      throw new BadRequestException('Onboarding session is not active or has expired');
    }

    // Update draft data
    session.draftData[stepId] = stepData;
    session.updatedAt = new Date();

    await this.onboardingSessionRepository.save(session);
    this.logger.log(`Updated step ${stepId} data for session ${sessionId}`);
  }

  /**
   * Validate step data against business rules
   * Requirements: 6.5 - Real-time validation
   */
  async validateStepData(stepId: string, data: StepData): Promise<ValidationResult> {
    this.logger.log(`Validating step ${stepId} data`);

    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      switch (stepId) {
        case 'amenities':
          await this.validateAmenityStep(data, result);
          break;
        case 'images':
          await this.validateImageStep(data, result);
          break;
        case 'property-info':
          await this.validatePropertyInfoStep(data, result);
          break;
        case 'rooms':
          await this.validateRoomStep(data, result);
          break;
        case 'business-features':
          await this.validateBusinessFeaturesStep(data, result);
          break;
        default:
          this.logger.warn(`No validation rules defined for step: ${stepId}`);
      }

      result.isValid = result.errors.length === 0;
    } catch (error) {
      this.logger.error(`Validation error for step ${stepId}:`, error);
      result.isValid = false;
      result.errors.push('Validation failed due to system error');
    }

    return result;
  }

  /**
   * Complete onboarding process
   * Requirements: 7.1 - Quality score calculation, 8.4 - System integration
   */
  async completeOnboarding(sessionId: string): Promise<CompletionResult> {
    this.logger.log(`Completing onboarding for session ${sessionId}`);

    const session = await this.onboardingSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['enhancedHotel'],
    });

    if (!session) {
      throw new NotFoundException('Onboarding session not found');
    }

    if (!session.isActive()) {
      throw new BadRequestException('Onboarding session is not active or has expired');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Calculate quality score
      const qualityScore = await this.calculateQualityScore(session.draftData);
      
      // Update hotel with onboarding data
      await this.applyOnboardingDataToHotel(session.enhancedHotelId, session.draftData, queryRunner);

      // Update hotel onboarding status
      const hotel = await queryRunner.manager.findOne(EnhancedHotel, {
        where: { id: session.enhancedHotelId },
      });

      if (hotel) {
        hotel.onboardingStatus = OnboardingStatus.COMPLETED;
        hotel.qualityMetrics = {
          overallScore: qualityScore,
          imageQuality: 0, // Will be calculated by quality assurance engine
          contentCompleteness: 0,
          policyClarity: 0,
          lastCalculated: new Date(),
          breakdown: {
            imageQuality: { score: 0, weight: 0.4, factors: {} as any },
            contentCompleteness: { score: 0, weight: 0.4, factors: {} as any },
            policyClarity: { score: 0, weight: 0.2, factors: {} as any },
          },
        };
        await queryRunner.manager.save(hotel);
      }

      // Mark session as completed
      session.sessionStatus = SessionStatus.COMPLETED;
      session.qualityScore = qualityScore;
      await queryRunner.manager.save(session);

      await queryRunner.commitTransaction();

      this.logger.log(`Completed onboarding for session ${sessionId} with quality score ${qualityScore}`);

      return {
        success: true,
        sessionId,
        hotelId: session.enhancedHotelId,
        qualityScore,
        message: 'Onboarding completed successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to complete onboarding for session ${sessionId}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Save draft data
   * Requirements: 6.4 - Offline draft saving
   */
  async saveDraft(sessionId: string, draftData: OnboardingDraft): Promise<void> {
    this.logger.log(`Saving draft for session ${sessionId}`);

    const session = await this.onboardingSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Onboarding session not found');
    }

    session.draftData = { ...session.draftData, ...draftData };
    session.updatedAt = new Date();

    await this.onboardingSessionRepository.save(session);
    this.logger.log(`Saved draft for session ${sessionId}`);
  }

  /**
   * Load draft data
   * Requirements: 6.4 - Offline draft saving
   */
  async loadDraft(sessionId: string): Promise<OnboardingDraft> {
    this.logger.log(`Loading draft for session ${sessionId}`);

    const session = await this.onboardingSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Onboarding session not found');
    }

    return session.draftData || {};
  }

  /**
   * Mark step as completed
   * Requirements: 6.6 - Step completion tracking
   */
  async markStepCompleted(sessionId: string, stepId: string): Promise<void> {
    this.logger.log(`Marking step ${stepId} as completed for session ${sessionId}`);

    const session = await this.onboardingSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Onboarding session not found');
    }

    if (!session.isStepCompleted(stepId)) {
      session.addCompletedStep(stepId);
      await this.onboardingSessionRepository.save(session);
    }
  }

  /**
   * Get session progress
   * Requirements: 6.2 - Progress indicators
   */
  async getSessionProgress(sessionId: string): Promise<{
    currentStep: number;
    completedSteps: string[];
    totalSteps: number;
    completionPercentage: number;
    qualityScore: number;
  }> {
    const session = await this.onboardingSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Onboarding session not found');
    }

    return {
      currentStep: session.currentStep,
      completedSteps: session.completedSteps,
      totalSteps: 14, // Based on task list
      completionPercentage: session.getCompletionPercentage(),
      qualityScore: session.qualityScore,
    };
  }

  // Private validation methods
  private async validateAmenityStep(data: StepData, result: ValidationResult): Promise<void> {
    if (!data.selectedAmenities || !Array.isArray(data.selectedAmenities)) {
      result.errors.push('Selected amenities must be provided as an array');
      return;
    }

    if (data.selectedAmenities.length === 0) {
      result.warnings.push('Consider adding amenities to attract more guests');
    }

    // Validate amenity business rules
    // This would integrate with the AmenityService for proper validation
  }

  private async validateImageStep(data: StepData, result: ValidationResult): Promise<void> {
    if (!data.images || !Array.isArray(data.images)) {
      result.errors.push('Images must be provided as an array');
      return;
    }

    if (data.images.length === 0) {
      result.errors.push('At least one image is required');
      return;
    }

    // Validate image quality and categories
    const requiredCategories = ['exterior', 'lobby', 'rooms'];
    const providedCategories = new Set(data.images.map((img: any) => img.category));
    
    for (const category of requiredCategories) {
      if (!providedCategories.has(category)) {
        result.warnings.push(`Consider adding ${category} images for better presentation`);
      }
    }
  }

  private async validatePropertyInfoStep(data: StepData, result: ValidationResult): Promise<void> {
    if (!data.description || data.description.trim().length < 50) {
      result.errors.push('Property description must be at least 50 characters');
    }

    if (!data.policies) {
      result.errors.push('Hotel policies are required');
    }

    if (!data.locationDetails) {
      result.warnings.push('Adding location details helps guests find your property');
    }
  }

  private async validateRoomStep(data: StepData, result: ValidationResult): Promise<void> {
    if (!data.rooms || !Array.isArray(data.rooms)) {
      result.errors.push('Room information must be provided as an array');
      return;
    }

    if (data.rooms.length === 0) {
      result.errors.push('At least one room type is required');
      return;
    }

    // Validate each room
    for (const room of data.rooms) {
      if (!room.name || room.name.trim().length === 0) {
        result.errors.push('All rooms must have a name');
      }
      if (!room.images || room.images.length === 0) {
        result.warnings.push(`Consider adding images for ${room.name || 'room'}`);
      }
    }
  }

  private async validateBusinessFeaturesStep(data: StepData, result: ValidationResult): Promise<void> {
    // Business features are optional, so only validate if provided
    if (data.meetingRooms && Array.isArray(data.meetingRooms)) {
      for (const room of data.meetingRooms) {
        if (!room.name || !room.capacity) {
          result.errors.push('Meeting rooms must have name and capacity');
        }
      }
    }

    if (data.connectivity && !data.connectivity.wifiSpeed) {
      result.warnings.push('Consider providing WiFi speed information for business travelers');
    }
  }

  private async calculateQualityScore(draftData: OnboardingDraft): Promise<number> {
    let score = 0;
    let maxScore = 0;

    // Image quality (40% weight)
    const imageData = draftData['images'];
    if (imageData && imageData.images) {
      const imageScore = Math.min(imageData.images.length * 10, 40);
      score += imageScore;
    }
    maxScore += 40;

    // Content completeness (40% weight)
    const propertyData = draftData['property-info'];
    if (propertyData) {
      if (propertyData.description && propertyData.description.length > 100) score += 15;
      if (propertyData.policies) score += 15;
      if (propertyData.locationDetails) score += 10;
    }
    maxScore += 40;

    // Policy clarity (20% weight)
    if (propertyData && propertyData.policies) {
      if (propertyData.policies.checkIn) score += 7;
      if (propertyData.policies.cancellation) score += 7;
      if (propertyData.policies.booking) score += 6;
    }
    maxScore += 20;

    return Math.round((score / maxScore) * 100);
  }

  private async applyOnboardingDataToHotel(
    hotelId: string,
    draftData: OnboardingDraft,
    queryRunner: any,
  ): Promise<void> {
    const hotel = await queryRunner.manager.findOne(EnhancedHotel, {
      where: { id: hotelId },
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    // Apply amenity data
    if (draftData['amenities']) {
      hotel.amenities = draftData['amenities'].selectedAmenities || {};
    }

    // Apply property information
    if (draftData['property-info']) {
      const propData = draftData['property-info'];
      if (propData.description) {
        hotel.propertyDescription = {
          content: propData.description,
          format: 'html',
          wordCount: propData.description.split(' ').length,
          readingTime: Math.ceil(propData.description.split(' ').length / 200),
        };
      }
      if (propData.policies) {
        hotel.policies = propData.policies;
      }
      if (propData.locationDetails) {
        hotel.locationDetails = propData.locationDetails;
      }
    }

    // Apply business features
    if (draftData['business-features']) {
      hotel.businessFeatures = draftData['business-features'];
    }

    await queryRunner.manager.save(hotel);
  }
}