import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { EncryptionService } from '../services/encryption.service';

export const ENCRYPT_RESPONSE_KEY = 'encrypt_response';
export const SENSITIVE_FIELDS_KEY = 'sensitive_fields';

/**
 * Decorator to mark response data for encryption
 * Requirements: 10.2 - Data encryption in transit
 */
export const EncryptResponse = (sensitiveFields?: string[]) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(ENCRYPT_RESPONSE_KEY, true, descriptor.value);
    if (sensitiveFields) {
      Reflect.defineMetadata(SENSITIVE_FIELDS_KEY, sensitiveFields, descriptor.value);
    }
    return descriptor;
  };
};

/**
 * Interceptor to encrypt sensitive response data
 * Requirements: 10.2 - Automatic encryption of sensitive data in transit
 */
@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(EncryptionInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly encryptionService: EncryptionService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const shouldEncrypt = this.reflector.get<boolean>(
      ENCRYPT_RESPONSE_KEY,
      context.getHandler(),
    );

    if (!shouldEncrypt) {
      return next.handle();
    }

    const sensitiveFields = this.reflector.get<string[]>(
      SENSITIVE_FIELDS_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data) => {
        try {
          return this.encryptSensitiveData(data, sensitiveFields);
        } catch (error) {
          this.logger.error('Failed to encrypt response data:', error);
          // Return original data if encryption fails to avoid breaking the response
          return data;
        }
      }),
    );
  }

  /**
   * Encrypt sensitive fields in response data
   * Requirements: 10.2 - Selective field encryption
   */
  private encryptSensitiveData(data: any, sensitiveFields?: string[]): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // If no specific fields are specified, encrypt the entire response
    if (!sensitiveFields || sensitiveFields.length === 0) {
      const encrypted = this.encryptionService.encryptObject(data);
      return {
        encrypted: true,
        data: encrypted.encryptedData,
        iv: encrypted.iv,
        tag: encrypted.tag,
      };
    }

    // Encrypt only specified sensitive fields
    const result = { ...data };

    for (const field of sensitiveFields) {
      if (this.hasNestedProperty(result, field)) {
        const value = this.getNestedProperty(result, field);
        if (value !== null && value !== undefined) {
          const encrypted = this.encryptionService.encrypt(JSON.stringify(value));
          this.setNestedProperty(result, field, {
            encrypted: true,
            data: encrypted.encryptedData,
            iv: encrypted.iv,
            tag: encrypted.tag,
          });
        }
      }
    }

    return result;
  }

  /**
   * Check if object has nested property
   */
  private hasNestedProperty(obj: any, path: string): boolean {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return false;
      }
      current = current[key];
    }

    return true;
  }

  /**
   * Get nested property value
   */
  private getNestedProperty(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Set nested property value
   */
  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }
}