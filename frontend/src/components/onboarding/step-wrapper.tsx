'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Wifi, 
  WifiOff,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StepComponentProps, ValidationResult } from './mobile-wizard';

export interface StepWrapperProps extends StepComponentProps {
  stepId: string;
  title: string;
  description: string;
  isOptional?: boolean;
  estimatedTime?: number;
  children: React.ReactNode;
  onSave?: () => void;
  onPreview?: () => void;
  showPreview?: boolean;
}

export const StepWrapper: React.FC<StepWrapperProps> = ({
  stepId,
  title,
  description,
  isOptional = false,
  estimatedTime,
  data,
  onDataChange,
  onValidationChange,
  isActive,
  isOffline,
  children,
  onSave,
  onPreview,
  showPreview = false
}) => {
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Handle validation changes
  const handleValidationChange = useCallback((result: ValidationResult) => {
    setValidation(result);
    onValidationChange(result);
  }, [onValidationChange]);

  // Manual save handler
  const handleManualSave = useCallback(() => {
    if (onSave) {
      onSave();
      setLastSaved(new Date());
    }
  }, [onSave]);

  const getValidationIcon = () => {
    if (validation.errors.length > 0) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (validation.warnings.length > 0) {
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
    if (validation.isValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  const getValidationColor = () => {
    if (validation.errors.length > 0) return 'border-red-200 bg-red-50';
    if (validation.warnings.length > 0) return 'border-amber-200 bg-amber-50';
    if (validation.isValid) return 'border-green-200 bg-green-50';
    return 'border-slate-200 bg-white';
  };

  return (
    <div className="space-y-4">
      {/* Step Header */}
      <Card className={cn("border-2 transition-colors", getValidationColor())}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg">{title}</CardTitle>
                {isOptional && (
                  <Badge variant="secondary" className="text-xs">
                    Optional
                  </Badge>
                )}
                {getValidationIcon()}
              </div>
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {estimatedTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{estimatedTime}m</span>
                </div>
              )}
              {isOffline ? (
                <WifiOff className="h-4 w-4 text-red-500" />
              ) : (
                <Wifi className="h-4 w-4 text-green-500" />
              )}
            </div>
          </div>

          {/* Validation Feedback */}
          {(validation.errors.length > 0 || validation.warnings.length > 0) && (
            <div className="mt-3 space-y-2">
              {validation.errors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-700">
                        Please fix the following issues:
                      </p>
                      <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
                        {validation.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-700">
                        Recommendations:
                      </p>
                      <ul className="mt-1 text-sm text-amber-600 list-disc list-inside">
                        {validation.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Save Status */}
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <div className="flex items-center gap-2">
              {lastSaved && (
                <span>Last saved {lastSaved.toLocaleTimeString()}</span>
              )}
              {isOffline && (
                <span className="text-amber-600">Working offline</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {onSave && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManualSave}
                  className="h-6 px-2 text-xs"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
              )}
              {onPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPreview}
                  className="h-6 px-2 text-xs"
                >
                  {showPreview ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                  {showPreview ? 'Hide' : 'Preview'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Step Content */}
          <div className="space-y-4">
            {React.cloneElement(children as React.ReactElement, {
              initialData: data,
              onDataChange,
              onValidationChange: handleValidationChange,
              isActive,
              isOffline
            } as any)}
          </div>

          {/* Offline Notice */}
          {isOffline && (
            <div className="mt-4 p-3 bg-slate-100 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <WifiOff className="h-4 w-4" />
                <span>
                  You're working offline. Changes will be saved locally and synced when you're back online.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Preview */}
      {showPreview && Object.keys(data).length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Step Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-slate-600 whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StepWrapper;