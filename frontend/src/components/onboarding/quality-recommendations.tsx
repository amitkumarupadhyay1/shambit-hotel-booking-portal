'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Lightbulb, 
  TrendingUp, 
  Camera, 
  FileText, 
  Shield, 
  Star,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  ArrowRight,
  Target
} from 'lucide-react';

export interface Recommendation {
  type: 'image' | 'content' | 'policy' | 'amenity';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionRequired: string;
  estimatedImpact: number; // score improvement estimate
}

interface QualityRecommendationsProps {
  recommendations: Recommendation[];
  onActionClick?: (recommendation: Recommendation) => void;
  className?: string;
}

export function QualityRecommendations({ 
  recommendations, 
  onActionClick,
  className = '' 
}: QualityRecommendationsProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const getTypeIcon = (type: 'image' | 'content' | 'policy' | 'amenity') => {
    switch (type) {
      case 'image':
        return <Camera className="h-5 w-5 text-blue-500" />;
      case 'content':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'policy':
        return <Shield className="h-5 w-5 text-purple-500" />;
      case 'amenity':
        return <Star className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getPriorityBadgeVariant = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'destructive' as const;
      case 'medium':
        return 'secondary' as const;
      case 'low':
        return 'outline' as const;
    }
  };

  const getImpactColor = (impact: number) => {
    if (impact >= 10) return 'text-green-600 bg-green-100';
    if (impact >= 5) return 'text-yellow-600 bg-yellow-100';
    return 'text-blue-600 bg-blue-100';
  };

  // Sort by priority and impact
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.estimatedImpact - a.estimatedImpact;
  });

  const displayedRecommendations = showAll 
    ? sortedRecommendations 
    : sortedRecommendations.slice(0, 5);

  const totalImpact = recommendations.reduce((sum, rec) => sum + rec.estimatedImpact, 0);

  if (recommendations.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-6 w-6 text-green-500" />
          <div>
            <h3 className="font-semibold text-gray-900">Excellent Quality!</h3>
            <p className="text-sm text-gray-600">
              Your property profile meets all quality standards. Keep up the great work!
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Lightbulb className="h-6 w-6 text-yellow-500" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quality Recommendations</h2>
            <p className="text-sm text-gray-600">
              Improve your property profile to attract more bookings
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Target className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-gray-700">
            Potential +{totalImpact} points
          </span>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        {displayedRecommendations.map((recommendation, index) => (
          <Card 
            key={index} 
            className={`border-l-4 ${getPriorityColor(recommendation.priority)}`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getTypeIcon(recommendation.type)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{recommendation.title}</h3>
                      <Badge variant={getPriorityBadgeVariant(recommendation.priority)}>
                        {recommendation.priority}
                      </Badge>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(recommendation.estimatedImpact)}`}>
                        +{recommendation.estimatedImpact} pts
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {recommendation.description}
                    </p>
                    
                    {expandedItems.has(index) && (
                      <div className="bg-white rounded-lg p-3 border border-gray-100 mb-3">
                        <h4 className="font-medium text-gray-900 mb-2">Action Required:</h4>
                        <p className="text-sm text-gray-700">{recommendation.actionRequired}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(index)}
                        className="text-xs h-6 px-2"
                      >
                        {expandedItems.has(index) ? (
                          <>
                            Less details
                            <ChevronUp className="h-3 w-3 ml-1" />
                          </>
                        ) : (
                          <>
                            More details
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {onActionClick && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onActionClick(recommendation)}
                    className="ml-4 shrink-0"
                  >
                    Take Action
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Show More/Less Button */}
      {recommendations.length > 5 && (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => setShowAll(!showAll)}
            className="text-sm"
          >
            {showAll ? (
              <>
                Show Less
                <ChevronUp className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                Show {recommendations.length - 5} More Recommendations
                <ChevronDown className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Summary Card */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Quality Improvement Potential</h3>
            <p className="text-sm text-gray-600">
              Implementing all recommendations could improve your score by up to {totalImpact} points
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-600">+{totalImpact}</div>
            <div className="text-xs text-gray-500">points</div>
          </div>
        </div>
      </Card>

      {/* Priority Breakdown */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">
                {recommendations.filter(r => r.priority === 'high').length} high priority
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600">
                {recommendations.filter(r => r.priority === 'medium').length} medium priority
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">
                {recommendations.filter(r => r.priority === 'low').length} low priority
              </span>
            </div>
          </div>
          
          <div className="text-gray-500">
            Focus on high-priority items for maximum impact
          </div>
        </div>
      </Card>
    </div>
  );
}