'use client';

import React, { useState } from 'react';
import { X, Eye, Download, RotateCcw, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface ProcessedImage {
  id: string;
  originalUrl: string;
  optimizedUrls: { [size: string]: string };
  thumbnails: {
    small: string;
    medium: string;
    large: string;
  };
  metadata: {
    filename: string;
    size: number;
    dimensions: { width: number; height: number };
    format: string;
    uploadedAt: Date;
    uploadedBy: string;
    qualityChecks: any;
    tags: string[];
  };
  qualityScore: number;
  category: string;
}

export interface ImageGalleryProps {
  images: ProcessedImage[];
  category: string;
  onImageDelete?: (imageId: string) => void;
  onImageReorder?: (images: ProcessedImage[]) => void;
  onImageSelect?: (image: ProcessedImage) => void;
  className?: string;
  editable?: boolean;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  category,
  onImageDelete,
  onImageReorder,
  onImageSelect,
  className = '',
  editable = true,
}) => {
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleImageClick = (image: ProcessedImage) => {
    setSelectedImage(image);
    onImageSelect?.(image);
  };

  const handleDelete = (imageId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this image?')) {
      onImageDelete?.(imageId);
    }
  };

  const getQualityBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryDisplayName = (cat: string) => {
    return cat.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (images.length === 0) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <div className="text-gray-400 mb-4">
          <Eye className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No {getCategoryDisplayName(category)} Images
        </h3>
        <p className="text-gray-500">
          Upload some images to see them here
        </p>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {getCategoryDisplayName(category)} Gallery
        </h3>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {images.length} image{images.length !== 1 ? 's' : ''}
          </Badge>
          {/* View Mode Toggle - Hidden on mobile */}
          <div className="hidden md:flex border rounded-lg p-1">
            <Button
              type="button"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="px-3 py-1 h-auto"
            >
              Grid
            </Button>
            <Button
              type="button"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="px-3 py-1 h-auto"
            >
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card
              key={image.id}
              className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow"
              onClick={() => handleImageClick(image)}
            >
              <div className="relative aspect-square">
                <img
                  src={image.thumbnails.medium}
                  alt={image.metadata.filename}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Quality Badge */}
                <div className="absolute top-2 left-2">
                  <Badge className={`text-xs ${getQualityBadgeColor(image.qualityScore)}`}>
                    {image.qualityScore}
                  </Badge>
                </div>

                {/* Delete Button */}
                {editable && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                    onClick={(e) => handleDelete(image.id, e)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Image Info */}
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {image.metadata.filename}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    {image.metadata.dimensions.width} × {image.metadata.dimensions.height}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatFileSize(image.metadata.size)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {images.map((image) => (
            <Card
              key={image.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleImageClick(image)}
            >
              <div className="flex items-center space-x-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.thumbnails.small}
                    alt={image.metadata.filename}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Image Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {image.metadata.filename}
                    </h4>
                    <Badge className={`text-xs ${getQualityBadgeColor(image.qualityScore)}`}>
                      {image.qualityScore}/100
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{image.metadata.dimensions.width} × {image.metadata.dimensions.height}</span>
                    <span>{formatFileSize(image.metadata.size)}</span>
                    <span>{image.metadata.format.toUpperCase()}</span>
                  </div>

                  {/* Quality Issues */}
                  {image.metadata.qualityChecks?.issues?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-yellow-600">
                        {image.metadata.qualityChecks.issues.length} quality issue{image.metadata.qualityChecks.issues.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {editable && (
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(image.originalUrl, '_blank');
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(image.id, e)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold truncate">
                {selectedImage.metadata.filename}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              {/* Image */}
              <div className="mb-4">
                <img
                  src={selectedImage.optimizedUrls.large || selectedImage.originalUrl}
                  alt={selectedImage.metadata.filename}
                  className="w-full h-auto max-h-96 object-contain rounded-lg"
                />
              </div>

              {/* Image Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Details</h4>
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Dimensions:</dt>
                      <dd>{selectedImage.metadata.dimensions.width} × {selectedImage.metadata.dimensions.height}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">File Size:</dt>
                      <dd>{formatFileSize(selectedImage.metadata.size)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Format:</dt>
                      <dd>{selectedImage.metadata.format.toUpperCase()}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Quality Score:</dt>
                      <dd>
                        <Badge className={getQualityBadgeColor(selectedImage.qualityScore)}>
                          {selectedImage.qualityScore}/100
                        </Badge>
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Quality Issues */}
                {selectedImage.metadata.qualityChecks?.issues?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Quality Issues</h4>
                    <ul className="space-y-2">
                      {selectedImage.metadata.qualityChecks.issues.map((issue: any, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <div className={`
                            w-2 h-2 rounded-full mt-2 flex-shrink-0
                            ${issue.severity === 'high' ? 'bg-red-500' : 
                              issue.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}
                          `} />
                          <div>
                            <p className="text-gray-900">{issue.description}</p>
                            <p className="text-gray-500 text-xs mt-1">{issue.suggestedFix}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.open(selectedImage.originalUrl, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                {editable && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      handleDelete(selectedImage.id, {} as React.MouseEvent);
                      setSelectedImage(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};