import React, { useState, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select } from '../ui/select';

export interface RichTextContent {
  content: string;
  format: 'markdown' | 'html';
  wordCount: number;
  readingTime: number;
}

export interface PropertyDescriptionEditorProps {
  initialContent?: RichTextContent;
  onSave: (content: RichTextContent) => Promise<void>;
  onValidate?: (content: string) => { isValid: boolean; errors: string[]; warnings: string[] };
  className?: string;
}

export const PropertyDescriptionEditor: React.FC<PropertyDescriptionEditorProps> = ({
  initialContent,
  onSave,
  onValidate,
  className = '',
}) => {
  const [content, setContent] = useState(initialContent?.content || '');
  const [format, setFormat] = useState<'markdown' | 'html'>(initialContent?.format || 'markdown');
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<{ isValid: boolean; errors: string[]; warnings: string[] } | null>(null);

  const calculateWordCount = useCallback((text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, []);

  const calculateReadingTime = useCallback((wordCount: number): number => {
    return Math.ceil(wordCount / 200); // 200 words per minute
  }, []);

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
    
    // Real-time validation
    if (onValidate) {
      const validationResult = onValidate(value);
      setValidation(validationResult);
    }
  }, [onValidate]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const wordCount = calculateWordCount(content);
      const readingTime = calculateReadingTime(wordCount);
      
      const richTextContent: RichTextContent = {
        content,
        format,
        wordCount,
        readingTime,
      };

      await onSave(richTextContent);
    } catch (error) {
      console.error('Failed to save property description:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const wordCount = calculateWordCount(content);
  const readingTime = calculateReadingTime(wordCount);

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Property Description</h3>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              {wordCount} words • {readingTime} min read
            </div>
            <Select
              value={format}
              onValueChange={(value: 'markdown' | 'html') => setFormat(value)}
            >
              <option value="markdown">Markdown</option>
              <option value="html">HTML</option>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="property-description">
            Describe your property in detail to help guests understand what makes it special
          </Label>
          <Textarea
            id="property-description"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={format === 'markdown' 
              ? "# Welcome to Our Hotel\n\nDescribe your property's unique features, amenities, and what makes it special for guests..."
              : "<h1>Welcome to Our Hotel</h1>\n\n<p>Describe your property's unique features, amenities, and what makes it special for guests...</p>"
            }
            className="min-h-[300px] font-mono text-sm"
          />
        </div>

        {/* Format Help */}
        <div className="bg-blue-50 p-3 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            {format === 'markdown' ? 'Markdown Formatting' : 'HTML Formatting'}
          </h4>
          <div className="text-xs text-blue-700 space-y-1">
            {format === 'markdown' ? (
              <>
                <div><code># Heading</code> for main headings</div>
                <div><code>**bold text**</code> for emphasis</div>
                <div><code>*italic text*</code> for style</div>
                <div><code>- List item</code> for bullet points</div>
              </>
            ) : (
              <>
                <div><code>&lt;h1&gt;Heading&lt;/h1&gt;</code> for main headings</div>
                <div><code>&lt;strong&gt;bold&lt;/strong&gt;</code> for emphasis</div>
                <div><code>&lt;em&gt;italic&lt;/em&gt;</code> for style</div>
                <div><code>&lt;ul&gt;&lt;li&gt;List item&lt;/li&gt;&lt;/ul&gt;</code> for lists</div>
              </>
            )}
          </div>
        </div>

        {/* Validation Feedback */}
        {validation && (
          <div className="space-y-2">
            {validation.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <h4 className="text-sm font-medium text-red-800 mb-1">Errors:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {validation.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <h4 className="text-sm font-medium text-yellow-800 mb-1">Suggestions:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Content Guidelines */}
        <div className="bg-gray-50 p-3 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Writing Tips</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Aim for at least 50 words for better guest understanding</li>
            <li>• Highlight unique features and amenities</li>
            <li>• Mention nearby attractions and accessibility</li>
            <li>• Use descriptive language that helps guests visualize their stay</li>
            <li>• Keep it engaging and informative</li>
          </ul>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={isLoading || (validation ? !validation.isValid : false)}
            className="px-6"
          >
            {isLoading ? 'Saving...' : 'Save Description'}
          </Button>
        </div>
      </div>
    </Card>
  );
};