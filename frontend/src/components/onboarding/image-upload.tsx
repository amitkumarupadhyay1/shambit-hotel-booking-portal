'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export enum ImageCategory {
  EXTERIOR = 'EXTERIOR',
  LOBBY = 'LOBBY',
  ROOMS = 'ROOMS',
  AMENITIES = 'AMENITIES',
  DINING = 'DINING',
  RECREATIONAL = 'RECREATIONAL',
  BUSINESS = 'BUSINESS',
  VIRTUAL_TOURS = 'VIRTUAL_TOURS',
}

export interface QualityIssue {
  type: 'resolution' | 'blur' | 'brightness' | 'contrast' | 'aspect_ratio';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestedFix: string;
}

export interface QualityCheckResult {
  passed: boolean;
  score: number;
  issues: QualityIssue[];
  recommendations: string[];
}

export interface QualityStandards {
  minResolution: { width: number; height: number };
  acceptableAspectRatios: number[];
  maxFileSize?: number;
  blurThreshold?: number;
  brightnessRange?: { min: number; max: number };
  contrastRange?: { min: number; max: number };
}

export interface UploadedImage {
  id: string;
  file: File;
  category: ImageCategory;
  qualityScore: number;
  url: string;
  uploadedAt: string;
}

export interface UploadProgress {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  qualityCheck?: QualityCheckResult;
  error?: string;
  url?: string; // For preview and cleanup
}

export interface ImageUploadProps {
  category: ImageCategory;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  qualityStandards?: QualityStandards; // Optional quality standards override
  onUploadProgress?: (progress: UploadProgress[]) => void;
  onUploadComplete?: (images: UploadedImage[]) => void;
  onQualityCheck?: (results: QualityCheckResult[]) => void;
  className?: string;
  disabled?: boolean;
}

const QUALITY_STANDARDS: QualityStandards = {
  minResolution: { width: 1920, height: 1080 },
  acceptableAspectRatios: [16/9, 4/3, 3/2, 1/1],
  maxFileSize: 5 * 1024 * 1024, // 5MB
};

interface UseImageUploadControllerOptions {
  category: ImageCategory;
  maxFiles?: number;
  maxFileSize?: number;
  qualityStandards?: QualityStandards;
  onUploadProgress?: (progress: UploadProgress[]) => void;
  onUploadComplete?: (images: UploadedImage[]) => void;
  onQualityCheck?: (results: QualityCheckResult[]) => void;
}

export const useImageUploadController = ({
  category,
  maxFiles = 10,
  maxFileSize,
  qualityStandards,
  onUploadProgress,
  onUploadComplete,
  onQualityCheck,
}: UseImageUploadControllerOptions) => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const standards = qualityStandards ?? QUALITY_STANDARDS;
  const actualMaxFileSize = maxFileSize ?? standards.maxFileSize ?? 5 * 1024 * 1024;

  const performQualityCheck = useCallback(async (file: File): Promise<QualityCheckResult> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        const issues: QualityIssue[] = [];
        let score = 100;

        // Check resolution
        if (img.width < standards.minResolution.width ||
            img.height < standards.minResolution.height) {
          issues.push({
            type: 'resolution',
            severity: 'medium',
            description: `Image resolution ${img.width}x${img.height} is below minimum ${standards.minResolution.width}x${standards.minResolution.height}`,
            suggestedFix: 'Upload a higher resolution image',
          });
          score -= 20;
        }

        // Check aspect ratio
        const aspectRatio = img.width / img.height;
        const isAcceptableRatio = standards.acceptableAspectRatios.some(
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

        const recommendations: string[] = [];
        if (issues.length === 0) {
          recommendations.push('Image meets all quality standards');
        } else {
          recommendations.push('Consider retaking the photo with the following improvements:');
          issues.forEach(issue => recommendations.push(`- ${issue.suggestedFix}`));
        }

        resolve({
          passed: issues.length === 0 || !issues.some(issue => issue.severity === 'high'),
          score: Math.max(0, score),
          issues,
          recommendations,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          passed: false,
          score: 0,
          issues: [{
            type: 'resolution',
            severity: 'high',
            description: 'Failed to analyze image',
            suggestedFix: 'Upload a valid image file',
          }],
          recommendations: ['Upload a valid image file in a supported format'],
        });
      };

      img.src = objectUrl;
    });
  }, [standards]);

  const simulateUpload = useCallback(async (uploadId: string): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          resolve();
        }

        if (!isMounted.current) return;

        setUploads(prev =>
          prev.map(u =>
            u.id === uploadId ? { ...u, progress } : u
          )
        );
      }, 200);
    });
  }, []);

  const addFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validationErrors: string[] = [];
    const validFiles: File[] = [];

    fileArray.forEach(file => {
      if (!file.type.startsWith('image/')) {
        validationErrors.push(`${file.name} is not an image file`);
        return;
      }
      if (file.size > actualMaxFileSize) {
        validationErrors.push(`${file.name} exceeds the maximum file size of ${Math.round(actualMaxFileSize / (1024 * 1024))}MB`);
        return;
      }
      validFiles.push(file);
    });

    if (uploads.length + validFiles.length > maxFiles) {
      validationErrors.push(`You can only upload up to ${maxFiles} images`);
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);

    // Create upload records with IDs
    const newUploads: UploadProgress[] = validFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    // Add new uploads and emit progress from the updater
    setUploads(prev => {
      const next = [...prev, ...newUploads];
      onUploadProgress?.(next);
      return next;
    });

    // Process files concurrently
    const qualityResults: QualityCheckResult[] = [];

    const processFile = async (upload: UploadProgress) => {
      try {
        await simulateUpload(upload.id);

        const qualityResult = await performQualityCheck(upload.file);
        qualityResults.push(qualityResult);

        const previewUrl = URL.createObjectURL(upload.file);

        setUploads(prev => {
          const next = prev.map(u =>
            u.id === upload.id ? {
              ...u,
              progress: 100,
              status: 'completed' as const,
              qualityCheck: qualityResult,
              url: previewUrl,
            } : u
          );
          
          console.log('Emitting progress update:', next);
          // Emit progress update after each file completion
          onUploadProgress?.(next);
          
          return next;
        });
      } catch (error) {
        setUploads(prev =>
          prev.map(u =>
            u.id === upload.id ? {
              ...u,
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'Upload failed',
            } : u
          )
        );
      }
    };

    // Wait for all files to be processed
    await Promise.all(newUploads.map(processFile));

    // Emit quality check results once for all
    if (qualityResults.length > 0) {
      onQualityCheck?.(qualityResults);
    }

    // Create and emit completed images from the final state
    setUploads(prev => {
      const completedImages: UploadedImage[] = prev
        .filter(u => u.status === 'completed')
        .map(u => ({
          id: u.id,
          file: u.file,
          category,
          qualityScore: u.qualityCheck?.score ?? 0,
          url: u.url!,
          uploadedAt: new Date().toISOString(),
        }));

      console.log('Emitting upload complete:', completedImages);
      if (completedImages.length > 0) {
        onUploadComplete?.(completedImages);
      }

      return prev;
    });
  }, [uploads, maxFiles, actualMaxFileSize, category, onUploadProgress, onUploadComplete, onQualityCheck, simulateUpload, performQualityCheck]);

  const removeUpload = useCallback((uploadId: string) => {
    setUploads(prev => {
      const uploadToRemove = prev.find(u => u.id === uploadId);
      if (uploadToRemove?.url) {
        URL.revokeObjectURL(uploadToRemove.url);
      }
      return prev.filter(u => u.id !== uploadId);
    });
  }, []);

  return {
    uploads,
    errors,
    addFiles,
    removeUpload,
  };
};

export const ImageUpload: React.FC<ImageUploadProps> = ({
  category,
  maxFiles = 10,
  maxFileSize,
  qualityStandards,
  onUploadProgress,
  onUploadComplete,
  onQualityCheck,
  className = '',
  disabled = false,
}) => {
  const { uploads, errors, addFiles, removeUpload } = useImageUploadController({
    category,
    maxFiles,
    maxFileSize,
    qualityStandards,
    onUploadProgress,
    onUploadComplete,
    onQualityCheck,
  });

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    addFiles(files);
  }, [addFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openCameraDialog = () => {
    cameraInputRef.current?.click();
  };

  const getCategoryDisplayName = (cat: string) => {
    return cat.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getQualityBadgeColor = (score: number) => {
    if (score >= 85) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Upload {getCategoryDisplayName(category)} Images
        </h3>
        <Badge variant="outline">
          {uploads.length} / {maxFiles}
        </Badge>
      </div>

      {/* Upload Area */}
      <Card
        className={`
          border-2 border-dashed p-8 text-center transition-colors cursor-pointer
          ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!disabled && !isDragOver ? openFileDialog : undefined}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <ImageIcon className="h-12 w-12 text-gray-400" />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              Drop images here or click to browse
            </p>
            <p className="text-sm text-gray-500 mt-1">
              PNG, JPG, WebP up to {Math.round((maxFileSize ?? QUALITY_STANDARDS.maxFileSize ?? 5 * 1024 * 1024) / (1024 * 1024))}MB each
            </p>
          </div>
          
          {/* Mobile Camera Button */}
          <div className="flex justify-center space-x-4 md:hidden">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                openCameraDialog();
              }}
              disabled={disabled}
              className="flex items-center space-x-2"
            >
              <Camera className="h-4 w-4" />
              <span>Take Photo</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Desktop Upload Buttons */}
      <div className="hidden md:flex justify-center space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={openFileDialog}
          disabled={disabled}
          className="flex items-center space-x-2"
        >
          <Upload className="h-4 w-4" />
          <span>Choose Files</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={openCameraDialog}
          disabled={disabled}
          className="flex items-center space-x-2"
        >
          <Camera className="h-4 w-4" />
          <span>Take Photo</span>
        </Button>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        aria-label="Select images from device"
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={disabled}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-label="Take photo with camera"
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={disabled}
      />

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Upload Progress</h4>
          {uploads.map((upload) => (
            <Card key={upload.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {upload.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : upload.status === 'error' ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {upload.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(upload.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUpload(upload.id)}
                  className="flex-shrink-0"
                  disabled={upload.status === 'uploading'}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Progress Bar */}
              {upload.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  {/*
                    webhint ignore no-inline-styles
                    Dynamic width for progress bar requires inline styles
                  */}
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}

              {/* Quality Check Results */}
              {upload.qualityCheck && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Quality Score</span>
                    <Badge className={getQualityBadgeColor(upload.qualityCheck.score)}>
                      {upload.qualityCheck.score}/100
                    </Badge>
                  </div>
                  
                  {upload.qualityCheck.issues.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-700">Issues:</p>
                      {upload.qualityCheck.issues.map((issue, issueIndex) => (
                        <div key={issueIndex} className="text-xs text-gray-600 pl-2">
                          <span className={`
                            inline-block w-2 h-2 rounded-full mr-2
                            ${issue.severity === 'high' ? 'bg-red-500' : 
                              issue.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}
                          `} />
                          {issue.description}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {upload.error && (
                <div className="mt-2 text-sm text-red-600">
                  {upload.error}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
