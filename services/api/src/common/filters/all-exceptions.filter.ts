import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { STATUS_CODES } from 'node:http';
import type { Request, Response } from 'express';
import { Prisma } from '@ajac/database';

const PRISMA_STATUS_MAP: Record<string, HttpStatus> = {
  P2002: HttpStatus.CONFLICT, // unique constraint violated
  P2003: HttpStatus.CONFLICT, // foreign key constraint violated
  P2025: HttpStatus.NOT_FOUND, // record to update/delete not found
};

const PRISMA_DEFAULT_MESSAGE: Record<string, string> = {
  P2002: 'A record with these details already exists.',
  P2003: 'The request references data that does not exist.',
  P2025: 'The record was not found.',
};

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

/**
 * Single global exception filter: normalizes every error into a consistent
 * `{ statusCode, error, message, timestamp, path }` envelope. Maps known Prisma
 * client errors (unique/FK violations, missing records) to the right HTTP code;
 * never leaks internal error details to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'An unexpected error occurred.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = this.extractMessage(exception);
      if (status >= 500) {
        this.logger.error(exception.message, exception.stack);
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = PRISMA_STATUS_MAP[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
      message = PRISMA_DEFAULT_MESSAGE[exception.code] ?? 'A database error occurred.';
      this.logger.error(`Prisma ${exception.code}: ${exception.message}`);
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    const body: ErrorBody = {
      statusCode: status,
      error: STATUS_CODES[status] ?? 'Error',
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
    response.status(status).json(body);
  }

  private extractMessage(exception: HttpException): string | string[] {
    const res = exception.getResponse();
    if (typeof res === 'string') {
      return res;
    }
    if (typeof res === 'object' && res !== null) {
      const message = (res as { message?: unknown }).message;
      if (Array.isArray(message) || typeof message === 'string') {
        return message;
      }
    }
    return exception.message;
  }
}
