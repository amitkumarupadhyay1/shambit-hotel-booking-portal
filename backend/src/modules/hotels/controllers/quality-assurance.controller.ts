import { Controller, Get, Post, Param, Body, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { QualityAssuranceService, QualityAssessmentData } from '../services/quality-assurance.service';
import { QualityMetrics } from '../interfaces/enhanced-hotel.interface';
import { QualityReport, MissingInformation, Recommendation } from '../entities/quality-report.entity';

@Controller('hotels/:hotelId/quality')
export class QualityAssuranceController {
  private readonly logger = new Logger(QualityAssuranceController.name);

  constructor(
    private readonly qualityAssuranceService: QualityAssuranceService,
  ) {}

  @Get('metrics')
  async getQualityMetrics(@Param('hotelId') hotelId: string): Promise<QualityMetrics> {
    try {
      this.logger.log(`Calculating quality metrics for hotel ${hotelId}`);
      
      // This would typically fetch hotel data and pass to quality service
      // For now, we'll use mock data structure
      const assessmentData: QualityAssessmentData = {
        images: [],
        amenities: undefined,
        propertyDescription: undefined,
        locationDetails: undefined,
        policies: undefined,
        businessFeatures: undefined,
        totalRooms: 0,
      };

      const qualityMetrics = await this.qualityAssuranceService.calculateQualityScore(assessmentData);
      
      this.logger.log(`Quality metrics calculated for hotel ${hotelId}: ${qualityMetrics.overallScore}%`);
      return qualityMetrics;
    } catch (error) {
      this.logger.error(`Error calculating quality metrics for hotel ${hotelId}:`, error);
      throw new HttpException(
        'Failed to calculate quality metrics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('missing-information')
  async getMissingInformation(@Param('hotelId') hotelId: string): Promise<MissingInformation[]> {
    try {
      this.logger.log(`Identifying missing information for hotel ${hotelId}`);
      
      const assessmentData: QualityAssessmentData = {
        images: [],
        amenities: undefined,
        propertyDescription: undefined,
        locationDetails: undefined,
        policies: undefined,
        businessFeatures: undefined,
        totalRooms: 0,
      };

      const missingInformation = await this.qualityAssuranceService.identifyMissingInformation(assessmentData);
      
      this.logger.log(`Found ${missingInformation.length} missing information items for hotel ${hotelId}`);
      return missingInformation;
    } catch (error) {
      this.logger.error(`Error identifying missing information for hotel ${hotelId}:`, error);
      throw new HttpException(
        'Failed to identify missing information',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('recommendations')
  async getRecommendations(@Param('hotelId') hotelId: string): Promise<Recommendation[]> {
    try {
      this.logger.log(`Generating recommendations for hotel ${hotelId}`);
      
      const assessmentData: QualityAssessmentData = {
        images: [],
        amenities: undefined,
        propertyDescription: undefined,
        locationDetails: undefined,
        policies: undefined,
        businessFeatures: undefined,
        totalRooms: 0,
      };

      const qualityMetrics = await this.qualityAssuranceService.calculateQualityScore(assessmentData);
      const missingInformation = await this.qualityAssuranceService.identifyMissingInformation(assessmentData);
      const recommendations = await this.qualityAssuranceService.generateRecommendations(qualityMetrics, missingInformation);
      
      this.logger.log(`Generated ${recommendations.length} recommendations for hotel ${hotelId}`);
      return recommendations;
    } catch (error) {
      this.logger.error(`Error generating recommendations for hotel ${hotelId}:`, error);
      throw new HttpException(
        'Failed to generate recommendations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('dashboard-data')
  async getDashboardData(@Param('hotelId') hotelId: string): Promise<{
    qualityMetrics: QualityMetrics;
    missingInformation: MissingInformation[];
    recommendations: Recommendation[];
  }> {
    try {
      this.logger.log(`Getting dashboard data for hotel ${hotelId}`);
      
      const assessmentData: QualityAssessmentData = {
        images: [],
        amenities: undefined,
        propertyDescription: undefined,
        locationDetails: undefined,
        policies: undefined,
        businessFeatures: undefined,
        totalRooms: 0,
      };

      const qualityMetrics = await this.qualityAssuranceService.calculateQualityScore(assessmentData);
      const missingInformation = await this.qualityAssuranceService.identifyMissingInformation(assessmentData);
      const recommendations = await this.qualityAssuranceService.generateRecommendations(qualityMetrics, missingInformation);
      
      this.logger.log(`Dashboard data retrieved for hotel ${hotelId}`);
      return {
        qualityMetrics,
        missingInformation,
        recommendations,
      };
    } catch (error) {
      this.logger.error(`Error getting dashboard data for hotel ${hotelId}:`, error);
      throw new HttpException(
        'Failed to get dashboard data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('report')
  async generateQualityReport(@Param('hotelId') hotelId: string): Promise<QualityReport> {
    try {
      this.logger.log(`Generating quality report for hotel ${hotelId}`);
      
      const startTime = Date.now();
      const report = await this.qualityAssuranceService.createQualityReport(hotelId);
      const processingTime = Date.now() - startTime;
      
      this.logger.log(`Quality report generated for hotel ${hotelId} in ${processingTime}ms`);
      
      // Ensure performance requirement (5 seconds)
      if (processingTime > 5000) {
        this.logger.warn(`Quality report generation exceeded 5 second target: ${processingTime}ms`);
      }
      
      return report;
    } catch (error) {
      this.logger.error(`Error generating quality report for hotel ${hotelId}:`, error);
      throw new HttpException(
        'Failed to generate quality report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports')
  async getQualityReports(@Param('hotelId') hotelId: string): Promise<QualityReport[]> {
    try {
      this.logger.log(`Getting quality reports for hotel ${hotelId}`);
      
      // This would typically query the database for existing reports
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      this.logger.error(`Error getting quality reports for hotel ${hotelId}:`, error);
      throw new HttpException(
        'Failed to get quality reports',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}