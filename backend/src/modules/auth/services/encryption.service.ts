import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  tag: string;
}

export interface DecryptionRequest {
  encryptedData: string;
  iv: string;
  tag: string;
}

/**
 * Encryption service for sensitive data protection
 * Requirements: 10.2, 10.5 - Data encryption in transit and at rest
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits

  constructor(private readonly configService: ConfigService) {}

  /**
   * Get encryption key from environment or generate one
   * Requirements: 10.5 - Secure key management
   */
  private getEncryptionKey(): Buffer {
    const keyString = this.configService.get<string>('ENCRYPTION_KEY');
    
    if (!keyString) {
      this.logger.warn('ENCRYPTION_KEY not found in environment, using default key for development');
      // In production, this should throw an error
      return crypto.scryptSync('default-dev-key', 'salt', this.keyLength);
    }

    // If key is provided as hex string
    if (keyString.length === this.keyLength * 2) {
      return Buffer.from(keyString, 'hex');
    }

    // If key is provided as base64
    if (keyString.length === Math.ceil(this.keyLength * 4 / 3)) {
      return Buffer.from(keyString, 'base64');
    }

    // Derive key from string using scrypt
    return crypto.scryptSync(keyString, 'hotel-onboarding-salt', this.keyLength);
  }

  /**
   * Encrypt sensitive data
   * Requirements: 10.2 - Encryption for sensitive data at rest
   */
  encrypt(plaintext: string): EncryptionResult {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.ivLength);
      
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
      };
    } catch (error) {
      this.logger.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   * Requirements: 10.2 - Decryption for sensitive data access
   */
  decrypt(request: DecryptionRequest): string {
    try {
      const key = this.getEncryptionKey();
      const iv = Buffer.from(request.iv, 'hex');
      const tag = Buffer.from(request.tag, 'hex');
      
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(request.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash sensitive data for storage (one-way)
   * Requirements: 10.2 - Secure data hashing
   */
  hash(data: string, salt?: string): string {
    try {
      const actualSalt = salt || crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(data, actualSalt, 64).toString('hex');
      return `${actualSalt}:${hash}`;
    } catch (error) {
      this.logger.error('Hashing failed:', error);
      throw new Error('Failed to hash data');
    }
  }

  /**
   * Verify hashed data
   * Requirements: 10.2 - Secure data verification
   */
  verifyHash(data: string, hashedData: string): boolean {
    try {
      const [salt, hash] = hashedData.split(':');
      const dataHash = crypto.scryptSync(data, salt, 64).toString('hex');
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(dataHash, 'hex'));
    } catch (error) {
      this.logger.error('Hash verification failed:', error);
      return false;
    }
  }

  /**
   * Generate secure random token
   * Requirements: 10.5 - Secure token generation
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Encrypt object data for JSON storage
   * Requirements: 10.2 - Object encryption for database storage
   */
  encryptObject(obj: any): EncryptionResult {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString);
  }

  /**
   * Decrypt object data from JSON storage
   * Requirements: 10.2 - Object decryption from database
   */
  decryptObject<T>(request: DecryptionRequest): T {
    const jsonString = this.decrypt(request);
    return JSON.parse(jsonString);
  }

  /**
   * Create secure hash for data integrity verification
   * Requirements: 10.2 - Data integrity verification
   */
  createIntegrityHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify data integrity
   * Requirements: 10.2 - Data integrity verification
   */
  verifyIntegrity(data: string, expectedHash: string): boolean {
    const actualHash = this.createIntegrityHash(data);
    return crypto.timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'));
  }
}