/**
 * Unified Step Component
 * Single component that handles all step types based on configuration
 * Eliminates 8 separate step components with configuration-driven approach
 */

import React from 'react';
import { StepConfig, FieldConfig } from '../types/step-config';
import { useStepForm } from '../hooks/useStepForm';
import { useOptimisticUpdates } from '../hooks/useOptimisticUpdates';
import { useValidation } from '../hooks/useValidation';
import { stepSchemas } from '../validation/schemas';

interface UnifiedStepComponentProps {
  config: StepConfig;
  defaultData?: any;
}

export function UnifiedStepComponent({ config, defaultData = {} }: UnifiedStepComponentProps) {
  const {
    formData,
    updateField,
    getFieldError,
    isFieldValid,
    validateStep,
    rollback,
  } = useStepForm({
    stepId: config.id as keyof typeof stepSchemas,
    defaultData,
  });

  const {
    hasPendingUpdates,
    canRollback,
    isSaving,
    saveWithRollback,
    rollbackChanges,
  } = useOptimisticUpdates();

  const {
    getFieldValidationStatus,
    getStepCompletionPercentage,
  } = useValidation();

  const completionPercentage = getStepCompletionPercentage(config.id as keyof typeof stepSchemas);

  const handleSave = async () => {
    const result = await saveWithRollback();
    if (result.success) {
      console.log('Saved successfully');
    } else {
      console.error('Save failed:', result.error);
      if (result.rolledBack) {
        console.log('Changes rolled back automatically');
      }
    }
  };

  const handleRollback = () => {
    const success = rollbackChanges();
    if (success) {
      console.log('Changes rolled back');
    }
  };

  const renderField = (field: FieldConfig, index: number) => {
    // Check conditional display
    if (field.showWhen) {
      const conditionValue = formData[field.showWhen.field];
      if (conditionValue !== field.showWhen.value) {
        return null;
      }
    }

    const fieldValue = formData[field.name];
    const fieldError = getFieldError(field.name);
    const isValid = isFieldValid(field.name);

    const baseInputClasses = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      fieldError 
        ? 'border-red-300 focus:ring-red-500' 
        : 'border-gray-300'
    }`;

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.description && (
              <p className="text-sm text-gray-500">{field.description}</p>
            )}
            <div className="relative">
              {field.prefix && (
                <span className="absolute left-3 top-2 text-gray-500">{field.prefix}</span>
              )}
              <input
                type="text"
                value={fieldValue || ''}
                onChange={(e) => updateField(field.name, e.target.value)}
                placeholder={field.placeholder}
                className={`${baseInputClasses} ${field.prefix ? 'pl-8' : ''} ${field.suffix ? 'pr-16' : ''}`}
              />
              {field.suffix && (
                <span className="absolute right-3 top-2 text-gray-500">{field.suffix}</span>
              )}
            </div>
            {fieldError && (
              <p className="text-sm text-red-600">{fieldError}</p>
            )}
            {isValid && fieldValue && !fieldError && (
              <p className="text-sm text-green-600">✓ Valid {field.label.toLowerCase()}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.description && (
              <p className="text-sm text-gray-500">{field.description}</p>
            )}
            <div className="relative">
              {field.prefix && (
                <span className="absolute left-3 top-2 text-gray-500">{field.prefix}</span>
              )}
              <input
                type="number"
                value={fieldValue || ''}
                onChange={(e) => updateField(field.name, Number(e.target.value))}
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                step={field.step}
                className={`${baseInputClasses} ${field.prefix ? 'pl-8' : ''} ${field.suffix ? 'pr-16' : ''}`}
              />
              {field.suffix && (
                <span className="absolute right-3 top-2 text-gray-500">{field.suffix}</span>
              )}
            </div>
            {fieldError && (
              <p className="text-sm text-red-600">{fieldError}</p>
            )}
          </div>
        );

      case 'time':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.description && (
              <p className="text-sm text-gray-500">{field.description}</p>
            )}
            <input
              type="time"
              value={fieldValue || ''}
              onChange={(e) => updateField(field.name, e.target.value)}
              className={baseInputClasses}
            />
            {fieldError && (
              <p className="text-sm text-red-600">{fieldError}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.description && (
              <p className="text-sm text-gray-500">{field.description}</p>
            )}
            <textarea
              value={fieldValue || ''}
              onChange={(e) => updateField(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows || 3}
              className={baseInputClasses}
            />
            {fieldError && (
              <p className="text-sm text-red-600">{fieldError}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.description && (
              <p className="text-sm text-gray-500">{field.description}</p>
            )}
            <select
              value={fieldValue || ''}
              onChange={(e) => updateField(field.name, e.target.value)}
              className={baseInputClasses}
            >
              <option value="">Select {field.label.toLowerCase()}</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {field.options && fieldValue && (
              <div className="text-sm text-gray-600">
                {field.options.find(opt => opt.value === fieldValue)?.description}
              </div>
            )}
            {fieldError && (
              <p className="text-sm text-red-600">{fieldError}</p>
            )}
          </div>
        );

      case 'multiselect':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.description && (
              <p className="text-sm text-gray-500">{field.description}</p>
            )}
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
              {field.options?.map((option) => (
                <label key={option.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={(fieldValue || []).includes(option.value)}
                    onChange={(e) => {
                      const currentValues = fieldValue || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v: string) => v !== option.value);
                      updateField(field.name, newValues);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
            {fieldError && (
              <p className="text-sm text-red-600">{fieldError}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className="space-y-1">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={fieldValue || false}
                onChange={(e) => updateField(field.name, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </span>
            </label>
            {field.description && (
              <p className="text-sm text-gray-500 ml-6">{field.description}</p>
            )}
            {fieldError && (
              <p className="text-sm text-red-600 ml-6">{fieldError}</p>
            )}
          </div>
        );

      case 'array':
        return (
          <div key={field.name} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.description && (
                <p className="text-sm text-gray-500">{field.description}</p>
              )}
            </div>
            
            <div className="space-y-4">
              {(fieldValue || []).map((item: any, itemIndex: number) => (
                <div key={itemIndex} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-700">
                      {field.label.slice(0, -1)} {itemIndex + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const newArray = [...(fieldValue || [])];
                        newArray.splice(itemIndex, 1);
                        updateField(field.name, newArray);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      {field.arrayConfig?.removeButtonText || 'Remove'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {field.arrayConfig?.itemFields.map((itemField) => (
                      <div key={itemField.name}>
                        {renderArrayItemField(itemField, item, itemIndex, field.name)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                const newItem = field.arrayConfig?.itemFields.reduce((acc, itemField) => {
                  acc[itemField.name] = itemField.type === 'number' ? 0 : '';
                  return acc;
                }, {} as any);
                updateField(field.name, [...(fieldValue || []), newItem]);
              }}
              className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              + {field.arrayConfig?.addButtonText || 'Add Item'}
            </button>

            {fieldError && (
              <p className="text-sm text-red-600">{fieldError}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderArrayItemField = (itemField: FieldConfig, item: any, itemIndex: number, arrayFieldName: string) => {
    const itemValue = item[itemField.name];
    const baseInputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";

    const updateArrayItem = (fieldName: string, value: any) => {
      const currentArray = formData[arrayFieldName] || [];
      const newArray = [...currentArray];
      newArray[itemIndex] = { ...newArray[itemIndex], [fieldName]: value };
      updateField(arrayFieldName, newArray);
    };

    switch (itemField.type) {
      case 'text':
        return (
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">
              {itemField.label} {itemField.required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              {itemField.prefix && (
                <span className="absolute left-3 top-2 text-gray-500 text-sm">{itemField.prefix}</span>
              )}
              <input
                type="text"
                value={itemValue || ''}
                onChange={(e) => updateArrayItem(itemField.name, e.target.value)}
                placeholder={itemField.placeholder}
                className={`${baseInputClasses} ${itemField.prefix ? 'pl-8' : ''} ${itemField.suffix ? 'pr-16' : ''}`}
              />
              {itemField.suffix && (
                <span className="absolute right-3 top-2 text-gray-500 text-sm">{itemField.suffix}</span>
              )}
            </div>
          </div>
        );

      case 'number':
        return (
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">
              {itemField.label} {itemField.required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              {itemField.prefix && (
                <span className="absolute left-3 top-2 text-gray-500 text-sm">{itemField.prefix}</span>
              )}
              <input
                type="number"
                value={itemValue || ''}
                onChange={(e) => updateArrayItem(itemField.name, Number(e.target.value))}
                min={itemField.min}
                max={itemField.max}
                className={`${baseInputClasses} ${itemField.prefix ? 'pl-8' : ''} ${itemField.suffix ? 'pr-16' : ''}`}
              />
              {itemField.suffix && (
                <span className="absolute right-3 top-2 text-gray-500 text-sm">{itemField.suffix}</span>
              )}
            </div>
          </div>
        );

      case 'select':
        return (
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">
              {itemField.label} {itemField.required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={itemValue || ''}
              onChange={(e) => updateArrayItem(itemField.name, e.target.value)}
              className={baseInputClasses}
            >
              <option value="">Select {itemField.label.toLowerCase()}</option>
              {itemField.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  const renderSections = () => {
    if (!config.sections) {
      return (
        <div className="space-y-6">
          {config.fields.map((field, index) => renderField(field, index))}
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {config.sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-lg font-medium text-gray-900">{section.title}</h3>
              {section.description && (
                <p className="text-sm text-gray-600">{section.description}</p>
              )}
            </div>
            <div className="space-y-6">
              {section.fields.map((fieldName) => {
                const field = config.fields.find(f => f.name === fieldName);
                return field ? renderField(field, config.fields.indexOf(field)) : null;
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{config.title}</h2>
          {config.estimatedTime && (
            <span className="text-sm text-gray-500">
              ~{config.estimatedTime} min
            </span>
          )}
        </div>
        <p className="text-gray-600">{config.description}</p>
        {config.completionHint && (
          <p className="text-sm text-blue-600">{config.completionHint}</p>
        )}
      </div>

      {/* Progress indicator */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Step completion</span>
          <span>{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Status indicators */}
      {hasPendingUpdates && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2" />
            <span className="text-yellow-800 text-sm">
              {isSaving ? 'Saving changes...' : 'Unsaved changes'}
            </span>
          </div>
        </div>
      )}

      {/* Form fields */}
      {renderSections()}

      {/* Action buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <div className="flex space-x-2">
          {canRollback && (
            <button
              onClick={handleRollback}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Undo Changes
            </button>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          
          <button
            onClick={() => validateStep()}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Validate
          </button>
        </div>
      </div>
    </div>
  );
}