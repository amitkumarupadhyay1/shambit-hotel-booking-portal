/**
 * Simplified Images Step
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';
import { useStepForm } from '../../hooks/useStepForm';

interface ImageData {
  url: string;
  type: 'EXTERIOR' | 'LOBBY' | 'ROOM' | 'AMENITY' | 'OTHER';
  caption?: string;
}

interface ImagesData {
  images: ImageData[];
}

const defaultData: ImagesData = {
  images: [],
};

export function ImagesStep() {
  const { formData, errors, updateField } = useStepForm({
    stepId: 'images',
    defaultData,
  });

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    
    // Simulate image upload - in real app, upload to cloud storage
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: ImageData = {
          url: e.target?.result as string,
          type: 'OTHER',
          caption: file.name,
        };
        
        const updatedImages = [...(formData.images || []), newImage];
        updateField('images', updatedImages);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    const updatedImages = formData.images.filter((_, i) => i !== index);
    updateField('images', updatedImages);
  };

  const updateImageType = (index: number, type: ImageData['type']) => {
    const updatedImages = formData.images.map((img, i) => 
      i === index ? { ...img, type } : img
    );
    updateField('images', updatedImages);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Images</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div className="space-y-2">
          <Label>Upload Images * (Minimum 3 required)</Label>
          {errors.images && (
            <p className="text-sm text-red-500">{errors.images}</p>
          )}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600 mb-2">
              Drag and drop images here, or click to select
            </p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files)}
              className="hidden"
              id="image-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              Select Images
            </Button>
          </div>
        </div>

        {/* Image Grid */}
        {formData.images && formData.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.url}
                  alt={image.caption || `Image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <select
                  value={image.type}
                  onChange={(e) => updateImageType(index, e.target.value as ImageData['type'])}
                  className="absolute bottom-2 left-2 text-xs bg-black/50 text-white rounded px-2 py-1"
                >
                  <option value="EXTERIOR">Exterior</option>
                  <option value="LOBBY">Lobby</option>
                  <option value="ROOM">Room</option>
                  <option value="AMENITY">Amenity</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            ))}
          </div>
        )}

        <p className="text-sm text-gray-500">
          Uploaded: {formData.images?.length || 0} images
          {formData.images && formData.images.length < 3 && (
            <span className="text-red-500 ml-2">
              (Need {3 - formData.images.length} more)
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}