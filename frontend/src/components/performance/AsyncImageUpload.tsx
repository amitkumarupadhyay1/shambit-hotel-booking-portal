'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

interface UploadStatus {
  uploadId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  processedImage?: any;
  error?: string;
}

interface AsyncImageUploadProps {
  category: string;
  entityType: 'hotel' | 'room';
  entityId: string;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  onUploadComplete?: (images: any[]) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

export default function AsyncImageUpload({
  category,
  entityType,
  entityId,
  maxFiles = 10,
  maxFileSize = 5,
  onUploadComplete,
  onUploadError,
  className = '',
}: AsyncImageUploadProps) {
  const [uploads, setUploads] = useState<Map<string, UploadStatus>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [completedImages, setCompletedImages] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const handleFileSelect = useCallback(async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        onUploadError?.('Only image files are allowed');
        return false;
      }
      if (file.size > maxFileSize * 1024 * 1024) {
        onUploadError?.(`File size must be less than ${maxFileSize}MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Check total file limit
    if (uploads.size + validFiles.length > maxFiles) {
      onUploadError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Upload files asynchronously
    for (const file of validFiles) {
      await uploadFileAsync(file);
    }
  }, [uploads.size, maxFiles, maxFileSize, onUploadError]);

  const uploadFileAsync = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('category', category);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);

      // Start async upload
      const response = await fetch('/api/performance/images/upload-async', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { uploadId } = await response.json();

      // Initialize upload status
      const initialStatus: UploadStatus = {
        uploadId,
        status: 'processing',
        progress: 0,
      };

      setUploads(prev => new Map(prev).set(uploadId, initialStatus));

      // Start polling for progress
      startProgressPolling(uploadId);

    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const startProgressPolling = (uploadId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/performance/images/upload-status/${uploadId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to get upload status');
        }

        const status: UploadStatus = await response.json();

        setUploads(prev => {
          const newMap = new Map(prev);
          newMap.set(uploadId, status);
          return newMap;
        });

        // Stop polling if completed or failed
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval);
          pollIntervals.current.delete(uploadId);

          if (status.status === 'completed' && status.processedImage) {
            setCompletedImages(prev => [...prev, status.processedImage]);
            onUploadComplete?.([status.processedImage]);
          } else if (status.status === 'failed') {
            onUploadError?.(status.error || 'Upload failed');
          }
        }
      } catch (error) {
        clearInterval(interval);
        pollIntervals.current.delete(uploadId);
        onUploadError?.(error instanceof Error ? error.message : 'Failed to check upload status');
      }
    }, 1000); // Poll every second

    pollIntervals.current.set(uploadId, interval);
  };

  const removeUpload = (uploadId: string) => {
    setUploads(prev => {
      const newMap = new Map(prev);
      newMap.delete(uploadId);
      return newMap;
    });

    // Clear polling interval
    const interval = pollIntervals.current.get(uploadId);
    if (interval) {
      clearInterval(interval);
      pollIntervals.current.delete(uploadId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const getStatusIcon = (status: UploadStatus) => {
    switch (status.status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">
              Drop images here or click to upload
            </p>
            <p className="text-sm text-gray-500">
              Maximum {maxFiles} files, up to {maxFileSize}MB each
            </p>
            <p className="text-xs text-gray-400">
              Supports JPG, PNG, WebP formats
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => fileInputRef.current?.click()}
          >
            Select Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploads.size > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">Upload Progress</h3>
          {Array.from(uploads.values()).map((upload) => (
            <Card key={upload.uploadId} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(upload)}
                  <span className="text-sm font-medium">
                    {upload.status === 'processing' && 'Processing...'}
                    {upload.status === 'completed' && 'Upload Complete'}
                    {upload.status === 'failed' && 'Upload Failed'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUpload(upload.uploadId)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {upload.status === 'processing' && (
                <div className="space-y-2">
                  <Progress 
                    value={upload.progress} 
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    {upload.progress}% complete
                  </p>
                </div>
              )}

              {upload.status === 'failed' && upload.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-800">{upload.error}</p>
                  </div>
                </div>
              )}

              {upload.status === 'completed' && upload.processedImage && (
                <div className="mt-2">
                  <img
                    src={upload.processedImage.thumbnails?.small}
                    alt="Uploaded"
                    className="h-16 w-16 object-cover rounded"
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Completed Images */}
      {completedImages.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">
            Completed Uploads ({completedImages.length})
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {completedImages.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image.thumbnails?.medium || image.thumbnails?.small}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <div className="absolute top-1 right-1">
                  <CheckCircle className="h-4 w-4 text-green-500 bg-white rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Data Usage Warning */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <p className="text-sm text-blue-800">
            Images are optimized for mobile data usage. Original quality is preserved for desktop viewing.
          </p>
        </div>
      </div>
    </div>
  );
}