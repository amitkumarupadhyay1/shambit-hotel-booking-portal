import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Standardized API Error Response Format
 * Requirements: 8.1 - Standardize API error responses (Requirement 4.3)
 */
export interface StandardErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  correlationId: string;
  details?: any;
  stack?: string;
}

/**
 * Global HTTP Exception Filter
 * 
 * This filter standardizes all API error responses by:
 * 1. Creating consistent error response format
 * 2. Adding proper HTTP status codes
 * 3. Including detailed error messages
 * 4. Adding error correlation IDs for tracking
 * 5. Improving error logging and monitoring
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Generate correlation ID for error tracking
    const correlationId = uuidv4();

    let status: number;
    let message: string | string[];
    let error: string;
    let details: any = undefined;

    if (exception instanceof HttpException) {
      // Handle NestJS HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = this.getErrorName(status);
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || 'Unknown error';
        error = responseObj.error || this.getErrorName(status);
        details = responseObj.details;
      } else {
        message = 'Unknown error occurred';
        error = this.getErrorName(status);
      }
    } else if (exception instanceof Error) {
      // Handle generic JavaScript errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : exception.message;
      error = 'Internal Server Error';
      
      // Include error details in development
      if (process.env.NODE_ENV !== 'production') {
        details = {
          name: exception.name,
          stack: exception.stack,
        };
      }
    } else {
      // Handle unknown exceptions
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Unknown error occurred';
      error = 'Internal Server Error';
      
      if (process.env.NODE_ENV !== 'production') {
        details = { exception: String(exception) };
      }
    }

    // Create standardized error response
    const errorResponse: StandardErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
    };

    // Add details in development mode
    if (details && process.env.NODE_ENV !== 'production') {
      errorResponse.details = details;
    }

    // Add stack trace in development mode for server errors
    if (status >= 500 && process.env.NODE_ENV !== 'production' && exception instanceof Error) {
      errorResponse.stack = exception.stack;
    }

    // Log error with appropriate level
    this.logError(exception, request, correlationId, status);

    // Send standardized response
    response.status(status).json(errorResponse);
  }

  /**
   * Get standard error name for HTTP status code
   */
  private getErrorName(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.METHOD_NOT_ALLOWED:
        return 'Method Not Allowed';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Unprocessable Entity';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Too Many Requests';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Internal Server Error';
      case HttpStatus.BAD_GATEWAY:
        return 'Bad Gateway';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'Service Unavailable';
      case HttpStatus.GATEWAY_TIMEOUT:
        return 'Gateway Timeout';
      default:
        return 'Unknown Error';
    }
  }

  /**
   * Log error with appropriate level and context
   */
  private logError(
    exception: unknown,
    request: Request,
    correlationId: string,
    statusCode: number,
  ): void {
    const userId = (request as any).user?.id || 'anonymous';
    const userAgent = request.headers['user-agent'] || 'unknown';
    const ip = request.ip || 'unknown';

    const logContext = {
      correlationId,
      userId,
      method: request.method,
      url: request.url,
      userAgent,
      ip,
      statusCode,
    };

    if (statusCode >= 500) {
      // Server errors - log as error
      this.logger.error(
        `Server error: ${exception instanceof Error ? exception.message : String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
        logContext,
      );
    } else if (statusCode >= 400) {
      // Client errors - log as warning
      this.logger.warn(
        `Client error: ${exception instanceof Error ? exception.message : String(exception)}`,
        logContext,
      );
    } else {
      // Other errors - log as debug
      this.logger.debug(
        `Error: ${exception instanceof Error ? exception.message : String(exception)}`,
        logContext,
      );
    }
  }
}

/**
 * Validation Exception Filter
 * Handles class-validator validation errors with detailed field information
 */
@Catch()
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Only handle validation errors
    if (!this.isValidationError(exception)) {
      // Pass to global exception filter
      new HttpExceptionFilter().catch(exception, host);
      return;
    }

    const correlationId = uuidv4();
    const status = HttpStatus.BAD_REQUEST;

    // Extract validation errors
    const validationErrors = this.extractValidationErrors(exception);

    const errorResponse: StandardErrorResponse = {
      statusCode: status,
      message: 'Validation failed',
      error: 'Bad Request',
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      details: {
        validationErrors,
        failedFields: Object.keys(validationErrors),
      },
    };

    // Log validation error
    this.logger.warn(
      `Validation error on ${request.method} ${request.url}`,
      {
        correlationId,
        userId: (request as any).user?.id || 'anonymous',
        validationErrors,
      },
    );

    response.status(status).json(errorResponse);
  }

  private isValidationError(exception: any): boolean {
    const response = exception instanceof HttpException ? exception.getResponse() : null;
    return (
      exception instanceof HttpException &&
      exception.getStatus() === HttpStatus.BAD_REQUEST &&
      response &&
      typeof response === 'object' &&
      Array.isArray((response as any).message)
    );
  }

  private extractValidationErrors(exception: any): Record<string, string[]> {
    const response = exception.getResponse();
    const messages = Array.isArray(response.message) ? response.message : [response.message];
    
    const errors: Record<string, string[]> = {};

    for (const message of messages) {
      if (typeof message === 'string') {
        // Try to extract field name from message
        const fieldMatch = message.match(/^(\w+)\s/);
        const field = fieldMatch ? fieldMatch[1] : 'general';
        
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(message);
      }
    }

    return errors;
  }
}