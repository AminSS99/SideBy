import { describe, it, expect } from 'vitest';
import { ApiError } from './api';

describe('ApiError', () => {
  it('should create an instance with message and status', () => {
    const error = new ApiError('Not Found', 404);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Not Found');
    expect(error.status).toBe(404);
    expect(error.code).toBeUndefined();
  });

  it('should create an instance with message, status, and code', () => {
    const error = new ApiError('Internal Error', 500, 'ERR_500');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Internal Error');
    expect(error.status).toBe(500);
    expect(error.code).toBe('ERR_500');
  });

  it('should maintain proper prototype chain', () => {
    const error = new ApiError('Test', 400);
    expect(error).toBeInstanceOf(ApiError);
    expect(error instanceof Error).toBe(true);
  });
});
