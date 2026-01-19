'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, CheckCircle, AlertCircle, RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface MobileImageUploadProps {
  category: string;
  maxFiles?: number;
  maxFileSize?: number;
  onUploadProgress?: (progress: any[]) => void;
  onUploadComplete?: (images: any[]) => void;
  onQualityCheck?: (results: any[]) => void;
  className?: string;
  disabled?: boolean;
}

export const MobileImageUpload: React.FC<MobileImageUploadProps> = ({
  category,
  maxFiles = 10,
  maxFileSize = 5 * 1024 * 1024,
  onUploadProgress,
  onUploadComplete,
  onQualityCheck,
  className = '',
  disabled = false,
}) => {
  const [uploads, setUploads] = useState<any[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if device has camera
  const [hasCamera, setHasCamera] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'tablet'];
      return mobileKeywords.some(keyword => userAgent.includes(keyword)) || 
             window.innerWidth <= 768;
    };

    setIsMobile(checkMobile());

    // Check camera availability
    if (navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const hasVideoInput = devices.some(device => device.kind === 'videoinput');
          setHasCamera(hasVideoInput);
        })
        .catch(() => setHasCamera(false));
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
      setIsCapturing(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCapturing(false);
  }, [cameraStream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
        handleFileUpload([file]);
      }
    }, 'image/jpeg', 0.9);

    stopCamera();
  }, [cameraStream]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (isCapturing) {
      stopCamera();
      // Restart with new facing mode
      setTimeout(startCamera, 100);
    }
  }, [isCapturing, startCamera, stopCamera]);

  const handleFileUpload = useCallback(async (files: File[]) => {
    if (disabled) return;

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > maxFileSize) {
        alert(`${file.name} exceeds the maximum file size of ${maxFileSize / (1024 * 1024)}MB`);
        return false;
      }
      return true;
    });

    if (uploads.length + validFiles.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} images`);
      return;
    }

    // Process files with mobile-optimized feedback
    for (const file of validFiles) {
      const uploadId = Date.now() + Math.random();
      const newUpload = {
        id: uploadId,
        file,
        progress: 0,
        status: 'uploading',
        preview: URL.createObjectURL(file),
      };

      setUploads(prev => [...prev, newUpload]);

      // Simulate upload with progress
      await simulateUpload(uploadId);
      
      // Perform quality check
      const qualityResult = await performMobileQualityCheck(file);
      
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, status: 'completed', qualityCheck: qualityResult }
          : upload
      ));

      onQualityCheck?.([qualityResult]);
    }
  }, [uploads, maxFiles, maxFileSize, disabled, onQualityCheck]);

  const simulateUpload = async (uploadId: number): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 25 + 10; // Faster progress for mobile
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          resolve();
        }
        
        setUploads(prev => prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, progress }
            : upload
        ));
      }, 150);
    });
  };

  const performMobileQualityCheck = async (file: File): Promise<any> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const issues: any[] = [];
        let score = 100;

        // Mobile-optimized quality checks
        if (img.width < 1280 || img.height < 720) {
          issues.push({
            type: 'resolution',
            severity: 'medium',
            description: 'Image resolution could be higher for better quality',
            suggestedFix: 'Try taking the photo in better lighting or closer to the subject',
          });
          score -= 15;
        }

        // Check if image is too small (likely a thumbnail)
        if (file.size < 50 * 1024) { // Less than 50KB
          issues.push({
            type: 'resolution',
            severity: 'high',
            description: 'Image file size is very small',
            suggestedFix: 'Take a new photo with higher quality settings',
          });
          score -= 30;
        }

        resolve({
          passed: score >= 60, // More lenient for mobile
          score: Math.max(0, score),
          issues,
          recommendations: issues.length === 0 
            ? ['Great photo! Image meets quality standards.']
            : ['Consider the following improvements:', ...issues.map(i => `• ${i.suggestedFix}`)],
        });
      };
      
      img.onerror = () => {
        resolve({
          passed: false,
          score: 0,
          issues: [{ type: 'format', severity: 'high', description: 'Invalid image file' }],
          recommendations: ['Please select a valid image file'],
        });
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const removeUpload = (id: number) => {
    setUploads(prev => {
      const upload = prev.find(u => u.id === id);
      if (upload?.preview) {
        URL.revokeObjectURL(upload.preview);
      }
      return prev.filter(u => u.id !== id);
    });
  };

  const getCategoryDisplayName = (cat: string) => {
    return cat.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Mobile-first layout
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {getCategoryDisplayName(category)} Photos
        </h3>
        <Badge variant="outline" className="text-xs">
          {uploads.length}/{maxFiles}
        </Badge>
      </div>

      {/* Camera Interface */}
      {isCapturing && (
        <Card className="p-4 bg-black">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover rounded-lg"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Camera Controls */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center space-x-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={switchCamera}
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <Button
                type="button"
                onClick={capturePhoto}
                className="bg-white text-black hover:bg-gray-100 w-16 h-16 rounded-full p-0"
              >
                <div className="w-12 h-12 bg-white rounded-full border-4 border-gray-300" />
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={stopCamera}
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Upload Options */}
      {!isCapturing && (
        <div className="grid grid-cols-1 gap-3">
          {/* Camera Button - Prominent on mobile */}
          {hasCamera && (
            <Button
              type="button"
              onClick={startCamera}
              disabled={disabled}
              className="h-16 text-lg font-medium bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="h-6 w-6 mr-3" />
              Take Photo
            </Button>
          )}
          
          {/* File Upload Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="h-12"
          >
            <Upload className="h-5 w-5 mr-2" />
            Choose from Gallery
          </Button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFileUpload(Array.from(e.target.files));
          }
        }}
        disabled={disabled}
      />

      {/* Upload Progress - Mobile Optimized */}
      {uploads.length > 0 && (
        <div className="space-y-3">
          {uploads.map((upload) => (
            <Card key={upload.id} className="p-3">
              <div className="flex items-start space-x-3">
                {/* Preview Image */}
                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={upload.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Upload Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {upload.file.name}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUpload(upload.id)}
                      className="p-1 h-auto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-2">
                    {(upload.file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>

                  {/* Progress Bar */}
                  {upload.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center space-x-2">
                    {upload.status === 'completed' ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-green-600">Uploaded</span>
                        {upload.qualityCheck && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              upload.qualityCheck.score >= 80 ? 'text-green-600' :
                              upload.qualityCheck.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}
                          >
                            {upload.qualityCheck.score}/100
                          </Badge>
                        )}
                      </>
                    ) : upload.status === 'error' ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-xs text-red-600">Failed</span>
                      </>
                    ) : (
                      <>
                        <div className="h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-blue-600">Uploading...</span>
                      </>
                    )}
                  </div>

                  {/* Quality Issues - Simplified for mobile */}
                  {upload.qualityCheck?.issues?.length > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
                      <div className="flex items-center space-x-1 text-yellow-700">
                        <Zap className="h-3 w-3" />
                        <span className="font-medium">Tips for better photos:</span>
                      </div>
                      <ul className="mt-1 text-yellow-600 space-y-1">
                        {upload.qualityCheck.issues.slice(0, 2).map((issue: any, idx: number) => (
                          <li key={idx}>• {issue.suggestedFix}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Tips for Mobile */}
      {!isCapturing && uploads.length === 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Camera className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Photo Tips</h4>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• Use good lighting for clearer photos</li>
                <li>• Hold your phone steady</li>
                <li>• Get close to show details</li>
                <li>• Take multiple angles if needed</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};