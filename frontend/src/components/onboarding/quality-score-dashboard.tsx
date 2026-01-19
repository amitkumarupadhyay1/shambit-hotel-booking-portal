'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Camera, 
  FileText, 
  Shield,
  TrendingUp,
  Star
} from 'lucide-react';

export interface QualityScoreBreakdown {
  imageQuality: {
    score: number;
    weight: 0.4;
    factors: {
      totalImages: number;
      highQualityImages: number;
      categoryCoverage: number;
      professionalPhotos: number;
    };
  };
  contentCompleteness: {
    score: number;
    weight: 0.4;
    factors: {
      descriptionQuality: number;
      amenityCompleteness: number;
      locationDetails: number;
      roomInformation: number;
    };
  };
  policyClarity: {
    score: number;
    weight: 0.2;
    factors: {
      cancellationPolicy: number;
      checkInOut: number;
      bookingTerms: number;
      additionalPolicies: number;
    };
  };
}

export interface QualityMetrics {
  overallScore: number;
  imageQuality: number;
  contentCompleteness: number;
  policyClarity: number;
  lastCalculated: Date;
  breakdown: QualityScoreBreakdown;
}

interface QualityScoreDashboardProps {
  qualityMetrics: QualityMetrics;
  className?: string;
}

export function QualityScoreDashboard({ qualityMetrics, className = '' }: QualityScoreDashboardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getGrade = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const formatLastCalculated = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Score Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Property Quality Score</h2>
          <Badge variant={qualityMetrics.overallScore >= 80 ? 'default' : 'secondary'}>
            Grade {getGrade(qualityMetrics.overallScore)}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Score</span>
              <span className={`text-2xl font-bold ${getScoreColor(qualityMetrics.overallScore)}`}>
                {qualityMetrics.overallScore}%
              </span>
            </div>
            <Progress 
              value={qualityMetrics.overallScore} 
              className="h-3"
            />
          </div>
          {getScoreIcon(qualityMetrics.overallScore)}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Last updated: {formatLastCalculated(qualityMetrics.lastCalculated)}</span>
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-4 w-4" />
            <span>Quality Assessment</span>
          </div>
        </div>
      </Card>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Image Quality */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Camera className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Image Quality</h3>
              <p className="text-sm text-gray-500">40% weight</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Score</span>
              <span className={`font-bold ${getScoreColor(qualityMetrics.imageQuality)}`}>
                {qualityMetrics.imageQuality}%
              </span>
            </div>
            <Progress value={qualityMetrics.imageQuality} className="h-2" />
            
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Total Images</span>
                <span>{qualityMetrics.breakdown.imageQuality.factors.totalImages}</span>
              </div>
              <div className="flex justify-between">
                <span>High Quality</span>
                <span>{qualityMetrics.breakdown.imageQuality.factors.highQualityImages}</span>
              </div>
              <div className="flex justify-between">
                <span>Category Coverage</span>
                <span>{qualityMetrics.breakdown.imageQuality.factors.categoryCoverage}/3</span>
              </div>
              <div className="flex justify-between">
                <span>Professional Photos</span>
                <span>{qualityMetrics.breakdown.imageQuality.factors.professionalPhotos}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Content Completeness */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Content Completeness</h3>
              <p className="text-sm text-gray-500">40% weight</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Score</span>
              <span className={`font-bold ${getScoreColor(qualityMetrics.contentCompleteness)}`}>
                {qualityMetrics.contentCompleteness}%
              </span>
            </div>
            <Progress value={qualityMetrics.contentCompleteness} className="h-2" />
            
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Description Quality</span>
                <span>{qualityMetrics.breakdown.contentCompleteness.factors.descriptionQuality}%</span>
              </div>
              <div className="flex justify-between">
                <span>Amenity Completeness</span>
                <span>{qualityMetrics.breakdown.contentCompleteness.factors.amenityCompleteness}%</span>
              </div>
              <div className="flex justify-between">
                <span>Location Details</span>
                <span>{qualityMetrics.breakdown.contentCompleteness.factors.locationDetails}%</span>
              </div>
              <div className="flex justify-between">
                <span>Room Information</span>
                <span>{qualityMetrics.breakdown.contentCompleteness.factors.roomInformation}%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Policy Clarity */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-6 w-6 text-purple-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Policy Clarity</h3>
              <p className="text-sm text-gray-500">20% weight</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Score</span>
              <span className={`font-bold ${getScoreColor(qualityMetrics.policyClarity)}`}>
                {qualityMetrics.policyClarity}%
              </span>
            </div>
            <Progress value={qualityMetrics.policyClarity} className="h-2" />
            
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Cancellation Policy</span>
                <span>{qualityMetrics.breakdown.policyClarity.factors.cancellationPolicy}%</span>
              </div>
              <div className="flex justify-between">
                <span>Check-in/out</span>
                <span>{qualityMetrics.breakdown.policyClarity.factors.checkInOut}%</span>
              </div>
              <div className="flex justify-between">
                <span>Booking Terms</span>
                <span>{qualityMetrics.breakdown.policyClarity.factors.bookingTerms}%</span>
              </div>
              <div className="flex justify-between">
                <span>Additional Policies</span>
                <span>{qualityMetrics.breakdown.policyClarity.factors.additionalPolicies}%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quality Insights */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Star className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-900">Quality Insights</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Strengths</h4>
            <ul className="space-y-1 text-gray-600">
              {qualityMetrics.imageQuality >= 80 && (
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Excellent image quality</span>
                </li>
              )}
              {qualityMetrics.contentCompleteness >= 80 && (
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Comprehensive content</span>
                </li>
              )}
              {qualityMetrics.policyClarity >= 80 && (
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Clear policies</span>
                </li>
              )}
              {qualityMetrics.overallScore >= 90 && (
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Outstanding overall quality</span>
                </li>
              )}
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Areas for Improvement</h4>
            <ul className="space-y-1 text-gray-600">
              {qualityMetrics.imageQuality < 70 && (
                <li className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span>Add more high-quality images</span>
                </li>
              )}
              {qualityMetrics.contentCompleteness < 70 && (
                <li className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span>Complete property information</span>
                </li>
              )}
              {qualityMetrics.policyClarity < 70 && (
                <li className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span>Clarify booking policies</span>
                </li>
              )}
              {qualityMetrics.overallScore < 60 && (
                <li className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>Significant improvements needed</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}