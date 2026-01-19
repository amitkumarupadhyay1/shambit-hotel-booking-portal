'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Lightbulb,
  X,
  AlertTriangle
} from 'lucide-react';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationFeedbackProps {
  validation: ValidationResult;
  onDismissWarning?: (index: number) => void;
  className?: string;
}

export function ValidationFeedback({ 
  validation, 
  onDismissWarning,
  className 
}: ValidationFeedbackProps) {
  if (validation.errors.length === 0 && validation.warnings.length === 0) {
    return (
      <Card className={cn("border-green-200 bg-green-50", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">All amenity selections are valid</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Errors */}
      {validation.errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-700 text-base">
              <AlertCircle className="h-5 w-5" />
              Validation Errors
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {validation.errors.map((error, index) => (
                <div key={index} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 leading-relaxed">{error}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings/Recommendations */}
      {validation.warnings.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-700 text-base">
              <Lightbulb className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {validation.warnings.map((warning, index) => (
                <div key={index} className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <Info className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-700 leading-relaxed">{warning}</p>
                  </div>
                  {onDismissWarning && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDismissWarning(index)}
                      className="text-amber-500 hover:text-amber-700 hover:bg-amber-100"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Inline validation indicator for individual amenities
export interface InlineValidationProps {
  type: 'error' | 'warning' | 'success';
  message: string;
  className?: string;
}

export function InlineValidation({ type, message, className }: InlineValidationProps) {
  const config = {
    error: {
      icon: AlertCircle,
      className: 'text-red-600 bg-red-50 border-red-200',
    },
    warning: {
      icon: AlertTriangle,
      className: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    success: {
      icon: CheckCircle,
      className: 'text-green-600 bg-green-50 border-green-200',
    },
  };

  const { icon: Icon, className: typeClassName } = config[type];

  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-md border text-xs",
      typeClassName,
      className
    )}>
      <Icon className="h-3 w-3 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// Validation summary badge
export interface ValidationSummaryProps {
  validation: ValidationResult;
  totalSelected: number;
  className?: string;
}

export function ValidationSummary({ 
  validation, 
  totalSelected, 
  className 
}: ValidationSummaryProps) {
  if (totalSelected === 0) {
    return (
      <Badge variant="outline" className={cn("text-muted-foreground", className)}>
        No amenities selected
      </Badge>
    );
  }

  if (!validation.isValid) {
    return (
      <Badge variant="destructive" className={cn("", className)}>
        <AlertCircle className="h-3 w-3 mr-1" />
        {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}
      </Badge>
    );
  }

  if (validation.warnings.length > 0) {
    return (
      <Badge variant="secondary" className={cn("bg-amber-100 text-amber-700", className)}>
        <Info className="h-3 w-3 mr-1" />
        {validation.warnings.length} recommendation{validation.warnings.length !== 1 ? 's' : ''}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={cn("bg-green-100 text-green-700", className)}>
      <CheckCircle className="h-3 w-3 mr-1" />
      Valid selection
    </Badge>
  );
}

// Real-time validation hook
export function useAmenityValidation(
  selectedAmenities: string[],
  propertyType: string,
  debounceMs: number = 300
) {
  const [validation, setValidation] = React.useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
  });
  const [isValidating, setIsValidating] = React.useState(false);

  React.useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (selectedAmenities.length === 0) {
        setValidation({
          isValid: true,
          errors: [],
          warnings: ['No amenities selected'],
        });
        return;
      }

      setIsValidating(true);
      try {
        // This would be replaced with actual API call
        // const response = await apiClient.post('/hotels/amenities/validate', {
        //   amenityIds: selectedAmenities,
        //   propertyType,
        // });
        // setValidation(response.data);

        // Mock validation for now
        const mockValidation = mockValidateAmenities(selectedAmenities, propertyType);
        setValidation(mockValidation);
      } catch (error) {
        console.error('Validation failed:', error);
        setValidation({
          isValid: false,
          errors: ['Failed to validate amenity selection'],
          warnings: [],
        });
      } finally {
        setIsValidating(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [selectedAmenities, propertyType, debounceMs]);

  return { validation, isValidating };
}

// Mock validation function (to be replaced with actual API call)
function mockValidateAmenities(selectedIds: string[], propertyType: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Mock business rule: Business amenities require business property type
  const businessAmenities = ['5']; // Business Center ID from mock data
  const businessPropertyTypes = ['BUSINESS_HOTEL', 'HOTEL', 'LUXURY_HOTEL'];
  
  for (const amenityId of selectedIds) {
    if (businessAmenities.includes(amenityId) && !businessPropertyTypes.includes(propertyType)) {
      result.errors.push('Business amenities are not applicable to this property type');
      result.isValid = false;
    }
  }

  // Mock recommendation: Suggest eco-friendly amenities
  const hasEcoAmenities = selectedIds.some(id => ['3', '4'].includes(id)); // Solar, Recycling
  if (!hasEcoAmenities && selectedIds.length > 0) {
    result.warnings.push('Consider adding eco-friendly amenities to attract environmentally conscious guests');
  }

  return result;
}