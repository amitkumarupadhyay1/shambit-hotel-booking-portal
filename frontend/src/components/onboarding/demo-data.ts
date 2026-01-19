// Demo data for quality assurance components
// This file provides sample data for testing and demonstration purposes

import { QualityMetrics } from './quality-score-dashboard';
import { MissingInformation } from './missing-information-alerts';
import { Recommendation } from './quality-recommendations';
import { QualityReport } from './quality-report-generator';

export const demoQualityMetrics: QualityMetrics = {
  overallScore: 78,
  imageQuality: 85,
  contentCompleteness: 72,
  policyClarity: 75,
  lastCalculated: new Date(),
  breakdown: {
    imageQuality: {
      score: 85,
      weight: 0.4,
      factors: {
        totalImages: 12,
        highQualityImages: 10,
        categoryCoverage: 3,
        professionalPhotos: 8,
      },
    },
    contentCompleteness: {
      score: 72,
      weight: 0.4,
      factors: {
        descriptionQuality: 80,
        amenityCompleteness: 85,
        locationDetails: 65,
        roomInformation: 60,
      },
    },
    policyClarity: {
      score: 75,
      weight: 0.2,
      factors: {
        cancellationPolicy: 100,
        checkInOut: 100,
        bookingTerms: 50,
        additionalPolicies: 50,
      },
    },
  },
};

export const demoMissingInformation: MissingInformation[] = [
  {
    category: 'Images',
    items: ['business center photos', 'recreational area photos'],
    priority: 'medium',
  },
  {
    category: 'Content',
    items: ['detailed room descriptions', 'local attraction information'],
    priority: 'high',
  },
  {
    category: 'Policies',
    items: ['pet policy details', 'smoking policy'],
    priority: 'medium',
  },
  {
    category: 'Business Features',
    items: ['meeting room equipment list', 'WiFi speed specifications'],
    priority: 'low',
  },
];

export const demoRecommendations: Recommendation[] = [
  {
    type: 'content',
    title: 'Complete Room Descriptions',
    description: 'Add detailed descriptions for all room types to help guests make informed decisions',
    priority: 'high',
    actionRequired: 'Write comprehensive descriptions highlighting unique features, amenities, and selling points for each room category',
    estimatedImpact: 12,
  },
  {
    type: 'content',
    title: 'Add Local Attraction Information',
    description: 'Include information about nearby attractions and points of interest',
    priority: 'high',
    actionRequired: 'Research and document nearby attractions, restaurants, and transportation options with distances and descriptions',
    estimatedImpact: 10,
  },
  {
    type: 'image',
    title: 'Add Business Center Photos',
    description: 'Upload professional photos of your business facilities',
    priority: 'medium',
    actionRequired: 'Take high-resolution photos of meeting rooms, business center, and work spaces',
    estimatedImpact: 8,
  },
  {
    type: 'policy',
    title: 'Define Pet and Smoking Policies',
    description: 'Clear policies reduce guest confusion and booking disputes',
    priority: 'medium',
    actionRequired: 'Document pet allowance, fees, restrictions, and smoking policies with designated areas',
    estimatedImpact: 6,
  },
  {
    type: 'amenity',
    title: 'Specify WiFi Performance',
    description: 'Business travelers need reliable connectivity information',
    priority: 'low',
    actionRequired: 'Test and document WiFi speeds, coverage areas, and reliability metrics',
    estimatedImpact: 4,
  },
  {
    type: 'image',
    title: 'Professional Photography Upgrade',
    description: 'High-quality photos can increase bookings by up to 40%',
    priority: 'medium',
    actionRequired: 'Consider hiring a professional photographer for key property areas',
    estimatedImpact: 15,
  },
];

export const demoQualityReport: QualityReport = {
  id: 'demo-report-' + Date.now(),
  enhancedHotelId: 'demo-hotel-123',
  overallScore: demoQualityMetrics.overallScore,
  imageQualityScore: demoQualityMetrics.imageQuality,
  contentCompletenessScore: demoQualityMetrics.contentCompleteness,
  policyClarityScore: demoQualityMetrics.policyClarity,
  scoreBreakdown: demoQualityMetrics.breakdown,
  missingInformation: demoMissingInformation,
  recommendations: demoRecommendations,
  generatedBy: 'DEMO_QUALITY_ENGINE',
  createdAt: new Date(),
};

// Mock API functions for demonstration
export const mockApiCalls = {
  async fetchDashboardData() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      qualityMetrics: demoQualityMetrics,
      missingInformation: demoMissingInformation,
      recommendations: demoRecommendations,
    };
  },

  async generateReport(hotelId: string) {
    // Simulate report generation delay (under 5 seconds as per requirements)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      ...demoQualityReport,
      enhancedHotelId: hotelId,
      id: `report-${hotelId}-${Date.now()}`,
    };
  },
};

// Utility functions for demo scenarios
export const createScenarioData = {
  // High-quality property with minimal issues
  excellentProperty(): typeof demoQualityMetrics {
    return {
      ...demoQualityMetrics,
      overallScore: 92,
      imageQuality: 95,
      contentCompleteness: 90,
      policyClarity: 90,
      breakdown: {
        ...demoQualityMetrics.breakdown,
        imageQuality: { ...demoQualityMetrics.breakdown.imageQuality, score: 95 },
        contentCompleteness: { ...demoQualityMetrics.breakdown.contentCompleteness, score: 90 },
        policyClarity: { ...demoQualityMetrics.breakdown.policyClarity, score: 90 },
      },
    };
  },

  // Property needing significant improvements
  needsImprovementProperty(): typeof demoQualityMetrics {
    return {
      ...demoQualityMetrics,
      overallScore: 45,
      imageQuality: 30,
      contentCompleteness: 50,
      policyClarity: 60,
      breakdown: {
        ...demoQualityMetrics.breakdown,
        imageQuality: { ...demoQualityMetrics.breakdown.imageQuality, score: 30 },
        contentCompleteness: { ...demoQualityMetrics.breakdown.contentCompleteness, score: 50 },
        policyClarity: { ...demoQualityMetrics.breakdown.policyClarity, score: 60 },
      },
    };
  },

  // Critical missing information for low-quality property
  criticalMissingInfo(): MissingInformation[] {
    return [
      {
        category: 'Images',
        items: ['exterior photos', 'lobby photos', 'room photos', 'amenity photos'],
        priority: 'high',
      },
      {
        category: 'Content',
        items: ['property description', 'room descriptions', 'amenity list', 'location details'],
        priority: 'high',
      },
      {
        category: 'Policies',
        items: ['check-in policy', 'check-out policy', 'cancellation policy', 'booking terms'],
        priority: 'high',
      },
    ];
  },
};