'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Camera, 
  FileText, 
  Shield, 
  Briefcase,
  ChevronRight,
  CheckCircle
} from 'lucide-react';

export interface MissingInformation {
  category: string;
  items: string[];
  priority: 'high' | 'medium' | 'low';
}

interface MissingInformationAlertsProps {
  missingInformation: MissingInformation[];
  onActionClick?: (category: string, item: string) => void;
  className?: string;
}

export function MissingInformationAlerts({ 
  missingInformation, 
  onActionClick,
  className = '' 
}: MissingInformationAlertsProps) {
  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
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

  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('image')) return <Camera className="h-5 w-5" />;
    if (categoryLower.includes('content')) return <FileText className="h-5 w-5" />;
    if (categoryLower.includes('polic')) return <Shield className="h-5 w-5" />;
    if (categoryLower.includes('business')) return <Briefcase className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const getActionText = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('image')) return 'Upload Images';
    if (categoryLower.includes('content')) return 'Add Content';
    if (categoryLower.includes('polic')) return 'Set Policies';
    if (categoryLower.includes('business')) return 'Configure Features';
    return 'Complete Section';
  };

  // Sort by priority (high -> medium -> low)
  const sortedMissingInfo = [...missingInformation].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  if (missingInformation.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-6 w-6 text-green-500" />
          <div>
            <h3 className="font-semibold text-gray-900">All Information Complete!</h3>
            <p className="text-sm text-gray-600">
              Your property profile has all the required information.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Missing Information</h2>
        <Badge variant="outline">
          {missingInformation.length} {missingInformation.length === 1 ? 'item' : 'items'}
        </Badge>
      </div>

      <div className="space-y-3">
        {sortedMissingInfo.map((missing, index) => (
          <Card 
            key={index} 
            className={`p-4 border-l-4 ${getPriorityColor(missing.priority)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex items-center space-x-2">
                  {getPriorityIcon(missing.priority)}
                  {getCategoryIcon(missing.category)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{missing.category}</h3>
                    <Badge variant={getPriorityBadgeVariant(missing.priority)}>
                      {missing.priority} priority
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    {missing.items.map((item, itemIndex) => (
                      <div 
                        key={itemIndex}
                        className="flex items-center justify-between text-sm text-gray-600 py-1"
                      >
                        <span className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                          <span>{item}</span>
                        </span>
                        {onActionClick && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onActionClick(missing.category, item)}
                            className="text-xs h-6 px-2 hover:bg-white/50"
                          >
                            Fix
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {onActionClick && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onActionClick(missing.category, missing.items[0])}
                  className="ml-4 shrink-0"
                >
                  {getActionText(missing.category)}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-gray-600">
                {sortedMissingInfo.filter(item => item.priority === 'high').length} high priority
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-gray-600">
                {sortedMissingInfo.filter(item => item.priority === 'medium').length} medium priority
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="text-gray-600">
                {sortedMissingInfo.filter(item => item.priority === 'low').length} low priority
              </span>
            </div>
          </div>
          
          <div className="text-gray-500">
            Complete high priority items first for maximum impact
          </div>
        </div>
      </Card>
    </div>
  );
}