/**
 * Professional Image Upload Component
 * Simple, clean image upload with drag & drop, preview, and backend validation
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface UploadedImage {
    id: string;
    url: string;
    qualityScore?: number;
    category?: string;
    uploadedAt?: string;
}

interface ImageUploadProps {
    maxFiles?: number;
    maxFileSize?: number; // in bytes
    accept?: string;
    onUploadComplete: (images: UploadedImage[]) => void;
    existingImages?: UploadedImage[];
    uploadEndpoint: string;
    className?: string;
    disabled?: boolean;
}

interface UploadProgress {
    id: string;
    file: File;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
    url?: string;
}

export function ImageUpload({
    maxFiles = 20,
    maxFileSize = 5 * 1024 * 1024, // 5MB default
    accept = 'image/jpeg,image/png,image/webp',
    onUploadComplete,
    existingImages = [],
    uploadEndpoint,
    className,
    disabled = false,
}: ImageUploadProps) {
    const [images, setImages] = useState<UploadedImage[]>(existingImages);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /**
     * Validate file before upload
     */
    const validateFile = useCallback((file: File): string | null => {
        // Check file type
        const acceptedTypes = accept.split(',').map(t => t.trim());
        if (!acceptedTypes.includes(file.type)) {
            return `Invalid file type. Accepted: ${accept}`;
        }

        // Check file size
        if (file.size > maxFileSize) {
            const sizeMB = (maxFileSize / (1024 * 1024)).toFixed(1);
            return `File too large. Maximum size: ${sizeMB}MB`;
        }

        // Check max files
        if (images.length + uploadProgress.length >= maxFiles) {
            return `Maximum ${maxFiles} images allowed`;
        }

        return null;
    }, [accept, maxFileSize, maxFiles, images.length, uploadProgress.length]);

    /**
     * Upload file to backend
     */
    const uploadFile = useCallback(async (file: File) => {
        const uploadId = `${Date.now()}-${Math.random()}`;

        // Add to upload progress
        const newProgress: UploadProgress = {
            id: uploadId,
            file,
            progress: 0,
            status: 'uploading',
        };

        setUploadProgress(prev => [...prev, newProgress]);

        try {
            // Create form data
            const formData = new FormData();
            formData.append('image', file);

            // Upload with progress tracking
            const response = await fetch(uploadEndpoint, {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            const uploadedImage: UploadedImage = {
                id: data.id || uploadId,
                url: data.url,
                qualityScore: data.qualityScore,
                category: data.category,
                uploadedAt: new Date().toISOString(),
            };

            // Update progress to completed
            setUploadProgress(prev =>
                prev.map(p =>
                    p.id === uploadId
                        ? { ...p, status: 'completed', progress: 100, url: uploadedImage.url }
                        : p
                )
            );

            // Add to images
            setImages(prev => {
                const newImages = [...prev, uploadedImage];
                onUploadComplete(newImages);
                return newImages;
            });

            // Remove from progress after a delay
            setTimeout(() => {
                setUploadProgress(prev => prev.filter(p => p.id !== uploadId));
            }, 1000);

            toast.success('Image uploaded successfully');
        } catch (err: any) {
            console.error('Upload error:', err);

            // Update progress to error
            setUploadProgress(prev =>
                prev.map(p =>
                    p.id === uploadId
                        ? { ...p, status: 'error', error: err.message || 'Upload failed' }
                        : p
                )
            );

            toast.error('Failed to upload image');
        }
    }, [uploadEndpoint, onUploadComplete]);

    /**
     * Handle file selection
     */
    const handleFiles = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);

        for (const file of fileArray) {
            const error = validateFile(file);
            if (error) {
                toast.error(error);
                continue;
            }

            await uploadFile(file);
        }
    }, [validateFile, uploadFile]);

    /**
     * Handle drag and drop
     */
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragging(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        handleFiles(e.dataTransfer.files);
    }, [disabled, handleFiles]);

    /**
     * Handle file input change
     */
    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
        // Reset input so same file can be selected again
        e.target.value = '';
    }, [handleFiles]);

    /**
     * Open file dialog
     */
    const openFileDialog = useCallback(() => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [disabled]);

    /**
     * Remove image
     */
    const removeImage = useCallback((imageId: string) => {
        setImages(prev => {
            const newImages = prev.filter(img => img.id !== imageId);
            onUploadComplete(newImages);
            return newImages;
        });
        toast.success('Image removed');
    }, [onUploadComplete]);

    /**
     * Retry failed upload
     */
    const retryUpload = useCallback((uploadId: string) => {
        const upload = uploadProgress.find(p => p.id === uploadId);
        if (upload) {
            // Remove from progress
            setUploadProgress(prev => prev.filter(p => p.id !== uploadId));
            // Retry upload
            uploadFile(upload.file);
        }
    }, [uploadProgress, uploadFile]);

    return (
        <div className={cn('space-y-4', className)}>
            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                    isDragging && !disabled
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400',
                    disabled && 'opacity-50 cursor-not-allowed'
                )}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    multiple
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={disabled}
                />

                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-gray-600" />
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-700">
                            Drag and drop images here, or{' '}
                            <button
                                type="button"
                                onClick={openFileDialog}
                                disabled={disabled}
                                className="text-blue-600 hover:text-blue-700 font-semibold"
                            >
                                browse
                            </button>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Maximum {maxFiles} images, up to {(maxFileSize / (1024 * 1024)).toFixed(1)}MB each
                        </p>
                    </div>
                </div>
            </div>

            {/* Upload Progress */}
            {uploadProgress.length > 0 && (
                <div className="space-y-2">
                    {uploadProgress.map((upload) => (
                        <div
                            key={upload.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                            <div className="flex-shrink-0">
                                {upload.status === 'uploading' && (
                                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                )}
                                {upload.status === 'completed' && (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                )}
                                {upload.status === 'error' && (
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">
                                    {upload.file.name}
                                </p>
                                {upload.status === 'uploading' && (
                                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                                        <div
                                            className="bg-blue-600 h-1.5 rounded-full transition-all"
                                            style={{ width: `${upload.progress}%` }}
                                        />
                                    </div>
                                )}
                                {upload.status === 'error' && (
                                    <p className="text-xs text-red-600 mt-1">{upload.error}</p>
                                )}
                            </div>

                            {upload.status === 'error' && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => retryUpload(upload.id)}
                                >
                                    Retry
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Image Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                        <div
                            key={image.id}
                            className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100"
                        >
                            <img
                                src={image.url}
                                alt={`Upload ${index + 1}`}
                                className="w-full h-full object-cover"
                            />

                            {/* Remove button */}
                            <button
                                type="button"
                                onClick={() => removeImage(image.id)}
                                disabled={disabled}
                                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:opacity-50"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Quality score badge (if available) */}
                            {image.qualityScore && (
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                                    Quality: {image.qualityScore}%
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {images.length === 0 && uploadProgress.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm">No images uploaded yet</p>
                </div>
            )}
        </div>
    );
}
