import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { Prisma } from '@ajac/database';
import { AllExceptionsFilter } from './all-exceptions.filter';

function mockHost(): {
  response: { status: ReturnType<typeof vi.fn> };
  json: ReturnType<typeof vi.fn>;
  host: ArgumentsHost;
} {
  const json = vi.fn();
  const response = { status: vi.fn(() => ({ json })) };
  const request = { url: '/api/v1/clients' };
  const host = {
    switchToHttp: () => ({ getResponse: () => response, getRequest: () => request }),
  } as unknown as ArgumentsHost;
  return { response, json, host };
}

describe('AllExceptionsFilter', () => {
  it('formats an HttpException with its status and message', () => {
    const { response, json, host } = mockHost();
    const filter = new AllExceptionsFilter();
    filter.catch(new NotFoundException('Client abc not found'), host);
    expect(response.status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        error: 'Not Found',
        message: 'Client abc not found',
        path: '/api/v1/clients',
      }),
    );
  });

  it('passes validation error arrays through as-is', () => {
    const { json, host } = mockHost();
    const filter = new AllExceptionsFilter();
    filter.catch(new BadRequestException(['name should not be empty', 'email must be an email']), host);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    const body = json.mock.calls[0]?.[0] as { message: unknown };
    expect(Array.isArray(body.message)).toBe(true);
  });

  it('maps a Prisma unique-constraint error to 409', () => {
    const { response, host } = mockHost();
    const filter = new AllExceptionsFilter();
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.19.2',
    });
    filter.catch(error, host);
    expect(response.status).toHaveBeenCalledWith(409);
  });

  it('maps a Prisma record-not-found error to 404', () => {
    const { response, host } = mockHost();
    const filter = new AllExceptionsFilter();
    const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '6.19.2',
    });
    filter.catch(error, host);
    expect(response.status).toHaveBeenCalledWith(404);
  });

  it('hides internals for unknown errors', () => {
    const { response, json, host } = mockHost();
    const filter = new AllExceptionsFilter();
    filter.catch(new Error('secret internal stack'), host);
    expect(response.status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, message: 'An unexpected error occurred.' }),
    );
  });
});
