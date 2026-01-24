/**
 * Images Step
 * Upload property images with drag & drop
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ImageUpload, UploadedImage } from '@/components/shared/ImageUpload';
import { ImagesData } from '../../types/onboarding';

interface ImagesStepProps {
    data: ImagesData;
    onChange: (data: ImagesData) => void;
    sessionId: string;
}

export function ImagesStep({ data, onChange, sessionId }: ImagesStepProps) {
    const [images, setImages] = useState<UploadedImage[]>(data?.images || []);

    useEffect(() => {
        onChange({ images });
    }, [images, onChange]);

    const handleUploadComplete = (uploadedImages: UploadedImage[]) => {
        setImages(uploadedImages);
    };

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Image Guidelines</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Upload high-quality images (minimum 1920x1080 pixels)</li>
                    <li>• Include photos of exterior, lobby, rooms, and amenities</li>
                    <li>• First image will be used as the main property photo</li>
                    <li>• Maximum 20 images, up to 5MB each</li>
                </ul>
            </div>

            <ImageUpload
                maxFiles={20}
                maxFileSize={5 * 1024 * 1024}
                accept="image/jpeg,image/png,image/webp"
                onUploadComplete={handleUploadComplete}
                existingImages={images}
                uploadEndpoint={`/api/hotels/integrated-onboarding/sessions/${sessionId}/images`}
            />
        </div>
    );
}
